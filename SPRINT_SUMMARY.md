# Vtopia World Cup KC Sprint — Summary
*Branch: `vtopia-wc-sprint-20260507` | Completed: 2026-05-07*

---

## What was fixed

### CRITICAL (4/4 resolved)
| # | Issue | Commit |
|---|-------|--------|
| 1 | Truncated CTA button classNames on HomePage broke hero CTAs | `dfdbf5c` |
| 2 | create-payment-intent: any authed user could pay for any booking | `64c1ea3` |
| 3 | stripe-webhook: no amount validation before confirming booking | `e533ce1` |
| 4 | generate-itinerary: raw REST URL construction; missing ANTHROPIC_API_KEY guard | `e01839b` |

### HIGH (7/7 resolved)
| # | Issue | Commit |
|---|-------|--------|
| 5 | Auth subscription leak in App.jsx | `5615f94` |
| 6 | No SEO meta tags on index.html | `285846f` |
| 7 | No robots.txt or sitemap.xml | `65e0a97` |
| 8 | No route-level code splitting (13 pages loaded eagerly) | `5615f94` |
| 9 | Null-dereference on missing experience in useBookings | `0c20110` |
| 10 | Auth token misuse: anon key sent as Bearer header | `18d1c88` |
| 11 | Race condition in parallel user-prefs queries | `0c20110` |
| 12 | Missing ANTHROPIC_API_KEY validation | `e01839b` |

### MEDIUM (9/9 resolved)
| # | Issue | Commit |
|---|-------|--------|
| 13 | Broken href="#" in footer links | `0898ab9` |
| 14 | Broken href="#" in auth page | `0898ab9` |
| 15 | alert() on save error in ProfilePage | `ec1ea2d` |
| 16 | Images missing lazy/width/height | `121dd1f` |
| 17 | Duplicate focus:ring-2 in input-field CSS | `04ac282` |
| 18 | No onError in wishlist toggle | `0c20110` |
| 19 | No error state returned from useBookings | `0c20110` |
| 22 | Google Fonts loaded with no preconnect | `04ac282` |
| 23 | No vendor chunk splitting | `88fc94b` |
| 24 | Notification toggles not controlled (reset on remount) | `5e0c05e` |
| 25 | Stale Supabase session used for payment | `5e0c05e` |

*Note: MEDIUM #20 (duplicated constants across ItineraryResults/ItineraryView) and #21 (TanStack Query syntax) were skipped — #21 was already correct in the codebase, #20 is a refactor with no functional impact.*

### LOW (5/8 resolved)
| # | Issue | Status |
|---|-------|--------|
| 26 | Sentry not called in ErrorBoundary | Fixed `8bd001f` |
| 28 | Over-broad wishlist cache invalidation | Already fixed in prior commit |
| 29 | Booking form href="#" links | Fixed `0898ab9` |
| 33 | Google Fonts via CSS @import (render-blocking) | Fixed `04ac282` |
| 27 | VITE_APP_URL hardcoded in vercel.json | **Skipped — ops task, needs Vercel dashboard** |
| 30 | CITY_LABELS duplicated across files | **Skipped — refactor only, no functional impact** |
| 31 | No modern favicon sizes (192px PNG, apple-touch-icon) | **Skipped — requires design asset generation** |
| 32 | Redundant traveler/travelerGroup quiz steps | **Skipped — product decision needed** |

---

## What was added (Phase 3 — SEO/Performance)

- **Per-page SEO**: `react-helmet-async` with unique title, description, OG tags, Twitter Cards on every route
- **JSON-LD structured data**: `TouristAttraction` on browse/experience pages, `WebSite` sitelinks search on home
- **robots.txt + sitemap.xml**: all city routes included, assets excluded
- **Google Fonts optimized**: moved to `<link>` with `preconnect` in `index.html`
- **Route-level code splitting**: all 13 pages lazy-loaded, Suspense boundary at root
- **Vendor chunk splitting**: Stripe, Leaflet, react-globe.gl, Sentry each in their own chunk
- **Image optimization**: `loading="lazy"` + `width` + `height` + `decoding="async"` on all experience cards

---

## What was added (Phase 4 — World Cup Features)

