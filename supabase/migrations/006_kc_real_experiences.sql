-- Migration 006: Replace fake seeded KC data with real experiences
-- Sprint: vtopia-data-quality-20260508

-- ── 1. Hide chain/fast-food entries — not appropriate WC recommendations ──────

UPDATE public.experiences
SET is_active = false
WHERE city = 'Kansas City'
  AND title IN (
    'Starbucks', 'Church''s Chicken', 'Hardee''s', 'Five Guys',
    'Jimmy John''s', 'Planet Sub', 'Sarpino''s', 'Chipotle',
    'Minsky''s Pizza'
  );

-- ── 2. Fix prices on known restaurants still active ───────────────────────────

-- Sit-down restaurants had wildly wrong seed prices
UPDATE public.experiences SET price_per_person = 32, price_tier = 2
  WHERE city = 'Kansas City' AND title = 'Grand Street Cafe';
UPDATE public.experiences SET price_per_person = 28, price_tier = 2
  WHERE city = 'Kansas City' AND title = 'Blue Nile Cafe';
UPDATE public.experiences SET price_per_person = 30, price_tier = 2
  WHERE city = 'Kansas City' AND title = 'Cafe Trio';
UPDATE public.experiences SET price_per_person = 45, price_tier = 3
  WHERE city = 'Kansas City' AND title = 'Enzo';
UPDATE public.experiences SET price_per_person = 28, price_tier = 2
  WHERE city = 'Kansas City' AND title = 'La Costa Mexicana';
UPDATE public.experiences SET price_per_person = 22, price_tier = 2
  WHERE city = 'Kansas City' AND title = 'O''Neils Restaurant';
UPDATE public.experiences SET price_per_person = 35, price_tier = 2
  WHERE city = 'Kansas City' AND title = 'The JEM';
UPDATE public.experiences SET price_per_person = 18, price_tier = 2
  WHERE city = 'Kansas City' AND title = 'Westport Flea Market Bar & Grill';
UPDATE public.experiences SET price_per_person = 12, price_tier = 1
  WHERE city = 'Kansas City' AND title = 'Custard on the Square';
UPDATE public.experiences SET price_per_person = 8, price_tier = 1
  WHERE city = 'Kansas City' AND title = 'Hammerhand Coffee';

-- Bars — set realistic drink prices
UPDATE public.experiences SET price_per_person = 20, price_tier = 2
  WHERE city = 'Kansas City' AND experience_type = 'nightlife_walkin'
    AND price_per_person > 50;

-- ── 3. Insert real KC experiences ─────────────────────────────────────────────

INSERT INTO public.experiences (
  title, description, city, category,
  experience_type, price_per_person, price_tier,
  duration_label, max_guests,
  image_emoji, image_gradient,
  rating, review_count,
  is_active, is_featured,
  external_url, maps_url, tips,
  requires_booking, tags
) VALUES

-- ── BBQ Legends ──────────────────────────────────────────────────────────────

(
  'Joe''s Kansas City Bar-B-Que',
  'Widely regarded as one of the best BBQ restaurants in America. Famous for the Z-Man sandwich — smoked brisket, smoked provolone, and an onion ring on a kaiser roll. Walk-up counter inside a gas station. Cash-friendly, expect a line.',
  'Kansas City', 'Food & Drink',
  'food_walkup', 18, 1,
  '30–60 min', 50,
  '🔥', 'ci-no',
  4.9, 12800,
  true, true,
  'https://www.joeskc.com',
  'https://www.google.com/maps/search/?api=1&query=Joe''s+Kansas+City+Bar-B-Que',
  'The Z-Man is the must-order. Arrive before 11:30am or expect a 30+ minute wait. The 47th Street location is the original and most iconic. Cash or card accepted. They sell out of burnt ends by early afternoon.',
  false,
  ARRAY['bbq', 'world cup', 'iconic', 'local favorite', 'no reservation']
),

