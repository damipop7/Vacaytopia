// Opening-hours helpers for the `hours` JSONB column.
// Format: { mon: "09:00-21:00", tue: "Closed", ... }  (24h, America/Chicago)

const KC_TZ = 'America/Chicago'

function parseRange(rangeStr) {
  if (!rangeStr) return null
  const m = rangeStr.match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/)
  return m ? { open: m[1], close: m[2] } : null
}

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const ampm   = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`
}

export function getDayKey(now = new Date()) {
  return now.toLocaleDateString('en-US', { timeZone: KC_TZ, weekday: 'short' }).slice(0, 3).toLowerCase()
}

export function getTodayHours(hours, now = new Date()) {
  if (!hours || typeof hours !== 'object') return null
  const val = hours[getDayKey(now)]
  return val !== undefined ? val : null
}

export function isOpenNow(hours, now = new Date()) {
  if (!hours || typeof hours !== 'object') return null
  const todayRange = getTodayHours(hours, now)
  if (todayRange === null) return null
  if (todayRange.toLowerCase() === 'closed') return false

  const range = parseRange(todayRange)
  if (!range) return null

  const openMins  = toMinutes(range.open)
  const closeMins = toMinutes(range.close)

  const kcTimeStr = now.toLocaleTimeString('en-US', {
    timeZone: KC_TZ, hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23',
  })
  const nowMins = toMinutes(kcTimeStr)

  // Overnight ranges, e.g. 22:00-02:00
  if (closeMins < openMins) return nowMins >= openMins || nowMins < closeMins
  return nowMins >= openMins && nowMins < closeMins
}

export function formatHoursRange(rangeStr) {
  if (!rangeStr) return null
  if (rangeStr.toLowerCase() === 'closed') return 'Closed today'
  const range = parseRange(rangeStr)
  if (!range) return rangeStr
  return `${formatTime(range.open)} – ${formatTime(range.close)}`
}
