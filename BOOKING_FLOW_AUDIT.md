# Booking Flow Audit
*Vtopia Sprint v3 — 2026-05-07*

---

## Full Flow Map

```
1. User selects experience → /book/:experienceId
2. BookingPage: user fills contact details, selects date/time/guests
3. BookingPage: POST to Supabase → creates bookings row (status: "pending")
4. BookingPage: calls create-payment-intent edge function
   └─ FIXED (Sprint v1): verifies booking.user_id === caller user_id
5. User enters card in Stripe PaymentElement
6. stripe.confirmPayment() — Stripe handles 3DS if needed
7. On success → navigate to /profile?tab=history
8. Stripe fires payment_intent.succeeded webhook → stripe-webhook edge function
   └─ FIXED (Sprint v1): validates pi.amount === booking.total_amount × 100
   └─ Updates booking status to "confirmed", sets confirmed_at
```

---

## Step-by-Step Verification

| Step | What happens | Status | Confidence |
|------|-------------|--------|------------|
| 1 | Experience displayed with correct price | ✅ Works | HIGH |
| 2 | Booking row created in DB (status: pending) | ✅ Works | HIGH |
| 3 | Stripe PaymentIntent created with booking metadata | ✅ Works | HIGH |
| 4 | User ownership verified before payment intent | ✅ Fixed (Sprint v1) | HIGH |
| 5 | Amount validated before confirming booking | ✅ Fixed (Sprint v1) | HIGH |
| 6 | Stripe charge actually captures (not just authorizes) | ✅ Yes — PaymentElement with `mode: 'payment'` + `capture_method` defaults to immediate capture | HIGH |
| 7 | Booking status updated to "confirmed" in DB | ✅ Works via webhook | HIGH |
| 8 | User redirected to profile history | ✅ Works | HIGH |
| 9 | **Guest receives confirmation email** | ❌ NOT IMPLEMENTED | HIGH |
| 10 | **Provider receives booking notification** | ❌ NOT IMPLEMENTED | HIGH |
| 11 | **Provider confirms the booking** | ❌ NOT IMPLEMENTED | HIGH |

---

## Critical Gaps

### GAP 1 — No confirmation email to guest ❌
**Impact:** CRITICAL for trust. Guest has no record of booking except the DB row.
**Fix:** Send email via Resend when `payment_intent.succeeded` fires. See scaffold in `supabase/functions/stripe-webhook/index.ts`.
**Blocked by:** `RESEND_API_KEY` env var must be set. See `.env.example`.

### GAP 2 — No notification to experience provider ❌  
**Impact:** CRITICAL for reservation integrity. Vtopia processes payment but the venue/provider has no idea.
**Fix:** On `payment_intent.succeeded`, send email to provider with guest details, booking date/time, party size, and special requests.
**Provider email field:** The `experiences` table does not currently have a `provider_email` column. **Action required:** Add `provider_email TEXT` to experiences table, or store in a `providers` table.
**Blocked by:** Provider email addresses need to be collected and stored.

### GAP 3 — No provider confirmation mechanism ❌
**Impact:** HIGH. A real reservation is only honored if the provider sees and confirms it.
**Current state:** Vtopia confirms the booking unilaterally on payment — the provider has no input.
**Recommended fix:** Add `provider_confirmed_at TIMESTAMPTZ` column to bookings. Send provider a confirmation link email. When provider clicks link, set `provider_confirmed_at` and update booking status to `"provider_confirmed"`. Show this status to the guest on /profile.
**Workaround until implemented:** Treat every confirmed booking as "tentatively confirmed" and follow up by phone/email. Note this in the user-facing status.

### GAP 4 — No cancellation email ❌
**Impact:** MEDIUM. If `payment_intent.payment_failed`, booking is set to "cancelled" but guest hears nothing.
**Fix:** Send cancellation email in the `payment_intent.payment_failed` handler.

---

## Booking Status Flow (current)

```
pending → confirmed → completed (manual) → refunded (manual)
       ↘ cancelled (payment failed)
```

## Recommended Booking Status Flow

```
pending 
  → confirmed (Stripe webhook payment succeeds)
    → provider_confirmed (provider clicks confirm link in email)  ← NEW
      → completed (experience date has passed)
      → cancelled_by_provider (provider cancels)  ← NEW
  → cancelled (payment failed)
  → refunded (manual refund processed)
```

---

## Email Scaffold Status

A Resend email scaffold has been added to `supabase/functions/stripe-webhook/index.ts`.
It is **guarded by the `RESEND_API_KEY` env var** — if the key is not set, emails are skipped silently.

To activate:
1. Create a free account at resend.com
2. Add a verified sending domain (e.g. `notifications@vtopia.world`)
3. Get your API key
4. Add `RESEND_API_KEY=re_xxx` to Supabase edge function secrets:
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxx
   ```

---

## Immediate Actions Required (human)

1. **Add `provider_email` to experiences table** — run in Supabase SQL editor:
   ```sql
   ALTER TABLE public.experiences ADD COLUMN provider_email TEXT;
   ```
2. **Collect provider email addresses** for all active KC experiences
3. **Set up Resend account** and add API key to Supabase secrets
4. **Verify sending domain** in Resend (support@vtopia.world or notifications@vtopia.world)
5. **Test end-to-end booking** with a real Stripe test card to confirm emails fire
