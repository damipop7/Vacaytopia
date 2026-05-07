# Vtopia Sprint V3 — Summary
*Branch: `vtopia-wc-sprint-v3-20260507` | Completed: 2026-05-07*

---

## Workstream Status

| # | Workstream | Status | Notes |
|---|-----------|--------|-------|
| 1 | Supabase project rename | ⚠️ Manual step | Dashboard rename only — URL doesn't change. See below. |
| 2 | KC-only mode | ✅ Complete | `VITE_ACTIVE_CITIES=Kansas City` hides all other cities |
| 3 | KC in interest questionnaire | ✅ Complete | KC is now first/default in both quiz flows |
| 4 | Page load & itinerary blank page | ✅ Complete | Idle state guard prevents blank flash on navigation |
| 5 | Deduplicate quiz steps 6 & 7 | ✅ Complete | Merged into single "Who's coming?" step (7 → 6 steps) |
| 6 | Booking flow audit + emails | ✅ Scaffolded | Audit documented; Resend email scaffold added; blocked on RESEND_API_KEY |
| 7 | Experience taxonomy | ✅ Complete | `experience_type` migration + smart CTA on all cards |
| 8 | Terms, legal, trust | ✅ Complete | Real Terms of Service at `/terms`; footer link wired |
| 9 | KC landing page | ✅ Complete | `/kansas-city` with hero, 5 itineraries, neighborhoods, getting around |

---

## Env Vars That Must Be Set Before Going Live

Set these in the Vercel dashboard (and Supabase dashboard for edge function secrets):

| Var | Where | Value | Notes |
|-----|-------|-------|-------|
| `VITE_ACTIVE_CITIES` | Vercel | `Kansas City` | Enables KC-only mode. Clear to show all cities post-WC. |
| `VITE_FEATURE_WORLD_CUP` | Vercel | `true` | Enables `/world-cup` page |
| `RESEND_API_KEY` | Supabase secrets | `re_xxx` | Activates booking confirmation emails. See below. |
| `VITE_SENTRY_DSN` | Vercel | `https://...` | Already scaffolded — add DSN to activate error monitoring |

To set Supabase edge function secrets:
```bash
supabase secrets set RESEND_API_KEY=re_your-key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your-secret
```

---

## Manual Steps Required (human action needed)

### WS1 — Supabase rename
1. Go to supabase.com → your project → Settings → General
2. Change the project **display name** to "vtopia"
3. Note: The URL (`vtxikcqasjxyjlxsxdof.supabase.co`) does NOT change — this is cosmetic only
4. The `.env` file does not need updating

### WS6 — Activate booking emails
1. Create a free account at resend.com
2. Add and verify your sending domain (e.g. `vtopia.world`)
3. Create an API key
4. Run: `supabase secrets set RESEND_API_KEY=re_xxx`
5. Add `provider_email TEXT` column to the `experiences` table:
   ```sql
   ALTER TABLE public.experiences ADD COLUMN provider_email TEXT;
   ```
6. Fill in provider email addresses for all active KC experiences in the DB

### WS7 — Run DB migration
Apply the new migration in Supabase SQL editor or via CLI:
```bash
supabase db push
```
Or run `supabase/migrations/004_experience_type.sql` manually in the SQL editor.

### WS7 — Classify KC experiences
After running the migration, update each KC experience's `experience_type` in the Supabase dashboard:
- BBQ restaurants → `food_delivery` (no reservation needed) or `reservable`
- Parks, trails, murals → `free_no_booking`
- Concerts, events → `ticketed` + fill in `ticket_url`
- Bars, clubs → `nightlife`
- Tours, cooking classes → `reservable`

---

## What Was Added

### New pages
- `/kansas-city` — full KC World Cup landing page with hero, 5 curated itineraries, neighborhood guide, getting-around section, SEO + JSON-LD
- `/terms` — real Terms of Service (13 sections, Missouri governing law, cancellation policy, liability limits)

### New features
- **KC-only mode** — `VITE_ACTIVE_CITIES` env var filters all city dropdowns, quiz, and browse. Non-KC URLs redirect to Kansas City automatically
- **Experience type taxonomy** — `experience_type` DB column + smart CTA rendering (Book Now / Get tickets / Get directions / Order online / Visit website) with UTM tracking on all external links
- **Booking confirmation emails** — Resend scaffold in stripe-webhook sends guest confirmation + provider notification on payment success (gated on `RESEND_API_KEY`)
- **Quiz deduplication** — merged traveler/travelerGroup into single step (7 steps → 6 steps)
- **KC as first/default city** — in both quiz flows

### Documents
- `BOOKING_FLOW_AUDIT.md` — full booking chain analysis with gaps, status, and action items
- `SPRINT_V3_SUMMARY.md` (this file)

---

## Open Decisions for the Creator

1. **Provider notification strategy**: The email scaffold sends a notification to `provider_email`. But until provider email addresses are stored in the DB, no notifications fire. Recommend: add `provider_email` to each active experience row immediately.

2. **Booking confirmation flow**: Currently Vtopia marks bookings as "confirmed" as soon as Stripe payment succeeds — without provider input. See `BOOKING_FLOW_AUDIT.md` for the recommended two-step flow (Stripe confirms → provider confirms).

3. **KC-only mode scope**: The `VITE_ACTIVE_CITIES` filter hides non-KC cities from the UI but does NOT remove their data from the DB or block API queries. If a user knows the direct URL (`/browse/miami`) they can still reach it. This is intentional — no data deleted, easily reversible.

4. **Experience images**: The `has_real_image` column has been added but not yet populated. Create a `MISSING_IMAGES.md` (or use Supabase dashboard) to identify experiences with placeholder images.

5. **Analytics**: Plausible/GA is not set up. Without analytics, there's no way to measure World Cup traffic. Strongly recommend adding before the tournament starts.

6. **Post-World-Cup cleanup**: Search the codebase for `// TODO: re-enable post-World-Cup` to find every place that needs to be reversed after the tournament:
   ```bash
   grep -r "TODO: re-enable post-World-Cup" src/
   ```

---

## Test Results

```
Test Files  4 passed (4)
     Tests  115 passed (115)
```

## Lint Results

```
0 errors, 3 warnings (exhaustive-deps in ItineraryResults/ItineraryView)
```
