import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import BrandMark from '../ui/BrandMark'

export default function AdminRoute() {
  const { user, profile, loading } = useAuthStore()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="text-3xl mb-3 flex justify-center">
            <BrandMark />
          </div>
          <div className="text-sm text-gray-400">Checking permissions…</div>
        </div>
      </div>
    )
  }

  // Not logged in → send to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  // Logged in but not admin or partner → send home
  if (profile?.role !== 'admin' && profile?.role !== 'partner') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
