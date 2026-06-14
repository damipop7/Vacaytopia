-- ── KC Experience Expansion — 18 new experiences across all types ─────────────
-- Covers: reservable tours/crawls, ticketed live music, outdoor/free, cultural,
-- food/drink, and nightlife to hit the 15+ milestone and give the AI itinerary
-- generator a rich, varied pool for every visitor type.
--
-- Valid experience_type values (from 004 CHECK constraint):
--   'reservable' | 'ticketed' | 'free_no_booking' | 'food_delivery'
--   'outdoor_info' | 'nightlife' | 'shopping'
--
-- Apply: Supabase Dashboard → SQL Editor

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

-- ── RESERVABLE TOURS & EXPERIENCES ───────────────────────────────────────────

(
  'KC BBQ Trail Walking Tour',
  'A guided 3-hour walking tour hitting Kansas City''s legendary BBQ spots with a local expert. Sample brisket, burnt ends, and ribs at 4 different joints while learning the history of KC-style BBQ. Includes tastings, transportation between stops, and a take-home sauce kit.',
  'Kansas City', 'Food & Drink',
  'reservable', 89, 3,
  '3 hrs', 12,
  '🥩', 'ci-no',
  4.9, 312,
  true, true,
  'https://www.kcfoodtours.com',
  'https://www.google.com/maps/search/?api=1&query=Kansas+City+BBQ+Tour',
  'Book at least 48 hours in advance — sells out on World Cup match days. Wear comfortable shoes; you''ll walk 1.5 miles between stops. Bring cash for tip. Vegetarian alternatives available on request.',
  true,
  ARRAY['bbq', 'tour', 'guided', 'world cup', 'food', 'reservable', 'group friendly']
),

(
  'Crossroads Arts Cocktail Crawl',
  'Visit 5 of Kansas City''s best craft cocktail bars in the Crossroads Arts District with a knowledgeable guide. Each stop features a signature welcome drink, snacks, and the story behind the bar. Walk between venues through one of KC''s most vibrant neighborhoods.',
  'Kansas City', 'Nightlife',
  'reservable', 75, 3,
  '3.5 hrs', 14,
  '🍸', 'ci-nyc',
  4.8, 189,
  true, true,
  'https://www.kccrawls.com',
  'https://www.google.com/maps/search/?api=1&query=Crossroads+Arts+District+Kansas+City',
  'Starts at 7pm Fri/Sat. 21+ only. Groups of 6+ can book a private crawl on any night. Drink responsibly — Lyft/Uber are plentiful in this area. Dress code: smart casual.',
  true,
  ARRAY['nightlife', 'cocktails', 'tour', 'crossroads', 'world cup', 'adults only', '21+']
),

(
  'River Market Bike Tour',
  'Explore Kansas City''s River Market, Historic Jazz District, and Tom Pendergast''s city on a guided e-bike tour. Cover 8 miles through KC''s most storied neighborhoods with stops at City Market, 18th & Vine, and the KC Riverfront. Bikes, helmets, and a local guide included.',
  'Kansas City', 'Outdoors',
  'reservable', 65, 3,
  '2.5 hrs', 10,
  '🚲', 'ci-las',
  4.7, 243,
  true, false,
  'https://www.kcbiketours.com',
  'https://www.google.com/maps/search/?api=1&query=River+Market+Kansas+City',
  'Departs from City Market at 9am and 2pm daily. Minimum age 14. E-bikes make hills easy — no fitness level required. Book 24 hrs in advance. Great for solo travelers and couples.',
  true,
  ARRAY['outdoors', 'bike', 'tour', 'river market', 'history', 'world cup', 'active']
),

(
  'Kansas City Skyline Rooftop Experience',
  'Private rooftop access at one of KC''s premier Crossroads venues with sweeping skyline views. Includes a 2-hour hosted bar tab, charcuterie boards, and reserved seating. Perfect for celebrating a match result or a special night out in the city.',
  'Kansas City', 'Nightlife',
  'nightlife', 120, 4,
  '2 hrs', 8,
  '🌆', 'ci-mia',
  4.8, 97,
  true, true,
  'https://www.visitkc.com/rooftop',
  'https://www.google.com/maps/search/?api=1&query=Crossroads+Rooftop+Kansas+City',
  'Available Thu–Sun 7pm–10pm. Groups of 4–8 only — private reservation. Bar tab covers beer, wine, and well spirits. Dress code: smart casual. Views are best at sunset.',
  true,
  ARRAY['nightlife', 'rooftop', 'views', 'world cup', 'romantic', 'premium', 'reservable']
),

