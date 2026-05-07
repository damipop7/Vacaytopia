import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useWishlist } from '../../hooks/useWishlist'
import BrandMark from '../ui/BrandMark'

export default function AppLayout() {
  const { user, profile, signOut } = useAuthStore()
  const { savedIds } = useWishlist()
  const navigate = useNavigate()
  const location = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const initials = profile
    ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase()
    : '?'

  const isAdmin = profile?.role === 'admin'

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentionally reset menu on navigation
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // Close dropdown when clicking anywhere outside it
  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  // Close dropdown on Escape key
  useEffect(() => {
    if (!menuOpen) return
    function handleEsc(e) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [menuOpen])

  // FIX: await signOut, then navigate home
  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
    navigate('/')
  }

  function handleNavItem(fn) {
    setMenuOpen(false)
    fn()
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ── Top Nav ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-blue-brand/10 px-6 py-3 flex items-center gap-4">
        <Link to="/" className="mr-4">
          <BrandMark className="text-2xl" />
        </Link>

        <div className="hidden md:flex items-center gap-1 flex-1">
          <NavLink to="/browse" label="Browse" active={location.pathname.startsWith('/browse')} />
          <NavLink to="/itinerary" label="✨ AI Itinerary" active={location.pathname.startsWith('/itinerary')} />
          {import.meta.env.VITE_FEATURE_WORLD_CUP === 'true' && (
            <NavLink to="/world-cup" label="🏆 World Cup KC" active={location.pathname === '/world-cup'} highlight />
          )}
          {user && (
            <NavLink to="/interests" label="Interests" active={location.pathname === '/interests'} />
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {user ? (
            <>
              {/* Wishlist counter */}
              <button
                onClick={() => navigate('/profile')}
                className="relative flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-brand transition-colors px-3 py-1.5 rounded-pill border border-blue-brand/15 hover:border-blue-brand hover:bg-blue-tint"
              >
                <span>♡</span>
                <span>Saved</span>
                {savedIds.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gold-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {savedIds.length}
                  </span>
                )}
              </button>

              {/* Avatar / click-toggled menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                  className="w-9 h-9 rounded-full bg-blue-brand text-white font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-blue-mid transition-colors select-none"
                >
                  {initials}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-card border border-blue-brand/10 shadow-lg py-1 z-50">
                    {/* User info header */}
                    <div className="px-4 py-2 border-b border-blue-brand/8 mb-1">
                      <p className="text-xs font-semibold text-[#0D1B3E] truncate">
                        {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'My Account'}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    </div>

                    <DropItem label="My Profile"       onClick={() => handleNavItem(() => navigate('/profile'))} />
                    <DropItem label="My trips"         onClick={() => handleNavItem(() => navigate('/profile', { state: { tab: 'history' } }))} />
                    <DropItem label="Personalise feed" onClick={() => handleNavItem(() => navigate('/interests'))} />

                    {isAdmin && (
                      <>
                        <div className="my-1 border-t border-blue-brand/8" />
                        <DropItem label="⚙️ Admin Dashboard" onClick={() => handleNavItem(() => navigate('/admin'))} />
                      </>
                    )}

                    <div className="my-1 border-t border-blue-brand/8" />
                    <DropItem label="Sign Out" onClick={handleSignOut} danger />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/auth')}
                className="text-sm font-semibold text-gray-500 hover:text-blue-brand transition-colors px-3 py-1.5"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="btn-primary text-sm px-4 py-2"
              >
                Get Started Free
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Page Content ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#0D1B3E] text-white/60 text-xs py-6 px-6 flex flex-wrap items-center justify-between gap-3 mt-auto">
        <BrandMark variant="light" className="text-base" />
        <span>© {new Date().getFullYear()} vtopia. We never sell your data.</span>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-gold-brand transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-gold-brand transition-colors">Terms</Link>
          <a href="mailto:hello@vtopia.world" className="hover:text-gold-brand transition-colors">Support</a>
        </div>
      </footer>
    </div>
  )
}

function NavLink({ to, label, active, highlight }) {
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-pill text-sm font-semibold transition-colors ${
        highlight
          ? active
            ? 'bg-gold-brand text-white'
            : 'bg-gold-tint text-gold-dark border border-gold-brand/30 hover:bg-gold-brand hover:text-white'
          : active
            ? 'bg-blue-tint text-blue-brand'
            : 'text-gray-500 hover:text-blue-brand hover:bg-blue-tint'
      }`}
    >
      {label}
    </Link>
  )
}

function DropItem({ label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-blue-tint ${
        danger ? 'text-red-600 hover:text-red-700' : 'text-gray-700 hover:text-blue-brand'
      }`}
    >
      {label}
    </button>
  )
}
