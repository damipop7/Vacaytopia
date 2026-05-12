-- Migration 010: Add provider_email to experiences
-- Used by stripe-webhook to notify the operator when a booking is confirmed.
-- Falls back to hello@vtopia.world when null (see stripe-webhook/index.ts).

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS provider_email TEXT DEFAULT NULL;
