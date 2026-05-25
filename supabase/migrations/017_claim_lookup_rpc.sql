-- ── Claim page: bypass is_active RLS filter ──────────────────────────────────
--
-- Problem: the "Experiences are public" RLS policy filters by is_active = true.
-- This blocks the claim page from loading inactive experiences — a business
-- owner should be able to claim their listing even if it hasn't been published.
--
-- Fix: SECURITY DEFINER function runs as the DB owner, bypassing RLS,
-- and returns only the minimal fields needed for the claim form.
--
-- Apply in Supabase Dashboard → SQL Editor.

CREATE OR REPLACE FUNCTION public.get_experience_for_claim(exp_id uuid)
RETURNS TABLE (
  id           uuid,
  title        text,
  city         text,
  category     text,
  image_emoji  text,
  is_claimed   boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id, title, city, category, image_emoji, is_claimed
  FROM public.experiences
  WHERE id = exp_id;
$$;

-- Allow any visitor (logged in or not) to call this function
GRANT EXECUTE ON FUNCTION public.get_experience_for_claim(uuid) TO anon, authenticated;
