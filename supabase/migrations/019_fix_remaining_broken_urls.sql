-- ── Fix 2 additional broken experiences found in second test run ──────────────
-- Apply in Supabase Dashboard → SQL Editor.

-- Kush Wynwood: PERMANENTLY CLOSED as of May 2026 (Yelp confirmed)
UPDATE public.experiences SET
  is_active   = false,
  website     = NULL,
  link_status = 'broken'
WHERE id = '16f1baaf-9633-4f24-9794-a061a42dead8';

-- Metro KC Fitness - Downtown: old URL used http:// and missing location path
UPDATE public.experiences SET
  external_url = 'https://metrokcfitness.com/location/downtown/',
  link_status  = 'verified'
WHERE id = 'a1038405-26e2-486f-b923-3d0da235ecec';
