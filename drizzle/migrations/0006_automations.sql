ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS dedupe_key text UNIQUE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS delivery text NOT NULL DEFAULT 'sent';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS recipient text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS error text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS needs_attention boolean NOT NULL DEFAULT false;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS attention_reason text;

CREATE TABLE public.waitlist_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_id uuid NOT NULL REFERENCES public.waitlist(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id),
  slot_start timestamptz NOT NULL,
  token text NOT NULL UNIQUE DEFAULT (replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','')),
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (waitlist_id, slot_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist_offers TO authenticated;
GRANT ALL ON public.waitlist_offers TO service_role;
ALTER TABLE public.waitlist_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner full access" ON public.waitlist_offers FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;