import { useState, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { QUIZ_CITIES } from '../lib/travelQuiz'

const LANGUAGES  = ['English', 'Spanish', 'French', 'Portuguese', 'German', 'Italian', 'Arabic', 'Mandarin', 'Japanese', 'Korean']
const SPECIALTIES = ['Food & Drink', 'Outdoors & Nature', 'Nightlife', 'Sports & Games', 'Arts & Culture', 'Wellness', 'History', 'Shopping', 'Sports Tourism', 'FIFA / Soccer']

const EMPTY = {
  first_name: '', last_name: '', email: '',
  city: 'Kansas City', bio: '',
  experience_years: '', instagram: '', website: '', why_vtopia: '',
  rate_text: '',
  languages: [], specialties: [],
  photo: null,           // File object
  photoPreview: null,    // local object URL
  consent: false,
}

function Toggle({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
        checked
          ? 'bg-blue-brand text-white border-blue-brand'
          : 'bg-white text-gray-500 border-gray-200 hover:border-blue-brand hover:text-blue-brand'
      }`}
    >
      {label}
    </button>
  )
}

export default function BecomeAGuidePage() {
  const { profile } = useAuthStore()
  const fileRef = useRef(null)
  const [form, setForm]   = useState(() => ({
    ...EMPTY,
    email:      profile?.email ?? '',
    first_name: profile?.full_name?.split(' ')[0] ?? '',
    last_name:  profile?.full_name?.split(' ').slice(1).join(' ') ?? '',
  }))
  const [status, setStatus]   = useState('idle')
  const [errorMsg, setError]  = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function toggleArray(key, value) {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(value)
        ? f[key].filter(x => x !== value)
        : [...f[key], value],
    }))
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (form.photoPreview) URL.revokeObjectURL(form.photoPreview)
    setForm(f => ({ ...f, photo: file, photoPreview: URL.createObjectURL(file) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.languages.length === 0) {
      setError('Please select at least one language.')
      return
    }
    if (!form.consent) {
      setError('Please confirm you consent to a background check.')
      return
    }
    setStatus('submitting')
    setError('')

    // Upload photo to Supabase Storage if provided
    let avatarUrl = null
    if (form.photo) {
      const ext  = form.photo.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('guide-avatars')
        .upload(path, form.photo, { contentType: form.photo.type })
      if (!upErr) {
        avatarUrl = supabase.storage.from('guide-avatars').getPublicUrl(path).data.publicUrl
      }
    }

    const { error } = await supabase
      .from('guide_applications')
      .insert({
        user_id:                   profile?.id ?? null,
        first_name:                form.first_name.trim(),
        last_name:                 form.last_name.trim(),
        email:                     form.email.trim().toLowerCase(),
        city:                      form.city,
        bio:                       form.bio.trim(),
        languages:                 form.languages,
        specialties:               form.specialties,
        experience_years:          form.experience_years ? parseInt(form.experience_years) : null,
        instagram:                 form.instagram.trim() || null,
        website:                   form.website.trim() || null,
        why_vtopia:                form.why_vtopia.trim() || null,
        rate_text:                 form.rate_text.trim() || null,
        avatar_url:                avatarUrl,
        background_check_consent:  true,
      })

    if (error) {
      setStatus('error')
      setError('Something went wrong. Please try again or email us at guides@vtopia.world.')
      return
    }

    setStatus('success')
  }

  if (status === 'success') return (
    <>
      <Helmet><title>Application received | Vtopia</title></Helmet>
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="font-display font-black text-2xl text-[#0D1B3E] mb-3">Application received!</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          We'll review your application within 3–5 business days and reach out to{' '}
          <strong className="text-[#0D1B3E]">{form.email}</strong> with next steps.
          During the World Cup, guide spots are limited — we'll prioritize local KC experts.
        </p>
        <button
          onClick={() => { setForm(EMPTY); setStatus('idle') }}
          className="btn-outline text-sm px-6"
        >
          Submit another application
        </button>
      </div>
    </>
  )

  const activeCities = QUIZ_CITIES.filter(c => c.value !== 'all')

  return (
    <>
      <Helmet>
        <title>Become a Guide | Vtopia — World Cup 2026</title>
        <meta name="description" content="Share your Kansas City expertise with 400,000+ World Cup visitors. Apply to become a Vtopia guide." />
      </Helmet>

      <div style={{ background: 'var(--bg)' }}>
        <div className="max-w-2xl mx-auto px-6 py-12">

          {/* Header */}
          <div className="mb-10">
            <div className="inline-block bg-gold-brand text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
              🏆 FIFA World Cup 2026 — Kansas City
            </div>
            <h1 className="font-display font-black text-3xl text-[#0D1B3E] mb-3 leading-tight">
              Become a Vtopia guide
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
              Share your local expertise with 400,000+ international visitors coming to Kansas City.
              Guides earn a commission on every booking made through their profile and experiences.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              {['✓ Earn per booking', '✓ Set your own schedule', '✓ Free to join', '✓ Reviewed in 3–5 days'].map(t => (
                <span key={t} className="text-xs text-[#0D1B3E] bg-blue-tint border border-blue-brand/15 px-3 py-1 rounded-full font-medium">{t}</span>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Photo */}
            <div className="bg-white rounded-card border border-blue-brand/10 p-6">
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-1">Profile photo</h2>
              <p className="text-xs text-gray-400 mb-4">Optional — helps visitors and our team put a face to the name.</p>
              <div className="flex items-center gap-4">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-full border-2 border-dashed border-blue-brand/25 flex items-center justify-center cursor-pointer hover:border-blue-brand hover:bg-blue-tint transition-all overflow-hidden flex-shrink-0"
                >
                  {form.photoPreview
                    ? <img src={form.photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    : <span className="text-2xl">📷</span>
                  }
                </div>
                <div>
                  <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline text-xs px-4 py-2">
                    {form.photo ? 'Change photo' : 'Upload photo'}
                  </button>
                  <p className="text-[11px] text-gray-400 mt-1.5">JPG or PNG, max 5 MB</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>

            {/* Contact info */}
            <div className="bg-white rounded-card border border-blue-brand/10 p-6">
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-4">Your info</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">First name *</label>
                  <input
                    required className="input-field text-sm"
                    value={form.first_name}
                    onChange={e => set('first_name', e.target.value)}
                    placeholder="Alex"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Last name *</label>
                  <input
                    required className="input-field text-sm"
                    value={form.last_name}
                    onChange={e => set('last_name', e.target.value)}
                    placeholder="Johnson"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email address *</label>
                  <input
                    required type="email" className="input-field text-sm"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="alex@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Guide profile */}
            <div className="bg-white rounded-card border border-blue-brand/10 p-6">
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-4">Your guide profile</h2>
              <div className="space-y-4">

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">City you guide in *</label>
                  <select
                    required className="input-field text-sm"
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                  >
                    {activeCities.map(c => (
                      <option key={c.value} value={c.value}>{c.value}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Bio * <span className="text-gray-400 font-normal">(2–4 sentences — what makes you the right guide?)</span>
                  </label>
                  <textarea
                    required rows={4} className="input-field text-sm resize-none"
                    value={form.bio}
                    onChange={e => set('bio', e.target.value)}
                    placeholder="KC native, food obsessed. I've spent 10 years finding the best BBQ joints, jazz spots, and hidden neighborhood gems that most tourists miss…"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Years of guiding / hosting experience</label>
                    <input
                      type="number" min="0" max="50" className="input-field text-sm"
                      value={form.experience_years}
                      onChange={e => set('experience_years', e.target.value)}
                      placeholder="e.g. 3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Your rate *</label>
                    <input
                      required className="input-field text-sm"
                      value={form.rate_text}
                      onChange={e => set('rate_text', e.target.value)}
                      placeholder="e.g. $75/person, $150/hr"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">What you typically charge per person or per hour.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Languages spoken *</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map(lang => (
                      <Toggle
                        key={lang}
                        label={lang}
                        checked={form.languages.includes(lang)}
                        onChange={() => toggleArray('languages', lang)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Your specialties</label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES.map(spec => (
                      <Toggle
                        key={spec}
                        label={spec}
                        checked={form.specialties.includes(spec)}
                        onChange={() => toggleArray('specialties', spec)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="bg-white rounded-card border border-blue-brand/10 p-6">
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-4">Links <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Instagram handle</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                    <input
                      className="input-field text-sm pl-8"
                      value={form.instagram}
                      onChange={e => set('instagram', e.target.value)}
                      placeholder="yourusername"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Personal website</label>
                  <input
                    type="url" className="input-field text-sm"
                    value={form.website}
                    onChange={e => set('website', e.target.value)}
                    placeholder="https://yoursite.com"
                  />
                </div>
              </div>
            </div>

            {/* Why Vtopia */}
            <div className="bg-white rounded-card border border-blue-brand/10 p-6">
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-1">Why do you want to guide with Vtopia?</h2>
              <p className="text-xs text-gray-400 mb-4">Optional — but it helps us understand your motivation.</p>
              <textarea
                rows={3} className="input-field text-sm resize-none"
                value={form.why_vtopia}
                onChange={e => set('why_vtopia', e.target.value)}
                placeholder="I want to share the real KC with World Cup visitors and give them a genuine local experience…"
              />
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                {errorMsg}
              </div>
            )}

            {/* Background check consent */}
            <div className="bg-white rounded-card border border-blue-brand/10 p-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={e => set('consent', e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-brand flex-shrink-0"
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  <strong className="text-[#0D1B3E]">I consent to a background check.</strong>{' '}
                  I understand that Vtopia requires all guides to pass a background check before being approved.
                  This is to ensure the safety of visitors booking through the platform.
                </span>
              </label>
              <p className="text-xs text-gray-400 mt-3 pl-7">
                By submitting, you also confirm all information is accurate and agree to our{' '}
                <a href="/terms" className="underline text-blue-brand">guide terms of service</a>.
              </p>
            </div>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="btn-primary w-full py-3 text-base min-h-[52px] disabled:opacity-60"
            >
              {status === 'submitting' ? 'Submitting…' : 'Apply to be a guide →'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
