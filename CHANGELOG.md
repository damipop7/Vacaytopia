# Vtopia — Full Development Timeline

> **Stack:** React 19 · React Router 7 · Vite 8 · Tailwind CSS · Supabase (PostgreSQL + Auth + Edge Functions) · Stripe · Claude Haiku
> **Target launch:** FIFA World Cup 2026 Kansas City
> **Repository:** https://github.com/damipop7/Vacaytopia

---

## 2026-05-07 — Sprint 1 · Security, Performance & World Cup Foundation (PR #1)

### Critical security fixes
| Severity | Fix |
|----------|-----|
| CRITICAL | `create-payment-intent` now verifies the booking belongs to the requesting user before creating a Stripe PaymentIntent |
| CRITICAL | `stripe-webhook` validates the PaymentIntent amount matches the booking total before confirming |
| CRITICAL | Supabase client replaced raw REST URLs with the typed SDK in Edge Functions |
| HIGH | `generate-itinerary` now sends the user's JWT as the Authorization Bearer instead of the anon key |
| HIGH | `ANTHROPIC_API_KEY` absence is caught and returns a clear 500 rather than crashing silently |
| HIGH | `Promise.allSettled` used in user-prefs to prevent one failed preference from blocking all others |
| MEDIUM | `alert()` removed from ProfilePage save handler — replaced with inline error state |
| MEDIUM | All broken `href="#"` links replaced with real routes across footer, auth page, and booking page |
| MEDIUM | JWT validation is now forced before any payment step (prevents expired-session payment attempts) |
| LOW | `Sentry.captureException` wired correctly into `ErrorBoundary.componentDidCatch` |

### Performance
- Experience card images now carry `loading="lazy"`, explicit `width`/`height`, and `decoding="async"` — eliminates layout shift and reduces LCP
- Render-blocking CSS `@import` for fonts removed; duplicate `focus:ring-2` in `input-field` cleaned up
- `manualChunks` migrated from object to function for Vite 8 / rolldown compatibility (was crashing the build)
- ESLint brought to zero errors

### SEO
- `react-helmet-async` added: per-page `<title>`, `<meta name="description">`, Open Graph tags, and JSON-LD (`LocalBusiness` schema) on Browse and Experience pages
- `robots.txt` and `sitemap.xml` generated with all city routes

### Features
- **KC-only mode** — `VITE_ACTIVE_CITIES` env flag hides all non-KC cities; activates single-city focus for launch
- **Kansas City** added as first/default city in both quiz flows; duplicate traveler steps merged into one
- **World Cup KC visitor guide** (`/world-cup`) — curated routes, neighborhoods, match schedule stub, multilingual share; feature-flagged behind `VITE_FEATURE_WORLD_CUP=true`
- **i18n scaffold** — lightweight English/Spanish locale system; drop-in translation ready with no build changes
- **Service worker** — cache-first strategy for static assets + offline fallback page for stadium/poor-connectivity environments

---

## 2026-05-07 — Sprint 2 · Experience Types & Operator Tools (PR #2)

### Features
- **Experience type taxonomy** — 16 distinct types (`restaurant_reserve`, `food_walkup`, `outdoor_free`, `cultural_paid`, `ticketed`, `nightlife_ticketed`, `sports_event`, `hotel`, `transport`, …)
- **Smart CTA engine** — each experience type maps to a tailored primary/secondary CTA (e.g. restaurants get "Reserve a table" + OpenTable affiliate; free outdoor gets "Get directions" only); all external links carry UTM tracking (`utm_source=vtopia&utm_medium=referral&utm_campaign=wc2026`)
- **Terms of Service page** (`/terms`) with real legal content wired to footer link
- **Kansas City World Cup landing page** (`/kansas-city`) — hero section, 5 curated itineraries, neighborhood guide, getting around section
- **Booking confirmation emails** via Resend — guest receipt + operator notification; gated behind `RESEND_API_KEY` env var

### Fixes
- BrowsePage redirect moved after all hooks (Rules of Hooks violation fixed)
- Itinerary page blank on first load — idle state guard prevents empty flash before redirect

---

