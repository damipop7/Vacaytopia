const EARTH_RADIUS_MI = 3958.8

/** Haversine distance in miles between two lat/lng points. */
export function distanceMi(lat1, lng1, lat2, lng2) {
  const toRad = deg => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_MI * 2 * Math.asin(Math.sqrt(a))
}

/** Human-readable distance string. */
export function formatDistance(mi) {
  if (mi < 0.1) return `${Math.round(mi * 5280)} ft`
  if (mi < 10)  return `${mi.toFixed(1)} mi`
  return `${Math.round(mi)} mi`
}

/** Walking time estimate (avg 3 mph). Returns null for distances over 1 mi. */
export function walkMinutes(mi) {
  if (mi > 1) return null
  return Math.round((mi / 3) * 60)
}
