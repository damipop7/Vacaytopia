import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLatestQuiz, useSaveQuiz } from '../hooks/useQuiz'
import { ONBOARD_INTERESTS_KEY } from '../lib/appUrl'
import { getStoredPersona } from '../components/ui/OnboardingQuiz'
import {
  QUIZ_INTERESTS,
  QUIZ_TRAVEL_STYLES,
  QUIZ_GROUP_TYPES,
  QUIZ_CITIES,
  labelInterests,
  labelStyle,
  labelGroups,
} from '../lib/travelQuiz'

// Map popup quiz answers → full InterestsPage fields
function seedFromPersona(persona) {
  if (!persona) return null
  const interestMap = { 'Food & Drink': 'food', Outdoors: 'outdoors', Sports: 'sports', 'Arts & Culture': 'arts' }
  const styleMap    = { explorer: 'spontaneous', foodie: 'planner', culture: 'planner', nightlife: 'social' }
  const groupMap    = { solo: ['solo'], couple: ['couple'], friends: ['friends'], family: ['family'] }
  return {
    interests:   persona.interest ? [interestMap[persona.interest]].filter(Boolean) : [],
    travelStyle: styleMap[persona.style] || '',
    groupType:   groupMap[persona.group] || [],
  }
}

const STEPS = ['Interests', 'Budget', 'Destination', 'Style', 'Group', 'Save']

