import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ONBOARD_INTERESTS_KEY } from '../lib/appUrl'
import BrandMark from '../components/ui/BrandMark'

function isBrandNewUser(user) {
  if (!user?.created_at) return false
  const created = new Date(user.created_at).getTime()
  return Date.now() - created < 3 * 60 * 1000
}

function routeAfterAuth(session, navigate) {
  if (!session?.user) return
  if (isBrandNewUser(session.user)) {
    sessionStorage.setItem(ONBOARD_INTERESTS_KEY, '1')
    navigate('/interests', { replace: true })
  } else {
    navigate('/browse', { replace: true })
  }
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const routedRef = useRef(false)

  useEffect(() => {
    const go = session => {
      if (routedRef.current || !session) return
      routedRef.current = true
      routeAfterAuth(session, navigate)
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) go(session)
      if (event === 'SIGNED_OUT') navigate('/auth', { replace: true })
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) go(session)
    })

    return () => authListener.subscription.unsubscribe()
  }, [navigate])

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg)' }}
    >
      <div className="text-center">
        <div className="text-3xl mb-3 flex justify-center">
          <BrandMark />
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