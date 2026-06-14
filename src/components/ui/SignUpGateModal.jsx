/**
 * Sign-Up Gate Modal
 *
 * Shows to first-time (unauthenticated) visitors 1.2 s after the homepage loads.
 * Dismissed state lives in sessionStorage — won't re-fire in the same browser tab.
 * Never shown to already-logged-in users.
 *
 * Auth paths:
 *   Google  → signInWithIdToken (same flow as AuthPage)
 *   Email   → navigate to /auth with email pre-filled
 *   Dismiss → set sessionStorage flag, close
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { ONBOARD_INTERESTS_KEY } from '../../lib/appUrl'
import BrandMark from './BrandMark'

const GATE_KEY = 'vtopia_gate_dismissed'

export default function SignUpGateModal() {
  const [visible, setVisible]   = useState(false)
  const [email, setEmail]       = useState('')
  const [gError, setGError]     = useState('')
  const [gLoading, setGLoading] = useState(false)
  const googleRef               = useRef(null)

  const { user, signInWithIdToken } = useAuthStore()
  const navigate = useNavigate()

  function dismiss() {
    sessionStorage.setItem(GATE_KEY, '1')
    setVisible(false)
  }

  // ── Visibility logic ────────────────────────────────────────────────
  useEffect(() => {
    if (user) return                                        // already signed in
    if (sessionStorage.getItem(GATE_KEY)) return           // dismissed this session

    const t = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(t)
  }, [user])

  // ── Google Identity Services ────────────────────────────────────────
  useEffect(() => {
    if (!visible) return
    let cancelled = false

    function initGSI() {
      if (cancelled || !googleRef.current) return
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setGError('')
          setGLoading(true)
          dismiss()
          try {
            const data = await signInWithIdToken(credential)
            if (data?.user) {
              const age = Date.now() - new Date(data.user.created_at).getTime()
              if (age < 3 * 60 * 1000) {
                sessionStorage.setItem(ONBOARD_INTERESTS_KEY, '1')
                navigate('/interests', { replace: true })
                return
              }
            }
            navigate('/browse', { replace: true })
          } catch (err) {
            setGError(err.message || 'Google sign-in failed. Please try again.')
            setGLoading(false)
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false,
      })
      window.google.accounts.id.renderButton(googleRef.current, {
        type:            'standard',
        theme:           'outline',
        size:            'large',
        text:            'continue_with',
        shape:           'pill',
        width:           '320',
        logo_alignment:  'center',
      })
    }

    if (window.google?.accounts) {
      initGSI()
    } else {
      const script    = document.createElement('script')
      script.src      = 'https://accounts.google.com/gsi/client'
      script.async    = true
      script.defer    = true
      script.onload   = initGSI
      document.head.appendChild(script)
      return () => {
        cancelled = true
        if (document.head.contains(script)) document.head.removeChild(script)
      }
    }
    return () => { cancelled = true }
  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleEmailContinue() {
    dismiss()
    navigate('/auth', { state: { prefillEmail: email, tab: 'signup' } })
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(13,27,62,0.72)', backdropFilter: 'blur(6px)' }}
    >
      <div className="relative w-full max-w-[460px] bg-white rounded-[20px] overflow-hidden shadow-2xl animate-[fadeInScale_0.25s_cubic-bezier(0.34,1.56,0.64,1)_both]">

        {/* ── Branded header ─────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-[#0D1B3E] via-[#034694] to-[#0D1B3E] px-8 pt-8 pb-10 text-white text-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-gold-brand/10" />

          <div className="relative z-10">
            <div className="flex justify-center mb-4">
              <BrandMark />
            </div>

            {/* World Cup badge */}
            <div className="inline-flex items-center gap-1.5 bg-gold-brand/20 border border-gold-brand/30 text-gold-brand text-[11px] font-bold px-3 py-1 rounded-full mb-4 tracking-wide">
              <span className="w-1.5 h-1.5 bg-gold-brand rounded-full animate-pulse" />
              WORLD CUP 2026 · KANSAS CITY
            </div>

            <h2 className="text-2xl font-display font-bold leading-tight mb-2">
              Your KC guide is<br />one step away
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              Personalized BBQ trails, jazz clubs, rooftop bars,<br className="hidden sm:block" /> and match-day plans — all built for you.
            </p>
          </div>
        </div>

        {/* ── Auth body ───────────────────────────────────────────── */}
        <div className="px-8 py-7">

          {gError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[9px] text-sm text-red-600">
              {gError}
            </div>
          )}

          {/* Google button */}
          <div className="flex justify-center mb-5 min-h-[44px]">
            {gLoading
              ? <div className="w-6 h-6 border-2 border-blue-brand/20 border-t-blue-brand rounded-full animate-spin" />
              : <div ref={googleRef} />}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5 text-xs text-gray-300">
            <div className="flex-1 h-px bg-gray-100" />
            or sign up with email
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Email input */}
          <div className="flex gap-2 mb-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && email.includes('@') && handleEmailContinue()}
              placeholder="Enter your email"
              className="flex-1 border border-blue-brand/20 rounded-[10px] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-brand/30 placeholder-gray-300"
            />
            <button
              onClick={handleEmailContinue}
              disabled={!email.includes('@')}
              className="px-4 py-2.5 text-sm font-bold bg-blue-brand text-white rounded-[10px] hover:bg-blue-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              Continue →
            </button>
          </div>

          <p className="text-[11px] text-gray-400 text-center mb-5 leading-relaxed">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>

          {/* Already have account */}
          <div className="text-center text-xs text-gray-400 mb-4">
            Already have an account?{' '}
            <button
              onClick={() => { dismiss(); navigate('/auth', { state: { tab: 'login' } }) }}
              className="text-blue-brand font-semibold hover:underline"
            >
              Sign in
            </button>
          </div>

          {/* Dismiss */}
          <div className="text-center">
            <button
              onClick={dismiss}
              className="text-xs text-gray-300 hover:text-gray-500 transition-colors underline underline-offset-2"
            >
              Browse without an account
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe for entrance animation */}
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  )
}
