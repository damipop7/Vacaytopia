-- ── Ad Contracts — outreach pipeline for advertising on vtopia.world ──────────
--
-- Tracks every advertising contract generated for an experience operator.
-- Workflow: draft → sent → viewed → signed (or declined).
--
-- Tiers and monthly values:
--   starter  — $299/mo  — Sponsored badge + priority listing (30 days)
--   featured — $599/mo  — Homepage spotlight + category pin  (60 days)
--   premium  — $999/mo  — Homepage hero + newsletter + social (90 days)
--
-- Apply: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.ad_contracts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experience_id   UUID REFERENCES public.experiences(id) ON DELETE SET NULL,

  -- Contact info (may differ from provider_email — this is the ads/marketing contact)
  business_name   TEXT,
  contact_name    TEXT,
  contact_email   TEXT NOT NULL,

  -- Contract metadata
  contract_tier   TEXT NOT NULL CHECK (contract_tier IN ('starter', 'featured', 'premium')),
  monthly_value   NUMERIC(8,2) NOT NULL,
  campaign_days   INT NOT NULL,           -- 30 / 60 / 90
  contract_text   TEXT,                   -- Claude-generated full contract body

  -- Lifecycle
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'declined')),
  notes           TEXT,

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at         TIMESTAMPTZ,
  viewed_at       TIMESTAMPTZ,
  signed_at       TIMESTAMPTZ,
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- RLS
ALTER TABLE public.ad_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ad_contracts"
  ON public.ad_contracts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Fast lookups
CREATE INDEX IF NOT EXISTS idx_ad_contracts_experience_id ON public.ad_contracts (experience_id);
CREATE INDEX IF NOT EXISTS idx_ad_contracts_status        ON public.ad_contracts (status);
CREATE INDEX IF NOT EXISTS idx_ad_contracts_contact_email ON public.ad_contracts (contact_email);

COMMENT ON TABLE public.ad_contracts IS
  'Advertising contracts generated for experience operators to advertise on vtopia.world.';
