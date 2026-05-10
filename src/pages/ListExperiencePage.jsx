import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['Food & Drink', 'Outdoors', 'Nightlife', 'Sports', 'Arts & Culture', 'Wellness']

const TYPES = [
  { value: 'reservable',         label: 'Guided experience / tour (needs booking)' },
  { value: 'restaurant_reserve', label: 'Restaurant (sit-down, reservation recommended)' },
  { value: 'food_walkup',        label: 'Food / café (walk in, no reservation)' },
  { value: 'outdoor_free',       label: 'Outdoor (free, no entry fee)' },
  { value: 'outdoor_paid',       label: 'Outdoor attraction (entry fee)' },
  { value: 'cultural_free',      label: 'Museum / gallery (free admission)' },
  { value: 'cultural_paid',      label: 'Museum / attraction (paid admission)' },
  { value: 'nightlife_walkin',   label: 'Bar / lounge (walk in)' },
  { value: 'nightlife_ticketed', label: 'Live music / ticketed nightlife' },
  { value: 'shopping',           label: 'Shopping / market' },
  { value: 'sports_event',       label: 'Sporting event' },
  { value: 'transport',          label: 'Transportation / getting around' },
]

const EMPTY = {
  operator_name: '', operator_email: '', business_name: '',
  title: '', category: '', experience_type: '', price_per_person: '',
  description: '', duration_label: '', max_guests: '',
  website: '', booking_url: '',
}

