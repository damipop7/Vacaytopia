/**
 * Centralized affiliate URL config.
 * Swap IDs here once affiliate accounts are live — nothing else changes.
 * All IDs read from environment variables so they never touch source control.
 */

const BOOKING_AFF = import.meta.env.VITE_BOOKING_AFFILIATE_ID || ''
const VIATOR_AFF  = import.meta.env.VITE_VIATOR_PARTNER_ID   || ''
const GYG_AFF     = import.meta.env.VITE_GYG_PARTNER_ID      || ''

/** Build a Booking.com deep link for a hotel name + city. */
export function bookingHotelUrl(hotelName, city = 'Kansas City') {
  const q = encodeURIComponent(`${hotelName} ${city}`)
  const base = `https://www.booking.com/search.html?ss=${q}&lang=en-us`
  return BOOKING_AFF ? `${base}&aid=${BOOKING_AFF}` : base
}

/** Build a Booking.com city-level search (for hotel widget below itinerary). */
export function bookingCityUrl(city = 'Kansas City') {
  const q = encodeURIComponent(city)
  const base = `https://www.booking.com/city/us/${q.toLowerCase()}.html`
  return BOOKING_AFF ? `${base}?aid=${BOOKING_AFF}` : base
}

/** Build a Viator search URL for an experience title + city. */
export function viatorSearchUrl(title, city = 'Kansas City') {
  const q = encodeURIComponent(`${title} ${city}`)
  const base = `https://www.viator.com/search/${q}`
  return VIATOR_AFF ? `${base}?pid=${VIATOR_AFF}&mcid=42383&medium=api` : base
}

/** Build a GetYourGuide search URL for an experience title + city. */
export function gygSearchUrl(title, city = 'Kansas City') {
  const q = encodeURIComponent(`${title} ${city}`)
  const base = `https://www.getyourguide.com/s/?q=${q}`
  return GYG_AFF ? `${base}&partner_id=${GYG_AFF}` : base
}

/** Build an OpenTable reservation search URL for a restaurant name + city. */
export function openTableUrl(restaurantName, city = 'Kansas City') {
  const q = encodeURIComponent(`${restaurantName} ${city}`)
  return `https://www.opentable.com/s?term=${q}&covers=2`
}

/** Uber deep link: request a ride to a named destination. */
export function uberDeepLink(destinationName, destinationLat, destinationLng) {
  if (destinationLat && destinationLng) {
    return `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${destinationLat}&dropoff[longitude]=${destinationLng}&dropoff[nickname]=${encodeURIComponent(destinationName)}`
  }
  const q = encodeURIComponent(destinationName)
  return `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${q}`
}

/** Lyft deep link: request a ride to a named destination. */
export function lyftDeepLink(destinationName, destinationLat, destinationLng) {
  if (destinationLat && destinationLng) {
    return `https://lyft.com/ride?destination[latitude]=${destinationLat}&destination[longitude]=${destinationLng}&destination[address]=${encodeURIComponent(destinationName)}`
  }
  return `https://lyft.com/ride?destination[address]=${encodeURIComponent(destinationName)}`
}

/** Whether affiliate IDs are configured (useful for showing/hiding affiliate badges). */
export const affiliatesEnabled = {
  booking: !!BOOKING_AFF,
  viator:  !!VIATOR_AFF,
  gyg:     !!GYG_AFF,
}
