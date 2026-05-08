-- Migration 005: Experience type taxonomy expansion + price tier
-- Sprint: vtopia-experience-overhaul-20260507

-- ── 1. Add new columns ──────────────────────────────────────────────

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS price_tier       INT     DEFAULT NULL
    CHECK (price_tier BETWEEN 1 AND 4),
  ADD COLUMN IF NOT EXISTS external_url     TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tips             TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS requires_booking BOOLEAN DEFAULT FALSE;

-- ── 2. Expand experience_type CHECK constraint ──────────────────────

ALTER TABLE public.experiences
  DROP CONSTRAINT IF EXISTS experiences_experience_type_check;

ALTER TABLE public.experiences
  ADD CONSTRAINT experiences_experience_type_check
  CHECK (experience_type IN (
    -- Vtopia-managed booking
    'reservable',

    -- External ticketing (general events)
    'ticketed',

    -- Food
    'restaurant_reserve',   -- sit-down, reservation recommended
    'food_walkup',          -- walk-in, no reservation needed

    -- Outdoors
    'outdoor_free',         -- parks, trails, free public spaces
    'outdoor_paid',         -- zoo, botanical garden, equipment rental

    -- Culture
    'cultural_free',        -- museums on free days, public galleries
    'cultural_paid',        -- paid admission museums/attractions

    -- Nightlife
    'nightlife_walkin',     -- bars, lounges, walk-in clubs
    'nightlife_ticketed',   -- ticketed club nights, events

    -- Other
    'shopping',
    'hotel',
    'sports_event',
    'transport',

    -- Legacy values from migration 004 (kept until all rows are remapped)
    'free_no_booking',
    'food_delivery',
    'outdoor_info',
    'nightlife'
  ));

-- ── 3. Backfill price_tier from price_per_person ────────────────────

UPDATE public.experiences SET price_tier =
  CASE
    WHEN price_per_person IS NULL OR price_per_person = 0 THEN NULL
    WHEN price_per_person < 15                            THEN 1
    WHEN price_per_person < 40                            THEN 2
    WHEN price_per_person < 80                            THEN 3
    ELSE                                                       4
  END
WHERE price_tier IS NULL;

-- ── 4. Remap old experience_type values to new taxonomy ─────────────

-- free_no_booking → outdoor_free (Outdoors) or cultural_free (Arts & Culture)
UPDATE public.experiences
  SET experience_type = 'outdoor_free'
  WHERE experience_type = 'free_no_booking'
    AND category = 'Outdoors';

UPDATE public.experiences
  SET experience_type = 'cultural_free'
  WHERE experience_type = 'free_no_booking'
    AND category = 'Arts & Culture';

UPDATE public.experiences
  SET experience_type = 'outdoor_free'
  WHERE experience_type = 'free_no_booking';  -- catch-all for remaining

-- food_delivery → food_walkup
UPDATE public.experiences
  SET experience_type = 'food_walkup'
  WHERE experience_type = 'food_delivery';

-- outdoor_info → outdoor_free
UPDATE public.experiences
  SET experience_type = 'outdoor_free'
  WHERE experience_type = 'outdoor_info';

-- nightlife → nightlife_walkin (default; ticketed spots overridden below)
UPDATE public.experiences
  SET experience_type = 'nightlife_walkin'
  WHERE experience_type = 'nightlife';

-- ticketed (Sports category) → sports_event
UPDATE public.experiences
  SET experience_type = 'sports_event'
  WHERE experience_type = 'ticketed'
    AND category = 'Sports';

-- ── 5. KC-specific overrides ────────────────────────────────────────

-- Sit-down restaurants that benefit from reservations
UPDATE public.experiences
  SET experience_type = 'restaurant_reserve', requires_booking = false
  WHERE city = 'Kansas City'
    AND category = 'Food & Drink'
    AND experience_type = 'reservable'
    AND title IN (
      'Grand Street Cafe', 'Blue Nile Cafe', 'Cafe Trio',
      'O''Neils Restaurant', 'The JEM', 'Enzo', 'La Costa Mexicana',
      'Minsky''s Pizza'
    );

-- Bar/grill hybrids → nightlife_walkin
UPDATE public.experiences
  SET experience_type = 'nightlife_walkin'
  WHERE city = 'Kansas City'
    AND title ILIKE '%flea market bar%';

