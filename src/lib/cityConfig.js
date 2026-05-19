/**
 * Active city configuration — single source of truth for city gating.
 *
 * World Cup mode (current):  VITE_ACTIVE_CITIES=Kansas City
 * Multi-city (post-WC):      clear VITE_ACTIVE_CITIES in Vercel env vars
 *
 * That one env change re-enables all cities everywhere in the app
 * simultaneously — BrowsePage, ItineraryQuiz, travelQuiz, and the
 * /browse/:city redirect all read from isCityActive() or SINGLE_CITY_MODE.
 *
 * To add a second live city without going fully multi-city:
 *   VITE_ACTIVE_CITIES=Kansas City,Miami
 */

const raw = import.meta.env.VITE_ACTIVE_CITIES || ''

export const ACTIVE_CITIES = raw
  .split(',')
  .map(c => c.trim())
  .filter(Boolean)

// True when exactly one city is active (KC-only mode during World Cup)
export const SINGLE_CITY_MODE = ACTIVE_CITIES.length === 1

export function isCityActive(cityName) {
  if (ACTIVE_CITIES.length === 0) return true  // no filter → show all cities
  return ACTIVE_CITIES.some(c => c.toLowerCase() === cityName.toLowerCase())
}
