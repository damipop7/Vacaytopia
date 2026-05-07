// supabase/functions/stripe-webhook/index.ts
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
//
// Listens for Stripe events and updates booking status in Supabase.
// Must be deployed with --no-verify-jwt since Stripe doesn't send a Supabase JWT.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Verify the webhook signature to confirm it came from Stripe
async function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(',')
    const timestamp = parts.find(p => p.startsWith('t='))?.slice(2)
    const v1 = parts.find(p => p.startsWith('v1='))?.slice(3)

    if (!timestamp || !v1) return false

    const payload = `${timestamp}.${body}`
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
    const computed = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    return computed === v1
  } catch {
    return false
  }
}

serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const body      = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''
  const secret    = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

  // Verify signature if webhook secret is set
  if (secret) {
    const valid = await verifyStripeSignature(body, signature, secret)
    if (!valid) {
      console.error('Invalid Stripe webhook signature')
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  let event: { type: string; data: { object: Record<string, unknown> } }
  try {
    event = JSON.parse(body)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log(`Webhook received: ${event.type}`)

  // ── Handle payment_intent.succeeded ─────────────────────────────
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as { id: string; amount?: number; metadata?: { booking_id?: string } }
    const bookingId = pi.metadata?.booking_id

    if (!bookingId) {
      console.error('No booking_id in PaymentIntent metadata')
      return new Response(JSON.stringify({ received: true, warning: 'No booking_id' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('total_amount, status, contact_name, contact_email, booking_reference, guest_count, booking_date, special_requests, experiences(title, provider_email)')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      console.error('Booking not found for id:', bookingId)
      return new Response(JSON.stringify({ received: true, warning: 'Booking not found' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const expectedAmount = Math.round(booking.total_amount * 100)
    if (pi.amount !== undefined && pi.amount !== expectedAmount) {
      console.error(`Amount mismatch for booking ${bookingId}: expected ${expectedAmount}, got ${pi.amount}`)
      return new Response(JSON.stringify({ received: true, warning: 'Amount mismatch — booking not confirmed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { error } = await supabase
      .from('bookings')
      .update({
        status:       'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (error) {
      console.error('Failed to confirm booking:', error.message)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`Booking ${bookingId} confirmed`)

    // ── Send confirmation emails via Resend (non-fatal if key not set) ──
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey && booking.contact_email) {
      const exp = (booking as any).experiences
      const expTitle = exp?.title ?? 'your experience'
      const providerEmail = exp?.provider_email

      // 1. Guest confirmation
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Vtopia <bookings@vtopia.world>',
          to: booking.contact_email,
          subject: `Booking confirmed — ${expTitle}`,
          html: `<h2>You're booked! 🎉</h2>
<p>Hi ${booking.contact_name},</p>
<p>Your booking for <strong>${expTitle}</strong> is confirmed.</p>
<ul>
  <li><strong>Reference:</strong> ${booking.booking_reference}</li>
  <li><strong>Date:</strong> ${booking.booking_date}</li>
  <li><strong>Guests:</strong> ${booking.guest_count}</li>
  <li><strong>Total paid:</strong> $${booking.total_amount}</li>
  ${booking.special_requests ? `<li><strong>Special requests:</strong> ${booking.special_requests}</li>` : ''}
</ul>
<p><strong>Cancellation policy:</strong> Cancel 24 hours before for a full refund. Contact <a href="mailto:support@vtopia.world">support@vtopia.world</a> with your reference number.</p>
<p>See you there! — The Vtopia team</p>`,
        }),
      }).catch(e => console.error('Guest email failed:', e))

      // 2. Provider notification
      if (providerEmail) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Vtopia Bookings <bookings@vtopia.world>',
            to: providerEmail,
            subject: `New Vtopia Booking — ${expTitle} — ${booking.booking_date}`,
            html: `<h2>New booking via Vtopia</h2>
<ul>
  <li><strong>Experience:</strong> ${expTitle}</li>
  <li><strong>Booking ref:</strong> ${booking.booking_reference}</li>
  <li><strong>Guest name:</strong> ${booking.contact_name}</li>
  <li><strong>Guest email:</strong> ${booking.contact_email}</li>
  <li><strong>Party size:</strong> ${booking.guest_count}</li>
  <li><strong>Date:</strong> ${booking.booking_date}</li>
  ${booking.special_requests ? `<li><strong>Special requests:</strong> ${booking.special_requests}</li>` : ''}
  <li><strong>Amount paid:</strong> $${booking.total_amount}</li>
</ul>
<p>Please reply to this email to confirm you have the reservation, or contact the guest directly at ${booking.contact_email}.</p>
<p>Questions? Contact <a href="mailto:support@vtopia.world">support@vtopia.world</a></p>`,
          }),
        }).catch(e => console.error('Provider email failed:', e))
      }
    }
  }

  // ── Handle payment_intent.payment_failed ────────────────────────
  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as { id: string; metadata?: { booking_id?: string } }
    const bookingId = pi.metadata?.booking_id

    if (bookingId) {
      await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)

      console.log(`Booking ${bookingId} cancelled due to payment failure`)
    }
  }

  // Always return 200 so Stripe doesn't retry
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