(
  'Q39 BBQ',
  'Chef-driven, competition-style BBQ that blends Kansas City tradition with wood-fired refinement. The prime brisket and burnt ends are the standouts. Full bar, craft cocktails, and a menu that goes beyond standard BBQ.',
  'Kansas City', 'Food & Drink',
  'restaurant_reserve', 38, 2,
  '1–2 hrs', 8,
  '🥩', 'ci-mia',
  4.8, 6200,
  true, true,
  'https://q39kc.com',
  'https://www.google.com/maps/search/?api=1&query=Q39+BBQ+Kansas+City',
  'Reserve on OpenTable — it fills up fast on game days. The Midtown location on McGee St is more intimate; Overland Park location has more parking. Try the burnt end baked beans as a side.',
  false,
  ARRAY['bbq', 'world cup', 'craft', 'reservation recommended', 'full bar']
),

(
  'Gates Bar-B-Q',
  'A Kansas City institution since 1946. Known for the loud, iconic greeting "HI, MAY I HELP YOU?" the moment you walk in. Classic KC-style BBQ with a rich tomato-based sauce. Five locations across the metro.',
  'Kansas City', 'Food & Drink',
  'food_walkup', 16, 1,
  '30–45 min', 100,
  '🍖', 'ci-orl',
  4.6, 4900,
  true, true,
  'https://gatesbbq.com',
  'https://www.google.com/maps/search/?api=1&query=Gates+Bar-B-Q+Kansas+City',
  'Order at the counter — the yell is part of the experience. Get the long end rib plate. The Main Street location near 18th & Vine is closest to the jazz district. Sauce is available to buy by the bottle.',
  false,
  ARRAY['bbq', 'iconic', 'historic', 'world cup', 'walk-up']
),

(
  'Arthur Bryant''s Barbeque',
  'The original Kansas City BBQ, open since 1908. Called "the single best restaurant in the world" by Calvin Trillin. Simple, no-frills counter service with thick-cut brisket and the famous tangy-sweet Bryant''s sauce.',
  'Kansas City', 'Food & Drink',
  'food_walkup', 15, 1,
  '30–45 min', 100,
  '🍗', 'ci-nyc',
  4.5, 3800,
  true, false,
  'https://arthurbryantsbbq.com',
  'https://www.google.com/maps/search/?api=1&query=Arthur+Bryant''s+Barbeque+Kansas+City',
  'Order the beef brisket sandwich — thick-cut and served on white bread with a pile of fries. The 18th & Brooklyn location is the historic original. Cash preferred. Closed Tuesdays.',
  false,
  ARRAY['bbq', 'historic', 'iconic', 'world cup', 'original']
),

(
  'Jack Stack Barbecue',
  'Upscale Kansas City BBQ with white tablecloths and a full bar. Famous for their crown prime beef back ribs, cheesy corn bake, and burnt ends. Multiple locations including a renovated firehouse in the Freight House District.',
  'Kansas City', 'Food & Drink',
  'restaurant_reserve', 48, 3,
  '1.5–2 hrs', 8,
  '🍷', 'ci-lv',
  4.7, 5100,
  true, false,
  'https://www.jackstackbbq.com',
  'https://www.google.com/maps/search/?api=1&query=Jack+Stack+Barbecue+Kansas+City',
  'Reserve ahead for the Freight House location — it''s the most scenic, near the Power & Light District. Crown prime beef back ribs are the signature. The cheesy corn bake is a non-negotiable side. Full bar with KC craft beers.',
  false,
  ARRAY['bbq', 'upscale', 'reservation recommended', 'world cup', 'full bar']
),

-- ── Culture & Arts ────────────────────────────────────────────────────────────

(
  '18th & Vine Jazz District',
  'The birthplace of Kansas City jazz and the geographic heart of Black history in KC. The district includes the American Jazz Museum, the Negro Leagues Baseball Museum, and several live music venues all within a few blocks.',
  'Kansas City', 'Arts & Culture',
  'cultural_paid', 12, 1,
  'Half day', 50,
  '🎷', 'ci-nyc',
  4.7, 2100,
  true, true,
  'https://americanjazzmuseum.org',
  'https://www.google.com/maps/search/?api=1&query=18th+and+Vine+Jazz+District+Kansas+City',
  'The combo ticket for the Jazz Museum + Negro Leagues Baseball Museum is $18 and worth every cent. Live jazz at the Blue Room (inside the Jazz Museum) on Friday and Saturday nights. The district comes alive after 9pm on weekends.',
  false,
  ARRAY['jazz', 'culture', 'history', 'world cup', 'live music', 'museums']
),

