// supabase/functions/create-payment-intent/index.ts
// Deploy with: supabase functions deploy create-payment-intent
//
// This Edge Function runs server-side so your Stripe SECRET key
// never touches the browser.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SERVICE_ROLE_KEY') ?? ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bookingId } = await req.json()

    // 1. Fetch the booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, experiences(title)')
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (booking.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Booking already processed' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(booking.total_amount * 100), // cents
      currency: 'usd',
      metadata: {
        booking_id:    bookingId,
        experience:    booking.experiences.title,
        user_id:       booking.user_id,
        commission:    booking.commission.toString(),
      },
      description: `vtopia: ${booking.experiences.title}`,
    })

    // 3. Save the PaymentIntent id to the booking
    await supabase
      .from('bookings')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', bookingId)

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
