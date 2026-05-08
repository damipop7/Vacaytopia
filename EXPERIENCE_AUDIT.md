# Experience Page Overhaul — Codebase Audit
*Branch: vtopia-experience-overhaul-20260507 | Date: 2026-05-07*

---

## 1. Where experience records are stored

**Table:** `public.experiences`

**Schema (all columns):**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto uuid_generate_v4() |
| title | text NOT NULL | |
| description | text | nullable |
| city | text NOT NULL | |
| category | text NOT NULL | CHECK: Food & Drink, Outdoors, Nightlife, Sports, Arts & Culture, Wellness |
| price_per_person | numeric(8,2) NOT NULL | raw price — being replaced by price_tier |
| duration_minutes | int | nullable |
| duration_label | text | e.g. "2 hrs" |
| max_guests | int | default 8 |
| image_emoji | text | |
| image_url | text | nullable (rarely populated) |
| image_gradient | text | CSS gradient key |
| rating | numeric(3,2) | default 0 |
| review_count | int | default 0 |
| guide_id | uuid → guides | nullable |
| is_active | boolean | default true |
| is_sponsored | boolean | default false |
| is_featured | boolean | default false |
| tags | text[] | default {} |
| what_is_included | text[] | default {} |
| cancellation_policy | text | default "Free cancellation…" |
| created_at / updated_at | timestamptz | |
| source | text | 'osm' for OSM-synced entries |
| website | text | OSM-sourced website URL |
| **experience_type** | text | Added in migration 004 (7 types) |
| **ticket_url** | text | Added in migration 004 |
| **delivery_url** | text | Added in migration 004 |
| **maps_url** | text | Added in migration 004 |
| **has_real_image** | boolean | Added in migration 004 |

**To be added in migration 005 (this sprint):**
- `price_tier` INT (1–4, NULL = free)
- `external_url` TEXT (canonical website for non-OSM experiences)
- `tips` TEXT (local insider tips shown on detail page)
- `requires_booking` BOOLEAN (true only for `reservable` type)

---

## 2. Experience card component

**File:** `src/components/cards/ExperienceCard.jsx`

- Renders in: `BrowsePage.jsx`, `HomePage.jsx` (recommended section), `ItineraryResults.jsx`
- Currently shows: photo, category badge, title, city/duration, raw `price_per_person`, type-specific CTA button
- Problem: Shows "Book Now" CTA directly on cards for reservable experiences
- Problem: Shows raw price ("$22.12") instead of price tier ("$$")

---

## 3. Experience detail page component

**File:** `src/pages/ExperiencePage.jsx`

- Route: `/experience/:id`
- Currently: Always shows full booking form in right panel (date picker, guest count, price breakdown, "Reserve Now →" button) for ALL experience types
- Problem: Starbucks and Nelson-Atkins show the same "Reserve Now" panel as a guided kayak tour
- Query: `useExperience(id)` in `src/hooks/useRecommendations.js` — selects `*` plus guides and reviews

---

## 4. experience_type field

**Yes, exists** — added in migration 004.

Current 7-type taxonomy:
```
reservable, ticketed, free_no_booking, food_delivery, outdoor_info, nightlife, shopping
```

This sprint expands to 14 types — see migration 005.

---

## 5. Price fields

- `price_per_person` numeric(8,2) — raw amount, used everywhere
- No price_tier, price_range, or tier field currently exists
- KC data has incorrect seed prices (Starbucks = $31/person, fast food chains = $50-80)
- Migration 005 adds `price_tier` (1–4, NULL=free) and backfills from price_per_person

---

## 6. "Reserve Now" / "Book" CTA locations

**ExperienceCard (`src/components/cards/ExperienceCard.jsx`):**
- Lines 130–152: `getCtaConfig()` function — type-aware CTA
- Line 255–262: renders "Book Now" `<button>` for reservable
- Lines 245–252: renders external `<a>` for non-bookable types
- **Fix needed:** Remove all booking CTAs from cards. Cards → "View details →" only.

**ExperiencePage (`src/pages/ExperiencePage.jsx`):**
- Lines 298–421: right-side sticky panel with full booking form
- Lines 378–390: raw price breakdown (`$X × N guests = $Y`)
- Lines 403–405: "Reserve Now →" button
- **Fix needed:** Replace right panel with type-aware ActionPanel for non-reservable types.

---

## 7. Current KC experiences (90 total, typed after migration 004)

| Type | Count | Categories |
|------|-------|------------|
| reservable | 19 | Food & Drink sit-down restaurants |
| food_delivery | 10 | Food & Drink fast casual/chains |
| free_no_booking | 25 | Outdoors |
| nightlife | 19 | Nightlife |
| ticketed | 13 | Sports |
| outdoor_info | 4 | (Arts & Culture or mixed) |
| **Total** | **90** | |

**Known Food & Drink experiences (reservable):**
Westport Flea Market Bar & Grill, Grand Street Cafe, Blue Nile Cafe, Cafe Trio, Jimmy John's (reclassified above), O'Neils Restaurant, Hammerhand Coffee (reclassified above), The JEM, Enzo, La Costa Mexicana

**Known Food & Drink experiences (food_delivery):**
Planet Sub, Sarpino's, Church's Chicken, Five Guys, Hardee's, Jimmy John's, Chipotle, Starbucks, Hammerhand Coffee, Custard on the Square

**Note:** No BBQ legends (Joe's, Q39, Gates, Bryant's) exist in the DB — KC data was seeded with generic/chain experiences. Real KC experiences need to be added before launch.
