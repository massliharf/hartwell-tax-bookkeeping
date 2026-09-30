CREATE OR REPLACE FUNCTION public.demo_take_snapshot() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients','leads','appointments','checklist_items','waitlist','waitlist_offers','messages','time_off'] LOOP
    EXECUTE format('INSERT INTO public.demo_snapshot(tbl, rows, taken_at) SELECT %L, coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb), now() FROM public.%I x
      ON CONFLICT (tbl) DO UPDATE SET rows = excluded.rows, taken_at = excluded.taken_at', t, t);
  END LOOP;
END $f$;

CREATE OR REPLACE FUNCTION public.demo_restore() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE t text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.demo_snapshot WHERE tbl = 'appointments') THEN RAISE EXCEPTION 'no snapshot'; END IF;
  DELETE FROM public.messages WHERE id IS NOT NULL;
  DELETE FROM public.waitlist_offers WHERE id IS NOT NULL;
  DELETE FROM public.checklist_items WHERE id IS NOT NULL;
  DELETE FROM public.waitlist WHERE id IS NOT NULL;
  DELETE FROM public.appointments WHERE id IS NOT NULL;
  DELETE FROM public.leads WHERE id IS NOT NULL;
  DELETE FROM public.clients WHERE id IS NOT NULL;
  DELETE FROM public.time_off WHERE id IS NOT NULL;
  FOREACH t IN ARRAY ARRAY['clients','leads','appointments','checklist_items','waitlist','waitlist_offers','messages','time_off'] LOOP
    IF EXISTS (SELECT 1 FROM public.demo_snapshot WHERE tbl = t) THEN
      EXECUTE format('INSERT INTO public.%I SELECT * FROM jsonb_populate_recordset(NULL::public.%I, (SELECT rows FROM public.demo_snapshot WHERE tbl = %L))', t, t, t);
    END IF;
  END LOOP;
  UPDATE public.settings SET demo_time_offset_minutes = 0 WHERE id = 1;
END $f$;