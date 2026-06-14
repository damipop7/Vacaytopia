/**
 * 3-question first-visit onboarding quiz.
 * Stores the result as a local travel persona in localStorage.
 * Shown once per browser session (not per route change).
 */
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'vtopia_persona'
const SHOWN_KEY   = 'vtopia_onboarding_shown'

const STEPS = [
  {
    id: 'style',
    q: 'What kind of traveler are you?',
    options: [
      { id: 'explorer',  label: 'Explorer',       desc: 'I love hidden gems & off-beat spots' },
      { id: 'foodie',    label: 'Foodie',          desc: 'Restaurants & local cuisine first' },
      { id: 'culture',   label: 'Culture lover',   desc: 'Museums, arts & history' },
      { id: 'nightlife', label: 'Night owl',        desc: 'Bars, clubs & live music' },
    ],
  },
  {
    id: 'group',
    q: "Who's joining you?",
    options: [
      { id: 'solo',    label: 'Solo',           desc: '' },
      { id: 'couple',  label: 'Couple',         desc: '' },
      { id: 'friends', label: 'Friends group',  desc: '' },
      { id: 'family',  label: 'Family & kids',  desc: '' },
    ],
  },
  {
    id: 'interest',
    q: "Top priority for your visit?",
    options: [
      { id: 'Food & Drink',  label: 'Food & Drink',   desc: 'BBQ, brunch & craft beer' },
      { id: 'Outdoors',      label: 'Outdoors',        desc: 'Parks, trails & nature' },
      { id: 'Sports',        label: 'World Cup',       desc: 'Matches & fan events' },
      { id: 'Arts & Culture','label': 'Arts & Culture', desc: 'Galleries, jazz & history' },
    ],
  },
]

// eslint-disable-next-line react-refresh/only-export-components
export function getStoredPersona() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') }
  catch { return null }
}

export default function OnboardingQuiz({ onComplete }) {
  const [visible, setVisible] = useState(false)
  const [step, setStep]       = useState(0)
  const [answers, setAnswers] = useState({})

  useEffect(() => {
    // Only show once — not on every page visit
    const alreadyShown = sessionStorage.getItem(SHOWN_KEY)
    const hasPersona   = !!localStorage.getItem(STORAGE_KEY)
    if (!alreadyShown && !hasPersona) {
      // Delay slightly so it doesn't pop on initial paint
      const t = setTimeout(() => setVisible(true), 900)
      return () => clearTimeout(t)
    }
  }, [])

  function choose(stepId, value) {
    const next = { ...answers, [stepId]: value }
    setAnswers(next)
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      // Save persona and close
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* quota */ }
      sessionStorage.setItem(SHOWN_KEY, '1')
      setVisible(false)
      onComplete?.(next)
    }
  }

  function dismiss() {
    sessionStorage.setItem(SHOWN_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const currentStep = STEPS[step]

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-0 animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-[20px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-brand px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Quick setup</p>
            <p className="text-white font-bold text-sm mt-0.5">Step {step + 1} of {STEPS.length}</p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Close onboarding quiz"
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Progress */}
        <div className="h-1 bg-blue-tint">
          <div
            className="h-full bg-gold-brand transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-5">
          <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-4">{currentStep.q}</h2>
          <div className="flex flex-col gap-2">
            {currentStep.options.map(opt => (
              <button
                key={opt.id}
                onClick={() => choose(currentStep.id, opt.id)}
                className="text-left px-4 py-3 rounded-[12px] border border-blue-brand/15 hover:border-blue-brand hover:bg-blue-tint transition-all group"
              >
                <div className="font-semibold text-sm text-[#0D1B3E] group-hover:text-blue-brand">{opt.label}</div>
                {opt.desc && <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>}
              </button>
            ))}
          </div>
          <button
            onClick={dismiss}
            className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
