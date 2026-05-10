-- Migration 008: Data enrichment columns + quality scoring
-- Adds Google Places, Foursquare, hours, quality score, and data freshness.
-- All columns use ADD COLUMN IF NOT EXISTS — safe to re-run.

-- ── 1. Google Places enrichment ──────────────────────────────────────────────
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS google_place_id     TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_rating       NUMERIC(3,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_review_count INT     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_price_level  INT     DEFAULT NULL CHECK (google_price_level BETWEEN 0 AND 4),
  ADD COLUMN IF NOT EXISTS google_photos       TEXT[]  DEFAULT NULL,  -- array of Google Places photo references
  ADD COLUMN IF NOT EXISTS place_website       TEXT    DEFAULT NULL;

-- ── 2. Opening hours (JSON: { mon:"09:00-21:00", tue:..., ... }) ─────────────
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS hours               JSONB   DEFAULT NULL;

-- ── 3. Foursquare enrichment ──────────────────────────────────────────────────
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS foursquare_id       TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS foursquare_tips     TEXT[]  DEFAULT NULL;

-- ── 4. Data quality ────────────────────────────────────────────────────────────
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS data_freshness      TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS quality_score       INT     DEFAULT NULL CHECK (quality_score BETWEEN 0 AND 100);

-- ── 5. Index on quality_score so low-quality records can be deprioritised ─────
CREATE INDEX IF NOT EXISTS idx_experiences_quality_score
  ON public.experiences (quality_score ASC NULLS LAST);

-- ── 6. Index on google_place_id for enrichment pipeline lookups ───────────────
CREATE INDEX IF NOT EXISTS idx_experiences_google_place_id
  ON public.experiences (google_place_id)
  WHERE google_place_id IS NOT NULL;

-- ── 7. Partial index: stale records (older than 30 days) ─────────────────────
CREATE INDEX IF NOT EXISTS idx_experiences_stale
  ON public.experiences (data_freshness ASC)
  WHERE data_freshness < NOW() - INTERVAL '30 days' OR data_freshness IS NULL;

COMMENT ON COLUMN public.experiences.quality_score    IS '0–100. Records below 60 are deprioritised in recommendations.';
COMMENT ON COLUMN public.experiences.data_freshness   IS 'Last time enrichment pipeline ran for this record.';
COMMENT ON COLUMN public.experiences.hours            IS 'JSON: { mon:"09:00-21:00", tue:"09:00-21:00", ... } in local time.';