export default function ListExperiencePage() {
  const [form, setForm]       = useState(EMPTY)
  const [status, setStatus]   = useState('idle') // idle | submitting | success | error
  const [errorMsg, setError]  = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('submitting')
    setError('')

    const { error } = await supabase
      .from('operator_submissions')
      .insert({
        operator_name:   form.operator_name.trim(),
        operator_email:  form.operator_email.trim().toLowerCase(),
        business_name:   form.business_name.trim(),
        title:           form.title.trim(),
        category:        form.category,
        experience_type: form.experience_type,
        price_per_person:form.price_per_person ? parseFloat(form.price_per_person) : null,
        description:     form.description.trim(),
        duration_label:  form.duration_label.trim() || null,
        max_guests:      form.max_guests ? parseInt(form.max_guests) : null,
        website:         form.website.trim() || null,
        booking_url:     form.booking_url.trim() || null,
      })

    if (error) {
      setStatus('error')
      setError('Something went wrong. Please try again or email us at support@vtopia.world.')
      return
    }

    setStatus('success')
  }

  if (status === 'success') return (
    <>
      <Helmet>
        <title>Submission received | Vtopia</title>
      </Helmet>
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="font-display font-black text-2xl text-[#0D1B3E] mb-3">You're on the list</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          We'll review your submission within 48 hours and reach out to{' '}
          <strong className="text-[#0D1B3E]">{form.operator_email}</strong> to confirm.
          During the World Cup, listings are free — no commission until after the tournament.
        </p>
        <button
          onClick={() => { setForm(EMPTY); setStatus('idle') }}
          className="btn-outline text-sm px-6"
        >
          Submit another experience
        </button>
      </div>
    </>
  )

  return (
    <>
      <Helmet>
        <title>List your KC experience | Vtopia — World Cup 2026</title>
        <meta name="description" content="List your Kansas City experience on Vtopia. Free during the 2026 FIFA World Cup. Reach 400,000+ international visitors." />
      </Helmet>

      <div style={{ background: 'var(--bg)' }}>
        <div className="max-w-2xl mx-auto px-6 py-12">

          {/* Header */}
          <div className="mb-10">
            <div className="inline-block bg-gold-brand text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
              🏆 FIFA World Cup 2026 — Kansas City
            </div>
            <h1 className="font-display font-black text-3xl text-[#0D1B3E] mb-3 leading-tight">
              List your experience on Vtopia
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
              Vtopia is the AI travel guide for World Cup visitors coming to Kansas City.
              We expect 400,000+ international visitors. Listings are{' '}
              <strong className="text-[#0D1B3E]">free during the tournament</strong> — no commission until after the World Cup.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              {['✓ Free to list', '✓ No commission during WC', '✓ Reviewed within 48 hrs', '✓ Cancel anytime'].map(t => (
                <span key={t} className="text-xs text-[#0D1B3E] bg-blue-tint border border-blue-brand/15 px-3 py-1 rounded-full font-medium">{t}</span>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Operator info */}
            <div className="bg-white rounded-card border border-blue-brand/10 p-6">
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-4">Your contact info</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Your name *</label>
                  <input
                    required className="input-field text-sm"
                    value={form.operator_name}
                    onChange={e => set('operator_name', e.target.value)}
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email address *</label>
                  <input
                    required type="email" className="input-field text-sm"
                    value={form.operator_email}
                    onChange={e => set('operator_email', e.target.value)}
                    placeholder="jane@yourbusiness.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Business name *</label>
                  <input
                    required className="input-field text-sm"
                    value={form.business_name}
                    onChange={e => set('business_name', e.target.value)}
                    placeholder="Taste of KC Tours"
                  />
                </div>
              </div>
            </div>

            {/* Experience details */}
            <div className="bg-white rounded-card border border-blue-brand/10 p-6">
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-4">Experience details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Experience title *</label>
                  <input
                    required className="input-field text-sm"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    placeholder="Guided BBQ & Jazz Tour of Kansas City"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Category *</label>
                    <select required className="input-field text-sm" value={form.category} onChange={e => set('category', e.target.value)}>
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Experience type *</label>
                    <select required className="input-field text-sm" value={form.experience_type} onChange={e => set('experience_type', e.target.value)}>
                      <option value="">Select type</option>
                      {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description * <span className="text-gray-400 font-normal">(2–4 sentences — what makes this special?)</span></label>
                  <textarea
                    required rows={4} className="input-field text-sm resize-none"
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    placeholder="Describe the experience from a visitor's perspective. What will they see, taste, or do? What makes it uniquely Kansas City?"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Price per person ($)</label>
                    <input
                      type="number" min="0" step="0.01" className="input-field text-sm"
                      value={form.price_per_person}
                      onChange={e => set('price_per_person', e.target.value)}
                      placeholder="0 if free"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Duration</label>
                    <input
                      className="input-field text-sm"
                      value={form.duration_label}
                      onChange={e => set('duration_label', e.target.value)}
                      placeholder="e.g. 3 hrs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Max group size</label>
                    <input
                      type="number" min="1" className="input-field text-sm"
                      value={form.max_guests}
                      onChange={e => set('max_guests', e.target.value)}
                      placeholder="e.g. 12"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="bg-white rounded-card border border-blue-brand/10 p-6">
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-4">Links</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Your website</label>
                  <input
                    type="url" className="input-field text-sm"
                    value={form.website}
                    onChange={e => set('website', e.target.value)}
                    placeholder="https://yourbusiness.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Booking / reservation link <span className="text-gray-400 font-normal">(OpenTable, Eventbrite, your own site, etc.)</span></label>
                  <input
                    type="url" className="input-field text-sm"
                    value={form.booking_url}
                    onChange={e => set('booking_url', e.target.value)}
                    placeholder="https://www.opentable.com/your-restaurant"
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                {errorMsg}
              </div>
            )}

            <div className="bg-blue-tint rounded-card p-4 text-xs text-gray-500 leading-relaxed">
              By submitting, you confirm this is your business and you have the right to list it. Vtopia reserves the right to review and approve all submissions. We may reach out to verify details before publishing.
            </div>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="btn-primary w-full py-3 text-base min-h-[52px] disabled:opacity-60"
            >
              {status === 'submitting' ? 'Submitting…' : 'Submit for review →'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
