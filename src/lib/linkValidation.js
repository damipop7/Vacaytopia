// Pure link-validation helpers shared between validateLinks.ts and tests.

const MAPS_HOSTS = new Set([
  'maps.google.com', 'www.google.com', 'goo.gl', 'maps.app.goo.gl',
])

const TRUSTED_DOMAINS = new Set([
  'doordash.com', 'ubereats.com', 'grubhub.com', 'toasttab.com',
  'opentable.com', 'resy.com', 'tock.com', 'exploretock.com',
  'yelp.com', 'eventbrite.com', 'ticketmaster.com', 'axs.com',
  'viator.com', 'getyourguide.com', 'klook.com',
  'booking.com', 'airbnb.com', 'tripadvisor.com',
  'instagram.com', 'facebook.com', 'linktr.ee',
  'squareup.com', 'square.site', 'clover.com',
  'explorekc.com', 'visitkc.com',
])

const BOOKING_PATHS = [
  '/order', '/reserve', '/book', '/menu', '/tickets',
  '/reservations', '/checkout', '/buy', '/purchase',
  '/delivery', '/ordering', '/dine', '/visit', '/experience',
]

export function isMapsUrl(url) {
  if (!url) return false
  try {
    const u    = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    return MAPS_HOSTS.has(host) || (host === 'google.com' && u.pathname.includes('/maps'))
  } catch { return false }
}

export function isWellFormedBookingUrl(url) {
  if (!url) return false
  try {
    const u    = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (isMapsUrl(url))            return true
    if (TRUSTED_DOMAINS.has(host)) return true
    return BOOKING_PATHS.some(p => u.pathname.toLowerCase().includes(p))
  } catch { return false }
}
