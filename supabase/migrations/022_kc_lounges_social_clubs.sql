-- ── KC Lounges, Distilleries & Social Clubs ──────────────────────────────────
--
-- J. Rieger & Co. and key KC nightlife venues not yet in the database.
-- All use experience_type = 'nightlife_walkin' (walk-in, no prior booking needed)
-- except the distillery tour which is 'cultural_paid'.
--
-- Apply in Supabase Dashboard → SQL Editor.

INSERT INTO public.experiences (
  title, description, city, category,
  experience_type, price_per_person, price_tier,
  duration_label, max_guests,
  image_emoji, image_gradient,
  rating, review_count,
  is_active, is_featured,
  external_url, website, maps_url, link_status, tips,
  requires_booking, tags
) VALUES

-- ── J. Rieger & Co. — Hey! Hey! Club ─────────────────────────────────────────
(
  'J. Rieger & Co. — Hey! Hey! Club',
  'Kansas City''s most atmospheric cocktail bar, set inside a beautifully restored 1920s East Bottoms distillery. The Hey! Hey! Club is a Prohibition-era social club with vaulted ceilings, dark wood, and craft cocktails made with Rieger''s own whiskey and gin. One of the most unique bar experiences in the Midwest.',
  'Kansas City', 'Nightlife',
  'nightlife_walkin', 16, 2,
  'Eve–late night', 120,
  '🥃', 'ci-lv',
  4.8, 940,
  true, true,
  'https://www.jriegerco.com/eat-and-drink',
  'https://www.jriegerco.com',
  'https://www.google.com/maps/search/?api=1&query=J+Rieger+Co+Kansas+City',
  'verified',
  'The Old Fashioned made with Rieger''s whiskey is the must-order. Go Thursday–Saturday for the full atmosphere. The building itself is stunning — arrive before 8pm to explore the distillery floor before the bar fills up. Parking is free on site.',
  false,
  ARRAY['cocktails', 'distillery', 'social club', 'prohibition', 'whiskey', 'nightlife', 'world cup', 'date night', 'iconic']
),

-- ── J. Rieger & Co. — Distillery Tour ────────────────────────────────────────
(
  'J. Rieger & Co. Distillery Tour',
  'Go behind the scenes at one of America''s most celebrated craft distilleries. The 75-minute tour covers the full production process — grain to bottle — for Rieger''s whiskey, gin, and amaro. Ends with a guided tasting of 4–5 spirits. The restored 1920s building alone is worth the visit.',
  'Kansas City', 'Arts & Culture',
  'cultural_paid', 25, 2,
  '75 min', 20,
  '🏭', 'ci-grn',
  4.7, 420,
  true, false,
  'https://www.jriegerco.com/distillery-tours',
  'https://www.jriegerco.com',
  'https://www.google.com/maps/search/?api=1&query=J+Rieger+Co+Distillery+Tour+Kansas+City',
  'verified',
  'Book in advance — tours sell out on weekends. Tours run Thursday–Sunday. Wear closed-toe shoes (production floor requirement). The tasting at the end is generous — don''t skip it. Buy a bottle at the gift shop; Rieger''s Midwestern Dry Gin is the sleeper hit.',
  true,
  ARRAY['distillery', 'tour', 'whiskey', 'gin', 'craft spirits', 'arts', 'world cup', 'unique experience']
),

-- ── Manifesto ─────────────────────────────────────────────────────────────────
(
  'Manifesto',
  'KC''s most celebrated cocktail bar, tucked in the basement of Hotel Phillips in a space that fits just 36 people. Manifesto has appeared on national best-bars lists for years. Every drink is made with precision — this is cocktail craft at its highest level in Kansas City.',
  'Kansas City', 'Nightlife',
  'nightlife_walkin', 18, 3,
  'Eve–late night', 36,
  '🍸', 'ci-lv',
  4.9, 1240,
  true, true,
  'https://www.manifestokc.com',
  'https://www.manifestokc.com',
  'https://www.google.com/maps/search/?api=1&query=Manifesto+Bar+Kansas+City',
  'verified',
  'No reservations — first come, first served, and it fills up by 9pm on weekends. The bartenders are experts; ask for a recommendation based on what spirits you like rather than ordering off a menu. Basement entrance off 12th Street.',
  false,
  ARRAY['cocktails', 'speakeasy', 'craft bar', 'intimate', 'nightlife', 'best bars', 'world cup', 'date night']
),

