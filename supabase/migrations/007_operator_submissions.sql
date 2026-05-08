-- Migration 007: Operator self-listing submissions table

CREATE TABLE IF NOT EXISTS public.operator_submissions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Contact
  operator_name   text NOT NULL,
  operator_email  text NOT NULL,
  business_name   text NOT NULL,
  -- Experience details
  title           text NOT NULL,
  category        text NOT NULL,
  experience_type text NOT NULL,
  price_per_person numeric(8,2),
  description     text NOT NULL,
  duration_label  text,
  max_guests      int,
  -- Links
  website         text,
  booking_url     text,
  -- Admin
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes     text,
  submitted_at    timestamptz NOT NULL DEFAULT now(),
  reviewed_at     timestamptz
);

-- Only admins can read/update; public can insert (submit)
ALTER TABLE public.operator_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit"
  ON public.operator_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage submissions"
  ON public.operator_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
