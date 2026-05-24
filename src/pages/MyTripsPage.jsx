import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMyTrips, useMyItineraries, useImportItineraryAsGroupTrip } from '../hooks/useTrip'
import TripCard from '../components/trips/TripCard'
import { CITY_LABELS } from '../lib/cities'

export default function MyTripsPage() {
  const navigate = useNavigate()
  const { data: trips = [],       isLoading: tripsLoading  } = useMyTrips()
  const { data: itineraries = [], isLoading: itnLoading    } = useMyItineraries()
  const { mutate: importItinerary }                          = useImportItineraryAsGroupTrip()

  const [mode,        setMode]        = useState(null) // null | 'import'
  const [importingId, setImportingId] = useState(null)
  const [importError, setImportError] = useState('')

  function handleImport(itn) {
    setImportingId(itn.id)
    setImportError('')
    importItinerary(
      {
        itinerary: itn.itinerary_data,
        cityLabel: CITY_LABELS[itn.city] || itn.city,
        startDate: itn.start_date,
        endDate:   itn.end_date,
      },
      {
        onSuccess: (trip) => navigate(`/trips/${trip.id}`),
        onError:   (err)  => { setImportError(err.message || 'Could not import. Try again.'); setImportingId(null) },
      }
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Plan with Friends</h1>
          <p className="text-white/50 text-sm">Create and manage your group trip plans.</p>
        </div>

        {/* Start a new group trip */}
        <section className="mb-8">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Start a group trip</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Option A: import from AI itinerary */}
            <button
              type="button"
              onClick={() => setMode(mode === 'import' ? null : 'import')}
              className={`p-5 rounded-2xl border text-left transition-all ${
                mode === 'import'
                  ? 'border-blue-500/50 bg-blue-600/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/25'
              }`}
            >
              <div className="text-2xl mb-2">🤖</div>
              <div className="font-semibold text-sm">Use an AI Itinerary</div>
              <div className="text-white/40 text-xs mt-1">Import a generated itinerary — all days move across instantly</div>
            </button>

            {/* Option B: create from scratch (wizard) */}
            <Link
              to="/trips/new"
              className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/25 text-left transition-all block"
            >
              <div className="text-2xl mb-2">✏️</div>
              <div className="font-semibold text-sm">Create a Shared Itinerary</div>
              <div className="text-white/40 text-xs mt-1">Build your schedule from scratch and invite the team</div>
            </Link>

          </div>
        </section>

        {/* AI Itinerary picker — expanded */}
        {mode === 'import' && (
          <section className="mb-8 bg-white/[0.03] border border-blue-500/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Your saved AI itineraries</h3>
              <Link to="/itinerary" className="text-xs text-blue-400 hover:text-blue-300 transition">
                Generate new →
              </Link>
            </div>

            {itnLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2].map(i => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}
              </div>
            ) : itineraries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/40 text-sm mb-4">No saved itineraries yet.</p>
                <Link
                  to="/itinerary"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition inline-block"
                >
                  Generate an itinerary →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {itineraries.map(itn => (
                  <div
                    key={itn.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {itn.itinerary_data?.headline || `${CITY_LABELS[itn.city] || itn.city} Trip`}
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">
                        📍 {CITY_LABELS[itn.city] || itn.city}
                        {itn.start_date && (
                          <> · {new Date(itn.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {' – '}{new Date(itn.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                        )}
                        {itn.itinerary_data?.days?.length > 0 && ` · ${itn.itinerary_data.days.length} days`}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={importingId === itn.id}
                      onClick={() => handleImport(itn)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-60 rounded-lg text-xs font-semibold transition whitespace-nowrap flex-shrink-0"
                    >
                      {importingId === itn.id ? '⏳ Importing…' : 'Import →'}
                    </button>
                  </div>
                ))}
                {importError && (
                  <p className="text-red-400 text-xs mt-1 text-center">{importError}</p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Existing group trips */}
        <section>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Your group trips</p>

          {tripsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />)}
            </div>
          ) : trips.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map(t => <TripCard key={t.id} trip={t} />)}
            </div>
          ) : (
            <div className="text-center py-14">
              <div className="text-4xl mb-3">🗺️</div>
              <p className="text-white/40 text-sm">No group trips yet — start one above.</p>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
