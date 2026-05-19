import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ONBOARD_INTERESTS_KEY } from '../lib/appUrl'
import VtopiaLogo from '../components/ui/VtopiaLogo'

export default function AuthPage() {
  const [tab,       setTab]       = useState('signup')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [form,      setForm]      = useState({ firstName:'', lastName:'', email:'', password:'' })
  const googleBtnRef = useRef(null)

  const { signUp, signIn, signInWithIdToken } = useAuthStore()
  const authLoading = useAuthStore(s => s.loading)
  const user        = useAuthStore(s => s.user)
  const navigate    = useNavigate()
  const location    = useLocation()
  const from        = location.state?.from?.pathname || '/browse'

  useEffect(() => {
    if (authLoading || !user) return
    if (sessionStorage.getItem(ONBOARD_INTERESTS_KEY) === '1') return
    navigate(from, { replace: true })
  }, [authLoading, user, from, navigate])

  // Load Google Identity Services and render the sign-in button
  useEffect(() => {
    let cancelled = false

    function initGSI() {
      if (cancelled || !googleBtnRef.current) return
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setError('')
          setLoading(true)
          try {
            const data = await signInWithIdToken(credential)
            // Brand-new Google account → onboarding
            if (data?.user) {
              const age = Date.now() - new Date(data.user.created_at).getTime()
              if (age < 3 * 60 * 1000) {
                sessionStorage.setItem(ONBOARD_INTERESTS_KEY, '1')
                navigate('/interests', { replace: true })
                return
              }
            }
            // Existing user — useEffect above handles redirect to `from`
          } catch (err) {
            setError(err.message || 'Google sign-in failed. Please try again.')
          } finally {
            setLoading(false)
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      })
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: String(Math.min(368, (window.innerWidth || 420) - 80)),
        logo_alignment: 'center',
      })
    }

    if (window.google?.accounts) {
      initGSI()
    } else {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initGSI
      document.head.appendChild(script)
      return () => {
        cancelled = true
        if (document.head.contains(script)) document.head.removeChild(script)
      }
    }
    return () => { cancelled = true }
  }, [])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async () => {
    setError('')
    if (!form.email || !form.email.includes('@')) return setError('Please enter a valid email.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (tab === 'signup' && !form.firstName) return setError('Please enter your first name.')

    setLoading(true)
    try {
      if (tab === 'signup') {
        await signUp({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName })
        sessionStorage.setItem(ONBOARD_INTERESTS_KEY, '1')
        navigate('/interests', { replace: true })
      } else {
        sessionStorage.removeItem(ONBOARD_INTERESTS_KEY)
        await signIn({ email: form.email, password: form.password })
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 via-white to-amber-50/30">
      <div className="w-full max-w-md">

        <div className="bg-white rounded-card border border-blue-brand/10 p-6 md:p-10 shadow-[0_4px_24px_-4px_rgba(3,70,148,0.10)]">

          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <VtopiaLogo size="lg" variant="dark" />
            <div className="text-gray-400 text-sm mt-2">Your next great experience is one step away</div>
          </div>

          {/* Tabs — pill-shaped */}
          <div className="flex bg-gray-50 rounded-full p-1 mb-6 border border-blue-brand/8">
            {['signup','login'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  tab === t
                    ? 'bg-white text-blue-brand shadow-sm border border-blue-brand/10'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t === 'signup' ? 'Create account' : 'Sign in'}
              </button>
            ))}
          </div>

          {/* Google Sign-In — rendered by Google Identity Services (shows vtopia.world in account picker) */}
          <div ref={googleBtnRef} className="flex justify-center mb-4 min-h-[44px]" />

          <div className="flex items-center gap-3 my-5 text-xs text-gray-300">
            <div className="flex-1 h-px bg-gray-100" />
            {tab === 'signup' ? 'or sign up with email' : 'or sign in with email'}
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-[9px] px-4 py-2.5 text-sm mb-4">
              {error}
            </div>
          )}

          {/* Form */}
          {tab === 'signup' && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">First name</label>
                <input className="input-field" type="text" placeholder="Alex" value={form.firstName} onChange={set('firstName')} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">Last name</label>
                <input className="input-field" type="text" placeholder="Rivera" value={form.lastName} onChange={set('lastName')} />
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">Email</label>
            <input className="input-field" type="email" placeholder="you@email.com" value={form.email} onChange={set('email')} />
          </div>

          <div className="mb-5">
            <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide flex justify-between">
              Password
              {tab === 'login' && (
                <span className="text-blue-brand cursor-pointer font-normal normal-case">Forgot password?</span>
              )}
            </label>
            <input className="input-field" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Just a moment...' : tab === 'signup' ? 'Create my account →' : 'Sign in →'}
          </button>

          {tab === 'signup' && (
            <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
              By creating an account you agree to our{' '}
              <a href="/privacy#terms" className="text-blue-brand">Terms</a> and{' '}
              <a href="/privacy" className="text-blue-brand">Privacy Policy</a>.
              <br />🔒 We never sell your data. Ever.
            </p>
          )}

          <p className="text-center text-xs text-gray-400 mt-3">
            {tab === 'signup' ? 'Already have an account? ' : 'New to vtopia? '}
            <span className="text-blue-brand font-semibold cursor-pointer" onClick={() => setTab(tab === 'signup' ? 'login' : 'signup')}>
              {tab === 'signup' ? 'Sign in' : 'Create account'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

