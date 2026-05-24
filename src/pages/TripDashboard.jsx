import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTrip } from '../hooks/useTrip'
import { useTripExperiences, useMyVotes, useVoteTripExperience, useApproveTripExperience, useRemoveTripExperience, useAddTripExperience } from '../hooks/useTripExperiences'
import { useTripRealtime } from '../hooks/useTripRealtime'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { useQuery } from '@tanstack/react-query'
import BudgetPanel from '../components/trips/BudgetPanel'
import ActivityFeed from '../components/trips/ActivityFeed'
import ExperienceSlotCard from '../components/trips/ExperienceSlotCard'
import MemberAvatarStack from '../components/trips/MemberAvatarStack'
import AddToCalendarButton from '../components/trips/AddToCalendarButton'

const SLOTS  = ['morning', 'afternoon', 'evening', 'night']
const SLOT_ICONS = { morning: '🌅', afternoon: '☀️', evening: '🌙', night: '🌃' }
const SLOT_LABELS = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night' }

// ── Add-experience search drawer ─────────────────────────────────────────────

function AddExperienceDrawer({ tripId, dayNumber, timeSlot, onClose }) {
  const [query, setQuery] = useState('')
  const { mutate: addExp, isPending } = useAddTripExperience(tripId)

  const { data: results = [] } = useQuery({
    queryKey: ['exp-search', query],
    queryFn: async () => {
      if (query.trim().length < 2) return []
      const { data } = await supabase
        .from('experiences')
        .select('id, title, category, price_per_person, image_emoji, city')
        .eq('city', 'Kansas City')
        .eq('is_active', true)
        .ilike('title', `%${query}%`)
        .limit(8)
      return data ?? []
    },
    enabled: query.trim().length >= 2,
  })

  const [customName, setCustomName] = useState('')
  const [customType, setCustomType] = useState('other')
  const [tab, setTab] = useState('search')

  function handleAdd(exp) {
    addExp({ experienceId: exp.id, dayNumber, timeSlot }, { onSuccess: onClose })
  }

  function handleAddCustom(e) {
    e.preventDefault()
    if (!customName.trim()) return
    addExp({ experienceId: null, dayNumber, timeSlot, customName: customName.trim(), customType }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 rounded-t-3xl md:rounded-2xl border border-white/10 p-5 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm">
            Add to Day {dayNumber} · {SLOT_LABELS[timeSlot]}
          </h3>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white text-xl">×</button>
        </div>

        <div className="flex gap-2 mb-4">
          {['search','custom'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === t ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {t === 'search' ? '🔍 Search Vtopia' : '✏️ Custom'}
            </button>
          ))}
        </div>

        {tab === 'search' && (
          <div className="flex flex-col gap-3 flex-1 overflow-hidden">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search Kansas City experiences…"
              autoFocus
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
            />
            <div className="overflow-y-auto flex flex-col gap-2">
              {results.length === 0 && query.length >= 2 && (
                <p className="text-white/30 text-sm text-center py-4">No results — try "Custom" to add anything.</p>
              )}
              {results.map(exp => (
                <button
                  key={exp.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleAdd(exp)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition"
                >
                  <span className="text-xl">{exp.image_emoji ?? '🌍'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{exp.title}</div>
                    <div className="text-xs text-white/40">{exp.category}</div>
                  </div>
                  <span className="text-xs text-white/30 font-mono">
                    {exp.price_per_person > 0 ? `$${exp.price_per_person}` : 'Free'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'custom' && (
          <form onSubmit={handleAddCustom} className="flex flex-col gap-3">
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Experience name"
              autoFocus
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
            />
            <select
              value={customType}
              onChange={e => setCustomType(e.target.value)}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
            >
              {['restaurant','outdoor','ticketed','nightlife','other'].map(t => (
                <option key={t} value={t} className="bg-gray-900">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!customName.trim() || isPending}
              className="py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-semibold text-sm transition"
            >
              Add to trip
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Day column ────────────────────────────────────────────────────────────────

function DayColumn({ day, date, experiences, myVotes, isOwner, onVote, onApprove, onRemove, onAdd, tripId, tripStart, trip }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      {/* Day header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 flex-shrink-0">
          {day}
        </div>
        <div>
          {date && <div className="text-white/40 text-xs">{new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>}
          <div className="text-white font-semibold text-sm">Day {day}</div>
        </div>
        <div className="ml-auto">
          <AddToCalendarButton
            experiences={experiences}
            tripTitle={trip?.title ?? 'Vtopia Trip'}
            tripId={tripId}
            tripStart={tripStart}
          />
        </div>
      </div>

      {/* Slots */}
      <div className="p-4 flex flex-col gap-4">
        {SLOTS.map(slot => {
          const slotExps = experiences.filter(e => e.time_slot === slot)
          return (
            <div key={slot}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{SLOT_ICONS[slot]}</span>
                <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">{SLOT_LABELS[slot]}</span>
              </div>

              {slotExps.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {slotExps.map(item => (
                    <ExperienceSlotCard
                      key={item.id}
                      item={item}
                      myVote={myVotes?.[item.id]}
                      onVote={(v) => onVote(item.id, v)}
                      onApprove={(id, status) => onApprove(id, status)}
                      onRemove={onRemove}
                      isOwner={isOwner}
                      tripStart={tripStart}
                      tripId={tripId}
                      tripTitle={trip?.title ?? 'Vtopia Trip'}
                    />
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onAdd(day, slot)}
                  className="w-full py-3 border border-dashed border-white/10 hover:border-blue-500/30 hover:text-blue-400 rounded-xl text-xs text-white/30 transition flex items-center justify-center gap-1.5"
                >
                  <span className="text-base">+</span>
                  Suggest an experience
                </button>
              )}

              {/* Allow adding another to a non-empty slot */}
              {slotExps.length > 0 && (
                <button
                  type="button"
                  onClick={() => onAdd(day, slot)}
                  className="mt-1 w-full text-[11px] text-white/20 hover:text-blue-400 transition text-center py-1"
                >
                  + Add another to this slot
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function TripDashboard() {
  const { tripId } = useParams()
  const navigate   = useNavigate()
  const user       = useAuthStore(s => s.user)

  const { data: trip,        isLoading: tripLoading    } = useTrip(tripId)
  const { data: experiences, isLoading: expLoading     } = useTripExperiences(tripId)
  const { data: myVotes = {} }                           = useMyVotes(tripId)

  useTripRealtime(tripId)

  const { mutate: vote }    = useVoteTripExperience(tripId)
  const { mutate: approve } = useApproveTripExperience(tripId)
  const { mutate: remove }  = useRemoveTripExperience(tripId)

  const [drawerDay,  setDrawerDay]  = useState(null)
  const [drawerSlot, setDrawerSlot] = useState(null)
  const [copied,     setCopied]     = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [feedOpen,   setFeedOpen]   = useState(false)

  const isOwner = trip?.created_by === user?.id ||
    (trip?.trip_members ?? []).some(m => m.user_id === user?.id && ['owner','admin'].includes(m.role))

  const nights = useMemo(() => {
    if (!trip?.start_date || !trip?.end_date) return 3
    return Math.max(1, Math.round((new Date(trip.end_date) - new Date(trip.start_date)) / 86400000))
  }, [trip?.start_date, trip?.end_date])

  const days = useMemo(() => Array.from({ length: nights }, (_, i) => {
    const base = trip?.start_date ? new Date(trip.start_date) : null
    if (base) {
      const d = new Date(base)
      d.setDate(d.getDate() + i)
      return { day: i + 1, date: d.toISOString().split('T')[0] }
    }
    return { day: i + 1, date: null }
  }), [nights, trip?.start_date])

  const shareUrl = trip?.share_token ? `${window.location.origin}/trips/join/${trip.share_token}` : null

  function handleCopyLink() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function handleVote(tripExperienceId, v) {
    vote({ tripExperienceId, vote: v })
  }

  function handleApprove(id, status) {
    approve({ tripExperienceId: id, status })
  }

  if (tripLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="h-12 bg-white/5 rounded-2xl animate-pulse mb-4 w-2/3" />
        <div className="h-6 bg-white/5 rounded-xl animate-pulse mb-8 w-1/3" />
        {[1,2,3].map(i => <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse mb-4" />)}
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <p className="text-white/50">Trip not found.</p>
        <Link to="/trips" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">← My Trips</Link>
      </div>
    )
  }

  const tripStart = trip.start_date ? new Date(trip.start_date) : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <div>
          <Link to="/trips" className="text-white/30 hover:text-white/60 text-xs mb-1 inline-block">← My Trips</Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{trip.title}</h1>
          <p className="text-white/50 text-sm mt-1">
            📍 {trip.destination}
            {trip.start_date && (
              <> &nbsp;·&nbsp; 📅 {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {trip.end_date && ` – ${new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {shareUrl && (
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/15 hover:border-white/30 rounded-xl text-sm font-semibold transition"
            >
              {copied ? '✓ Copied' : '🔗 Share'}
            </button>
          )}
          <AddToCalendarButton
            experiences={experiences ?? []}
            tripTitle={trip.title}
            tripId={tripId}
            tripStart={tripStart ?? new Date()}
          />
        </div>
      </div>

      {/* Members bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <MemberAvatarStack members={trip.trip_members ?? []} max={6} size={28} />
        <span className="text-white/40 text-xs">
          {(trip.trip_members ?? []).length} member{(trip.trip_members ?? []).length !== 1 ? 's' : ''}
        </span>
        {trip.trip_type === 'group' && shareUrl && (
          <button
            type="button"
            onClick={handleCopyLink}
            className="text-xs text-blue-400 hover:text-blue-300 transition"
          >
            + Invite more
          </button>
        )}
      </div>

      {/* Quick panels: budget + activity */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          type="button"
          onClick={() => setBudgetOpen(o => !o)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition border ${
            budgetOpen ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
          }`}
        >
          💰 Budget {budgetOpen ? '▲' : '▼'}
        </button>
        <button
          type="button"
          onClick={() => setFeedOpen(o => !o)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition border ${
            feedOpen ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live &nbsp;{feedOpen ? '▲' : '▼'}
        </button>
      </div>

      {budgetOpen && <div className="mb-5"><BudgetPanel trip={trip} isOwner={isOwner} /></div>}
      {feedOpen   && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <ActivityFeed tripId={tripId} />
        </div>
      )}

      {/* Day columns */}
      {expLoading ? (
        <div className="flex flex-col gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {days.map(({ day, date }) => (
            <DayColumn
              key={day}
              day={day}
              date={date}
              experiences={(experiences ?? []).filter(e => e.day_number === day)}
              myVotes={myVotes}
              isOwner={isOwner}
              onVote={handleVote}
              onApprove={handleApprove}
              onRemove={(id) => remove(id)}
              onAdd={(d, slot) => { setDrawerDay(d); setDrawerSlot(slot) }}
              tripId={tripId}
              tripStart={tripStart}
              trip={trip}
            />
          ))}

          {/* Add a day */}
          {isOwner && (
            <div className="text-center text-white/30 text-sm">
              Need more days?{' '}
              <Link to={`/trips/${tripId}/settings`} className="text-blue-400 hover:text-blue-300">
                Edit trip dates →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Add experience drawer */}
      {drawerDay !== null && drawerSlot !== null && (
        <AddExperienceDrawer
          tripId={tripId}
          dayNumber={drawerDay}
          timeSlot={drawerSlot}
          onClose={() => { setDrawerDay(null); setDrawerSlot(null) }}
        />
      )}
    </div>
  )
}
