import { Link, useLocation } from 'react-router-dom'
import { Compass, Map, Sparkles, Heart, User } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useWishlist } from '../../hooks/useWishlist'

const ITEMS = [
  { to: '/',          icon: Compass,   label: 'Home'     },
  { to: '/browse',    icon: Map,       label: 'Explore'  },
  { to: '/itinerary', icon: Sparkles,  label: 'Plan'     },
  { to: '/profile',   icon: Heart,     label: 'Saved',   authOnly: true  },
  { to: '/auth',      icon: User,      label: 'Sign in', guestOnly: true },
]

export default function BottomNav() {
  const location = useLocation()
  const user     = useAuthStore(s => s.user)
  const { savedIds } = useWishlist()

  const items = ITEMS.filter(item => {
    if (item.authOnly  && !user) return false
    if (item.guestOnly && user)  return false
    return true
  })

  // Don't render on auth pages or itinerary results (full-screen dark UI)
  const hide = ['/auth', '/auth/callback', '/itinerary/results'].some(
    p => location.pathname.startsWith(p)
  )
  if (hide) return null

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-blue-brand/10 safe-area-bottom"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-14 px-2">
        {items.map(({ to, icon: Icon, label, authOnly }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to)
          const hasBadge = authOnly && savedIds.length > 0

          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-[10px] transition-all ${
                isActive
                  ? 'text-blue-brand'
                  : 'text-gray-400 hover:text-blue-brand'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
                {hasBadge && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-gold-brand text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {savedIds.length > 9 ? '9+' : savedIds.length}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? 'text-blue-brand' : ''}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
