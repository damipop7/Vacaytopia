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
      .select('total_amount, status')
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