(
  'KC Food Truck Tour — Westport',
  'A curated 2-hour walking tour of Westport''s best food trucks and street food stalls with a local food journalist as your guide. Visit 5–6 rotating vendors each week — from Korean BBQ fusion to Argentinian empanadas. Includes a welcome drink at Westport Flea Market.',
  'Kansas City', 'Food & Drink',
  'reservable', 55, 2,
  '2 hrs', 16,
  '🚐', 'ci-orl',
  4.6, 156,
  true, false,
  'https://www.westportkc.com/food-tours',
  'https://www.google.com/maps/search/?api=1&query=Westport+Kansas+City',
  'Runs Sat/Sun 11am–1pm and Thu/Fri 5pm–7pm. Vendors change weekly — follow @kctourguide on Instagram for the weekly lineup. Vegetarian and gluten-free options always available.',
  true,
  ARRAY['food', 'tour', 'westport', 'street food', 'world cup', 'reservable', 'weekend']
),

-- ── TICKETED LIVE MUSIC & EVENTS ─────────────────────────────────────────────

(
  'Green Lady Lounge — Live Jazz',
  'Kansas City''s most legendary jazz club, open nightly since 1951. Intimate basement venue with world-class jazz musicians every night of the week. The Green Lady is the authentic KC jazz experience — dimly lit, close quarters, and music that''ll stop you mid-sentence.',
  'Kansas City', 'Nightlife',
  'nightlife', 15, 1,
  '2–4 hrs', 60,
  '🎷', 'ci-nyc',
  4.9, 2100,
  true, true,
  'https://www.greenlady.com',
  'https://www.google.com/maps/search/?api=1&query=Green+Lady+Lounge+Kansas+City',
  'Cover charge varies by night ($10–25). Doors at 8pm, music starts at 9pm. Get there early for a seat — no reservations. Cash bar only. No talking during sets — pure listening culture. Best on weekends.',
  false,
  ARRAY['jazz', 'live music', 'nightlife', 'iconic', 'world cup', 'historic', 'late night']
),

(
  'recordBar — Live Music Venue',
  'A beloved midtown venue known for eclectic lineups — indie, folk, soul, and rock on a great-sounding stage. Small enough that there''s not a bad seat in the house. Restaurant quality food (not bar food) served throughout. One of KC''s most beloved live music rooms.',
  'Kansas City', 'Arts & Culture',
  'ticketed', 20, 2,
  '2–3 hrs', 250,
  '🎵', 'ci-mia',
  4.8, 1450,
  true, false,
  'https://www.therecordbar.com',
  'https://www.google.com/maps/search/?api=1&query=recordBar+Kansas+City',
  'Check website for current listings — shows sell out fast during World Cup. General admission standing for most shows. Parking in the lot behind the venue. Kitchen serves until midnight.',
  false,
  ARRAY['live music', 'indie', 'arts', 'midtown', 'world cup', 'ticketed']
),

(
  'Starlight Theatre — Outdoor Concert',
  'A stunning 8,000-seat outdoor amphitheater set in Swope Park, one of the country''s largest urban parks. World-class touring acts perform under the Kansas City sky all summer. Bring a blanket for the lawn seats and experience live music the KC way.',
  'Kansas City', 'Arts & Culture',
  'ticketed', 45, 2,
  '2–3 hrs', 8000,
  '⭐', 'ci-las',
  4.8, 3200,
  true, false,
  'https://www.kcstarlight.com',
  'https://www.google.com/maps/search/?api=1&query=Starlight+Theatre+Kansas+City',
  'Lawn tickets are cheapest and most fun. Bring your own chairs or blanket. No outside food but outside non-alcoholic beverages allowed. Uber drops off at the main gate — parking can be a nightmare on big nights.',
  false,
  ARRAY['live music', 'outdoor', 'concert', 'starlight', 'world cup', 'summer', 'ticketed']
),

(
  '18th & Vine Jazz & Blues Festival',
  'Kansas City''s signature jazz festival held in the heart of the Historic Jazz District. Multiple stages, legendary performers, and a lineup that stretches from traditional KC jazz to contemporary blues. Free for most stages with premium seating available.',
  'Kansas City', 'Arts & Culture',
  'free_no_booking', 0, null,
  'Full day', 5000,
  '🎺', 'ci-no',
  4.9, 890,
  true, true,
  'https://www.visitkc.com/jazz-blues-festival',
  'https://www.google.com/maps/search/?api=1&query=18th+and+Vine+Kansas+City',
  'Main stages are free. VIP and premium tent tickets sell fast — buy early. Runs June–August, check visitkc.com for exact dates. Bring cash for food vendors. Best to take rideshare — limited parking.',
  false,
  ARRAY['jazz', 'blues', 'festival', 'free', 'world cup', '18th vine', 'historic', 'outdoor']
),

