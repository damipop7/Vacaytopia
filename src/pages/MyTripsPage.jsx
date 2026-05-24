import { Link } from 'react-router-dom'
import { useMyTrips } from '../hooks/useTrip'
import TripCard from '../components/trips/TripCard'

export default function MyTripsPage() {
  const { data: trips = [], isLoading, error } = useMyTrips()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">My Trips</h1>
          <p className="text-white/50 text-sm">All your solo and group trip plans in one place.</p>
        </div>
        <Link
          to="/trips/new"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition flex items-center gap-2"
        >
          + New Trip
        </Link>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-white/50 text-sm">Could not load your trips. Please try again.</p>
        </div>
      )}

      {!isLoading && !error && trips.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-xl font-bold text-white mb-2">No trips yet</h2>
          <p className="text-white/50 text-sm mb-6 max-w-sm mx-auto">
            Start your first trip — solo or with friends. Kansas City is ready for you.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/trips/new" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition">
              Plan a group trip
            </Link>
            <Link to="/itinerary" className="px-5 py-2.5 border border-white/20 hover:border-white/40 rounded-xl text-sm text-white/70 hover:text-white transition">
              Solo AI itinerary
            </Link>
          </div>
        </div>
      )}

      {!isLoading && trips.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map(t => <TripCard key={t.id} trip={t} />)}
          <Link
            to="/trips/new"
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 hover:border-blue-500/40 text-white/30 hover:text-white/60 transition p-5 min-h-[140px] gap-2 group"
          >
            <span className="text-2xl group-hover:scale-110 transition">+</span>
            <span className="text-sm font-semibold">New Trip</span>
          </Link>
        </div>
      )}
    </div>
    </div>
  )
}
