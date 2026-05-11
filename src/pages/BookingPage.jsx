import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { useExperience } from '../hooks/useRecommendations'
import { useBookings } from '../hooks/useBookings'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

// Load Stripe once — never inside a component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const TIMES = ['7:00 AM','9:00 AM','11:00 AM','1:00 PM','4:00 PM ✨']
const GRADIENTS = {
  'ci-mia':'from-[#b2e8f8] to-[#7dd8f5]','ci-nyc':'from-[#c7d9f5] to-[#a8c4ef]',
  'ci-orl':'from-[#fde8b4] to-[#fbd580]','ci-lv':'from-[#ddd2f8] to-[#c4b0f3]',
  'ci-no':'from-[#b5e8d4] to-[#82d9b8]','ci-grn':'from-[#c8f0d4] to-[#9de3b4]',
}

// Stripe Elements appearance — matches Vtopia brand
const STRIPE_APPEARANCE = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#034694',
    colorBackground: '#ffffff',
    colorText: '#0D1B3E',
    colorDanger: '#dc2626',
    fontFamily: '"DM Sans", system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '9px',
  },
  rules: {
    '.Input': {
      border: '1px solid rgba(3,70,148,0.15)',
      boxShadow: 'none',
      padding: '10px 14px',
    },
    '.Input:focus': {
      border: '1px solid #034694',
      boxShadow: '0 0 0 3px rgba(3,70,148,0.08)',
    },
    '.Label': {
      fontWeight: '700',
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: '#7A8BAA',
      marginBottom: '6px',
    },
  },
}

// ── Inner payment form (must be inside <Elements>) ───────────────────
function StripePaymentForm({ total, onSuccess, onBack, bookingId }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handlePay() {
    if (!stripe || !elements) return
    setError('')
    setLoading(true)

    // 1. Validate the PaymentElement fields
    const { error: submitErr } = await elements.submit()
    if (submitErr) {
      setError(submitErr.message)
      setLoading(false)
      return
    }

    // 2. Fetch clientSecret from our edge function
    try {
      // getUser() forces a server-side token validation, ensuring the session
      // hasn't expired before we hit the payment edge function.
      const { data: { user: sessionUser }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !sessionUser) throw new Error('Session expired. Please sign in again.')
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ bookingId }),
        }
      )
      const data = await response.json()
      if (!response.ok || !data?.clientSecret) {
        throw new Error(data?.error || 'Could not initiate payment. Please try again.')
      }

      // 3. Confirm payment with Stripe
      const { error: confirmErr } = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: {
          // Stripe redirects here on 3DS — we handle it via return_url
          return_url: `${window.location.origin}/profile?tab=history`,
        },
        redirect: 'if_required', // Only redirect if 3DS is required
      })

      if (confirmErr) {
        setError(confirmErr.message)
        setLoading(false)
        return
      }

      // 4. Payment succeeded — advance to confirmation
      onSuccess()

    } catch (e) {
      setError(e.message || 'Payment failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-card border border-blue-brand/10 p-6">
        <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-4">Payment</h2>
        <div className="bg-blue-tint rounded-[9px] p-4 mb-5 text-sm text-blue-brand font-medium flex items-center gap-2">
          <span>🔒</span>
          <span>Payments processed securely by Stripe. vtopia never stores your card details.</span>
        </div>

        {/* Stripe's hosted PaymentElement — handles card, Apple Pay, Google Pay */}
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
          }}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-[9px] p-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-outline flex-1 text-sm">← Back</button>
        <button
          onClick={handlePay}
          disabled={loading || !stripe || !elements}
          className="btn-primary flex-2 disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed text-sm"
          style={{ flex: 2 }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing…
            </span>
          ) : (
            `🔒 Pay $${total.toFixed(2)}`
          )}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400">
        By paying you agree to our{' '}
        <a href="/privacy#terms" className="text-blue-brand">Terms</a>{' '}
        and{' '}
        <a href="/privacy#cancellation" className="text-blue-brand">Cancellation Policy</a>.
      </p>
    </div>
  )
}