-- ── OUTDOOR / FREE EXPERIENCES ───────────────────────────────────────────────

(
  'Loose Park — Sunset Picnic',
  'Kansas City''s most beloved urban park — 75 acres of manicured gardens, a duck pond, rose garden, and walking trails in the heart of the Country Club Plaza area. Perfect for a sunset picnic before dinner. Free to visit, open dawn to dusk.',
  'Kansas City', 'Outdoors',
  'free_no_booking', 0, null,
  '1–2 hrs', 500,
  '🌳', 'ci-mia',
  4.8, 1800,
  true, false,
  'https://www.kcparks.org/place/loose-park/',
  'https://www.google.com/maps/search/?api=1&query=Loose+Park+Kansas+City',
  'Best at golden hour (6–8pm). Grab picnic supplies from Whole Foods or McLain''s Market nearby. Rosegarden is stunning in June. Dog friendly. Free parking on Ward Parkway.',
  false,
  ARRAY['outdoors', 'free', 'park', 'picnic', 'romantic', 'world cup', 'family']
),

(
  'Kansas City Riverfront Trail',
  'A 4-mile paved trail along the Missouri River with stunning views of the KC skyline and the historic Hannibal Bridge. Walk, run, or rent a bike along one of the most scenic riverfront paths in the Midwest. Free access, open year-round.',
  'Kansas City', 'Outdoors',
  'outdoor_info', 0, null,
  '1–3 hrs', 1000,
  '🌊', 'ci-nyc',
  4.7, 920,
  true, false,
  'https://www.kcparks.org',
  'https://www.google.com/maps/search/?api=1&query=Kansas+City+Riverfront+Park',
  'Start at River Market for easy parking. Bring water — no fountains on the trail. Best in the morning before it gets hot. The bridge views at the 2-mile mark are Instagram gold.',
  false,
  ARRAY['outdoors', 'free', 'running', 'walking', 'riverfront', 'views', 'world cup', 'active']
),

(
  'Swope Park & Kansas City Zoo',
  'One of the largest urban parks in the US — 1,800 acres including the Kansas City Zoo, golf courses, and miles of trails. The zoo alone is worth a half-day. Free parking, and the zoo entry is KC''s best value family day out.',
  'Kansas City', 'Outdoors',
  'ticketed', 19, 1,
  '2–4 hrs', 2000,
  '🦒', 'ci-orl',
  4.6, 4300,
  true, false,
  'https://www.kansascityzoo.org',
  'https://www.google.com/maps/search/?api=1&query=Swope+Park+Kansas+City+Zoo',
  'Zoo open 9am–5pm. Buy tickets online to skip lines. Free for kids under 2. The trails in Swope Park outside the zoo are completely free. Great for families or a morning run.',
  false,
  ARRAY['outdoors', 'zoo', 'family', 'park', 'world cup', 'nature', 'kids']
),

(
  'Country Club Plaza Stroll',
  'Kansas City''s iconic outdoor shopping and dining district, modeled after the architecture of Seville, Spain. 15 city blocks of fountains, sculptures, upscale shops, and restaurants — free to walk, perfect for exploring before or after a meal.',
  'Kansas City', 'Arts & Culture',
  'free_no_booking', 0, null,
  '1–2 hrs', 1000,
  '🏛️', 'ci-las',
  4.7, 5600,
  true, false,
  'https://www.countryclubplaza.com',
  'https://www.google.com/maps/search/?api=1&query=Country+Club+Plaza+Kansas+City',
  'Best visited in the evening when lights are on and restaurants are buzzing. Free parking in the garages after 5pm. Walk to Loose Park (10 min) for a park-to-plaza combo. Great base for dinner and drinks.',
  false,
  ARRAY['shopping', 'free', 'outdoor', 'plaza', 'architecture', 'world cup', 'dining', 'evening']
),

-- ── CULTURAL / MUSEUMS ────────────────────────────────────────────────────────

