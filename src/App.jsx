import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'

import HomePage       from './pages/HomePage'
import BrowsePage     from './pages/BrowsePage'
import ExperiencePage from './pages/ExperiencePage'
import BookingPage    from './pages/BookingPage'
import ProfilePage    from './pages/ProfilePage'
import AuthPage       from './pages/AuthPage'
import GuidePage      from './pages/GuidePage'
import AuthCallback   from './pages/AuthCallback'
import NotFoundPage   from './pages/NotFoundPage'
import PrivacyPage    from './pages/PrivacyPage'
import InterestsPage  from './pages/InterestsPage'
import AdminPage      from './pages/AdminPage'
import ItineraryQuiz    from "./pages/ItineraryQuiz";
import ItineraryResults from "./pages/ItineraryResults";

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

export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [init])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
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
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