export default function InterestsPage() {
  const navigate = useNavigate()
  const { data: existing, isLoading: loadingQuiz } = useLatestQuiz()
  const saveQuiz = useSaveQuiz()

  const [step, setStep] = useState(0)
  const [interests, setInterests] = useState([])
  const [budget, setBudget] = useState(250)
  const [destination, setDestination] = useState('all')
  const [arriveDate, setArriveDate] = useState('')
  const [departDate, setDepartDate] = useState('')
  const [travelStyle, setTravelStyle] = useState('')
  const [groupType, setGroupType] = useState([])
  const [error, setError] = useState('')
  const [prefilled, setPrefilled] = useState(false)

  useEffect(() => {
    sessionStorage.removeItem(ONBOARD_INTERESTS_KEY)
  }, [])

  useEffect(() => {
    if (prefilled) return
    /* eslint-disable react-hooks/set-state-in-effect */
    if (existing) {
      // Prefill from saved quiz_results (editing mode)
      setInterests([...(existing.interests || [])])
      setBudget(existing.budget ?? 250)
      setDestination(existing.destination_city || 'all')
      setArriveDate(existing.arrive_date?.slice(0, 10) || '')
      setDepartDate(existing.depart_date?.slice(0, 10) || '')
      setTravelStyle(existing.travel_style || '')
      setGroupType([...(existing.group_type || [])])
      setPrefilled(true)
    } else if (!loadingQuiz) {
      // No saved quiz — seed from popup persona if available (reduces duplicate work)
      const seed = seedFromPersona(getStoredPersona())
      if (seed) {
        if (seed.interests.length)  setInterests(seed.interests)
        if (seed.travelStyle)       setTravelStyle(seed.travelStyle)
        if (seed.groupType.length)  setGroupType(seed.groupType)
      }
      setPrefilled(true)
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [existing, prefilled, loadingQuiz])

  const toggleInterest = id => {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleGroup = id => {
    setGroupType(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const canNext = () => {
    if (step === 0) return interests.length > 0
    if (step === 3) return !!travelStyle
    return true
  }

  const goNext = () => {
    setError('')
    if (!canNext()) {
      if (step === 0) setError('Pick at least one interest.')
      if (step === 3) setError('Choose a travel style.')
      return
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  const goBack = () => {
    setError('')
    setStep(s => Math.max(s - 1, 0))
  }

  const handleSubmit = async () => {
    setError('')
    try {
      await saveQuiz.mutateAsync({
        interests,
        budget,
        travel_style: travelStyle,
        group_type: groupType,
        destination_city: destination,
        arrive_date: arriveDate || null,
        depart_date: departDate || null,
      })
      navigate('/browse', { replace: true })
    } catch (e) {
      setError(e.message || 'Could not save. Try again.')
    }
  }

  if (loadingQuiz) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-blue-brand font-display font-bold">Loading your preferences…</div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-64px)] py-10 px-6">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="text-xs font-bold tracking-widest uppercase text-gold-brand mb-2">
            Personalise your vtopia
          </div>
          <h1 className="font-display font-black text-2xl text-[#0D1B3E] mb-2">
            Interest questionnaire
          </h1>
          <p className="text-sm text-gray-400">
            Powers your recommendation engine — same signals we use when you browse and book.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div
                className={`w-full h-1 rounded-full transition-colors ${
                  i <= step ? 'bg-blue-brand' : 'bg-blue-brand/15'
                }`}
              />
              <span
                className={`text-[9px] font-bold uppercase tracking-tighter truncate max-w-full ${
                  i === step ? 'text-blue-brand' : 'text-gray-300'
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-card border border-blue-brand/10 p-6 shadow-sm min-h-[320px] flex flex-col">
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-[9px] px-3 py-2">
              {error}
            </div>
          )}

          {step === 0 && (
            <>
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-1">
                What do you love on vacation?
              </h2>
              <p className="text-xs text-gray-400 mb-4">Select all that apply.</p>
              <div className="grid grid-cols-2 gap-2 flex-1">
                {QUIZ_INTERESTS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleInterest(opt.id)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-[9px] text-left text-sm font-semibold border transition-all ${
                      interests.includes(opt.id)
                        ? 'bg-blue-brand text-white border-blue-brand'
                        : 'border-blue-brand/15 text-gray-600 hover:border-blue-brand hover:bg-blue-tint'
                    }`}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="leading-tight">{opt.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-1">
                Typical budget per experience
              </h2>
              <p className="text-xs text-gray-400 mb-6">
                We’ll still show options above this — just ranked lower (Expedia-style flexibility).
              </p>
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>$25</span>
                <span className="font-bold text-blue-brand">${budget}</span>
                <span>$500+</span>
              </div>
              <input
                type="range"
                min={25}
                max={500}
                step={5}
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                className="w-full accent-[#034694]"
              />
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-1">
                Where are you headed?
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Optional trip window helps us weight cities (you can skip dates).
              </p>
              <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                City focus
              </label>
              <select
                value={destination}
                onChange={e => setDestination(e.target.value)}
                className="input-field text-sm mb-4"
              >
                {QUIZ_CITIES.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                    Arrive
                  </label>
                  <input
                    type="date"
                    value={arriveDate}
                    onChange={e => setArriveDate(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                    Depart
                  </label>
                  <input
                    type="date"
                    value={departDate}
                    onChange={e => setDepartDate(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-1">
                Travel style
              </h2>
              <p className="text-xs text-gray-400 mb-4">Pick the one that fits most trips.</p>
              <div className="flex flex-col gap-2">
                {QUIZ_TRAVEL_STYLES.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setTravelStyle(s.id)}
                    className={`text-left px-4 py-3 rounded-[9px] border text-sm font-semibold transition-all ${
                      travelStyle === s.id
                        ? 'bg-blue-brand text-white border-blue-brand'
                        : 'border-blue-brand/15 text-gray-600 hover:border-blue-brand hover:bg-blue-tint'
                    }`}
                  >
                    <span className="block">{s.label}</span>
                    <span
                      className={`text-xs font-normal ${travelStyle === s.id ? 'text-white/80' : 'text-gray-400'}`}
                    >
                      {s.hint}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-1">
                Who usually travels with you?
              </h2>
              <p className="text-xs text-gray-400 mb-4">Select any that apply (Airbnb-style party context).</p>
              <div className="flex flex-wrap gap-2">
                {QUIZ_GROUP_TYPES.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGroup(g.id)}
                    className={`px-4 py-2 rounded-pill text-xs font-bold border transition-all ${
                      groupType.includes(g.id)
                        ? 'bg-gold-brand text-white border-gold-brand'
                        : 'border-blue-brand/15 text-gray-500 hover:border-blue-brand'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-3">
                You’re set
              </h2>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                We’ll rank experiences using your interests, budget, city, style, and saves — and keep improving as
                you browse.
              </p>
              <ul className="text-xs text-gray-500 space-y-2 border border-blue-brand/10 rounded-[9px] p-4 bg-blue-tint/40">
                <li>
                  <strong className="text-[#0D1B3E]">Interests:</strong> {labelInterests(interests)}
                </li>
                <li>
                  <strong className="text-[#0D1B3E]">Budget:</strong> ${budget}/person
                </li>
                <li>
                  <strong className="text-[#0D1B3E]">City:</strong>{' '}
                  {destination === 'all' ? 'Flexible' : destination}
                </li>
                <li>
                  <strong className="text-[#0D1B3E]">Style:</strong> {labelStyle(travelStyle)}
                </li>
                <li>
                  <strong className="text-[#0D1B3E]">Group:</strong>{' '}
                  {groupType.length ? labelGroups(groupType) : 'Any'}
                </li>
              </ul>
            </>
          )}

          <div className="flex gap-3 mt-auto pt-6">
            {step > 0 ? (
              <button type="button" onClick={goBack} className="btn-outline flex-1 text-sm">
                ← Back
              </button>
            ) : (
              <button type="button" onClick={() => navigate(-1)} className="btn-outline flex-1 text-sm">
                Cancel
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={goNext} className="btn-primary flex-[1.3] text-sm">
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saveQuiz.isPending}
                className="btn-primary flex-[1.3] text-sm disabled:opacity-60"
              >
                {saveQuiz.isPending ? 'Saving…' : 'Save & browse →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
