import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useWishlist } from '../../hooks/useWishlist'
import BrandMark from '../ui/BrandMark'
import VtopiaLogo from '../ui/VtopiaLogo'
import BottomNav from './BottomNav'
import LanguageSelector from '../ui/LanguageSelector'
import { Heart, Sparkles, Trophy, Sliders, Settings, LogOut, LayoutDashboard, Menu, X } from 'lucide-react'

export default function AppLayout() {
  const { user, profile, signOut } = useAuthStore()
  const { savedIds } = useWishlist()
  const navigate = useNavigate()
  const location = useLocation()

  const [menuOpen,   setMenuOpen]   = useState(false)
  const [mobileNav,  setMobileNav]  = useState(false)
  const [scrolled,   setScrolled]   = useState(false)
  const menuRef = useRef(null)

  const initials = profile
    ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase()
    : '?'

  const isAdmin = profile?.role === 'admin' || profile?.role === 'partner'

  // Frosted glass threshold
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMenuOpen(false); setMobileNav(false) }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    function handleEsc(e) { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [menuOpen])

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

      {/* ── Top Nav — sticky + frosted glass ── */}
      <nav
        className={`sticky top-0 z-50 px-6 py-3 flex items-center gap-4 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-blue-brand/10 shadow-sm'
            : 'bg-white border-b border-blue-brand/10'
        }`}
      >
        {/* Hamburger — mobile only */}
        <button
          className="md:hidden p-2 rounded-[9px] text-gray-500 hover:text-blue-brand hover:bg-blue-tint transition-colors mr-1"
          onClick={() => setMobileNav(o => !o)}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <Link to="/" className="mr-4" aria-label="Vtopia home">
          <VtopiaLogo size="md" variant="dark" />
        </Link>

        <div className="hidden md:flex items-center gap-1 flex-1">
          <NavLink to="/browse"    label="Browse"        active={location.pathname.startsWith('/browse')} />
          <NavLink to="/itinerary" label="AI Itinerary"  active={location.pathname.startsWith('/itinerary')} icon={<Sparkles size={14} aria-hidden="true" />} />
          {import.meta.env.VITE_FEATURE_WORLD_CUP === 'true' && (
            <NavLink to="/world-cup" label="World Cup KC" active={location.pathname === '/world-cup'} highlight icon={<Trophy size={14} aria-hidden="true" />} />
          )}
          {user && (
            <NavLink to="/interests" label="Interests" active={location.pathname === '/interests'} />
          )}
          {user && (
            <NavLink to="/trips" label="Plan with Friends" active={location.pathname.startsWith('/trips')} />
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Language selector */}
          <LanguageSelector />

          {user ? (
            <>
              {/* Wishlist counter */}
              <button
                onClick={() => navigate('/profile')}
                aria-label={`Saved experiences (${savedIds.length})`}
                className="relative flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-brand transition-colors px-3 py-1.5 rounded-pill border border-blue-brand/15 hover:border-blue-brand hover:bg-blue-tint"
              >
                <Heart size={15} aria-hidden="true" />
                <span className="hidden sm:inline">Saved</span>
                {savedIds.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gold-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center" aria-hidden="true">
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
                  aria-label="Account menu"
                  className="w-9 h-9 rounded-full bg-blue-brand text-white font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-blue-mid transition-colors select-none"
                >
                  {initials}
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-card border border-blue-brand/10 shadow-lg py-1 z-50"
                  >
                    <div className="px-4 py-2 border-b border-blue-brand/8 mb-1">
                      <p className="text-xs font-semibold text-[#0D1B3E] truncate">
                        {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'My Account'}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    </div>

                    <DropItem label="My Profile"       icon={<Settings size={14} />}     onClick={() => handleNavItem(() => navigate('/profile'))} />
                    <DropItem label="Booking History"    icon={<Heart size={14} />}         onClick={() => handleNavItem(() => navigate('/profile', { state: { tab: 'history' } }))} />
                    <DropItem label="Personalise feed" icon={<Sliders size={14} />}       onClick={() => handleNavItem(() => navigate('/interests'))} />

                    {isAdmin && (
                      <>
                        <div className="my-1 border-t border-blue-brand/8" />
                        <DropItem label="Admin Dashboard" icon={<LayoutDashboard size={14} />} onClick={() => handleNavItem(() => navigate('/admin'))} />
                      </>
                    )}

                    <div className="my-1 border-t border-blue-brand/8" />
                    <DropItem label="Sign Out" icon={<LogOut size={14} />} onClick={handleSignOut} danger />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/auth')}
                className="text-sm font-semibold text-gray-500 hover:text-blue-brand transition-colors px-3 py-1.5 hidden sm:block"
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

      {/* ── Mobile nav drawer ── */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNav(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-blue-brand/10">
              <VtopiaLogo size="sm" variant="dark" />
              <button onClick={() => setMobileNav(false)} className="w-9 h-9 flex items-center justify-center rounded-full border border-blue-brand/15 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <nav className="flex flex-col p-4 gap-1 flex-1 overflow-y-auto">
              {[
                { to: '/browse',    label: 'Browse experiences' },
                { to: '/itinerary', label: 'AI Itinerary' },
                ...(import.meta.env.VITE_FEATURE_WORLD_CUP === 'true'
                  ? [{ to: '/world-cup', label: 'World Cup KC' }]
                  : []),
                ...(user ? [{ to: '/interests', label: 'My interests' }] : []),
                ...(user ? [{ to: '/trips',     label: 'Plan with Friends' }] : []),
                ...(user ? [{ to: '/profile',   label: 'Profile' }] : []),
              ].map(({ to, label }) => (
                <Link key={to} to={to}
                  className="flex items-center min-h-[48px] px-4 rounded-[9px] text-sm font-semibold text-gray-600 hover:bg-blue-tint hover:text-blue-brand transition-all">
                  {label}
                </Link>
              ))}
            </nav>
            {!user && (
              <div className="p-4 border-t border-blue-brand/10">
                <button onClick={() => navigate('/auth')} className="btn-primary w-full">
                  Sign in / Get started
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Page Content ── */}
      <main className="flex-1 pb-14 md:pb-0">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#0D1B3E] text-white/60 text-xs py-6 px-6 flex flex-wrap items-center justify-between gap-3 mt-auto">
        <VtopiaLogo size="sm" variant="light" />
        <span>© {new Date().getFullYear()} vtopia. We never sell your data.</span>
        <div className="flex gap-4">
          <Link to="/list-your-experience" className="hover:text-gold-brand transition-colors">List your experience</Link>
          <Link to="/become-a-guide" className="hover:text-gold-brand transition-colors">Become a guide</Link>
          <Link to="/privacy" className="hover:text-gold-brand transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-gold-brand transition-colors">Terms</Link>
          <a href="mailto:hello@vtopia.world" className="hover:text-gold-brand transition-colors">Support</a>
        </div>
      </footer>

      {/* ── Mobile bottom nav ── */}
      <BottomNav />
    </div>
  )
}

function NavLink({ to, label, active, highlight, icon }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-pill text-sm font-semibold transition-colors ${
        highlight
          ? active
            ? 'bg-gold-brand text-white'
            : 'bg-gold-tint text-gold-dark border border-gold-brand/30 hover:bg-gold-brand hover:text-white'
          : active
            ? 'bg-blue-tint text-blue-brand'
            : 'text-gray-500 hover:text-blue-brand hover:bg-blue-tint'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

function DropItem({ label, onClick, danger, icon }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-blue-tint flex items-center gap-2.5 ${
        danger ? 'text-red-600 hover:text-red-700' : 'text-gray-700 hover:text-blue-brand'
      }`}
    >
      {icon && <span className="opacity-60">{icon}</span>}
      {label}
    </button>
  )
}
