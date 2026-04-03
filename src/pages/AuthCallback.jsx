import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          navigate('/browse', { replace: true })
        } else if (event === 'SIGNED_OUT') {
          navigate('/auth', { replace: true })
        }
      }
    )

    // Also check if session already exists (handles page reload on callback)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/browse', { replace: true })
      }
    })

    return () => authListener.subscription.unsubscribe()
  }, [navigate])

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg)' }}
    >
      <div className="text-center">
        <div className="font-display font-black text-3xl text-blue-brand mb-3">
          Vacay<span className="text-gold-brand">topia</span>
        </div>
        <div className="text-sm text-gray-400">Signing you in...</div>
        <div className="mt-4 flex justify-center gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-brand rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}