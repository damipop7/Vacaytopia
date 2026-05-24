import { Link } from 'react-router-dom'
import MemberAvatarStack from './MemberAvatarStack'

function formatDateRange(start, end) {
  if (!start) return 'Dates TBD'
  const s = new Date(start)
  const e = end ? new Date(end) : null
  const opts = { month: 'short', day: 'numeric' }
  if (!e) return s.toLocaleDateString('en-US', opts)
  if (s.getFullYear() !== e.getFullYear())
    return `${s.toLocaleDateString('en-US', { ...opts, year: 'numeric' })} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`
}

const STATUS_CHIP = {
  planning:  { label: 'Planning',   cls: 'bg-blue-500/15 text-blue-400'   },
  confirmed: { label: 'Confirmed',  cls: 'bg-green-500/15 text-green-400' },
  completed: { label: 'Completed',  cls: 'bg-white/10 text-white/40'      },
}

export default function TripCard({ trip }) {
  const members   = trip.trip_members ?? []
  const totalCents = trip.total_budget_cents ?? 0
  const pooledCents = members.reduce((s, m) => s + (m.contribution_cents ?? 0), 0)
  const budgetPct  = totalCents > 0 ? Math.min(100, (pooledCents / totalCents) * 100) : 0
  const chip       = STATUS_CHIP[trip.status] ?? STATUS_CHIP.planning

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="block rounded-2xl border border-white/10 bg-white/[0.03] hover:border-blue-500/30 hover:bg-white/[0.05] transition p-5 group"
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <h3 className="font-bold text-white text-sm leading-tight group-hover:text-blue-300 transition line-clamp-2">
          {trip.title}
        </h3>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${chip.cls}`}>
          {chip.label}
        </span>
      </div>

      <p className="text-white/50 text-xs mb-3">
        📍 {trip.destination} &nbsp;·&nbsp; 📅 {formatDateRange(trip.start_date, trip.end_date)}
      </p>

      {members.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <MemberAvatarStack members={members} max={4} size={24} />
          <span className="text-white/40 text-xs">
            {trip.trip_type === 'group' ? `${members.length} traveler${members.length !== 1 ? 's' : ''}` : 'Solo'}
          </span>
        </div>
      )}

      {totalCents > 0 && (
        <div>
          <div className="flex justify-between text-[10px] text-white/40 mb-1">
            <span>${Math.round(pooledCents / 100)} pooled</span>
            <span>of ${Math.round(totalCents / 100)}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${budgetPct}%` }} />
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-blue-400 group-hover:text-blue-300 transition font-semibold">
        View trip →
      </div>
    </Link>
  )
}
