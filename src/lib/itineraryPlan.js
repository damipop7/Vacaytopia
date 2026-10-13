/**
 * Turns a generated itinerary into something a traveler can act on:
 * the right next step for each time slot, and travel time between stops.
 */
import { estimateTravelMinutes } from './graph'
import { BOOKABLE_VIA_VTOPIA, resolveCta, resolveCtaLabel, typeLabel } from './experienceCta'

export const SLOT_ORDER = ['morning', 'afternoon', 'evening']

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Anything a short walk away is shown as a walk; beyond that we assume a ride.
const MAX_WALK_MINUTES = 15

/** Catalog experience ids referenced by an itinerary's time slots (deduped, UUIDs only). */
export function itineraryExperienceIds(itinerary) {
  const ids = new Set()
  for (const day of itinerary?.days ?? []) {
    for (const slot of SLOT_ORDER) {
      const id = day?.[slot]?.experienceId
      if (typeof id === 'string' && UUID_RE.test(id)) ids.add(id)
    }
  }
  return [...ids]
}

/**
 * The next step for one time slot.
 *   book     — reservable through Vtopia's own booking flow
 *   external — reserve / tickets / directions on someone else's site
 *   details  — slot points at a catalog id we couldn't load; link to the page and let it decide
 * Returns null for slots that aren't tied to a catalog experience.
 */
export function slotAction(slot, exp) {
  const id = slot?.experienceId
  if (!id) return null
  const to = `/experience/${id}?from=itinerary`

  if (!exp) return { kind: 'details', label: 'View details →', to }

  if (!exp.experience_type || BOOKABLE_VIA_VTOPIA.has(exp.experience_type)) {
    return { kind: 'book', label: 'Book on Vtopia →', to }
  }

  const linkVerified = !exp.link_status || exp.link_status === 'verified'
  const { primary } = resolveCtaLabel(resolveCta(exp), linkVerified)
  return {
    kind:  'external',
    label: primary.label,
    href:  primary.href,
    note:  typeLabel(exp.experience_type),
    to,
  }
}

function coords(exp) {
  const lat = Number(exp?.lat)
  const lng = Number(exp?.lng)
  if (exp?.lat == null || exp?.lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

/**
 * Estimated travel between consecutive slots of one day.
 * Only slots matched to a catalog experience with coordinates produce a leg;
 * estimates are straight-line, so they're a guide rather than a routed time.
 * Returns e.g. [{ from: 'morning', to: 'afternoon', minutes: 12, mode: 'rideshare' }].
 */
export function dayLegs(day, experiencesById = {}) {
  const stops = SLOT_ORDER
    .map((slot) => {
      const id = day?.[slot]?.experienceId
      const at = coords(experiencesById[id])
      return at ? { slot, id, ...at } : null
    })

  const legs = []
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    // Legs only join adjacent slots — skipping an unmatched slot would hide a stop in between.
    if (!a || !b || a.id === b.id) continue
    const walk = estimateTravelMinutes(a, b, 'walk')
    legs.push(
      walk <= MAX_WALK_MINUTES
        ? { from: a.slot, to: b.slot, minutes: walk, mode: 'walk' }
        : { from: a.slot, to: b.slot, minutes: estimateTravelMinutes(a, b, 'rideshare'), mode: 'rideshare' }
    )
  }
  return legs
}