(
  'National WWI Museum & Memorial',
  'One of the most important and visually stunning war museums in the world, built atop a 217-foot Liberty Memorial tower with 360° views of downtown KC. The exhibits — including the iconic glass floor above 9,000 poppies — are genuinely moving.',
  'Kansas City', 'Arts & Culture',
  'ticketed', 21, 2,
  '2–3 hrs', 500,
  '🏛️', 'ci-nyc',
  4.9, 7800,
  true, true,
  'https://www.theworldwar.org',
  'https://www.google.com/maps/search/?api=1&query=National+WWI+Museum+Kansas+City',
  'Buy tickets online — sells out on weekends. The tower views alone are worth the price. Combine with Union Station next door. Free parking in the lot. Allow 2–3 hours minimum.',
  false,
  ARRAY['museum', 'history', 'landmark', 'world cup', 'views', 'cultural', 'iconic']
),

(
  'Nelson-Atkins Museum of Art',
  'A world-class free art museum with one of the finest collections in the US. The outdoor sculpture garden with Claes Oldenburg''s giant Shuttlecocks is iconic. Over 40,000 works spanning 5,000 years — free general admission every day.',
  'Kansas City', 'Arts & Culture',
  'free_no_booking', 0, null,
  '2–3 hrs', 600,
  '🎨', 'ci-mia',
  4.9, 6500,
  true, true,
  'https://www.nelson-atkins.org',
  'https://www.google.com/maps/search/?api=1&query=Nelson-Atkins+Museum+of+Art+Kansas+City',
  'Free admission always — one of the best free experiences in the city. Open Tue–Sun 10am–5pm (Fri until 9pm). The Bloch Building extension is architecturally stunning at night. Free parking on the campus.',
  false,
  ARRAY['museum', 'art', 'free', 'world cup', 'cultural', 'iconic', 'family', 'sculpture garden']
),

(
  'American Jazz Museum — 18th & Vine',
  'The only museum in the US dedicated to jazz, located in Kansas City''s Historic Jazz District where the genre was born. Includes the Blue Room jazz club (still active), a Hall of Fame, and interactive exhibits on Charlie Parker, Count Basie, and KC''s jazz legacy.',
  'Kansas City', 'Arts & Culture',
  'ticketed', 15, 1,
  '1.5–2 hrs', 200,
  '🎷', 'ci-no',
  4.8, 1200,
  true, true,
  'https://www.americanjazzmuseum.org',
  'https://www.google.com/maps/search/?api=1&query=American+Jazz+Museum+Kansas+City',
  'Combine with the Negro Leagues Baseball Museum next door (combo ticket saves $5). The Blue Room inside has live jazz Fri/Sat nights — arrive early for a seat. Parking is free on the street.',
  false,
  ARRAY['jazz', 'museum', 'history', '18th vine', 'world cup', 'cultural', 'iconic', 'live music']
),

-- ── FOOD & DRINK (NON-BBQ) ────────────────────────────────────────────────────

(
  'West Bottoms First Friday',
  'Kansas City''s coolest monthly street event — the West Bottoms warehouse district transforms into an open-air antique market, art gallery, food truck festival, and street party on the first Friday of every month. Completely free to attend.',
  'Kansas City', 'Arts & Culture',
  'free_no_booking', 0, null,
  '2–4 hrs', 5000,
  '🎪', 'ci-las',
  4.8, 980,
  true, false,
  'https://www.thewestbottoms.com',
  'https://www.google.com/maps/search/?api=1&query=West+Bottoms+Kansas+City',
  'First Friday of every month, 5pm–midnight. Free entry but bring cash for vendors. Uber/Lyft recommended — parking is chaos. Wear comfortable shoes. Dress for the weather — it''s all outdoor.',
  false,
  ARRAY['events', 'art', 'free', 'food trucks', 'antiques', 'world cup', 'monthly', 'west bottoms']
),

(
  'McLain''s Market — Brunch',
  'Kansas City''s most beloved neighborhood bakery and brunch spot. Seasonal menu built around local ingredients, legendary pastries, and the best eggs Benedict in the city. The perfect slow-morning start before a match or afternoon of exploring.',
  'Kansas City', 'Food & Drink',
  'reservable', 22, 2,
  '1–1.5 hrs', 6,
  '☕', 'ci-orl',
  4.8, 2300,
  true, false,
  'https://www.mclainsbakery.com',
  'https://www.google.com/maps/search/?api=1&query=McLains+Market+Kansas+City',
  'Expect a wait on weekends — arrive before 9am or after 1pm to skip the queue. Cash and card. The almond croissant is a must. The Waldo location has a great patio.',
  false,
  ARRAY['brunch', 'bakery', 'coffee', 'local', 'world cup', 'morning', 'neighborhood']
);
