# Booking Page — QA Checklist

## Auth guard
- [ ] Visiting `/book/:id` while logged out redirects to `/auth` with a `from` return URL
- [ ] After signing in, the user lands back on the correct booking page
- [ ] Auth expiry mid-session: refreshing the page redirects to sign-in (ProtectedRoute handles this)

## Step 1 — Details
- [ ] Experience title, city, duration, rating, and description render correctly
- [ ] "What's included" list renders when the field is populated
- [ ] "Reserve Now" advances to Step 2

## Step 2 — Booking details
- [ ] Arriving from ExperiencePage with prefilled date/time/guests shows "Your selections" summary card (read-only)
- [ ] "Change" link expands the full date/time/guests inputs
- [ ] Date picker enforces `min={today}` (no past dates)
- [ ] Guest counter respects `max_guests` from the experience row
- [ ] Submitting without a date shows the inline error: "Please select a date before continuing."
- [ ] Submitting without a name or email shows the relevant inline error
- [ ] Error message scrolls into view automatically
- [ ] Loading spinner appears on "Continue to Payment" while the booking row is being created

## Step 3 — Payment
- [ ] Stripe PaymentElement renders with card, Apple Pay, Google Pay tabs
- [ ] Paying with a test card (`4242 4242 4242 4242`) succeeds and advances to Step 4
- [ ] Declined card shows the Stripe error inline
- [ ] "Back" returns to Step 2 without losing contact details

## Step 4 — Confirmation
- [ ] Booking reference, experience name, date, guests, and amount paid all shown correctly
- [ ] "View in My trips" navigates to Profile → history tab
- [ ] "Share trip summary" copies a plain-text summary to clipboard

## Edge cases
- [ ] Price is 0 or null — total shows $0.00 and Stripe form still renders
- [ ] `max_guests` not set — falls back to 8
- [ ] Experience not found (deleted/inactive) — shows "Experience not found" with a browse link
