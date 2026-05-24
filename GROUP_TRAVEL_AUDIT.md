# Group Travel Sprint — Codebase Audit

## 1. Existing Database Schema (relevant tables)

### `itineraries`
- `id` UUID PK, `user_id` UUID → auth.users (cascade), `city` text, `start_date` / `end_date` date, `budget` text, `interests` text[], `traveler_type` text, `extras` text, `itinerary_data` JSONB (full AI plan), `created_at`
- RLS: users see/insert/delete their own rows

### `experiences`
- `id` UUID PK, `title`, `city`, `category`, `price_per_person`, `experience_type`, `tags` text[], `lat`, `lng`, `maps_url`, `external_url`, `ticket_url`, `delivery_url`, `is_active` bool, `price_tier` int(1–4), `tips` text
- Public readable for active=true

### `bookings`
- `id` UUID PK, `user_id`, `experience_id`, `booking_date`, `booking_time`, `guest_count`, `total_amount`, `status`, `stripe_payment_intent_id`, `booking_reference`
- Bookings are currently per-user; no group/trip concept exists yet

### `profiles`
- `id` UUID PK (= auth.users.id), `email`, `first_name`, `last_name`, `role` ('user'|'guide'|'admin'|'partner')

---

## 2. Auth Model

- Supabase Auth (email/password + Google OAuth)
- `useAuthStore` (Zustand) exposes: `user`, `profile`, `loading`, `init()`, `signIn()`, `signOut()`, `updateProfile()`
- User identified by `user.id` (UUID). JWT available via `supabase.auth.getSession()`
- Profile row auto-created on signup via DB trigger

---

## 3. Routing (current)

| Path | Component |
|------|-----------|
| `/` | HomePage |
| `/browse` | BrowsePage |
| `/experience/:id` | ExperiencePage |
| `/itinerary` | ItineraryQuiz |
| `/itinerary/results` | ItineraryResults |
| `/itinerary/:id` | ItineraryView |
| `/book/:experienceId` | BookingPage (protected) |
| `/profile` | ProfilePage (protected) |
| `/interests` | InterestsPage (protected) |

**New routes added by this sprint:** `/trips`, `/trips/new`, `/trips/:tripId`, `/trips/join/:shareToken`

---

## 4. State Management

- One Zustand store: `useAuthStore` for auth + profile
- All server data via TanStack React Query hooks
- Itinerary cached in `sessionStorage` (key: `vtopia_active_itinerary`)
- Local favorites in `localStorage` (key: `vtopia_local_favs`)

---

## 5. Supabase Realtime

**Status before sprint: NOT IMPLEMENTED.** Zero `.channel()` calls, no websockets anywhere.
This sprint introduces the first Realtime subscriptions for live trip collaboration.

---

## 6. Reusable Components

| Path | Description |
|------|-------------|
| `components/layout/AppLayout.jsx` | Shell with nav + footer |
| `components/layout/ProtectedRoute.jsx` | Auth redirect guard |
| `components/layout/AdminRoute.jsx` | Admin-only guard |
| `components/layout/BottomNav.jsx` | Mobile bottom nav |
| `components/cards/ExperienceCard.jsx` | Grid experience card |
| `components/browse/BrowseMap.jsx` | Leaflet map |
| `components/ui/ErrorBoundary.jsx` | React error boundary |
| `components/ui/ExperienceConcierge.jsx` | AI chat panel |
| `components/ui/VtopiaGlobe.jsx` | 3D city globe |

New components added in this sprint: `components/trips/*` (see summary)

---

## 7. Hooks

| File | Description |
|------|-------------|
| `useRecommendations.js` | React Query experience fetch + scoring |
| `useBookings.js` | User bookings query + create mutation |
| `useWishlist.js` | Save/unsave experiences |
| `useQuiz.js` | Quiz result query + save |
| `useLocalFavorites.js` | localStorage favorites |
| `useWeather.js` | 7-day forecast |

New hooks: `useTrip`, `useTripMembers`, `useTripExperiences`, `useTripRealtime`, `useTripActivity`

---

## 8. Booking Flow

- Route `/book/:experienceId` (protected) — 4-step wizard
- Step 2 inserts `bookings` row with status `pending`
- Step 3 uses Stripe Elements, calls `/functions/v1/create-payment-intent`
- Webhook confirms booking → status `confirmed`
- Currently solo only; group bookings added in this sprint via `trip_id` + `group_booking` flag

---

## 9. Current Itinerary Data Model

**AI JSON (stored in `itinerary_data` JSONB):**
```json
{
  "headline": "string",
  "overview": "string",
  "days": [{
    "day": 1,
    "theme": "string",
    "morning": { "title", "description", "tip", "cost", "experienceId" },
    "afternoon": { "..." },
    "evening": { "..." },
    "lunch": "string",
    "dinner": "string",
    "dailyTotal": "~$120"
  }],
  "hotelRecommendations": [{ "name", "reason", "priceRange" }],
  "packingTips": ["string"],
  "budgetBreakdown": { "accommodation", "food", "activities", "transport" }
}
```

---

## 10. Environment Variables

Already wired: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_GOOGLE_MAPS_API_KEY` (optional)

Edge function secrets: `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`

---

## Gap Analysis (what group travel needs)

| Gap | Solution |
|-----|----------|
| No trip/group concept | New `trips` + `trip_members` tables |
| Itineraries are solo | `trips` wraps/replaces `itineraries` for group context |
| No realtime | Supabase Realtime channels on `trip_experiences`, `trip_activity`, `trip_members` |
| Bookings are per-user | `trip_id` FK + `group_booking` flag on bookings |
| No voting | `trip_experience_votes` table + `VoteButton` component |
| No budget pooling | `trip_budget_contributions` table + optional Stripe |
| No share/invite links | `share_token` column on `trips` |
| No activity feed | `trip_activity` table + Realtime subscription |
