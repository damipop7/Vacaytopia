import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ONBOARD_INTERESTS_KEY } from '../lib/appUrl'
import BrandMark from '../components/ui/BrandMark'

export default function AuthPage() {
  const [tab,       setTab]       = useState('signup')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [form,      setForm]      = useState({ firstName:'', lastName:'', email:'', password:'' })

  const { signUp, signIn, signInWithGoogle } = useAuthStore()
  const authLoading = useAuthStore(s => s.loading)
  const user          = useAuthStore(s => s.user)
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/browse'

  useEffect(() => {
    if (authLoading || !user) return
    // Let new signups reach /interests (flag set in handleSubmit / OAuth callback)
    if (sessionStorage.getItem(ONBOARD_INTERESTS_KEY) === '1') return
    navigate(from, { replace: true })
  }, [authLoading, user, from, navigate])

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

  const handleGoogle = async () => {
    try { await signInWithGoogle() }
    catch (err) { setError(err.message) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl">
            <BrandMark />
          </div>
          <div className="text-gray-400 text-sm mt-1">Your next great experience is one step away</div>
        </div>

        <div className="bg-white rounded-card border border-blue-brand/10 p-8 shadow-sm">

          {/* Tabs */}
          <div className="flex bg-gray-50 rounded-[9px] p-1 mb-6">
            {['signup','login'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-2 rounded-[7px] text-sm font-semibold transition-all ${
                  tab === t
                    ? 'bg-white text-blue-brand shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t === 'signup' ? 'Create account' : 'Sign in'}
              </button>
            ))}
          </div>

          {/* Social */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-blue-brand/15 rounded-pill text-sm font-medium text-gray-700 hover:bg-blue-tint hover:border-blue-brand transition-all mb-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-4 text-xs text-gray-300">
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
              <a href="#" className="text-blue-brand">Terms</a> and{' '}
              <a href="#" className="text-blue-brand">Privacy Policy</a>.
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
