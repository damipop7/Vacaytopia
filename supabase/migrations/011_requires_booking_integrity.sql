-- Migration 011: Enforce requires_booking integrity
--
-- requires_booking=true means Vtopia processes payment for this experience.
-- That only makes sense if an operator has been onboarded (provider_email set).
-- Experiences without a provider_email route to their external_url or Google Maps
-- and should never generate a Stripe PaymentIntent.
--
-- This resets the flag for all auto-imported experiences that were never
-- manually onboarded. They remain active and discoverable — just not Vtopia-booked.

UPDATE public.experiences
SET requires_booking = false
WHERE requires_booking = true
  AND (provider_email IS NULL OR provider_email = '');