-- KC Streetcar → transport + Free
UPDATE public.experiences
  SET experience_type    = 'transport',
      requires_booking   = false,
      price_tier         = NULL,
      external_url       = 'https://www.kcstreetcar.org',
      maps_url           = 'https://www.google.com/maps/search/?api=1&query=KC+Streetcar+Kansas+City',
      tips               = 'The streetcar runs every 10–15 minutes, 7am–midnight weekdays. It''s free to ride — just hop on. The Main Street line connects the River Market to Crown Center.'
  WHERE city = 'Kansas City'
    AND title ILIKE '%streetcar%';

-- Nelson-Atkins Museum → cultural_free
UPDATE public.experiences
  SET experience_type  = 'cultural_free',
      price_tier       = NULL,
      external_url     = 'https://www.nelson-atkins.org',
      tips             = 'Admission is free (suggested donation $15). The outdoor Sculpture Park is always open. Thursdays 10am–9pm if you want to avoid weekend crowds.'
  WHERE city = 'Kansas City'
    AND title ILIKE '%nelson%atkins%';

-- Kemper Museum → cultural_free
UPDATE public.experiences
  SET experience_type  = 'cultural_free',
      price_tier       = NULL,
      external_url     = 'https://www.kemperart.org',
      tips             = 'Always free. Closed Mondays. The on-site Café Sebastienne is worth a stop for lunch.'
  WHERE city = 'Kansas City'
    AND title ILIKE '%kemper%';

-- KC Zoo → outdoor_paid tier 2
UPDATE public.experiences
  SET experience_type  = 'outdoor_paid',
      price_tier       = 2,
      external_url     = 'https://www.kczoo.org',
      tips             = 'Buy tickets online to skip the gate line. Arrive early in summer — animals are most active before 11am. Parking is free.'
  WHERE city = 'Kansas City'
    AND title ILIKE '%zoo%';

-- Worlds of Fun → outdoor_paid tier 3
UPDATE public.experiences
  SET experience_type  = 'outdoor_paid',
      price_tier       = 3,
      external_url     = 'https://www.worldsoffun.com',
      tips             = 'Buy tickets at least 24 hours in advance online for significant savings. Arrives when gates open to hit top coasters before 11am crowds.'
  WHERE city = 'Kansas City'
    AND title ILIKE '%worlds of fun%';

-- KC Royals → sports_event tier 2
UPDATE public.experiences
  SET experience_type  = 'sports_event',
      price_tier       = 2,
      external_url     = 'https://www.mlb.com/royals/tickets',
      ticket_url       = 'https://www.mlb.com/royals/tickets',
      tips             = 'Right field seats in the lower bowl offer the best view-to-price ratio. Gates open 90 minutes before first pitch — worth arriving early for BP.'
  WHERE city = 'Kansas City'
    AND (title ILIKE '%royals%' OR title ILIKE '%kauffman%');

-- KC Chiefs → sports_event tier 4
UPDATE public.experiences
  SET experience_type  = 'sports_event',
      price_tier       = 4,
      external_url     = 'https://www.chiefs.com/tickets/',
      ticket_url       = 'https://www.chiefs.com/tickets/',
      tips             = 'Parking opens 5 hours before kickoff — tailgating is a KC institution. Buy on secondary market (Ticketmaster or SeatGeek) at face value or below mid-week.'
  WHERE city = 'Kansas City'
    AND (title ILIKE '%chiefs%' OR title ILIKE '%arrowhead%' OR title ILIKE '%GEHA%');

-- Sporting KC → sports_event tier 2
UPDATE public.experiences
  SET experience_type  = 'sports_event',
      price_tier       = 2,
      external_url     = 'https://www.sportingkc.com/tickets',
      ticket_url       = 'https://www.sportingkc.com/tickets',
      tips             = 'Children 2 and under are free. The supporter''s section (Cauldron) is the loudest spot in the stadium. Pre-match tailgate starts 2 hours before.'
  WHERE city = 'Kansas City'
    AND title ILIKE '%sporting kc%';

