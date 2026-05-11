# Bug Fix Sprint — vtopia-bugfixes-20260510

## BUG 11 — Experience card highlight chips
`src/components/cards/ExperienceCard.jsx`
Added `pickHighlights()` helper that scores and filters tags, suppressing generic single-word tags (food, drink, outdoors…). Cards now render up to 3 specific highlight chips below the meta row, with a "+N more" overflow pill.

## BUG 12 — Highlights section on Experience page
`src/pages/ExperiencePage.jsx`
The Highlights section now uses `pickHighlights(exp.tags, 4)` (exported from ExperienceCard) and shows a "+N more" pill instead of truncating silently.

## BUG 13 — CTA link quality (`link_status`)
`supabase/migrations/009_link_status.sql`, `src/pages/ExperiencePage.jsx`, `scripts/validateLinks.ts`, `src/pages/AdminLinksPage.jsx`, `src/App.jsx`
Added `link_status` column (`verified | unverified | broken`). ExperiencePage suppresses external URLs when `link_status = 'broken'` and falls back to Google Maps. A headless validator script and admin dashboard at `/admin/links` were added to manage link quality.

## BUG 14 — Mobile nav & filter drawer
`src/components/layout/AppLayout.jsx`, `src/pages/BrowsePage.jsx`
Added a hamburger button and full-screen slide-in drawer (left edge, 72px width) to AppLayout for mobile. BrowsePage got a horizontal scrollable pill bar with right-fade mask and a bottom slide-up filter drawer for category/budget/sort on mobile.

## BUG 15 — Back-to-itinerary navigation
`src/pages/ItineraryResults.jsx`, `src/pages/ExperiencePage.jsx`
ItineraryResults saves the full itinerary JSON to `sessionStorage` under `vtopia_active_itinerary` after generation. TimeBlock "Book on Vtopia" links now pass `?from=itinerary`. ExperiencePage detects this param and shows a dismissible sticky blue banner — "Back to your itinerary" — that calls `navigate(-1)`.

## BUG 16 — Booking page auth guard & error UX
`src/pages/BookingPage.jsx`, `docs/booking-qa.md`
Added an explicit in-component auth guard (`Navigate to /auth` with `state.from`) as a belt-and-suspenders alongside ProtectedRoute. Improved loading state to a branded spinner with descriptive text. Error messages in Step 2 now carry `role="alert"`, a warning icon, and auto-scroll into view via `useEffect` + `scrollIntoView`. A QA checklist was created at `docs/booking-qa.md`.

## Privacy email typo fix
`src/pages/PrivacyPage.jsx`
Corrected `privacy@vtopia.com` → `privacy@vtopia.world` in the Contact section body and mailto link.
