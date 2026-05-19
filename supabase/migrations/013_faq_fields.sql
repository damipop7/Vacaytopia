-- Add faq_text to experiences (AI concierge uses this as context)
-- and to operator_submissions (collected at listing time, populated into experiences on approval)

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS faq_text TEXT DEFAULT NULL;

ALTER TABLE public.operator_submissions
  ADD COLUMN IF NOT EXISTS faq_text TEXT DEFAULT NULL;
