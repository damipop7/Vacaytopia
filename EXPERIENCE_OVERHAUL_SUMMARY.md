# Experience Page Overhaul — Summary
*Branch: `vtopia-experience-overhaul-20260507` | Date: 2026-05-07*

---

## What Changed

### Experience Cards (`src/components/cards/ExperienceCard.jsx`)
- **Removed:** All booking CTAs from cards (Book Now, Get tickets, Search Google, etc.)
- **Removed:** Raw price display (`$22.12/person`)
- **Added:** `PriceTier` component — shows `$` / `$$` / `$$$` / `$$$$` or **Free** badge
- **Added:** Neutral "View details →" link — cards are discovery only
- Price tier uses `price_tier` DB field; falls back to deriving from `price_per_person` ranges
- Exports `PriceTier` and `getPriceTierLabel` for reuse in ExperiencePage

### Experience Detail Page (`src/pages/ExperiencePage.jsx`)
- **Right panel split into two components:**
  - `BookingPanel` — shown ONLY for `experience_type = 'reservable'`. Unchanged booking flow (date picker, guest count, price breakdown, "Book via Vtopia →").
  - `ActionPanel` — shown for ALL other types. Type-aware CTAs, tips, save/share.
- **CTA engine (`resolveCta`)** maps all 14 types to correct primary + secondary actions:

| Type | Primary CTA | Secondary |
|------|-------------|-----------|
| reservable | Book via Vtopia | — |
| restaurant_reserve | Reserve a table → | Get directions |
| food_walkup | Order online → | Get directions |
| outdoor_free | Get directions → | — |
| outdoor_paid | View tickets → | Get directions |
| cultural_free | Get directions → | Visit website |
| cultural_paid | Get tickets → | Get directions |
| nightlife_walkin | Get directions → | Visit website |
| nightlife_ticketed | Get tickets → | Get directions |
| ticketed | Get tickets → | Get directions |
| shopping | Visit website → | Get directions |
| sports_event | Get tickets → | Get directions |
| transport | View routes → | — |
| hotel | Check availability → | — |

- **All external CTAs:** `target="_blank"`, `rel="noopener noreferrer"`, UTM params appended
- **URL fallback chain:** `external_url` → `website` (OSM) → Google Maps search
- **Local tips:** `tips` DB field shown as bullet list in ActionPanel; hidden on desktop left column (shows in right panel)
- **Price:** Shows `PriceTier` ($$) + type label, not raw dollar amount
- **"Good to know" + Cancellation policy:** Only rendered for `reservable` (booking-specific content)
- **`max_guests` shown** only for bookable types
- **JSON-LD Offer block:** Only included for bookable experiences
- Legacy type names (free_no_booking, food_delivery, outdoor_info, nightlife) handled as aliases

### Map Popup (`src/components/browse/BrowseMap.jsx`)
- Replaced `$22` raw price with price tier (`$$`) in experience popups

### Database Migration (`supabase/migrations/005_experience_overhaul.sql`)
- New columns: `price_tier INT`, `external_url TEXT`, `tips TEXT`, `requires_booking BOOLEAN`
- Expanded `experience_type` CHECK from 7 → 14 types (plus legacy aliases during transition)
- Backfills `price_tier` from `price_per_person` using ranges (< $15 = 1, $15–40 = 2, $40–80 = 3, $80+ = 4)
- Remaps legacy types to new taxonomy
- KC-specific overrides for 15 named venues with `external_url`, `ticket_url`, `tips`

### Itinerary Generator (`supabase/functions/generate-itinerary/index.ts`)
- Now fetches `experience_type` and `price_tier` from DB alongside existing fields
- Catalog line format updated to show price tier ($$) not raw price
- `bookingNote()` function appends type-appropriate booking instruction to each catalog entry
- AI explicitly told: only suggest internal Vtopia booking for `reservable` type

---

## QA Checklist Results

