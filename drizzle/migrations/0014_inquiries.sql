ALTER TYPE public.message_type ADD VALUE IF NOT EXISTS 'inquiry_reply';
CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  question text NOT NULL,
  status text NOT NULL DEFAULT 'needs_claire',
  ai_reply text,
  reply text,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner full access" ON public.inquiries FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());