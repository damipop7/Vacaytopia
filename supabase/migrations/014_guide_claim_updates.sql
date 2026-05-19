-- ── 1. Extend guide_applications with photo, rate, and consent ──────────────
ALTER TABLE public.guide_applications
  ADD COLUMN IF NOT EXISTS avatar_url              TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rate_text               TEXT    DEFAULT NULL,  -- e.g. "$75/person"
  ADD COLUMN IF NOT EXISTS background_check_consent BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 2. Experience claims — "I own this listing" queue ────────────────────────
CREATE TABLE IF NOT EXISTS public.experience_claims (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experience_id       UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimant_name       TEXT NOT NULL,
  claimant_email      TEXT NOT NULL,
  business_role       TEXT NOT NULL,   -- owner | manager | marketing | other
  proof_website       TEXT,
  proof_notes         TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected')),
  admin_notes         TEXT,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at         TIMESTAMPTZ
);

ALTER TABLE public.experience_claims ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a claim
CREATE POLICY "Anyone can submit an experience claim"
  ON public.experience_claims FOR INSERT
  WITH CHECK (true);

-- Claimant can see their own claim if logged in
CREATE POLICY "Users can view their own claims"
  ON public.experience_claims FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view and update all claims
CREATE POLICY "Admins can manage experience claims"
  ON public.experience_claims FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── 3. Mark verified/claimed status on experiences ───────────────────────────
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS is_claimed           BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_owner_email TEXT    DEFAULT NULL;
