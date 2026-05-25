-- ── Fix 20 broken experience URLs found by npm run test:live ─────────────────
--
-- Sources: web search May 2026 to verify current live URLs.
-- Apply in Supabase Dashboard → SQL Editor.
--
-- Legend:
--   link_status = 'verified'   → confirmed reachable, safe to show transactional CTAs
--   link_status = 'unverified' → best available link but not independently verified
--   is_active   = false        → business permanently closed, hide from browse

-- ── The River Course ──────────────────────────────────────────────────────────
-- happygilmoresgolf.com is dead. The River Course is part of Heart of America
-- Golf Course; official URL is hoagolfcourse.com/Course/TheRiver.
UPDATE public.experiences SET
  external_url = 'https://www.hoagolfcourse.com/Course/TheRiver',
  link_status  = 'verified'
WHERE id = '9a60198c-bb2a-4374-b3d1-551e487a6f0e';

-- ── Hammerhand Coffee ─────────────────────────────────────────────────────────
-- Domain changed: hammerhandcoffee.com → hammerhand.coffee
UPDATE public.experiences SET
  external_url = 'https://hammerhand.coffee/',
  link_status  = 'verified'
WHERE id = '9e285649-b22c-4046-9c37-8d20b549ce8e';

-- ── Minsky's Pizza ────────────────────────────────────────────────────────────
-- www.minskys.com failed; root domain minskys.com is live.
UPDATE public.experiences SET
  external_url = 'https://minskys.com/',
  link_status  = 'verified'
WHERE id = '95593a4d-7cfb-4536-ad71-9a03971cb173';

-- ── 810 Zone Sports Bar ───────────────────────────────────────────────────────
-- Permanently CLOSED (Yelp: "CLOSED" as of March 2026). Deactivate listing.
UPDATE public.experiences SET
  is_active    = false,
  external_url = NULL,
  link_status  = 'broken'
WHERE id = 'd73bacaa-4f68-4a50-9913-9ae16baf1296';

-- ── Block 15 Tavern & Exchange ────────────────────────────────────────────────
-- Correct URL found: block15kc.com
UPDATE public.experiences SET
  external_url = 'https://www.block15kc.com',
  link_status  = 'verified'
WHERE id = 'ddc9fe50-cd3d-4739-983a-3ef43e9da274';

-- ── Torn Label Brewing Co. ────────────────────────────────────────────────────
-- Cloudflare 520 on old http:// URL. Updated to https://.
UPDATE public.experiences SET
  external_url = 'https://tornlabel.com/',
  link_status  = 'verified'
WHERE id = '4d9e64e4-6660-4e46-8923-cc83b1392516';

-- ── Money Museum (Federal Reserve Bank KC) ────────────────────────────────────
-- Old URL timed out. Official Federal Reserve Bank KC page is live.
UPDATE public.experiences SET
  external_url = 'https://www.kansascityfed.org/moneymuseum/',
  link_status  = 'verified'
WHERE id = 'd2ff1c55-62ca-496c-9550-ceef13c2dd7a';

-- ── Heart of America Golf Course ──────────────────────────────────────────────
-- Old URL returned 500. Official site hoagolfcourse.com is live.
UPDATE public.experiences SET
  external_url = 'https://www.hoagolfcourse.com/',
  link_status  = 'verified'
WHERE id = '55bf2667-9f64-4e40-80e2-47851f26b6f9';

-- ── Shoal Creek Golf Course ───────────────────────────────────────────────────
-- Old URL returned 500. Official site shoalcreekgolf.com is live.
UPDATE public.experiences SET
  external_url = 'https://www.shoalcreekgolf.com/',
  link_status  = 'verified'
WHERE id = 'c596bcf2-cfcd-4c8e-9812-ff5ce9ab5915';

-- ── Thomas Hart Benton Home & Studio ─────────────────────────────────────────
-- Old URL returned 404. Missouri State Parks is the authoritative source.
UPDATE public.experiences SET
  external_url = 'https://mostateparks.com/historic-site/thomas-hart-benton-home-and-studio-state-historic-site',
  link_status  = 'verified'
