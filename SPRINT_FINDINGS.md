# Vtopia WC Sprint — Audit Findings
*Branch: vtopia-wc-sprint-20260507 | Audited: 2026-05-07*

---

## CRITICAL

| # | Severity | Confidence | File:Line | Issue | Fix |
|---|----------|------------|-----------|-------|-----|
| 1 | CRITICAL | HIGH | `src/pages/HomePage.jsx:169,178` | Two CTA buttons have **truncated className strings** ending with `"text-..."` and `"..."` — renders as broken/unstyled buttons | Complete the Tailwind class strings |
| 2 | CRITICAL | HIGH | `supabase/functions/create-payment-intent/index.ts` | **No user ownership verification** — any authed user can pass any `bookingId` and trigger a payment intent for someone else's booking | After fetching booking, assert `booking.user_id === userId` from JWT |
| 3 | CRITICAL | HIGH | `supabase/functions/stripe-webhook/index.ts` | **Webhook updates bookings by ID with no amount validation** — a replayed/forged Stripe event could confirm a booking without matching payment | Validate `paymentIntent.amount === booking.total_amount * 100` before confirming |
| 4 | CRITICAL | HIGH | `supabase/functions/generate-itinerary/index.ts:113-126` | **Raw URL string construction for Supabase REST query** — uses string interpolation with `encodeURIComponent(cityName)` instead of Supabase SDK `.eq()` | Replace raw fetch with Supabase SDK call |

---

## HIGH

| # | Severity | Confidence | File:Line | Issue | Fix |
|---|----------|------------|-----------|-------|-----|
| 5 | HIGH | HIGH | `src/App.jsx:37` | **Auth subscription leaks** — `useEffect` calls `init()` which returns an unsubscribe function, but the effect doesn't return it. React Strict Mode / HMR creates double listeners | Change to `return () => init().then(cleanup => cleanup?.())` or use pattern in comments |
| 6 | HIGH | HIGH | `index.html` | **Zero SEO meta tags** — no `<meta name="description">`, no Open Graph, no Twitter Cards, no canonical URL, title is just "vtopia" | Add full SEO head |
| 7 | HIGH | HIGH | `public/` | **No robots.txt and no sitemap.xml** — search crawlers operate blind; no sitemap means slow/incomplete indexing | Create both files |
| 8 | HIGH | HIGH | `src/App.jsx:6-20` | **No route-level code splitting** — all 13 pages imported eagerly, meaning the full bundle is parsed on first load | Wrap all page imports in `React.lazy()` + `Suspense` |
| 9 | HIGH | HIGH | `src/hooks/useBookings.js:31-36` | **Null-dereference on missing experience** — no null check after fetching experience; `exp.price_per_person` throws if experience doesn't exist | Add `if (!exp) throw new Error('Experience not found')` |
| 10 | HIGH | HIGH | `src/pages/ItineraryResults.jsx:283` | **Auth token misuse** — sends anon key as `Authorization: Bearer` header; Bearer should be the user's JWT, not an API key | Use `(await supabase.auth.getSession()).data.session?.access_token` |
| 11 | HIGH | HIGH | `src/hooks/useRecommendations.js:81-92` | **Race condition in parallel user-prefs queries** — `Promise.all()` short-circuits if either query fails, breaking recommendations for all users | Use `Promise.allSettled()` |
| 12 | HIGH | MEDIUM | `supabase/functions/generate-itinerary/index.ts:3` | **Missing env key validation** — non-null assertion `!` on `ANTHROPIC_API_KEY`; cold start crash if key not set | Add explicit validation with graceful 500 response |

---

## MEDIUM

