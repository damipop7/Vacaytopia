import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTripByToken, useJoinTrip } from '../hooks/useTrip'
import { useAuthStore } from '../store/authStore'
import MemberAvatarStack from '../components/trips/MemberAvatarStack'

function formatDateRange(start, end) {
  if (!start) return 'Dates TBD'
  const s = new Date(start)
  const e = end ? new Date(end) : null
  const opts = { month: 'long', day: 'numeric', year: 'numeric' }
  if (!e) return s.toLocaleDateString('en-US', opts)
  return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export default function JoinTripPage() {
  const { shareToken } = useParams()
  const navigate       = useNavigate()
  const user           = useAuthStore(s => s.user)
  const loading        = useAuthStore(s => s.loading)

  const { data: trip, isLoading: tripLoading, error } = useTripByToken(shareToken)
  const { mutate: join, isPending, error: joinError } = useJoinTrip()
  const [joined, setJoined] = useState(false)

  const alreadyMember = !!trip && (trip.trip_members ?? []).some(m => m.user_id === user?.id)

  useEffect(() => {
    if (alreadyMember) navigate(`/trips/${trip.id}`, { replace: true })
  }, [alreadyMember, trip, navigate])

  function handleJoin() {
    join(shareToken, {
      onSuccess: (t) => {
        setJoined(true)
        setTimeout(() => navigate(`/trips/${t.id}`), 1200)
      },
    })
  }

  if (loading || tripLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500/40 border-t-blue-500 animate-spin" />
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="text-4xl">🔍</div>
        <h2 className="text-xl font-bold">Trip not found</h2>
        <p className="text-white/50 text-sm max-w-xs">This invite link may have expired or the trip was deleted.</p>
        <Link to="/" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition">
          Back to Vtopia
        </Link>
      </div>
    )
  }

  const organizer    = (trip.trip_members ?? []).find(m => m.role === 'owner')
  const memberCount  = (trip.trip_members ?? []).length

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-white/50 text-sm mb-1">
            {organizer?.display_name ?? 'Someone'} invited you to
          </p>
          <h1 className="text-3xl font-bold mb-4 leading-tight">{trip.title}</h1>

          <div className="inline-flex flex-col gap-2 text-sm text-white/70 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-left mb-6">
            <span>📍 {trip.destination}</span>
            <span>📅 {formatDateRange(trip.start_date, trip.end_date)}</span>
            <div className="flex items-center gap-2">
              <MemberAvatarStack members={trip.trip_members ?? []} max={5} size={24} />
              <span>{memberCount} traveler{memberCount !== 1 ? 's' : ''} already joined</span>
            </div>
          </div>
        </div>

        {/* Join CTA */}
        {joined ? (
          <div className="text-center">
            <div className="text-4xl mb-3 animate-bounce">🎉</div>
            <p className="font-bold text-lg">You're in! Taking you to the trip…</p>
          </div>
        ) : !user ? (
          <div className="flex flex-col gap-3">
            <Link
              to="/auth"
              state={{ from: `/trips/join/${shareToken}`, message: 'Sign in to join this trip' }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-center transition"
            >
              Sign in to join →
            </Link>
            <p className="text-center text-white/40 text-xs">New to Vtopia? You can create a free account on the next screen.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleJoin}
              disabled={isPending}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-xl font-semibold transition"
            >
              {isPending ? 'Joining…' : 'Join trip →'}
            </button>
            {joinError && (
              <p className="text-red-400 text-sm text-center">{joinError.message}</p>
            )}
            <p className="text-center text-white/40 text-xs">
              Joining as {user.email}. <Link to="/auth" className="underline">Switch account</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
