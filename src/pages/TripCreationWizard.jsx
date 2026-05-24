import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCreateTrip } from '../hooks/useTrip'

// Map quiz traveler type → wizard traveler count
const TRAVELER_FROM_TYPE = { solo: 2, couple: 2, friends: 4, family: 4 }

const TRAVELER_OPTIONS = [
  { id: 2,   label: '2 travelers' },
  { id: 3,   label: '3 travelers' },
  { id: 4,   label: '4 travelers' },
  { id: 5,   label: '5 travelers' },
  { id: 6,   label: '6+ travelers' },
]

const BUDGET_OPTIONS = [
  { id: 'budget',  label: 'Budget',     range: '$100–200/day', desc: 'Hostels, street food, free attractions' },
  { id: 'mid',     label: 'Mid-Range',  range: '$200–350/day', desc: 'Hotels, restaurants, paid experiences'  },
  { id: 'premium', label: 'Premium',    range: '$350–500/day', desc: 'Boutique hotels, fine dining, VIP access' },
]

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
            ${i < current  ? 'bg-blue-600 text-white' :
              i === current ? 'bg-blue-600 text-white ring-4 ring-blue-500/30' :
              'bg-white/10 text-white/40'}`}
          >
            {i < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && <div className={`flex-1 h-px ${i < current ? 'bg-blue-600' : 'bg-white/10'} w-8`} />}
        </div>
      ))}
    </div>
  )
}

function Step1Basics({ form, setForm }) {
  const today = new Date().toISOString().split('T')[0]
  const suggestedTitle = form.startDate
    ? `KC Trip — ${new Date(form.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    : 'KC World Cup Weekend'

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="text-white/60 text-sm mb-1.5 block">Trip name</label>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder={suggestedTitle}
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/60 text-sm"
        />
      </div>

      <div>
        <label className="text-white/60 text-sm mb-1.5 block">Destination</label>
        <div className="px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white/50 text-sm flex items-center gap-2">
          📍 Kansas City <span className="text-white/25 text-xs ml-auto">Only city available for WC 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-white/60 text-sm mb-1.5 block">Start date</label>
          <input
            type="date"
            min={today}
            value={form.startDate}
            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-blue-500/60"
          />
        </div>
        <div>
          <label className="text-white/60 text-sm mb-1.5 block">End date</label>
          <input
            type="date"
            min={form.startDate || today}
            value={form.endDate}
            onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-blue-500/60"
          />
        </div>
      </div>

      <div>
        <label className="text-white/60 text-sm mb-2 block">Number of travelers</label>
        <div className="flex gap-2 flex-wrap">
          {TRAVELER_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setForm(f => ({ ...f, travelers: opt.id }))}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                form.travelers === opt.id
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-white/5 border-white/15 text-white/60 hover:border-white/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step2Budget({ form, setForm }) {
  const perPerson = form.totalBudget && form.travelers
    ? Math.round(parseInt(form.totalBudget, 10) / form.travelers)
    : null

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="text-white/60 text-sm mb-2 block">Budget level</label>
        <div className="flex flex-col gap-2">
          {BUDGET_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setForm(f => ({ ...f, budgetTier: opt.id }))}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition ${
                form.budgetTier === opt.id
                  ? 'bg-blue-600/15 border-blue-500/50'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex-1">
                <div className="font-semibold text-sm text-white">{opt.label}</div>
                <div className="text-white/40 text-xs mt-0.5">{opt.desc}</div>
              </div>
              <span className="text-white/50 text-sm font-mono">{opt.range}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-white/60 text-sm mb-1.5 block">
          Total trip budget <span className="text-white/30">(optional — leave blank to skip)</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
          <input
            type="number"
            min="0"
            step="50"
            value={form.totalBudget}
            onChange={e => setForm(f => ({ ...f, totalBudget: e.target.value }))}
            placeholder="500"
            className="w-full bg-white/5 border border-white/15 rounded-xl pl-8 pr-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/60 text-sm"
          />
        </div>
        {perPerson && (
          <p className="text-white/40 text-xs mt-1.5">≈ ${perPerson} per person ({form.travelers} travelers)</p>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="text-white/60 text-sm mb-2">Budget collection</div>
        <div className="flex flex-col gap-2">
          {[
            { id: 'pledge', label: 'Track pledges in app', desc: 'Members commit amounts, no payment taken' },
            { id: 'separate', label: 'Handle money separately', desc: 'Venmo, bank transfer, etc.' },
          ].map(opt => (
            <label key={opt.id} className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="budgetMethod"
                value={opt.id}
                checked={form.budgetMethod === opt.id}
                onChange={() => setForm(f => ({ ...f, budgetMethod: opt.id }))}
                className="mt-0.5 accent-blue-500"
              />
              <div>
                <div className="text-sm text-white font-medium">{opt.label}</div>
                <div className="text-white/40 text-xs">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step3Invite({ trip }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/trips/join/${trip.share_token}`

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function shareViaWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Join my trip on Vtopia! ${shareUrl}`)}`, '_blank', 'noopener')
  }

  function shareViaEmail() {
    window.location.href = `mailto:?subject=${encodeURIComponent(`Join my trip: ${trip.title}`)}&body=${encodeURIComponent(`Hey!\n\nI'm planning a trip to Kansas City and would love for you to join. Click here to see the details and join:\n\n${shareUrl}\n\nSee you there!`)}`
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center mb-2">
        <div className="text-4xl mb-2">🎉</div>
        <h3 className="text-xl font-bold text-white mb-1">"{trip.title}" is live!</h3>
        <p className="text-white/50 text-sm">Invite your travel crew via the link below.</p>
      </div>

      <div>
        <label className="text-white/60 text-sm mb-1.5 block">Share link</label>
        <div className="flex gap-2">
          <div className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white/60 text-sm truncate font-mono">
            {shareUrl}
          </div>
          <button
            type="button"
            onClick={copyLink}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition flex-shrink-0"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div>
        <label className="text-white/60 text-sm mb-2 block">Share via</label>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={shareViaWhatsApp}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600/20 border border-green-500/30 hover:bg-green-600/30 rounded-xl text-sm font-semibold text-green-400 transition"
          >
            📱 WhatsApp
          </button>
          <button
            type="button"
            onClick={shareViaEmail}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/15 hover:bg-white/10 rounded-xl text-sm font-semibold text-white/70 transition"
          >
            ✉️ Email
          </button>
        </div>
      </div>

      <p className="text-white/30 text-xs text-center">
        Anyone with this link can join your trip. You can turn this off in trip settings.
      </p>
    </div>
  )
}

const STEPS = ['Basics', 'Budget', 'Invite']

export default function TripCreationWizard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { mutate: createTrip, isPending, error } = useCreateTrip()

  const prefill = location.state?.prefill ?? {}

  const [step, setStep] = useState(0)
  const [createdTrip, setCreatedTrip] = useState(null)
  const [form, setForm] = useState({
    title:        prefill.title       ?? '',
    startDate:    prefill.startDate   ?? '',
    endDate:      prefill.endDate     ?? '',
    travelers:    prefill.travelers   ?? 2,
    budgetTier:   prefill.budgetTier  ?? 'mid',
    totalBudget:  '',
    budgetMethod: 'pledge',
  })

  const isStep1Valid = !!form.title.trim()
  const isStep2Valid = true // budget is optional

  function handleNext() {
    if (step === 0 && !isStep1Valid) return
    if (step === 1) {
      const totalCents = form.totalBudget ? Math.round(parseFloat(form.totalBudget) * 100) : 0
      createTrip(
        {
          title: form.title.trim(),
          destination: 'Kansas City',
          startDate: form.startDate || null,
          endDate:   form.endDate   || null,
          tripType: form.travelers > 1 ? 'group' : 'solo',
          totalBudgetCents: totalCents,
        },
        {
          onSuccess: (trip) => {
            setCreatedTrip(trip)
            setStep(2)
          },
        }
      )
      return
    }
    setStep(s => s + 1)
  }

  function handleBack() {
    if (step === 0) { navigate(-1); return }
    if (step === 2) { navigate(`/trips/${createdTrip.id}`); return }
    setStep(s => s - 1)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Plan a trip</h1>
          <p className="text-white/50 text-sm">{STEPS[step]} — step {step + 1} of {STEPS.length}</p>
        </div>

        <StepIndicator current={step} total={STEPS.length} />

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-6">
          {step === 0 && <Step1Basics form={form} setForm={setForm} />}
          {step === 1 && <Step2Budget form={form} setForm={setForm} />}
          {step === 2 && createdTrip && <Step3Invite trip={createdTrip} />}
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error.message}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="px-5 py-3 border border-white/20 rounded-xl text-sm text-white/60 hover:text-white hover:border-white/40 transition"
          >
            {step === 2 ? 'Go to trip →' : 'Back'}
          </button>
          {step < 2 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={(step === 0 && !isStep1Valid) || isPending}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-semibold transition text-sm"
            >
              {isPending ? 'Creating…' : step === 1 ? 'Create trip' : 'Next →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