(
  'Crossroads Arts District',
  'KC''s creative hub, stretching along the streetcar corridor between downtown and Crown Center. Galleries, independent restaurants, coffee shops, and street art fill converted warehouses. First Fridays bring thousands of visitors each month.',
  'Kansas City', 'Arts & Culture',
  'cultural_free', 0, NULL,
  'Half day', 200,
  '🎨', 'ci-grn',
  4.6, 890,
  true, false,
  'https://thecrossroadsdistrict.com',
  'https://www.google.com/maps/search/?api=1&query=Crossroads+Arts+District+Kansas+City',
  'First Fridays (first Friday of every month, 5–9pm) transform the district — galleries open free, food trucks line the streets, thousands of locals turn out. The KC Streetcar stops right here. Check @crossroadsartsdistrict on Instagram for current gallery shows.',
  false,
  ARRAY['arts', 'galleries', 'free', 'streetcar', 'world cup', 'first fridays']
),

(
  'Nelson-Atkins Museum of Art',
  'One of America''s finest art museums, with a collection spanning 5,000 years. Free admission to the permanent collection. The outdoor Donald J. Hall Sculpture Park and the iconic Shuttlecocks installation on the front lawn are landmarks.',
  'Kansas City', 'Arts & Culture',
  'cultural_free', 0, NULL,
  '2–3 hrs', 200,
  '🏛️', 'ci-mia',
  4.8, 7400,
  true, true,
  'https://www.nelson-atkins.org',
  'https://www.google.com/maps/search/?api=1&query=Nelson-Atkins+Museum+Kansas+City',
  'Permanent collection is always free — suggested donation $15. Thursday evenings (10am–9pm) are less crowded than weekends. Don''t miss the Asian art wing and the Bloch Building (contemporary). The sculpture park is open dawn to dusk, always free.',
  false,
  ARRAY['museum', 'free', 'art', 'world cup', 'sculpture', 'family friendly']
),

-- ── Live Music & Nightlife ────────────────────────────────────────────────────

(
  'Green Lady Lounge',
  'A Kansas City jazz institution. Dark, intimate, and serious about the music. Live jazz every single night of the week, no cover charge. One of the last true jazz lounges in the Midwest.',
  'Kansas City', 'Nightlife',
  'nightlife_walkin', 15, 1,
  'Evening', 60,
  '🎶', 'ci-nyc',
  4.8, 1200,
  true, true,
  'https://www.greenladylounge.com',
  'https://www.google.com/maps/search/?api=1&query=Green+Lady+Lounge+Kansas+City',
  'No cover, ever. Get there by 9pm on weekends for a seat — it fills fast. Cash only at the bar. Talking during sets is considered rude; this crowd takes the music seriously. Pairs perfectly with dinner at 18th & Vine beforehand.',
  false,
  ARRAY['jazz', 'live music', 'no cover', 'iconic', 'world cup', 'intimate']
),

(
  'Knuckleheads Saloon',
  'Kansas City''s premier outdoor music venue, with both an indoor stage and a sprawling outdoor space. Hosts major touring acts across rock, blues, country, and alt-country. Cash bar at the door is faster than the main bar.',
  'Kansas City', 'Nightlife',
  'nightlife_ticketed', 25, 2,
  'Evening', 1500,
  '🎸', 'ci-no',
  4.6, 2300,
  true, false,
  'https://knuckleheadskc.com',
  'https://www.google.com/maps/search/?api=1&query=Knuckleheads+Saloon+Kansas+City',
  'Check the calendar at knuckleheadskc.com — shows sell out. Outdoor stage has no roof, check weather. Arrive 30 min before doors for good positioning. Rideshare drop-off on the north side of the building.',
  false,
  ARRAY['live music', 'outdoor', 'rock', 'blues', 'ticketed', 'world cup']
),

-- ── Outdoors ──────────────────────────────────────────────────────────────────

