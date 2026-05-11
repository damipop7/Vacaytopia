-- Migration 009: Link status tracking for external URLs
-- Adds link_status column so broken/unverified CTAs can be hidden from users.

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS link_status TEXT DEFAULT 'unverified'
    CHECK (link_status IN ('verified', 'unverified', 'broken'));

CREATE INDEX IF NOT EXISTS idx_experiences_link_status
  ON public.experiences (link_status)
  WHERE link_status IN ('broken', 'unverified');

COMMENT ON COLUMN public.experiences.link_status IS
  'verified = URL confirmed live; unverified = not yet checked; broken = 404/timeout/wrong domain';
