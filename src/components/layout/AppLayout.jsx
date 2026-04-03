import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useWishlist } from '../../hooks/useWishlist'

export default function AppLayout() {
  const { user, profile, signOut } = useAuthStore()
  const { savedIds } = useWishlist()
  const navigate = useNavigate()
  const location = useLocation()

  const initials = profile
    ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase()
    : '?'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ── Top Nav ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-blue-brand/10 px-6 py-3 flex items-center gap-4">
        <Link
          to="/"
          className="font-display font-black text-2xl text-blue-brand tracking-tight mr-4"
        >
          Vacay<span className="text-gold-brand">topia</span>
        </Link>

        <div className="hidden md:flex items-center gap-1 flex-1">
          <NavLink to="/browse" label="Browse" active={location.pathname.startsWith('/browse')} />
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

              {/* Avatar / menu */}
              <div className="relative group">
                <button className="w-9 h-9 rounded-full bg-blue-brand text-white font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-blue-mid transition-colors">
                  {initials}
                </button>
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-card border border-blue-brand/10 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1 z-50">
                  <DropItem label="My Profile"   onClick={() => navigate('/profile')} />
                  <DropItem label="My Bookings"  onClick={() => navigate('/profile')} />
                  <div className="my-1 border-t border-blue-brand/8" />
                  <DropItem label="Sign Out" onClick={signOut} danger />
                </div>
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
        <span className="font-display font-black text-white text-base">
          Vacay<span className="text-gold-brand">topia</span>
        </span>
        <span>© {new Date().getFullYear()} Vacaytopia. We never sell your data.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-gold-brand transition-colors">Privacy</a>
          <a href="#" className="hover:text-gold-brand transition-colors">Terms</a>
          <a href="#" className="hover:text-gold-brand transition-colors">Support</a>
        </div>
      </footer>
    </div>
  )
}

function NavLink({ to, label, active }) {
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-pill text-sm font-semibold transition-colors ${
        active
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
