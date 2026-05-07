-- Add experience_type taxonomy to experiences table
-- This drives smart CTA rendering per experience type (Workstream 7)

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS experience_type TEXT
    CHECK (experience_type IN (
      'reservable',       -- Vtopia booking flow
      'ticketed',         -- external ticket platform (Ticketmaster, Eventbrite, etc.)
      'free_no_booking',  -- parks, landmarks, public spaces
      'food_delivery',    -- casual dining / order online
      'outdoor_info',     -- hiking, biking, trails
      'nightlife',        -- bars, clubs, rooftop venues
      'shopping'          -- markets, boutiques
    ));

-- Add external link fields for non-reservable types
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS ticket_url    TEXT,   -- for ticketed type
  ADD COLUMN IF NOT EXISTS delivery_url  TEXT,   -- for food_delivery type
  ADD COLUMN IF NOT EXISTS maps_url      TEXT,   -- for free/outdoor/nightlife/shopping
  ADD COLUMN IF NOT EXISTS has_real_image BOOLEAN DEFAULT false;

-- Default existing experiences to 'reservable' (safe fallback — preserves booking flow)
UPDATE public.experiences
  SET experience_type = 'reservable'
  WHERE experience_type IS NULL;

-- Back-fill Kansas City experiences with sensible types based on category
UPDATE public.experiences SET experience_type = 'food_delivery'
  WHERE city = 'Kansas City' AND category = 'Food & Drink' AND price_per_person = 0;

UPDATE public.experiences SET experience_type = 'free_no_booking'
  WHERE city = 'Kansas City' AND category = 'Outdoors' AND price_per_person = 0;

UPDATE public.experiences SET experience_type = 'ticketed'
  WHERE city = 'Kansas City' AND category = 'Sports';

UPDATE public.experiences SET experience_type = 'nightlife'
  WHERE city = 'Kansas City' AND category = 'Nightlife';

COMMENT ON COLUMN public.experiences.experience_type IS
  'Controls CTA rendering: reservable=Vtopia booking, ticketed=external tickets, free_no_booking=directions only, food_delivery=DoorDash/website, outdoor_info=trail/maps, nightlife=details+directions, shopping=website/maps';