(
  'Loose Park',
  'A 75-acre urban park in the prestigious Ward Parkway neighborhood, featuring a rose garden with 5,000 rose bushes, a small lake, and wide open lawns. The city''s most beloved green space for morning runs and weekend picnics.',
  'Kansas City', 'Outdoors',
  'outdoor_free', 0, NULL,
  'Flexible', 500,
  '🌹', 'ci-grn',
  4.7, 1800,
  true, false,
  NULL,
  'https://www.google.com/maps/search/?api=1&query=Loose+Park+Kansas+City',
  'Rose garden peaks in June and September. Off-leash dog area on the north side. Free parking along Wornall Road. Popular for early morning runs before the heat sets in. The fountain area is a great photo spot.',
  false,
  ARRAY['park', 'free', 'rose garden', 'running', 'dogs', 'family friendly']
),

(
  'Swope Park',
  'One of the largest urban parks in the United States at 1,800 acres — larger than Central Park. Home to the Kansas City Zoo, a golf complex, mountain bike trails, and miles of hiking paths through native woodland.',
  'Kansas City', 'Outdoors',
  'outdoor_free', 0, NULL,
  'Half day', 1000,
  '🌲', 'ci-grn',
  4.6, 1100,
  true, false,
  NULL,
  'https://www.google.com/maps/search/?api=1&query=Swope+Park+Kansas+City',
  'The mountain bike trails on the east side are beginner-friendly. The park connects directly to the KC Zoo (separate admission). Multiple free parking lots throughout. Shelters can be reserved for groups. Great for a morning before an afternoon game.',
  false,
  ARRAY['park', 'free', 'trails', 'mountain biking', 'family', 'world cup']
),

-- ── Sports Events ─────────────────────────────────────────────────────────────

(
  'KC Current — NWSL Match',
  'The Kansas City Current are the dominant force in the National Women''s Soccer League, playing at the brand-new CPKC Stadium — the first stadium in the world built specifically for a women''s professional soccer team.',
  'Kansas City', 'Sports',
  'sports_event', 28, 2,
  '2.5 hrs', 11500,
  '⚽', 'ci-mia',
  4.8, 890,
  true, false,
  'https://www.nwslsoccer.com/kccurrent/tickets',
  'https://www.google.com/maps/search/?api=1&query=CPKC+Stadium+Kansas+City',
  'Perfect pre-World Cup activity — see elite women''s soccer in the world''s best women''s soccer-specific stadium. CPKC Stadium is on the riverfront, walkable from River Market. Kids 2 and under free. Standing section has the best atmosphere.',
  false,
  ARRAY['soccer', 'world cup', 'women''s soccer', 'NWSL', 'new stadium', 'riverside']
),

(
  'Sporting KC — MLS Match',
  'Kansas City''s Major League Soccer club, playing at Children''s Mercy Park in the suburb of Wyandotte County. Consistent playoff contenders with a passionate supporter culture. The Cauldron supporter section is one of the loudest in MLS.',
  'Kansas City', 'Sports',
  'sports_event', 32, 2,
  '2.5 hrs', 18500,
  '🏟️', 'ci-mia',
  4.6, 2200,
  true, false,
  'https://www.sportingkc.com/tickets',
  'https://www.google.com/maps/search/?api=1&query=Children''s+Mercy+Park+Kansas+City',
  'Request Cauldron tickets for the best atmosphere. Pre-match tailgate in the parking lot starts 2 hours before. Shuttle buses from downtown KC on match days. Great warm-up experience for World Cup visitors who want to feel KC soccer culture.',
  false,
  ARRAY['soccer', 'MLS', 'world cup', 'supporter culture', 'tailgate']
),

-- ── Getting Around ────────────────────────────────────────────────────────────

(
  'KC Streetcar — Main Street Line',
  'A free, 2.5-mile streetcar connecting the River Market through downtown to Crown Center and Union Station. Runs every 10–15 minutes. The single best way to move between the main tourist areas without a car.',
  'Kansas City', 'Outdoors',
  'transport', 0, NULL,
  'Flexible', 200,
  '🚃', 'ci-grn',
  4.7, 3400,
  true, true,
  'https://www.kcstreetcar.org',
  'https://www.google.com/maps/search/?api=1&query=KC+Streetcar+Kansas+City',
  'Completely free to ride, always. Runs 7am–midnight weekdays, until 2am Friday and Saturday. Connects: River Market → Power & Light → Crown Center → Union Station. Download the KC Streetcar app for real-time arrivals. Extension to UMKC/Westport underway.',
  false,
  ARRAY['free', 'transport', 'streetcar', 'world cup', 'downtown', 'no car needed']
);
