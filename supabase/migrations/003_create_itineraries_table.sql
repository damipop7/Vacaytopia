-- Migration: Create itineraries table for AI-generated trip plans
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.itineraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget TEXT NOT NULL,
  interests TEXT[] DEFAULT '{}',
  traveler_type TEXT,
  extras TEXT,
  itinerary_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: users can only see/edit their own itineraries
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own itineraries"
  ON public.itineraries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own itineraries"
  ON public.itineraries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own itineraries"
  ON public.itineraries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookup by user
CREATE INDEX itineraries_user_id_idx ON public.itineraries(user_id);
CREATE INDEX itineraries_city_idx ON public.itineraries(city);

-- Grant usage to authenticated role
GRANT SELECT, INSERT, DELETE ON public.itineraries TO authenticated;
