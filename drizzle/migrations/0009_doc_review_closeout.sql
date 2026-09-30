ALTER TABLE public.checklist_items
  ADD COLUMN IF NOT EXISTS ai_check text,
  ADD COLUMN IF NOT EXISTS ai_note text,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS fix_reason text,
  ADD COLUMN IF NOT EXISTS fix_note text;
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS fee_cents integer,
  ADD COLUMN IF NOT EXISTS client_note text,
  ADD COLUMN IF NOT EXISTS finished_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_method text,
  ADD COLUMN IF NOT EXISTS filed_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_session_id text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS video_link text;
ALTER TYPE public.message_type ADD VALUE IF NOT EXISTS 'payment_reminder';
ALTER TYPE public.message_type ADD VALUE IF NOT EXISTS 'doc_fix_request';
ALTER TYPE public.message_type ADD VALUE IF NOT EXISTS 'review_sign_pay';
ALTER TYPE public.message_type ADD VALUE IF NOT EXISTS 'return_filed';

CREATE OR REPLACE FUNCTION public.compute_ready_score(_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare total int; done int; st appointment_status; score int;
begin
  select count(*) filter (where required),
         count(*) filter (where required and (status = 'not_applicable' or (status = 'uploaded' and review_status <> 'needs_fix')))
    into total, done from checklist_items where appointment_id = _id;
  select status into st from appointments where id = _id;
  score := case when total = 0 then 100 else round(100.0 * done / total) end;
  if st = 'confirmed' then score := score + 10; end if;
  update appointments set ready_score = least(100, score) where id = _id and ready_score is distinct from least(100, score);
end $function$;