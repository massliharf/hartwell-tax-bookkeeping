CREATE TABLE public.automation_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  cron_token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex')
);
REVOKE ALL ON public.automation_config FROM anon, authenticated;
GRANT ALL ON public.automation_config TO service_role;
ALTER TABLE public.automation_config ENABLE ROW LEVEL SECURITY;
INSERT INTO public.automation_config (id) VALUES (1) ON CONFLICT DO NOTHING;