-- ── The Monarch Bar ───────────────────────────────────────────────────────────
(
  'The Monarch Bar',
  'An upscale lounge in the heart of the Country Club Plaza with a rotating seasonal cocktail menu and one of KC''s best wine lists. The Monarch hits the sweet spot between sophisticated and relaxed — velvet booths, low lighting, and a crowd that actually dresses up.',
  'Kansas City', 'Nightlife',
  'nightlife_walkin', 20, 3,
  'Eve–late night', 60,
  '👑', 'ci-lv',
  4.6, 580,
  true, false,
  'https://www.themonarchbar.com',
  'https://www.themonarchbar.com',
  'https://www.google.com/maps/search/?api=1&query=The+Monarch+Bar+Kansas+City',
  'verified',
  'The tasting menu cocktail flight ($35) is the best way to experience the menu. Country Club Plaza location means easy parking in the garage across the street. Dress code is smart-casual — no athletic wear.',
  false,
  ARRAY['cocktails', 'wine bar', 'lounge', 'upscale', 'nightlife', 'world cup', 'date night', 'plaza']
),

-- ── Extra Virgin ──────────────────────────────────────────────────────────────
(
  'Extra Virgin',
  'James Beard Award-nominated chef Michael Smith''s Mediterranean-inspired wine bar and small plates spot in the Crossroads Arts District. The wine list is one of KC''s most interesting — heavy on natural and Old World pours. The food is just as good as the drinks.',
  'Kansas City', 'Nightlife',
  'nightlife_walkin', 22, 3,
  '2–3 hrs', 40,
  '🍷', 'ci-mia',
  4.7, 710,
  true, false,
  'https://www.extravirginkc.com',
  'https://www.extravirginkc.com',
  'https://www.google.com/maps/search/?api=1&query=Extra+Virgin+Kansas+City',
  'verified',
  'The charcuterie and cheese boards are made for sharing — order two and a bottle of wine. Crossroads location makes it a natural stop before or after a gallery walk. Reservations recommended on weekends but walk-ins are often accommodated at the bar.',
  false,
  ARRAY['wine bar', 'small plates', 'crossroads', 'mediterranean', 'nightlife', 'world cup', 'date night', 'arts district']
),

-- ── The Drum Room at President Hotel ─────────────────────────────────────────
(
  'The Drum Room',
  'A legendary Jazz Age cocktail lounge inside the historic President Hotel, where Count Basie and big band greats used to play. The live swing and jazz performances on Friday and Saturday nights make this one of KC''s most atmospheric and historically significant nightlife experiences.',
  'Kansas City', 'Nightlife',
  'nightlife_walkin', 15, 2,
  'Eve–midnight', 80,
  '🎺', 'ci-no',
  4.6, 320,
  true, false,
  'https://www.presidenthotelkc.com/drum-room',
  'https://www.presidenthotelkc.com',
  'https://www.google.com/maps/search/?api=1&query=The+Drum+Room+President+Hotel+Kansas+City',
  'verified',
  'Live jazz Friday and Saturday — no cover, just buy a drink. The hotel itself is a 1926 landmark worth seeing. Arrive by 8:30pm on weekends to get a table before the band starts. Classic cocktails here lean old school; the sidecar is excellent.',
  false,
  ARRAY['jazz', 'live music', 'historic', 'cocktails', 'lounge', 'nightlife', 'world cup', 'big band', 'swing']
);
