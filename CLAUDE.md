# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server at http://localhost:5173
npm run build        # production build (Vite 8 / rolldown)
npm run lint         # ESLint — must stay at 0 errors
npm test             # Vitest unit tests (jsdom, ~120 tests)
npm run test:watch   # Vitest in watch mode
npm run test:live    # live API tests against real Supabase (needs VITE_TEST_USER_JWT)
npm run test:e2e     # Playwright end-to-end
```

Run a single test file: `npx vitest run src/tests/highlights.test.js`

## Architecture

**Stack:** React 19 · React Router 7 · Vite 8 · Tailwind CSS · Supabase (PostgreSQL + Auth + Edge Functions) · Stripe · Claude Haiku · Leaflet

**State management:**
- `src/store/authStore.js` — Zustand store, single source of truth for `user`, `profile`, `loading`. `init()` is called once in `App.jsx` and sets up the Supabase auth listener; always returns a cleanup fn to prevent HMR double-listener leaks.
- React Query (`@tanstack/react-query`) for all server data. `queryClient` is created in `App.jsx` with 5-min stale time and no refetch on window focus.

**Data flow for recommendations:**
1. `useRecommendations()` in `src/hooks/useRecommendations.js` fetches experiences from Supabase and the user's `quiz_results` + `wishlists` in parallel.
2. `scoreExperience()` (same file) runs client-side scoring — category match (35pt), budget fit (25pt), city match (20pt), travel style (10pt), rating (5pt), saved bonus (5pt).
3. BrowsePage re-sorts/filters scored results in-component for search, "open now", and sort mode.

**Routing:** All routes in `App.jsx`. Protected routes use `<ProtectedRoute>` (redirects to `/auth`). Admin routes use `<AdminRoute>` (checks `profiles.role = 'admin'`). All 30+ page components are `React.lazy()`-loaded.

**Supabase edge functions** live in `supabase/functions/` (Deno runtime):
- `generate-itinerary` — calls Claude Haiku; requires user JWT (not anon key)
- `create-payment-intent` — Stripe; verifies booking ownership before creating intent
- `stripe-webhook` — validates amount before confirming payment
- `review-submission` — admin-only; updates `operator_submissions` and emails operator via Resend
- `personalize-experience` — Claude blurb for the Experience detail page

**Database migrations** are in `supabase/migrations/` (numbered `001_`…). Apply via Supabase Dashboard → SQL Editor or `supabase db push`.

**Data pipeline scripts** in `scripts/` (TypeScript, run with `npx tsx scripts/<name>.ts`):
- `discoverExperiences.ts` — Google Places API → inserts new KC experiences (84 search queries)
- `enrichExperiences.ts` — fills in hours, phone, website from Places API
- `fetchPlacePhotos.ts` — fetches CDN photo URLs into `image_url`
- `validateLinks.ts` — HEAD-checks all external URLs, updates `link_status`

## Key conventions

**City gating:** `VITE_ACTIVE_CITIES=Kansas City` in env enables KC-only mode. All city checks go through `isCityActive()` and `SINGLE_CITY_MODE` from `src/lib/cityConfig.js` — never hardcode city names in conditionals.

**Feature flags:** `VITE_FEATURE_WORLD_CUP=true` gates the `/world-cup` route and nav link. Checked as `import.meta.env.VITE_FEATURE_WORLD_CUP === 'true'`.

**Build chunks:** `vite.config.js` splits Stripe, Leaflet, react-globe.gl, Sentry, Supabase, and React into separate vendor chunks. The `manualChunks` option uses a function (not object) for Vite 8 / rolldown compatibility.

**Tailwind tokens:** `bg-blue-brand` (`#034694`), `bg-blue-tint`, `bg-gold-brand` (`#F5A623`), `bg-gold-tint`, `rounded-card`, `rounded-pill` — defined in `tailwind.config.js`. Use these instead of arbitrary values.

**CSS variables:** `var(--bg)` for page background (defined in `src/styles/index.css`).

## Auth and onboarding flow

`OnboardingQuiz` (popup on `HomePage`) stores persona in `localStorage` under `vtopia_persona` and a shown flag in `sessionStorage` under `vtopia_onboarding_shown`. It does **not** write to Supabase.

Full interest questionnaire (`/interests` → `InterestsPage`) saves to the `quiz_results` table in Supabase and is what powers recommendations.

New user routing:
- Email signup → `AuthPage` → on success, sets `sessionStorage.vtopia_onboarding_interests = '1'` → navigates to `/interests`
- Google OAuth → `AuthCallback` → if account age < 3 min, same flag + redirect to `/interests`
- Existing user → redirects to `location.state.from` or `/browse`

`ONBOARD_INTERESTS_KEY = 'vtopia_onboarding_interests'` is the sessionStorage key that prevents `AuthPage`'s `useEffect` from redirecting away mid-onboarding.

## Map

`BrowseMap` uses Leaflet via `react-leaflet`. Experiences with `lat`/`lng` columns (added in migration 023) get precise pins; others fall back to a deterministic jitter around `CITY_CENTERS`. The map is lazy-loaded. `TripMap` (in trip dashboard) follows the same pattern.

## Testing

Unit tests use Vitest + jsdom + `@testing-library/react`. Setup file is `src/tests/setup.js` (just imports `@testing-library/jest-dom`). Live tests in `src/tests/live/` hit real Supabase — require `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `VITE_TEST_USER_JWT`. Skip JWT-gated tests gracefully when the env var is absent.