-- Knuckleheads → nightlife_ticketed
UPDATE public.experiences
  SET experience_type  = 'nightlife_ticketed',
      price_tier       = 2,
      external_url     = 'https://knuckleheadskc.com',
      ticket_url       = 'https://knuckleheadskc.com/events',
      tips             = 'Indoor and outdoor stages. Show up 30 minutes before showtime to claim a good spot. Cash bar at the door is faster than the main bar.'
  WHERE city = 'Kansas City'
    AND title ILIKE '%knucklehead%';

-- Green Lady Lounge → nightlife_walkin
UPDATE public.experiences
  SET experience_type  = 'nightlife_walkin',
      price_tier       = 1,
      external_url     = 'https://www.greenladylounge.com',
      tips             = 'Live jazz every night — no cover. Get there by 9pm on weekends for a seat. Cash only at the bar. The vibe is intimate; talking during sets is frowned upon.'
  WHERE city = 'Kansas City'
    AND title ILIKE '%green lady%';

-- Loose Park → outdoor_free
UPDATE public.experiences
  SET experience_type  = 'outdoor_free',
      price_tier       = NULL,
      tips             = 'The rose garden peaks in June and September. Dog-friendly with a dog run off-leash area. Free parking on Wornall Road. Popular for weekend morning runs.'
  WHERE city = 'Kansas City'
    AND title ILIKE '%loose park%';

-- Swope Park → outdoor_free
UPDATE public.experiences
  SET experience_type  = 'outdoor_free',
      price_tier       = NULL,
      tips             = 'One of the largest urban parks in the US. Trail network connects to the zoo and golf courses. MTB trails on the east side. Free parking throughout.'
  WHERE city = 'Kansas City'
    AND title ILIKE '%swope%';

-- Power & Light District → nightlife_walkin
UPDATE public.experiences
  SET experience_type  = 'nightlife_walkin',
      price_tier       = 1,
      tips             = 'The district itself is free to walk. Most bars charge a cover on weekend nights ($5–15). The outdoor area fills up for Chiefs games — arrive 2 hours early for a spot.'
  WHERE city = 'Kansas City'
    AND title ILIKE '%power%light%';

-- River Market → cultural_free
UPDATE public.experiences
  SET experience_type  = 'cultural_free',
      price_tier       = NULL,
      tips             = 'The Saturday farmers market runs 6am–3pm, year-round. Best produce before 9am. Several good Vietnamese and Cambodian restaurants on the surrounding blocks.'
  WHERE city = 'Kansas City'
    AND title ILIKE '%river market%';

-- Science City → cultural_paid tier 2
UPDATE public.experiences
  SET experience_type  = 'cultural_paid',
      price_tier       = 2,
      external_url     = 'https://www.unionstation.org/sciencecity',
      tips             = 'Located inside Union Station. Buy a combo ticket that includes the planetarium. Weekday mornings are quietest. Free parking in the Union Station garage with validation.'
  WHERE city = 'Kansas City'
    AND (title ILIKE '%science city%' OR title ILIKE '%union station%');

-- Starbucks → food_walkup tier 1 + DoorDash
UPDATE public.experiences
  SET experience_type  = 'food_walkup',
      price_tier       = 1,
      external_url     = 'https://www.starbucks.com',
      delivery_url     = 'https://www.doordash.com/search/store/starbucks+kansas+city/',
      tips             = 'Mobile order ahead via the Starbucks app to skip the line during the morning rush.'
  WHERE city = 'Kansas City'
    AND title ILIKE '%starbucks%';

-- Set requires_booking = true only for reservable
UPDATE public.experiences
  SET requires_booking = TRUE
  WHERE experience_type = 'reservable';

-- ── 6. Remove legacy type values now that all rows are remapped ─────
-- (Run ONLY after confirming no rows remain with old type names)
-- Uncomment when ready:
--
-- ALTER TABLE public.experiences
--   DROP CONSTRAINT IF EXISTS experiences_experience_type_check;
-- ALTER TABLE public.experiences
--   ADD CONSTRAINT experiences_experience_type_check
--   CHECK (experience_type IN (
--     'reservable','ticketed','restaurant_reserve','food_walkup',
--     'outdoor_free','outdoor_paid','cultural_free','cultural_paid',
--     'nightlife_walkin','nightlife_ticketed','shopping','hotel',
--     'sports_event','transport'
--   ));
