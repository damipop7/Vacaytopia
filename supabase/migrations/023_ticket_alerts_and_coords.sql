-- ── Ticket price alerts + lat/lng for experience map pins ────────────────────
--
-- ticket_alerts: captures email + match when someone clicks "Notify me"
-- lat/lng: used by the discover script and browse map
--
-- Apply in Supabase Dashboard → SQL Editor.

-- ── 1. Coordinates on experiences (used by discoverExperiences.ts) ────────────
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS lat NUMERIC(10,7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lng NUMERIC(10,7) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_experiences_coords
  ON public.experiences (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- ── 2. Ticket price alert captures ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ticket_alerts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  match_id   TEXT NOT NULL,   -- e.g. 'arg-alg-jun16'
  match_name TEXT NOT NULL,   -- e.g. 'Argentina vs Algeria'
  max_price  INTEGER,         -- user's price ceiling in USD (optional)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ticket_alerts ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can insert their own alert
CREATE POLICY "Anyone can subscribe to ticket alerts"
  ON public.ticket_alerts FOR INSERT WITH CHECK (true);

-- Only admins can read the list
CREATE POLICY "Admins can read ticket alerts"
  ON public.ticket_alerts FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
