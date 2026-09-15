-- Migration: per-user rate limit log for the generate-itinerary edge function
-- Run this in Supabase Dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS public.itinerary_generation_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS enabled with no policies: only the service-role key (used server-side by the
-- edge function) can read/write this table. Not exposed to anon/authenticated clients.
ALTER TABLE public.itinerary_generation_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX itinerary_generation_log_user_created_idx
  ON public.itinerary_generation_log(user_id, created_at);
