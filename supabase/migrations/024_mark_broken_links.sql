-- ── Mark confirmed-dead experience links as broken ───────────────────────────
--
-- Torn Label Brewing: SSL 526 error (Cloudflare origin unreachable)
-- Block 15 Tavern: fetch failed (domain not resolving)
--
-- Marking link_status = 'broken' hides the external link button from users
-- and surfaces them in the admin /admin/links broken-link queue.
--
-- Apply in Supabase Dashboard → SQL Editor.

UPDATE public.experiences
SET link_status = 'broken'
WHERE title IN (
  'Torn Label Brewing Co.',
  'Block 15 Tavern & Exchange'
)
AND link_status != 'broken';
