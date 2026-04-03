import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function ProtectedRoute() {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="font-display font-black text-3xl text-blue-brand mb-3">
            Vacay<span className="text-gold-brand">topia</span>
          </div>
          <div className="text-sm text-gray-400">Loading your experience...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    // Save the page they tried to visit so we can redirect back after login
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return <Outlet />
}
