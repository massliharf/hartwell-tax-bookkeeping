CREATE TABLE public.time_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_off TO authenticated;
GRANT ALL ON public.time_off TO service_role;
ALTER TABLE public.time_off ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner full access" ON public.time_off FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE OR REPLACE FUNCTION public.available_slots(_service_id uuid, _from date, _to date, _now timestamp with time zone)
 RETURNS SETOF timestamp with time zone
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare s settings; dur int; d date; hrs jsonb; t timestamptz;
begin
  select * into s from settings where id = 1;
  select duration_min into dur from services where id = _service_id and active;
  if dur is null or _to < _from or _to - _from > 62 then return; end if;
  for d in select generate_series(_from, _to, interval '1 day')::date loop
    hrs := s.hours -> lower(to_char(d, 'dy'));
    if hrs is null or jsonb_typeof(hrs) <> 'array' then continue; end if;
    for t in select generate_series(
        (d + (hrs->>0)::time) at time zone s.timezone,
        (d + (hrs->>1)::time) at time zone s.timezone - make_interval(mins => dur) - interval '1 minute',
        interval '15 minutes') loop
      continue when t < _now + interval '3 hours';
      continue when exists (
        select 1 from appointments a
        where a.status in ('booked','confirmed')
          and a.start_at < t + make_interval(mins => dur + s.buffer_min)
          and a.end_at + make_interval(mins => s.buffer_min) > t);
      continue when exists (
        select 1 from time_off o
        where o.starts_at < t + make_interval(mins => dur) and o.ends_at > t);
      return next t;
    end loop;
  end loop;
end $function$;