WHERE id = 'b75f26b2-503f-4393-9f8d-45f8db840e2b';

-- ── Hodge Park Golf Course ────────────────────────────────────────────────────
-- Old URL returned 500. Official site hodgeparkgolf.com is live.
UPDATE public.experiences SET
  external_url = 'https://www.hodgeparkgolf.com/',
  link_status  = 'verified'
WHERE id = 'fc3072f3-3877-4d12-bc65-e1efc3367646';

-- ── PlazaMassage ─────────────────────────────────────────────────────────────
-- No owned website found (old URL 502). Fresha booking page is best available.
UPDATE public.experiences SET
  external_url = 'https://www.fresha.com/lvp/plazamassage-belleview-avenue-kansas-city-2M8x82',
  link_status  = 'unverified'
WHERE id = '8473bb0e-c28a-4d10-bec8-6b44cc3537dd';

-- ── MOB WAFFLES ───────────────────────────────────────────────────────────────
-- mobwaffles.com (old URL) is a dead domain. Business is open (March 2026 Yelp).
-- Using DoorDash page until they restore their own site.
UPDATE public.experiences SET
  external_url = 'https://www.doordash.com/store/mob-waffles-kansas-city-39607711/',
  link_status  = 'unverified'
WHERE id = 'c1067c7e-d69d-4f5d-8222-11aa0510fec6';

-- ── Kundalini Yoga & Meditation ───────────────────────────────────────────────
-- kckundaliniyoga.org returned 502 (server issue). 3HO Foundation of Missouri
-- is the umbrella org running the same KC center.
UPDATE public.experiences SET
  external_url = 'https://www.3hofoundationofmissouri.com/kansas-city-ks/kundalini-yoga-and-meditation-classes',
  link_status  = 'unverified'
WHERE id = '8f8ae89a-f5b0-42e3-85d2-d7cef0cfa07e';

-- ── Gravady (Las Vegas) ───────────────────────────────────────────────────────
-- Gravady rebranded to DEFY Extreme Air Sports. gravady.com shows "Coming Soon".
UPDATE public.experiences SET
  website     = 'https://defy.com/locations/',
  link_status = 'unverified'
WHERE id = '4044e370-79ff-4d40-b402-838255e27a3d';

-- ── Church's Chicken ─────────────────────────────────────────────────────────
-- Old website URL missing the period in "e." — correct URL confirmed live.
UPDATE public.experiences SET
  website     = 'https://locations.churchs.com/mo/kansas-city/2600-e.-gregory-boulevard',
  link_status = 'verified'
WHERE id = 'a7d82a09-a597-40c6-b616-f41385fedcdc';

-- ── Jewish Community Center of Greater Kansas City ────────────────────────────
-- jcckc.org is unreachable. Organization rebranded to "The J KC" → thejkc.org.
UPDATE public.experiences SET
  external_url = 'https://www.thejkc.org/',
  link_status  = 'verified'
WHERE id = '69dfcd8e-0719-4763-ba0f-32fe90c8df86';

-- ── Five Guys (NYC 55th St) ───────────────────────────────────────────────────
-- Old olo.express ordering URL is dead. Official Five Guys restaurant page is live.
UPDATE public.experiences SET
  website     = 'https://restaurants.fiveguys.com/43-w-55th-street',
  link_status = 'verified'
WHERE id = 'c5151fc5-7e8c-4b6b-8289-0d94ab5b3a3e';

-- ── Trudy's Ice Cream (NYC) ───────────────────────────────────────────────────
-- trudysicecream.com fetch failed — likely intermittent. Domain confirmed correct.
UPDATE public.experiences SET
  website     = 'https://trudysicecream.com/',
  link_status = 'unverified'
WHERE id = '308d25f7-6583-4519-9aa0-fb8f33ea4428';

-- ── Brenden Theater (Palms Casino, Las Vegas) ─────────────────────────────────
-- Old path /imax-theater.html no longer exists. Updated to current Palms page.
UPDATE public.experiences SET
  website     = 'https://www.palms.com/experiences/brenden-theatres',
  link_status = 'verified'
WHERE id = 'fc1405ba-65e7-45f3-9338-82600a52c7de';