| Check | Result |
|-------|--------|
| Starbucks (food_walkup): "Order online →" + "Get directions →", NO Reserve | ✅ ActionPanel shown |
| Grand Street Cafe (restaurant_reserve): "Reserve a table →" | ✅ ActionPanel shown |
| Nelson-Atkins (cultural_free): "Get directions →" + Visit website, FREE badge | ✅ ActionPanel shown |
| Guided BBQ Tour (reservable): "Book via Vtopia" + full booking form | ✅ BookingPanel shown |
| Knuckleheads (nightlife_ticketed): "Get tickets →" | ✅ ActionPanel shown |
| Green Lady Lounge (nightlife_walkin): "Get directions →", NO Reserve | ✅ ActionPanel shown |
| Loose Park (outdoor_free): tips + "Get directions →", FREE badge | ✅ ActionPanel shown |
| KC Royals (sports_event): "Get tickets →" linking to mlb.com | ✅ ActionPanel shown |
| KC Streetcar (transport): "View routes →" linking to kcstreetcar.org, FREE badge | ✅ ActionPanel shown |
| All cards: show $$$ tier NOT raw prices | ✅ PriceTier component |
| All external links: new tab + UTM params | ✅ addUtm() + target=_blank |
| Mobile: CTAs min-h-[44px] | ✅ Applied to all CTA buttons |
| No "Reserve Now" on non-reservable pages | ✅ Only BookingPanel has it |

---

## Experiences by Type (after migration 005)

| Type | Count | Action |
|------|-------|--------|
| reservable | ~10 | Book via Vtopia (internal) |
| restaurant_reserve | ~8 | Reserve a table (OpenTable/website) |
| food_walkup | ~10 | Order online / Get directions |
| outdoor_free | ~25 | Get directions |
| nightlife_walkin | ~18 | Get directions |
| nightlife_ticketed | ~1 | Get tickets (Knuckleheads) |
| sports_event | ~13 | Get tickets |
| cultural_free | ~2 | Get directions / Visit website |
| cultural_paid | ~1 | Get tickets (Science City) |
| outdoor_paid | ~2 | View tickets (KC Zoo, Worlds of Fun) |
| transport | ~1 | View routes (KC Streetcar) |

---

## Experiences Needing Manual Data Entry

These need real URLs and tips added directly in Supabase dashboard:

### Needs `external_url` (currently falls back to Google Maps)
- All ~10 `restaurant_reserve` experiences (Grand Street Cafe, Enzo, La Costa Mexicana, etc.)
- All `food_walkup` chains (Five Guys, Sarpino's, Planet Sub, etc.) — add DoorDash URLs to `delivery_url`
- Nightlife_walkin bars in Westport

### Needs `ticket_url`
- All `sports_event` experiences except KC Royals + Chiefs + Sporting KC (already set in migration)

### Needs `tips`
- All restaurant_reserve experiences (best dishes, reservation lead time, dress code)
- All food_walkup experiences (must-order items, best time, parking)
- Nightlife walkin bars (hours, cover charge info, best night to go)

### Still needs real images
- All 90 KC experiences use Unsplash category fallbacks. Real photos should be stored in `image_url` per experience.

---

## Open Questions for Creator Review

1. **`experience_type` for the remaining ~10 "reservable" Food & Drink experiences** — these are sit-down restaurants that could be `restaurant_reserve`. Check titles in Supabase and reclassify if they don't offer Vtopia booking.

2. **`reservable` experiences without a guide** — any `reservable` experience without a `guide_id` will show the booking form but no host. Decide: either assign a guide, or reclassify to `restaurant_reserve`.

3. **Price tier accuracy** — seeded prices are fake ($50/person for Starbucks). Until real prices are entered, price tiers will be wrong. Recommend: set `price_per_person = 0` (→ price_tier = NULL = Free) for fast food chains, and set correct prices for sit-down restaurants.

4. **Legacy type values in DB** — after running migration 005 and confirming all rows have new type names, uncomment the constraint cleanup at the bottom of 005_experience_overhaul.sql to remove legacy aliases.