## 2026-05-08 — Sprint 3 · Experience Data Overhaul (PR #3)

### Data
- 15 real Kansas City experiences added with verified prices, tips, and accurate `experience_type` labels
- Chain businesses hidden from browse (Starbucks, McDonald's, etc.) via `is_active = false`

### UI
- Experience cards: price tier badges replace the old booking CTA for non-reservable experiences ("View details" instead of "Book")
- Experience card images now loaded from `image_url` in the database; bright Unsplash KC fallbacks replace the previous dark placeholder images
- Map popup uses price tier display instead of raw `price_per_person` number

### Developer tooling
- Experience schema documented; migration `005` adds the full `experience_type` enum to the database
- 16-type taxonomy: `restaurant_reserve`, `food_walkup`, `food_delivery`, `outdoor_free`, `outdoor_paid`, `cultural_free`, `cultural_paid`, `nightlife_walkin`, `nightlife_ticketed`, `ticketed`, `shopping`, `sports_event`, `transport`, `hotel`, `free_no_booking`, `outdoor_info`

### Operator tools
- **Self-listing page** (`/list-your-experience`) — public form for operators to submit their experience; linked in footer
- Supabase migration for `operator_submissions` table

---

## 2026-05-09 — Sprint 4 · Platform Polish & Data Quality (PR #4)

### Design polish
- Global design system refinements: spacing, card radius, shadow tokens
- Frosted glass top nav (scroll-triggered `backdrop-blur` + border)
- Button and pill component consistency pass

### Multilingual
- Language selector component added to top nav
- i18n hook wired to existing locale files

### Affiliates
- Booking.com, Viator, Uber, and Lyft affiliate links integrated across Experience and Itinerary pages
- Affiliate config centralised in `src/lib/affiliates.config.ts`

### ML foundations
- User interest model scaffolded — interest tags stored on profile, used to personalise Browse ordering and BookableExperiences widget on itinerary results

### Infrastructure
- Migration fix: `NOW()` predicate in a partial index replaced with an immutable timestamp constant (PostgreSQL requires immutable expressions in index predicates)

---

## 2026-05-10 — Sprint 5 · Google Places Discovery Pipeline (PR #5)

### Data pipeline
- **`scripts/discoverExperiences.ts`** — searches Google Places API (New) across 28 Kansas City query terms; filters chain businesses via `CHAIN_BLACKLIST`; skips venues with fewer than 10 reviews; maps to the Vtopia experience schema and inserts via the Supabase service-role key (bypasses RLS)
- Result: **434 new KC experiences inserted**, 88 skipped (chains or low-review-count)
- **`scripts/enrichExperiences.ts`** upgraded to Places API (New) — POST endpoint, `X-Goog-FieldMask` header, `PRICE_LEVEL_MAP` for string-to-number conversion, `weekdayDescriptions` field

### Infrastructure
- GitHub branch protection enabled on `main`
- All future changes shipped via branch + PR workflow (no direct commits to main)
- ImprovMX email forwarding configured: `hello@`, `support@`, `privacy@` → `damivtopia@gmail.com`
- Resend domain verification: DKIM, SPF, DMARC records added in Namecheap Advanced DNS

---

## 2026-05-10 — Sprint 6 · UX Bug Fix Sprint (PR #6)

### BUG 11 — Experience card highlight chips
- `pickHighlights()` helper added to `ExperienceCard.jsx`; scores and filters tags, suppressing generic single-word labels (food, drink, outdoors, arts…)
- Cards now render up to 3 specific highlight chips below the meta row (e.g. "Live music", "Rooftop terrace", "Dog friendly")
- "+N more" overflow pill shown when additional tags exist

### BUG 12 — Highlights section on Experience detail page
- ExperiencePage Highlights section uses the same `pickHighlights(exp.tags, 4)` with a "+N more" pill — consistent display between card and detail views

### BUG 13 — CTA link quality (`link_status`)
- `link_status` column added (`verified | unverified | broken`) — migration `009`
- ExperiencePage `resolveCta()` suppresses external URLs when `link_status = 'broken'`, falling back to Google Maps
- **`scripts/validateLinks.ts`** — HEAD-request validator with a `TRUSTED_DOMAINS` allowlist and `VALID_PATH_PATTERNS` check; marks each experience as verified/broken/unverified; requires `SUPABASE_SERVICE_ROLE_KEY`
- **`/admin/links`** — password-protected admin dashboard showing all experiences with colour-coded link status pills, filter tabs, and instructions to run the validator

### BUG 14 — Mobile navigation & browse filters
- **AppLayout** — hamburger button added (mobile only); full-screen slide-in drawer from the left edge with 48px touch targets, logo, close button, nav links, and sign-in CTA; closes on route change
- **BrowsePage** — horizontal scrollable category pill bar with right-fade mask image gradient; "Filters" button (SlidersHorizontal icon) opens a bottom slide-up drawer with category, budget, and sort controls; tapping outside dismisses it

### BUG 15 — Back-to-itinerary navigation
- After generating an itinerary, the full JSON is saved to `sessionStorage` under `vtopia_active_itinerary`
- "Book on Vtopia" links in `TimeBlock` now pass `?from=itinerary` to the Experience detail page
- ExperiencePage detects the `from=itinerary` search param and shows a dismissible sticky blue banner — "← Back to your itinerary" — that calls `navigate(-1)`; dismissed with the × button

### BUG 16 — Booking page auth guard & error UX
- Explicit in-component auth guard: if `user` is null after auth finishes loading, `<Navigate to="/auth" state={{ from: location }} replace />` sends the user to sign-in with a return URL (belt-and-suspenders alongside `ProtectedRoute`)
- Loading state replaced with a branded spinner and "Loading your booking…" text
- Step 2 error messages now carry `role="alert"` and a warning icon; a `useEffect` watches the `error` state and calls `scrollIntoView` so the message is always visible
- `docs/booking-qa.md` — full QA checklist covering auth, all 4 steps, and edge cases

### Additional fixes
- `privacy@vtopia.com` corrected to `privacy@vtopia.world` in PrivacyPage (body text and mailto link)
- Google OAuth consent screen documented in `docs/google-oauth-fix.md` (Supabase-managed; no client credentials in codebase)

---

## 2026-05-11 — Sprint 7 · Codebase cleanup & open item completion (PR #7)

### Completed
- **CITY_LABELS & BUDGET_LABELS centralised** — extracted to `src/lib/cities.js`; `ItineraryResults.jsx` and `ItineraryView.jsx` now import from it; test file updated to import from the shared module instead of maintaining a third inline copy
- **Plausible analytics wired** — privacy-first, no-cookie, GDPR-compliant script added to `index.html`; activates as soon as `vtopia.world` is registered at plausible.io/sites (safe to ship before registration — script does nothing if domain is unknown)
- **PWA manifest added** — `public/site.webmanifest` created with name, theme colour `#034694`, and icon references; `<link rel="manifest">` added to `index.html`
- **`public/test.html` removed** — dev-only QA artifact was publicly accessible and exposed internal Supabase URLs and owner email address
- **All locale files confirmed complete** — `es.js`, `fr.js`, `de.js`, `pt.js` all have every key from `en.js`; no missing translations

### Open — requires external action

| Item | Status | Notes |
|------|--------|-------|
| ~~Migration 009 applied to production~~ | ✅ Done 2026-05-12 | `link_status` column live |
| ~~Link validator run~~ | ✅ Done 2026-05-12 | 1 verified, 0 broken, 199 unverified — homepage URLs expected |
| ~~`provider_email` empty in DB~~ | ✅ Done 2026-05-12 | Migration 011 reset `requires_booking=false` for 588 unpartnered experiences; webhook falls back to `hello@vtopia.world` |
| ~~Migration 010 & 011 applied to production~~ | Needs SQL editor | Paste `010_provider_email.sql` then `011_requires_booking_integrity.sql` into Supabase SQL Editor |
| ~~Favicon PNGs missing~~ | ✅ Done 2026-05-12 | `apple-touch-icon.png` (180×180) and `icon-512.png` (512×512) generated from `favicon.svg` via `scripts/generateAssets.ts` |
| ~~OG image missing~~ | ✅ Done 2026-05-12 | `public/og-image.png` (1200×630) generated — dark branded background, logo, tagline, purple→blue accent |
| FIFA match schedule | Needs API key or manual entry | Register at api-football.com or manually enter confirmed KC 2026 match dates in `WorldCupPage.jsx` |
| Plausible account | Needs account creation | Register `vtopia.world` at plausible.io/sites — script is already in `index.html` |
| Post-WC cleanup | Time-based | After tournament ends: search `// TODO: re-enable post-World-Cup` in `src/` and revert all flagged code |

---

## 2026-05-12 — Sprint 8 · Operator Email & Booking Integrity (PR #8)

### Booking integrity
- **Migration 010** — `provider_email` column added to `experiences` table (`TEXT DEFAULT NULL`); was referenced by `stripe-webhook` but never existed in schema
- **Migration 011** — `requires_booking` reset to `false` for all 588 active experiences with no `provider_email`; experiences without an onboarded operator remain discoverable but no longer generate Stripe PaymentIntents
- **Operator onboarding flow** — to make an experience Vtopia-bookable: set `provider_email` in the dashboard, then flip `requires_booking = true`

### Webhook resilience
- `stripe-webhook` now falls back to `hello@vtopia.world` when `provider_email` is null — no booking notification is ever silently dropped

### Tooling
- **`scripts/exportMissingProviderEmails.ts`** — exports a CSV of bookable experiences missing `provider_email`; scoped to `requires_booking = true` only so discovery-only experiences are excluded

---

## Launch configuration — required env vars

| Variable | Where set | Value / notes |
|----------|-----------|---------------|
| `VITE_ACTIVE_CITIES` | Vercel | `Kansas City` — enables KC-only mode. Clear after World Cup to restore all cities. |
| `VITE_FEATURE_WORLD_CUP` | Vercel | `true` — enables `/world-cup` page and nav link |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Vercel | `pk_live_…` |
| `VITE_SUPABASE_URL` | Vercel | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Vercel | Supabase anon key |
| `VITE_OPENWEATHER_API_KEY` | Vercel | OpenWeatherMap key — enables 7-day forecast strip on itinerary |
| `VITE_BOOKING_AFFILIATE_ID` | Vercel | Booking.com affiliate ID |
| `VITE_GYG_PARTNER_ID` | Vercel | GetYourGuide partner ID |
| `RESEND_API_KEY` | Supabase secrets | `re_…` — activates booking confirmation emails |
| `STRIPE_WEBHOOK_SECRET` | Supabase secrets | `whsec_…` — validates Stripe webhook signatures |
| `ANTHROPIC_API_KEY` | Supabase secrets | Claude Haiku key for `generate-itinerary` |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env` (scripts only) | Required for `discoverExperiences.ts` and `validateLinks.ts` |

To set Supabase edge function secrets:
```bash
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx
```

---

## Summary by category

| Category | Changes |
|----------|---------|
| Security | 10 fixes (4 critical, 3 high, 2 medium, 1 low) |
| Performance & build | Lazy images, font loading, Vite 8 compat, ESLint zero |
| SEO | Helmet meta, OG tags, JSON-LD, robots.txt, sitemap.xml |
| Data | 15 hand-curated + 434 Google Places–discovered KC experiences |
| Experience types | 16-type taxonomy with smart CTA per type |
| Mobile UX | Nav drawer, browse filter drawer, highlight chips, back-banner |
| Booking flow | Auth guard, error scroll, loading state, QA checklist |
| Itinerary | sessionStorage persistence, back-navigation |
| Affiliate revenue | Booking.com, Viator, Uber, Lyft, OpenTable integrated |
| Infrastructure | Branch protection, email forwarding, Resend domain, Places API (New) |
| Operator | Self-listing page, link validator, admin dashboard, provider email fallback, booking integrity migration |
| i18n | English/Spanish/French/German/Portuguese scaffold, language selector |
| Legal | Terms of Service, Privacy policy corrections |
| Offline | Service worker, offline fallback page |
| Analytics | Plausible script wired (activation pending account registration) |
| PWA | site.webmanifest, manifest link in index.html |
