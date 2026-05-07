import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'

const HomePage         = lazy(() => import('./pages/HomePage'))
const BrowsePage       = lazy(() => import('./pages/BrowsePage'))
const ExperiencePage   = lazy(() => import('./pages/ExperiencePage'))
const BookingPage      = lazy(() => import('./pages/BookingPage'))
const ProfilePage      = lazy(() => import('./pages/ProfilePage'))
const AuthPage         = lazy(() => import('./pages/AuthPage'))
const GuidePage        = lazy(() => import('./pages/GuidePage'))
const AuthCallback     = lazy(() => import('./pages/AuthCallback'))
const NotFoundPage     = lazy(() => import('./pages/NotFoundPage'))
const PrivacyPage      = lazy(() => import('./pages/PrivacyPage'))
const InterestsPage    = lazy(() => import('./pages/InterestsPage'))
const AdminPage        = lazy(() => import('./pages/AdminPage'))
const ItineraryQuiz    = lazy(() => import('./pages/ItineraryQuiz'))
const ItineraryResults = lazy(() => import('./pages/ItineraryResults'))
const ItineraryView    = lazy(() => import('./pages/ItineraryView'))

import AppLayout      from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminRoute     from './components/layout/AdminRoute'
import ErrorBoundary  from './components/ui/ErrorBoundary'

import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1, refetchOnWindowFocus: false },
  },
})

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 border-2 border-blue-brand/20 border-t-blue-brand rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const init = useAuthStore(s => s.init)

  useEffect(() => {
    let cleanup
    init().then(fn => { cleanup = fn })
    return () => cleanup?.()
  }, [init])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/"               element={<HomePage />} />
                <Route path="/browse"         element={<BrowsePage />} />
                <Route path="/browse/:city"   element={<BrowsePage />} />
                <Route path="/experience/:id" element={<ExperiencePage />} />
                <Route path="/guide/:id"      element={<GuidePage />} />
                <Route path="/privacy"        element={<PrivacyPage />} />
                <Route path="/itinerary"         element={<ItineraryQuiz />} />
                <Route path="/itinerary/results" element={<ItineraryResults />} />
                <Route path="/itinerary/:id" element={<ItineraryView />} />
              </Route>

              <Route path="/auth"          element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* ── Authenticated routes ── */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/book/:experienceId" element={<BookingPage />} />
                  <Route path="/profile"            element={<ProfilePage />} />
                  <Route path="/interests"          element={<InterestsPage />} />
                  <Route path="/auth/quiz"          element={<Navigate to="/interests" replace />} />
                </Route>
              </Route>

              {/* ── Admin-only routes ── */}
              <Route element={<AdminRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/admin" element={<AdminPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
