import { Link } from 'react-router-dom'
import VoteButton from './VoteButton'
import AddToCalendarButton from './AddToCalendarButton'

const STATUS_STYLES = {
  approved:  { label: 'Approved ✓',   cls: 'bg-green-500/15 text-green-400 border-green-500/25' },
  rejected:  { label: 'Passed',        cls: 'bg-red-500/10   text-red-400   border-red-500/20'   },
  booked:    { label: 'Booked 🎫',    cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  suggested: { label: 'Suggested',     cls: 'bg-white/5      text-white/40  border-white/10'      },
}

export default function ExperienceSlotCard({
  item,
  myVote,
  onVote,
  onApprove,
  onRemove,
  isOwner,
  tripStart,
  tripId,
  tripTitle,
}) {
  const exp       = item.experiences
  const name      = exp?.title ?? item.custom_name ?? 'Custom experience'
  const status    = STATUS_STYLES[item.status] ?? STATUS_STYLES.suggested
  const isBooked  = item.status === 'booked'
  const isApproved = item.status === 'approved'

  return (
    <div className={`rounded-xl border bg-white/[0.03] overflow-hidden transition group ${
      isApproved ? 'border-green-500/25' : isBooked ? 'border-amber-500/25' : 'border-white/10'
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Emoji / image */}
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
            {exp?.image_emoji ?? '🌍'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h4 className="font-semibold text-sm text-white leading-tight">{name}</h4>
                {exp?.category && <p className="text-white/40 text-xs mt-0.5">{exp.category}</p>}
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.cls} flex-shrink-0`}>
                {status.label}
              </span>
            </div>

            {exp?.tips && (
              <p className="text-white/50 text-xs mt-1.5 line-clamp-2">💡 {exp.tips}</p>
            )}
            {item.notes && (
              <p className="text-blue-300/70 text-xs mt-1 italic">"{item.notes}"</p>
            )}

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {/* Voting */}
              <div className="flex items-center gap-1.5">
                <VoteButton
                  direction="up"
                  count={item.votes_up}
                  active={myVote === 1}
                  onVote={onVote}
                  disabled={isBooked}
                />
                <VoteButton
                  direction="down"
                  count={item.votes_down}
                  active={myVote === -1}
                  onVote={onVote}
                  disabled={isBooked}
                />
              </div>

              {/* Experience page link */}
              {exp?.id && (
                <Link
                  to={`/experience/${exp.id}`}
                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  Details →
                </Link>
              )}

              {/* Calendar export */}
              {tripStart && (item.status === 'approved' || item.status === 'booked') && (
                <AddToCalendarButton
                  experiences={[item]}
                  tripTitle={tripTitle}
                  tripId={tripId}
                  tripStart={tripStart}
                  singleExp={item}
                />
              )}
            </div>
          </div>
        </div>

        {/* Owner actions */}
        {isOwner && item.status === 'suggested' && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => onApprove(item.id, 'approved')}
              className="flex-1 py-1.5 rounded-lg bg-green-500/15 border border-green-500/25 text-green-400 text-xs font-semibold hover:bg-green-500/25 transition"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => onApprove(item.id, 'rejected')}
              className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 text-xs font-semibold hover:bg-white/10 transition"
            >
              Pass
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="py-1.5 px-3 rounded-lg text-red-400/60 text-xs hover:text-red-400 transition"
                aria-label="Remove"
              >
                ×
              </button>
            )}
          </div>
        )}
        {!isOwner && onRemove && item.added_by && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="mt-2 text-[10px] text-white/20 hover:text-red-400 transition"
          >
            Remove my suggestion
          </button>
        )}
      </div>
    </div>
  )
}
