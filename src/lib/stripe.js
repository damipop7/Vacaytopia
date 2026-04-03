import { loadStripe } from '@stripe/stripe-js'

// Stripe.js is loaded once and reused — never recreate it per render
let stripePromise = null

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}
