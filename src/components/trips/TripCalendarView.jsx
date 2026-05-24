const SLOTS = ['morning', 'afternoon', 'evening', 'night']
const SLOT_ICONS  = { morning: '🌅', afternoon: '☀️', evening: '🌙', night: '🌃' }
const SLOT_LABELS = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night' }

const STATUS_COLOR = {
  approved:  '#22C55E',
  suggested: '#F59E0B',
  booked:    '#6366F1',
  rejected:  '#6B7280',
}

// Reshapes flat experiences list into { [dayNumber]: { [slot]: item[] } }
export function buildCalendarGrid(days, experiences) {
  const grid = {}
  for (const { day } of days) {
    grid[day] = { morning: [], afternoon: [], evening: [], night: [] }
  }
  for (const exp of (experiences ?? [])) {
    const cell = grid[exp.day_number]
    if (cell && exp.time_slot && cell[exp.time_slot] !== undefined) {
      cell[exp.time_slot].push(exp)
    }
  }
  return grid
}

function CalendarCell({ items }) {
  if (!items.length) return <div className="min-h-[52px]" />
  return (
    <div className="flex flex-col gap-1 py-0.5">
      {items.map(item => {
        const title = item.experiences?.title ?? item.custom_name ?? 'Experience'
        const color = STATUS_COLOR[item.status] ?? '#9CA3AF'
        return (
          <div
            key={item.id}
            className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 border border-white/[0.08] hover:border-white/20 transition"
            title={title}
          >
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[3px]" style={{ background: color }} />
            <span className="text-white/80 text-[11px] leading-snug line-clamp-2">{title}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function TripCalendarView({ days, experiences }) {
  const grid = buildCalendarGrid(days, experiences)
  const colCount = days.length

  if (!colCount) {
    return (
      <div className="h-48 flex items-center justify-center text-white/30 text-sm">
        Set trip dates to see the calendar view.
      </div>
    )
  }

  const gridCols = `100px repeat(${colCount}, minmax(120px, 1fr))`

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
      <div style={{ minWidth: 100 + colCount * 120 }}>

        {/* Day header row */}
        <div className="grid border-b border-white/10" style={{ gridTemplateColumns: gridCols }}>
          <div className="px-3 py-3" />
          {days.map(({ day, date }) => (
            <div key={day} className="px-2 py-3 border-l border-white/[0.06] text-center">
              <div className="text-white font-semibold text-xs">Day {day}</div>
              {date && (
                <div className="text-white/35 text-[10px] mt-0.5">
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Slot rows */}
        {SLOTS.map((slot, si) => (
          <div
            key={slot}
            className="grid"
            style={{ gridTemplateColumns: gridCols, borderTop: si > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
          >
            {/* Slot label */}
            <div className="flex flex-col items-start gap-0.5 px-3 py-3">
              <span className="text-base leading-none">{SLOT_ICONS[slot]}</span>
              <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mt-1">
                {SLOT_LABELS[slot]}
              </span>
            </div>

            {/* Day cells */}
            {days.map(({ day }) => (
              <div key={day} className="border-l border-white/[0.06] px-1.5 py-1.5 min-h-[64px]">
                <CalendarCell items={grid[day]?.[slot] ?? []} />
              </div>
            ))}
          </div>
        ))}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 px-4 py-2.5 border-t border-white/[0.06]">
          {Object.entries(STATUS_COLOR).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-white/40 text-[10px] capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