| # | Severity | Confidence | File:Line | Issue | Fix |
|---|----------|------------|-----------|-------|-----|
| 13 | MEDIUM | HIGH | `src/components/layout/AppLayout.jsx:160-162` | **Footer links are broken `href="#"`** — Privacy page exists at `/privacy`; Terms/Support links go nowhere | Link Privacy to `/privacy`; stub Terms to `/privacy#terms` |
| 14 | MEDIUM | HIGH | `src/pages/AuthPage.jsx:157-158` | **Auth page footer links to `#`** — "Terms" and "Privacy Policy" links dead | Link to `/privacy` |
| 15 | MEDIUM | HIGH | `src/pages/ProfilePage.jsx:35` | **`alert()` on save error** — browser alert blocks UI thread; inconsistent with rest of app | Replace with inline error state |
| 16 | MEDIUM | HIGH | `src/components/cards/ExperienceCard.jsx:133` | **Images missing `loading="lazy"`, `width`, `height`** — causes LCP regression and CLS on browse/home pages | Add all three attributes |
| 17 | MEDIUM | HIGH | `src/styles/index.css:58` | **Duplicate `focus:ring-2 focus:ring-2`** in `.input-field` | Remove duplicate |
| 18 | MEDIUM | HIGH | `src/hooks/useWishlist.js:25-43` | **No `onError` in wishlist toggle mutation** — silent failure when save/unsave fails | Add `onError` callback |
| 19 | MEDIUM | HIGH | `src/hooks/useBookings.js:69` | **No `error` state returned from `useBookings`** — callers can't distinguish loading vs failed | Export `error` from query |
| 20 | MEDIUM | MEDIUM | `src/pages/ItineraryResults.jsx / ItineraryView.jsx` | **`CITY_LABELS`, `INTEREST_TAG_MAP`, `TimeBlock`, `MealBlock`** all duplicated verbatim | Extract to shared module |
| 21 | MEDIUM | MEDIUM | `src/hooks/useQuiz.js:68-69` | **Deprecated TanStack Query v4 invalidation syntax** — `invalidateQueries(['quiz', id])` should be `invalidateQueries({ queryKey: ['quiz', id] })` | Update to v5 object syntax |
| 22 | MEDIUM | HIGH | `src/styles/index.css:1` | **Google Fonts loaded with no `preconnect`** — adds ~100ms DNS/TCP RTT to font load; delays LCP | Add `<link rel="preconnect" href="https://fonts.googleapis.com">` to `index.html` |
| 23 | MEDIUM | MEDIUM | `vite.config.js` | **No `build.rollupOptions.output.manualChunks`** — leaflet, react-globe.gl, stripe, sentry all end up in one vendor chunk | Split heavy vendor libs into separate chunks |
| 24 | MEDIUM | HIGH | `src/pages/ProfilePage.jsx:253` | **Fake notification toggles** — `defaultChecked` not connected to any backend state; toggles reset on remount | Wire to profile preferences or remove |
| 25 | MEDIUM | MEDIUM | `src/pages/BookingPage.jsx:80-81` | **Possibly stale Supabase session used for payment** — `getSession()` returns cached token; expired JWTs may reach edge function | Use `getUser()` to force server-side token validation |

---

## LOW

| # | Severity | Confidence | File:Line | Issue | Fix |
|---|----------|------------|-----------|-------|-----|
| 26 | LOW | HIGH | `src/components/ui/ErrorBoundary.jsx:15` | **`console.error` in production** — no Sentry integration in ErrorBoundary despite existing Sentry setup | Call `Sentry.captureException(error)` when DSN is available |
| 27 | LOW | HIGH | `vercel.json` | **`VITE_APP_URL` hardcoded in repo** — environment-specific value in committed config | Move to Vercel dashboard env |
| 28 | LOW | MEDIUM | `src/hooks/useWishlist.js:40-41` | **Over-broad cache invalidation** — `['recommendations']` invalidates any query with that prefix | Invalidate exact `['experiences', ...]` queryKey |
| 29 | LOW | HIGH | `src/pages/BookingPage.jsx:169,454` | **`href="#"` in Terms/Cancellation links** inside booking form | Link to `/privacy` |
| 30 | LOW | MEDIUM | Multiple | **`CITY_LABELS`, `BUDGET_LABELS` copy-pasted** across 4+ files | Centralize in a shared `src/lib/cities.js` module |
| 31 | LOW | HIGH | `public/` | **No favicon for modern devices** — only `favicon.svg`; no 192px/512px PNG for PWA / Android, no `apple-touch-icon` | Add PNG sizes + manifest |
| 32 | LOW | MEDIUM | `src/pages/ItineraryQuiz.jsx:53` | **Redundant "traveler" + "travelerGroup" steps** (steps 6 & 7) ask nearly identical questions | Merge into one step |
| 33 | LOW | LOW | `src/styles/index.css:2` | **Fonts loaded via `@import` in CSS** rather than `<link>` in HTML — CSS `@import` blocks rendering | Move to HTML `<link>` tags |

---

## SEO Gaps (all HIGH for tourist traffic)

| # | Gap | Impact |
|---|-----|--------|
| S1 | No `<title>` per-page (all show "vtopia") | Google won't rank individual pages |
| S2 | No `<meta name="description">` anywhere | Low CTR from SERP |
| S3 | No Open Graph tags | Social shares show blank cards |
| S4 | No Twitter Card tags | Same |
| S5 | No canonical URL | Duplicate content signals |
| S6 | No `robots.txt` | Crawlers don't know what to index |
| S7 | No `sitemap.xml` | Slow discovery of city/experience pages |
| S8 | No JSON-LD structured data | Misses rich result eligibility (TouristAttraction, Event) |
| S9 | H1 text is fine on HomePage but no per-page H1 hierarchy | Weak keyword signal for city pages |

---

## Performance Gaps

| # | Gap | Impact |
|---|-----|--------|
| P1 | All 13 routes loaded eagerly | LCP +1–2s on first load |
| P2 | No `loading="lazy"` on images | Wasted bandwidth above fold |
| P3 | No image `width`/`height` attributes | CLS on every card grid |
| P4 | react-globe.gl + leaflet + stripe bundled together | Single 800KB+ vendor chunk |
| P5 | Google Fonts `@import` in CSS | Extra render-blocking RTT |
| P6 | No service worker / offline cache | Tourists with stadium WiFi = blank app |
| P7 | No `Cache-Control` headers for static assets | Vercel serves CDN defaults |

---

*World Cup features to implement: see PHASE 4 in sprint plan*
