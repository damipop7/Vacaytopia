/** ICS generation + Google Calendar deep-link utilities for Vtopia trips. */

function pad(n) { return String(n).padStart(2, '0') }

/** Format a JS Date to ICS DTSTART/DTEND string (local time, no timezone). */
function toICSDate(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    pad(date.getMinutes()),
    '00',
  ].join('')
}

/** Parse a "HH:MM AM/PM" string into { hours, minutes } in 24-hour format. */
function parseTime(timeStr) {
  if (!timeStr) return { hours: 9, minutes: 0 }
  const m = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!m) return { hours: 9, minutes: 0 }
  let h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0
  return { hours: h, minutes: min }
}

/** Slot → default hour so "afternoon" → 2pm etc. */
const SLOT_HOURS = { morning: 9, afternoon: 14, evening: 19, night: 21 }

/**
 * Build a single VEVENT block.
 * @param {object} exp - trip_experience row joined with experiences
 * @param {Date} tripStart - trip start date
 * @param {string} tripId - for the back-link
 */
export function buildVEvent(exp, tripStart, tripId) {
  const dayOffset = (exp.day_number ?? 1) - 1
  const base = new Date(tripStart)
  base.setDate(base.getDate() + dayOffset)

  const parsed  = exp.start_time ? parseTime(exp.start_time) : null
  const slotHour = parsed?.hours   ?? (SLOT_HOURS[exp.time_slot] ?? 9)
  const slotMin  = parsed?.minutes ?? 0

  const start = new Date(base)
  start.setHours(slotHour, slotMin, 0, 0)

  const end = new Date(start)
  end.setHours(start.getHours() + 2)

  const name    = exp.experiences?.title ?? exp.custom_name ?? 'Vtopia Activity'
  const tip     = exp.experiences?.tips  ?? ''
  const address = exp.experiences?.address ?? exp.experiences?.city ?? 'Kansas City'
  const url     = exp.experiences?.external_url ?? exp.experiences?.maps_url ?? ''

  const lines = [
    'BEGIN:VEVENT',
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${name} — Vtopia`,
    `DESCRIPTION:${tip ? tip + '\\n\\n' : ''}Booked via Vtopia: https://vtopia.world/trips/${tripId}`,
    `LOCATION:${address}`,
    url ? `URL:${url}` : null,
    `STATUS:CONFIRMED`,
    `END:VEVENT`,
  ].filter(Boolean)

  return lines.join('\r\n')
}

/**
 * Generate a complete .ics file string for a list of trip experiences.
 * @param {string} tripTitle
 * @param {object[]} experiences - trip_experience rows with joined `experiences`
 * @param {Date} tripStart
 * @param {string} tripId
 */
export function generateICS(tripTitle, experiences, tripStart, tripId) {
  const vevents = experiences.map(e => buildVEvent(e, tripStart, tripId)).join('\r\n')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vtopia//KC Trip Planner//EN',
    `X-WR-CALNAME:${tripTitle}`,
    vevents,
    'END:VCALENDAR',
  ].join('\r\n')
}

/** Trigger a browser download of an .ics file. */
export function downloadICS(content, filename = 'vtopia-trip.ics') {
  const blob = new Blob([content], { type: 'text/calendar' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Google Calendar deep-link for a single experience.
 * @param {object} exp - trip_experience joined with experiences
 * @param {Date} tripStart
 */
export function googleCalendarUrl(exp, tripStart) {
  const dayOffset = (exp.day_number ?? 1) - 1
  const base = new Date(tripStart)
  base.setDate(base.getDate() + dayOffset)

  const parsed = exp.start_time ? parseTime(exp.start_time) : null
  const hours   = parsed?.hours   ?? (SLOT_HOURS[exp.time_slot] ?? 9)
  const minutes = parsed?.minutes ?? 0

  const start = new Date(base)
  start.setHours(hours, minutes, 0, 0)
  const end = new Date(start)
  end.setHours(start.getHours() + 2, start.getMinutes(), 0, 0)

  // Use local-time ISO string so the calendar event lands in the user's timezone
  const fmt = (d) => [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate()),
    'T',
    pad(d.getHours()),
    pad(d.getMinutes()),
    '00',
  ].join('')

  const name     = exp.experiences?.title ?? exp.custom_name ?? 'Vtopia Activity'
  const details  = exp.experiences?.tips ?? 'Planned via Vtopia'
  const location = exp.experiences?.address ?? exp.experiences?.city ?? 'Kansas City'

  // Build query string manually to keep spaces as %20 (decodable by decodeURIComponent)
  const qs = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(name)}`,
    `dates=${fmt(start)}/${fmt(end)}`,
    `details=${encodeURIComponent(details)}`,
    `location=${encodeURIComponent(location)}`,
  ].join('&')
  return `https://calendar.google.com/calendar/render?${qs}`
}
