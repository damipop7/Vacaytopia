import { useState, useEffect } from 'react'

// World Cup origin cities — shown as offset hints for international visitors
const OFFSET_CITIES = [
  { city: 'New York',  tz: 'America/New_York'   },
  { city: 'London',    tz: 'Europe/London'       },
  { city: 'Lagos',     tz: 'Africa/Lagos'        },
  { city: 'São Paulo', tz: 'America/Sao_Paulo'   },
  { city: 'Buenos Aires', tz: 'America/Argentina/Buenos_Aires' },
]

function getLocalTime(tz) {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function getTzAbbr(tz) {
  const str = new Date().toLocaleTimeString('en-US', { timeZone: tz, timeZoneName: 'short' })
  return str.split(' ').pop() || ''
}

function getHourOffset(fromTz, toTz) {
  const now = new Date()
  const parse = tz => new Date(now.toLocaleString('en-US', { timeZone: tz }))
  const diffHrs = (parse(toTz) - parse(fromTz)) / 3600000
  const rounded = Math.round(diffHrs)
  if (rounded === 0) return null
  return rounded > 0 ? `+${rounded}h` : `${rounded}h`
}

/**
 * Live local time display.
 * theme: 'dark' | 'light'
 * showOffsets: show timezone offset chips for World Cup cities
 * compact: single-line compact variant
 */
export default function LocalClock({
  timezone    = 'America/Chicago',
  label       = 'Kansas City',
  theme       = 'dark',
  showOffsets = false,
  compact     = false,
}) {
  const [time, setTime] = useState(() => getLocalTime(timezone))

  useEffect(() => {
    const id = setInterval(() => setTime(getLocalTime(timezone)), 30000)
    return () => clearInterval(id)
  }, [timezone])

  const tzAbbr = getTzAbbr(timezone)

  // ── Compact — single line ─────────────────────────────────────────────────
  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-sm ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
        <span className={`font-semibold ${theme === 'light' ? 'text-[#0D1B3E]' : 'text-white'}`}>{label}</span>
        <span>{time} {tzAbbr}</span>
      </div>
    )
  }

  // ── Full — with optional offsets ──────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
        <span className={`text-[10px] font-bold uppercase tracking-widest ${
          theme === 'dark' ? 'text-white/40' : 'text-gray-400'
        }`}>{label} Local Time</span>
      </div>
      <div className={`font-bold text-xl leading-none ${theme === 'dark' ? 'text-white' : 'text-[#0D1B3E]'}`}>
        {time}{' '}
        <span className={`text-sm font-normal ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
          {tzAbbr}
        </span>
      </div>
      {showOffsets && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {OFFSET_CITIES.map(c => {
            const diff = getHourOffset(timezone, c.tz)
            return diff ? (
              <span key={c.city} className={`text-[11px] ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
                {c.city}{' '}
                <span className={theme === 'dark' ? 'text-white/50 font-semibold' : 'text-gray-600 font-semibold'}>
                  {diff}
                </span>
              </span>
            ) : null
          })}
        </div>
      )}
    </div>
  )
}
