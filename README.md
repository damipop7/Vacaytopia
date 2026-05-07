# Vtopia — Kansas City Experience Discovery

Vtopia helps tourists discover and book curated local experiences. This branch (`vtopia-wc-sprint-20260507`) contains all changes from the 2026 FIFA World Cup KC launch sprint.

---

## Getting started

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build
npm run lint       # ESLint (0 errors expected)
npm test           # Vitest — 115 tests
```

---

## Environment variables

Copy `.env.example` (or ask a team member) and fill in:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_SENTRY_DSN=          # optional
VITE_FEATURE_WORLD_CUP=   # set to "true" to enable World Cup features
```

### Toggling World Cup features

All Phase 4 tourist features are behind a single flag:

```bash
VITE_FEATURE_WORLD_CUP=true npm run dev
```

When `false` (or unset), the `/world-cup` route renders a "coming soon" stub and the nav link is hidden. No other pages are affected.

---

## What changed in the World Cup sprint (2026-05-07)

### Security fixes
- **create-payment-intent**: Added user ownership check — callers can no longer initiate payment for another user's booking (CRITICAL)
- **stripe-webhook**: Validates PaymentIntent amount matches booking total before confirming — prevents replayed/forged webhook events (CRITICAL)
- **generate-itinerary**: Replaced raw REST URL construction with Supabase SDK `.eq()` chain; added graceful startup check for `ANTHROPIC_API_KEY` (CRITICAL/HIGH)
- **ItineraryResults**: Fixed `Authorization: Bearer` header to use the user's JWT, not the anon key (HIGH)

### Bug fixes
- Completed truncated CTA button `className` strings on HomePage (CRITICAL)
- Fixed auth subscription leak in `App.jsx` `useEffect` — was creating double listeners in Strict Mode (HIGH)
- Added `Promise.allSettled` for parallel user-prefs queries so one failure doesn't break recommendations for all users (HIGH)
- Null-checked experience fetch in `useBookings` before accessing `price_per_person` (HIGH)
- Replaced `alert()` with inline error state in `ProfilePage` save handler (MEDIUM)
- Fixed all broken `href="#"` links in footer, auth page, and booking form (MEDIUM)
- Made notification/privacy toggles in ProfilePage controlled (no longer reset on tab remount) (MEDIUM)
- Added `getUser()` validation before payment intent request in BookingPage (MEDIUM)

### SEO (all pages)
- Per-page `<title>` and `<meta description>` via `react-helmet-async`
- Open Graph + Twitter Card tags on all pages
- JSON-LD structured data (`TouristAttraction`, `WebSite`) on browse and experience pages
- `robots.txt` and `sitemap.xml` with all city routes
- Google Fonts moved from CSS `@import` to HTML `<link>` with `preconnect`
- Canonical URL in `index.html`

### Performance
- All 13 routes wrapped in `React.lazy()` + `Suspense` for route-level code splitting
- Separate Rollup chunks for Stripe, Leaflet, react-globe.gl, and Sentry
- `loading="lazy"`, `width`, `height`, `decoding="async"` on all experience card images

### World Cup features (`VITE_FEATURE_WORLD_CUP=true`)
- **`/world-cup`** — Visitor guide page: top 10 KC experiences, neighborhood explorer, match schedule stub, getting-around section, venue proximity context (GEHA Field area)
- **Curated routes** — "Match Day in KC", "KC BBQ Trail", "Crossroads Arts Afternoon" shareable itinerary cards
- **Social sharing** — multilingual share cards (EN/ES/PT/FR/DE/AR) with `navigator.share` + clipboard fallback
- **i18n scaffold** — `src/lib/i18n.js` with `en`/`es` locale files; `useTranslation()` hook ready for drop-in translations
- **Service worker** — cache-first strategy for static assets; offline fallback page at `public/offline.html` so tourists on stadium WiFi still get a usable experience

---

## How to revert any phase using git

The sprint was committed atomically. To revert a specific fix:

```bash
git log --oneline                   # find the commit hash
git revert <hash>                   # creates a new undo commit (safe)
```

To revert all sprint changes and restore the pre-sprint state:

```bash
git checkout vtopia-pre-sprint-backup   # the backup tag from before the sprint
```

To disable World Cup features without reverting code:

```bash
# In .env.local or Vercel dashboard:
VITE_FEATURE_WORLD_CUP=false
```

---

## Open items (see SPRINT_SUMMARY.md)

- `VITE_APP_URL` in `vercel.json` should be moved to the Vercel dashboard env (LOW)
- Favicon PNGs (192px, 512px, apple-touch-icon) need to be generated from `public/favicon.svg`
- Live match schedule data requires a FIFA API key or third-party feed
- i18n translations: Spanish content strings need to be filled in `src/locales/es.json`
