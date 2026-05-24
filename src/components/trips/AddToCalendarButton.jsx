import { useState } from 'react'
import { generateICS, downloadICS, googleCalendarUrl } from '../../lib/tripCalendar'

/**
 * "Add to Calendar" button that shows a dropdown with:
 *  - Download .ics (Apple Calendar / Outlook)
 *  - Open Google Calendar
 *
 * @param {object} props
 * @param {object[]} props.experiences - trip_experience rows joined with `experiences`
 * @param {string}   props.tripTitle
 * @param {string}   props.tripId
 * @param {Date|string} props.tripStart - trip start date
 * @param {object|null}  props.singleExp - if set, show single-experience export only
 */
export default function AddToCalendarButton({ experiences, tripTitle, tripId, tripStart, singleExp = null }) {
  const [open, setOpen] = useState(false)
  const startDate = tripStart instanceof Date ? tripStart : new Date(tripStart)

  function handleICS() {
    const list = singleExp ? [singleExp] : experiences
    const content = generateICS(tripTitle, list, startDate, tripId)
    downloadICS(content, `${tripTitle.replace(/\s+/g, '-').toLowerCase()}.ics`)
    setOpen(false)
  }

  function handleGoogle() {
    const exp = singleExp ?? experiences[0]
    if (!exp) return
    window.open(googleCalendarUrl(exp, startDate), '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition"
      >
        📅 Add to calendar
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden w-52">
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/5 transition text-left"
            >
              <span className="text-base">📆</span> Google Calendar
            </button>
            <button
              type="button"
              onClick={handleICS}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/5 transition text-left border-t border-white/5"
            >
              <span className="text-base">⬇️</span> Download .ics
              <span className="text-white/40 text-xs ml-auto">Apple / Outlook</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
