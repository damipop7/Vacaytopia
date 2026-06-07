import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'npm:stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const ALLOWED_ORIGINS = new Set([
  'https://www.vtopia.world',
  'https://vtopia.world',
  'http://localhost:5173',
  'http://localhost:4173',
])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? ''
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : 'https://www.vtopia.world'
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

serve(async (req) => {
  const cors = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }
    const token = authHeader.slice(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const { bookingId } = await req.json()

    // Validate bookingId is a proper UUID before hitting the database
    if (!bookingId || !UUID_RE.test(bookingId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, experiences(title)')
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      // Generic message — don't reveal internal DB error details
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    if (booking.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    if (booking.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Booking already processed' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount:      Math.round(booking.total_amount * 100),
      currency:    'usd',
      description: `vtopia: ${booking.experiences.title}`,
      metadata: {
        booking_id: bookingId,
        experience: booking.experiences.title,
        user_id:    booking.user_id,
        commission: booking.commission.toString(),
      },
    })

    await supabase
      .from('bookings')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', bookingId)

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('create-payment-intent error:', err)
    return new Response(
      JSON.stringify({ error: 'Payment processing failed' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})