// ── Main BookingPage ─────────────────────────────────────────────────
export default function BookingPage() {
  const { experienceId } = useParams()
  const navigate         = useNavigate()
  const location         = useLocation()
  const { user, profile, loading: authLoading } = useAuthStore()
  const { data: exp, isLoading } = useExperience(experienceId)
  const { createBooking } = useBookings()
  const prefillApplied   = useRef('')
  const errorRef         = useRef(null)

  const [step,    setStep]    = useState(1)
  const [date,    setDate]    = useState('')
  const [time,    setTime]    = useState('11:00 AM')
  const [adults,  setAdults]  = useState(2)
  const [contact, setContact] = useState({
    name: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim(),
    email: user?.email ?? '',
    phone: '',
    specialRequests: '',
  })
  const [booking,     setBooking]     = useState(null)  // Supabase booking row
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [shareCopied, setShareCopied] = useState(false)

  const today     = new Date().toISOString().split('T')[0]
  const total     = exp ? exp.price_per_person * adults : 0
  const grad      = exp ? (GRADIENTS[exp.image_gradient] || GRADIENTS['ci-mia']) : ''
  const maxGuests = exp ? Math.min(Number(exp.max_guests) || 8, 20) : 8

  useEffect(() => {
    if (!exp) return
    const key = `${experienceId}:${location.key}`
    if (prefillApplied.current === key) return
    const st = location.state
    if (!st || typeof st !== 'object') { prefillApplied.current = key; return }
    if (typeof st.guests === 'number') setAdults(Math.min(Math.max(1, st.guests), maxGuests))
    if (st.date) setDate(st.date)
    if (st.time) setTime(st.time)
    prefillApplied.current = key
  }, [exp, experienceId, location.key, location.state, maxGuests])

  useEffect(() => {
    if (!exp) return
    setAdults(a => Math.min(a, maxGuests))
  }, [exp, maxGuests])

  useEffect(() => {
    if (error && errorRef.current) errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [error])

  const STEPS = ['Details', 'Booking', 'Payment', 'Confirmed']
  const bumpAdults = (delta) => setAdults(a => Math.min(maxGuests, Math.max(1, a + delta)))
  const [editingDetails, setEditingDetails] = useState(!location.state?.date)

  const copyBookingSummary = useCallback(() => {
    const lines = [
      `vtopia booking — ${exp?.title}`,
      `${exp?.city} · ${date} · ${time}`,
      `${adults} guests · $${total.toFixed(2)}`,
      booking?.booking_reference ? `Ref: ${booking.booking_reference}` : '',
    ].filter(Boolean)
    void navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 2200)
    })
  }, [exp, date, time, adults, total, booking?.booking_reference])

  // Called when user clicks "Continue to Payment" on step 2
  // Creates the booking row in Supabase (status: pending), then advances to step 3
  const handleContinueToPayment = async () => {
    if (!date) return setError('Please select a date.')
    setError('')
    setLoading(true)
    try {
      const b = await createBooking.mutateAsync({
        experienceId,
        date,
        time,
        guests: adults,
        contactDetails: contact,
      })
      setBooking(b)
      setStep(3)
    } catch (e) {
      setError(e.message || 'Could not create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Called by StripePaymentForm after stripe.confirmPayment() succeeds
  const handlePaymentSuccess = () => {
    setStep(4)
  }

  if (authLoading || isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg)' }}>
      <div className="w-10 h-10 border-2 border-blue-brand/20 border-t-blue-brand rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Loading your booking…</p>
    </div>
  )

  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />

  if (!exp) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500 text-sm">Experience not found.</p>
      <button onClick={() => navigate('/browse')} className="btn-primary">Back to Browse</button>
    </div>
  )

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen">

      {/* ── Step bar ── */}
      <div className="bg-white border-b border-blue-brand/10 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i+1 < step  ? 'bg-[#10b981] text-white' :
                  i+1 === step ? 'bg-blue-brand text-white' :
                                 'bg-blue-tint text-gray-400'
                }`}>
                  {i+1 < step ? '✓' : i+1}
                </div>
                <span className={`text-xs font-semibold ${
                  i+1 === step ? 'text-blue-brand' :
                  i+1 < step   ? 'text-[#10b981]' :
                                  'text-gray-300'
                }`}>{s}</span>
              </div>
              {i < STEPS.length-1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i+1 < step ? 'bg-[#10b981]' : 'bg-blue-tint'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">

          {/* ── LEFT — steps ── */}
          <div>

            {/* STEP 1 — Details */}
            {step === 1 && (
              <div>
                <div className={`h-48 rounded-card bg-gradient-to-br ${grad} flex items-center justify-center mb-5`}>
                  <span style={{ fontSize: 64 }}>{exp.image_emoji}</span>
                </div>
                <div className="bg-white rounded-card border border-blue-brand/10 p-6 mb-4">
                  <h1 className="font-display font-black text-2xl text-[#0D1B3E] mb-2">{exp.title}</h1>
                  <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap mb-4">
                    <span>📍 {exp.city}</span><span>·</span><span>⏱ {exp.duration_label}</span>
                    {exp.rating > 0 && (
                      <><span>·</span><span className="text-gold-brand font-semibold">★ {exp.rating} ({exp.review_count?.toLocaleString()})</span></>
                    )}
                  </div>
                  {exp.description && <p className="text-sm text-gray-500 leading-relaxed">{exp.description}</p>}
                </div>
                {exp.what_is_included?.length > 0 && (
                  <div className="bg-white rounded-card border border-blue-brand/10 p-6 mb-4">
                    <h3 className="font-display font-bold text-base text-[#0D1B3E] mb-3">What's included</h3>
                    <div className="space-y-2">
                      {exp.what_is_included.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-4 h-4 rounded-full bg-[#d1fae5] text-[#065f46] flex items-center justify-center text-[10px] font-bold flex-shrink-0">✓</div>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={() => setStep(2)} className="btn-primary w-full">Reserve Now →</button>
              </div>
            )}

            {/* STEP 2 — Booking details */}
            {step === 2 && (
              <div className="space-y-4">
                {!editingDetails ? (
                  <div className="bg-white rounded-card border border-blue-brand/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display font-bold text-lg text-[#0D1B3E]">Your selections</h2>
                      <button type="button" onClick={() => setEditingDetails(true)}
                        className="text-xs font-semibold text-blue-brand hover:underline">Change</button>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">📅 Date</span>
                        <span className="font-semibold text-[#0D1B3E]">{date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">🕐 Time</span>
                        <span className="font-semibold text-[#0D1B3E]">{time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">👥 Guests</span>
                        <span className="font-semibold text-[#0D1B3E]">{adults} adult{adults !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-card border border-blue-brand/10 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display font-bold text-lg text-[#0D1B3E]">Choose a date</h2>
                        {date && <button type="button" onClick={() => setEditingDetails(false)}
                          className="text-xs font-semibold text-blue-brand hover:underline">Done</button>}
                      </div>
                      <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)} className="input-field" />
                    </div>
                    <div className="bg-white rounded-card border border-blue-brand/10 p-6">
                      <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-4">Pick a time</h2>
                      <div className="grid grid-cols-3 gap-2">
                        {TIMES.map(t => (
                          <button key={t} onClick={() => setTime(t)}
                            className={`py-2.5 px-3 rounded-[9px] text-sm font-semibold border transition-all ${
                              time === t
                                ? 'bg-blue-brand text-white border-blue-brand'
                                : 'border-blue-brand/15 text-gray-500 hover:border-blue-brand hover:text-blue-brand'
                            }`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-card border border-blue-brand/10 p-6">
                      <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-4">Guests</h2>
                      <div className="flex items-center justify-between">
                        <div><div className="font-semibold text-sm">Adults</div><div className="text-xs text-gray-400">Ages 13+</div></div>
                        <div className="flex items-center gap-4">
                          <button type="button" onClick={() => bumpAdults(-1)} disabled={adults <= 1}
                            className="w-8 h-8 rounded-full border border-blue-brand/20 text-blue-brand font-bold hover:bg-blue-tint transition-colors disabled:opacity-35 disabled:cursor-not-allowed">−</button>
                          <span className="font-bold text-lg w-6 text-center">{adults}</span>
                          <button type="button" onClick={() => bumpAdults(1)} disabled={adults >= maxGuests}
                            className="w-8 h-8 rounded-full border border-blue-brand/20 text-blue-brand font-bold hover:bg-blue-tint transition-colors disabled:opacity-35 disabled:cursor-not-allowed">+</button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <div className="bg-white rounded-card border border-blue-brand/10 p-6">
                  <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-4">Contact details</h2>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">Name</label>
                      <input className="input-field text-sm" value={contact.name} onChange={e => setContact(c => ({ ...c, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">Email</label>
                      <input className="input-field text-sm" type="email" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">Special requests</label>
                    <textarea className="input-field text-sm resize-none" rows={2} placeholder="Dietary needs, accessibility..."
                      value={contact.specialRequests} onChange={e => setContact(c => ({ ...c, specialRequests: e.target.value }))} />
                  </div>
                </div>
                {error && (
                  <div ref={errorRef} role="alert" className="bg-red-50 border border-red-300 text-red-700 rounded-[9px] p-3 text-sm flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0">⚠</span>
                    <span>{error}</span>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => { setStep(1); setError('') }} className="btn-outline flex-1 text-sm">← Back</button>
                  <button
                    onClick={() => {
                      if (!date) { setError('Please select a date before continuing.'); return }
                      if (!contact.name.trim()) { setError('Please enter your name.'); return }
                      if (!contact.email.trim()) { setError('Please enter your email.'); return }
                      handleContinueToPayment()
                    }}
                    disabled={loading}
                    className="btn-primary text-sm"
                    style={{
                      flex: 2,
                      opacity: (!date || !contact.name || !contact.email) ? 0.5 : 1,
                      cursor: (!date || !contact.name || !contact.email) ? 'not-allowed' : 'pointer',
                      pointerEvents: loading ? 'none' : 'auto',
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating booking…
                      </span>
                    ) : !date ? 'Select a date to continue' : 'Continue to Payment →'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — Real Stripe payment */}
            {step === 3 && booking && (
              <Elements
                stripe={stripePromise}
                options={{
                  mode: 'payment',
                  amount: Math.round(total * 100), // cents
                  currency: 'usd',
                  appearance: STRIPE_APPEARANCE,
                }}
              >
                <StripePaymentForm
                  total={total}
                  bookingId={booking.id}
                  onSuccess={handlePaymentSuccess}
                  onBack={() => setStep(2)}
                />
              </Elements>
            )}

            {/* STEP 4 — Confirmation */}
            {step === 4 && (
              <div className="bg-white rounded-card border border-blue-brand/10 p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-[#d1fae5] flex items-center justify-center text-4xl mx-auto mb-5"
                  style={{ borderWidth: 3, borderColor: '#10b981', border: '3px solid #10b981' }}>🎉</div>
                <h1 className="font-display font-black text-3xl text-[#0D1B3E] mb-2">You're booked!</h1>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  Your <strong className="text-[#0D1B3E]">{exp.title}</strong> in {exp.city} is confirmed.
                  We've sent a receipt to <strong className="text-blue-brand">{contact.email}</strong>.
                </p>
                <div className="max-w-sm mx-auto text-left text-xs text-gray-500 space-y-2 mb-6">
                  <div className="flex items-center gap-2"><span className="text-[#10b981] font-bold">✓</span> Payment received</div>
                  <div className="flex items-center gap-2"><span className="text-[#10b981] font-bold">✓</span> Confirmation emailed</div>
                  <div className="flex items-center gap-2"><span className="text-blue-brand font-bold">◷</span> Host may follow up with meeting details</div>
                </div>
                <div className="bg-gray-50 rounded-[9px] border border-blue-brand/8 p-5 mb-6 mx-auto max-w-sm">
                  {[
                    ['Experience', exp.title],
                    ['Location',   exp.city],
                    ['Date & Time', `${date} · ${time}`],
                    ['Guests',     `${adults} adult${adults !== 1 ? 's' : ''}`],
                    ['Amount paid', `$${total.toFixed(2)}`],
                    ['Booking ref', booking?.booking_reference || 'VT-PENDING'],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between py-2 border-b border-blue-brand/6 last:border-0">
                      <span className="text-xs text-gray-400">{l}</span>
                      <span className={`text-xs font-semibold ${
                        l === 'Amount paid'  ? 'text-blue-brand font-display text-sm' :
                        l === 'Booking ref'  ? 'font-mono text-blue-brand bg-blue-tint px-2 py-0.5 rounded' :
                                               'text-[#0D1B3E]'
                      }`}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button type="button" onClick={() => navigate('/profile', { state: { tab: 'history' } })} className="btn-primary text-sm w-full sm:w-auto">
                    View in My trips
                  </button>
                  <button type="button" onClick={copyBookingSummary} className="btn-outline text-sm w-full sm:w-auto">
                    {shareCopied ? '✓ Copied summary' : 'Share trip summary'}
                  </button>
                  <button type="button" onClick={() => navigate('/browse')} className="text-sm font-semibold text-blue-brand hover:underline">
                    Explore more
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT — sticky summary ── */}
          {step < 4 && (
            <div className="sticky top-20">
              <div className="bg-white rounded-card border border-blue-brand/10 p-5 shadow-sm">
                <div className="flex gap-3 items-center mb-4 pb-4 border-b border-blue-brand/8">
                  <div className={`w-12 h-12 rounded-[9px] bg-gradient-to-br ${grad} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {exp.image_emoji}
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-[#0D1B3E] leading-tight">{exp.title}</div>
                    <div className="text-xs text-gray-400">{exp.city} · ★ {exp.rating}</div>
                  </div>
                </div>
                <div className="flex justify-between py-1.5 text-xs items-start gap-2">
                  <span className="text-gray-400 flex-shrink-0">📅 Date</span>
                  <span className="font-medium text-[#0D1B3E] text-right">{date || 'Not selected'}</span>
                </div>
                <div className="flex justify-between py-1.5 text-xs items-center gap-2">
                  <span className="text-gray-400 flex-shrink-0">🕐 Time</span>
                  <span className="font-medium text-[#0D1B3E] text-right">{time}</span>
                </div>
                <div className="flex justify-between py-1.5 text-xs items-center gap-2">
                  <span className="text-gray-400 flex-shrink-0">👥 Guests</span>
                  <span className="font-medium text-[#0D1B3E]">{adults} adult{adults !== 1 ? 's' : ''}</span>
                </div>
                <div className="border-t border-blue-brand/8 mt-3 pt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">${exp.price_per_person} × {adults} guests</span>
                    <span className="font-medium">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-3">
                    <span className="text-gray-400">Booking fee</span>
                    <span className="font-medium text-[#10b981]">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-sm text-[#0D1B3E]">Total</span>
                    <span className="font-display font-black text-xl text-blue-brand">${total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-blue-brand/8">
                  {['🔒 SSL', '✓ Free cancel', '🛡 GDPR'].map(t => (
                    <span key={t} className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
