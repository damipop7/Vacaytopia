/**
 * Active city configuration.
 * Set VITE_ACTIVE_CITIES=Kansas City in .env to enable KC-only mode.
 * Comma-separated for multiple: VITE_ACTIVE_CITIES=Kansas City,Miami
 * Leave blank to show all cities.
 */

const raw = import.meta.env.VITE_ACTIVE_CITIES || ''

export const ACTIVE_CITIES = raw
  .split(',')
  .map(c => c.trim())
  .filter(Boolean)

// True when a single city is active (KC-only mode for World Cup)
export const SINGLE_CITY_MODE = ACTIVE_CITIES.length === 1

export function isCityActive(cityName) {
  if (ACTIVE_CITIES.length === 0) return true  // no filter = show all
  return ACTIVE_CITIES.some(c => c.toLowerCase() === cityName.toLowerCase())
}