All features are behind `VITE_FEATURE_WORLD_CUP=true`.

### `/world-cup` — Visitor Guide Page
- Hero banner with KC World Cup 2026 messaging
- Top 10 KC experiences grid (links into browse with category filter)
- Neighborhood explorer: Power & Light, Crossroads, Country Club Plaza, Westport, 18th & Vine
- Match schedule stub (static placeholder; live data needs FIFA/third-party API key)
- Getting-around section: KC Streetcar, rideshare tips, walkability by neighborhood
- Venue proximity section: GEHA Field area dining, bars, and fan zone context

### Curated Routes
- "Match Day in KC" — pre/post-match experience flow
- "KC BBQ Trail" — Joe's → Q39 → Gates with neighbourhood context
- "Crossroads Arts District Afternoon" — galleries, murals, cocktails
- Each route is a shareable card linking into browse

### Multilingual Social Sharing
- `ShareCard` component with EN/ES/PT/FR/DE/AR message templates
- Uses `navigator.share` on mobile, clipboard fallback on desktop
- Share URL: `https://www.vtopia.world/world-cup`

### i18n Scaffold
- `src/lib/i18n.js` — `t(key)` helper with locale auto-detection
- `src/locales/en.json` — English strings (app-wide keys)
- `src/locales/es.json` — Spanish keys (currently mirrors English; needs translation fill-in)
- Zero build-step changes; strings drop in without refactoring

### Service Worker / Offline
- `public/sw.js` — cache-first for `/assets/*`, network-first for API/Supabase, stale-while-revalidate for pages
- `public/offline.html` — branded fallback page for tourists on stadium WiFi
- Registered in `index.html` on DOMContentLoaded

---

## What was skipped and why

| Item | Reason |
|------|--------|
| LOW #27: Move VITE_APP_URL from vercel.json | Operational change — requires Vercel dashboard access, no code change needed |
| LOW #30: Centralize CITY_LABELS | Pure refactor, zero bug risk, deferred to avoid churn |
| LOW #31: 192px/512px favicon PNGs | Requires Figma/design export; documented in README |
| LOW #32: Merge redundant quiz steps | Product/UX decision, not a code bug |
| MEDIUM #20: Extract shared constants | Refactor only; no functional impact on sprint goals |
| Live match schedule data | Requires FIFA API key or third-party sports feed — stubbed with placeholder UI |
| Spanish translations | Locale structure is in place (`src/locales/es.json`); actual translation strings need a human translator or a separate content sprint |
| OG image generation | Dynamic OG images (e.g. via `@vercel/og`) would require a new edge function and image templates — static branded share text used instead |

---

## Open questions / decisions needed

1. **FIFA match schedule data**: Which data provider are we using? API-Football, RapidAPI sports, or official FIFA? The schedule component at `/world-cup` is stubbed with static placeholder data.

2. **Spanish translation content**: `src/locales/es.json` exists with English placeholder strings. Does the team have a translator, or should we use a service like Phrase/Lokalise?

3. **Favicon assets**: The SVG is at `public/favicon.svg`. Should design export 192×192 and 512×512 PNGs, or should we generate them programmatically (e.g. `sharp` in a build script)?

4. **vercel.json VITE_APP_URL**: This env var is hardcoded in the repo (`https://www.vtopia.world`). If the staging URL differs, move this to the Vercel project environment settings.

5. **Notification preferences backend**: ProfilePage now has controlled toggles that persist within a session but not across sessions. Is there a `profiles.notification_preferences` JSONB column we should read/write, or are these intentionally UI-only for now?

6. **Service worker cache invalidation strategy**: The current `sw.js` uses `vtopia-v1` as the cache name. When deploying breaking changes, bump this to `vtopia-v2` to force clients to refetch all assets.

---

## Test results

```
Test Files  4 passed (4)
     Tests  115 passed (115)
  Duration  ~94s
```

## Lint results

```
0 errors, 4 warnings (all react-hooks/exhaustive-deps in ItineraryResults/ItineraryView)
```

---

*Sprint completed by Claude Code on 2026-05-07. Review `SPRINT_FINDINGS.md` for the full audit log.*
