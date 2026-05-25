import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const ROLES = [
  { value: 'owner',     label: 'Owner' },
  { value: 'manager',   label: 'General manager' },
  { value: 'marketing', label: 'Marketing / PR representative' },
  { value: 'other',     label: 'Other authorized representative' },
]

const EMPTY = {
  claimant_name: '', claimant_email: '', business_role: '',
  proof_website: '', proof_notes: '',
}

export default function ClaimExperiencePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const { data: exp, isLoading } = useQuery({
    queryKey: ['experience-claim', id],
    queryFn: async () => {
      // Uses a SECURITY DEFINER RPC so inactive experiences are also claimable
      const { data, error } = await supabase
        .rpc('get_experience_for_claim', { exp_id: id })
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const [form, setForm]     = useState(() => ({
    ...EMPTY,
    claimant_name:  profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : '',
    claimant_email: profile?.email ?? '',
  }))
  const [status, setStatus] = useState('idle')
  const [errorMsg, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')
    setError('')

    const { error } = await supabase
      .from('experience_claims')
      .insert({
        experience_id:  id,
        user_id:        profile?.id ?? null,
        claimant_name:  form.claimant_name.trim(),
        claimant_email: form.claimant_email.trim().toLowerCase(),
        business_role:  form.business_role,
        proof_website:  form.proof_website.trim() || null,
        proof_notes:    form.proof_notes.trim() || null,
      })

    if (error) {
      setStatus('error')
      setError('Something went wrong. Please try again or email us at support@vtopia.world.')
      return
    }

    setStatus('success')
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 border-2 border-blue-brand/20 border-t-blue-brand rounded-full animate-spin" />
    </div>
  )

  if (!exp) return (
    <div className="max-w-lg mx-auto px-6 py-20 text-center">
      <p className="text-gray-500 mb-4">Experience not found.</p>
      <button onClick={() => navigate('/browse')} className="btn-primary text-sm">Browse Experiences</button>
    </div>
  )

  if (status === 'success') return (
    <>
      <Helmet><title>Claim submitted | Vtopia</title></Helmet>
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-4">📋</div>
        <h1 className="font-display font-black text-2xl text-[#0D1B3E] mb-3">Claim submitted</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          We'll review your claim for <strong className="text-[#0D1B3E]">{exp.title}</strong> and
          reach out to <strong className="text-[#0D1B3E]">{form.claimant_email}</strong> within 3–5
          business days. We may ask for additional verification before granting ownership.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => navigate(`/experience/${id}`)} className="btn-primary text-sm px-6">
            Back to listing
          </button>
          <button onClick={() => navigate('/browse')} className="btn-outline text-sm px-6">
            Browse more
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <Helmet>
        <title>Claim {exp.title} | Vtopia</title>
        <meta name="description" content={`Claim ownership of ${exp.title} on Vtopia to manage your listing.`} />
      </Helmet>

      <div style={{ background: 'var(--bg)' }}>
        <div className="max-w-2xl mx-auto px-6 py-12">

          <button
            onClick={() => navigate(`/experience/${id}`)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-brand mb-8 transition-colors"
          >
            ← Back to listing
          </button>

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-tint border border-blue-brand/15 px-3 py-1.5 rounded-full mb-4">
              <span className="text-lg">{exp.image_emoji || '🏢'}</span>
              <span className="text-xs font-semibold text-blue-brand">{exp.title}</span>
              <span className="text-xs text-gray-400">· {exp.city}</span>
            </div>
            <h1 className="font-display font-black text-3xl text-[#0D1B3E] mb-3 leading-tight">
              Claim this listing
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
              If you own or manage this business, you can claim the listing to update details,
              respond to reviews, and get a verified owner badge. We manually review all claims
              to protect listing integrity.
            </p>

            {exp.is_claimed && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
                This listing has already been claimed. If you believe this is an error, contact us at{' '}
                <a href="mailto:support@vtopia.world" className="underline">support@vtopia.world</a>.
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Contact */}
            <div className="bg-white rounded-card border border-blue-brand/10 p-6">
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-4">Your contact info</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Full name *</label>
                  <input
                    required className="input-field text-sm"
                    value={form.claimant_name}
                    onChange={e => set('claimant_name', e.target.value)}
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Business email *</label>
                  <input
                    required type="email" className="input-field text-sm"
                    value={form.claimant_email}
                    onChange={e => set('claimant_email', e.target.value)}
                    placeholder="jane@yourbusiness.com"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Ideally matches the business domain.</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Your role *</label>
                  <select
                    required className="input-field text-sm"
                    value={form.business_role}
                    onChange={e => set('business_role', e.target.value)}
                  >
                    <option value="">Select your role</option>
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Proof */}
            <div className="bg-white rounded-card border border-blue-brand/10 p-6">
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-1">Verification proof</h2>
              <p className="text-xs text-gray-400 mb-4">Help us verify your connection to this business.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Business website</label>
                  <input
                    type="url" className="input-field text-sm"
                    value={form.proof_website}
                    onChange={e => set('proof_website', e.target.value)}
                    placeholder="https://yourbusiness.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Additional notes</label>
                  <textarea
                    rows={4} className="input-field text-sm resize-none"
                    value={form.proof_notes}
                    onChange={e => set('proof_notes', e.target.value)}
                    placeholder="E.g. I'm the listed owner on Google Business Profile, our EIN is on file, or other ways we can verify ownership…"
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
              Submitting a false claim is a violation of our{' '}
              <a href="/terms" className="underline text-blue-brand">terms of service</a> and may result in
              account suspension. We verify all claims manually before granting listing ownership.
            </div>

            <button
              type="submit"
              disabled={status === 'submitting' || exp.is_claimed}
              className="btn-primary w-full py-3 text-base min-h-[52px] disabled:opacity-60"
            >
              {status === 'submitting' ? 'Submitting…' : 'Submit ownership claim →'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
