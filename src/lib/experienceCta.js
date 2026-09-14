/**
 * Per-experience-type "follow-through plan" — decides what action(s) to
 * surface for a given experience (reserve, order online, get tickets, just
 * directions, etc). Shared between ExperiencePage's full action panel and
 * ExperienceCard's compact grid-card CTA so they never drift out of sync.
 */

// Only these types go through the Vtopia internal booking flow (BookingPanel).
// Everything else gets an external follow-through action instead.
export const BOOKABLE_VIA_VTOPIA = new Set(['reservable'])

const UTM = 'utm_source=vtopia&utm_medium=referral&utm_campaign=wc2026'

export function addUtm(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    u.searchParams.set('utm_source', 'vtopia')
    u.searchParams.set('utm_medium', 'referral')
    u.searchParams.set('utm_campaign', 'wc2026')
    return u.toString()
  } catch {
    return url.includes('?') ? `${url}&${UTM}` : `${url}?${UTM}`
  }
}

export function resolveCta(exp) {
  const type       = exp.experience_type || 'reservable'
  // 'broken' links are hidden; 'unverified' links degrade gracefully (label only changes in resolveCtaLabel)
  const linkBroken = exp.link_status === 'broken'
  const external   = linkBroken ? null : (exp.external_url || exp.website || null)
  const mapsUrl      = addUtm(exp.maps_url) ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${exp.title} ${exp.city}`)}&${UTM}`
  const ticketLink   = addUtm(linkBroken ? null : exp.ticket_url) || addUtm(external) || mapsUrl
  const deliveryLink = addUtm(linkBroken ? null : exp.delivery_url) || addUtm(external) || mapsUrl
  const extLink      = addUtm(external) || mapsUrl

  switch (type) {
    case 'restaurant_reserve':
      return {
        primary:   { label: 'Reserve a table →', href: extLink },
        secondary: { label: 'Get directions →',  href: mapsUrl },
      }
    case 'food_walkup':
    case 'food_delivery':
      return {
        primary:   { label: 'Order online →',   href: deliveryLink },
        secondary: { label: 'Get directions →', href: mapsUrl },
      }
    case 'outdoor_free':
    case 'free_no_booking':
    case 'outdoor_info':
      return {
        primary:   { label: 'Get directions →', href: mapsUrl },
        secondary: null,
      }
    case 'outdoor_paid':
      return {
        primary:   { label: 'View tickets →',   href: extLink },
        secondary: { label: 'Get directions →', href: mapsUrl },
      }
    case 'cultural_free':
      return {
        primary:   { label: 'Get directions →', href: mapsUrl },
        secondary: external ? { label: 'Visit website →', href: extLink } : null,
      }
    case 'cultural_paid':
      return {
        primary:   { label: 'Get tickets →',    href: extLink },
        secondary: { label: 'Get directions →', href: mapsUrl },
      }
    case 'nightlife_walkin':
    case 'nightlife':
      return {
        primary:   { label: 'Get directions →', href: mapsUrl },
        secondary: external ? { label: 'Visit website →', href: extLink } : null,
      }
    case 'nightlife_ticketed':
      return {
        primary:   { label: 'Get tickets →',    href: ticketLink },
        secondary: { label: 'Get directions →', href: mapsUrl },
      }
    case 'ticketed':
      return {
        primary:   { label: 'Get tickets →',    href: ticketLink },
        secondary: { label: 'Get directions →', href: mapsUrl },
      }
    case 'shopping':
      return {
        primary:   { label: external ? 'Visit website →' : 'Get directions →', href: external ? extLink : mapsUrl },
        secondary: external ? { label: 'Get directions →', href: mapsUrl } : null,
      }
    case 'sports_event':
      return {
        primary:   { label: 'Get tickets →',    href: ticketLink },
        secondary: { label: 'Get directions →', href: mapsUrl },
      }
    case 'transport':
      return {
        primary:   { label: 'View routes →', href: extLink },
        secondary: null,
      }
    case 'hotel':
      return {
        primary:   { label: 'Check availability →', href: extLink },
        secondary: null,
      }
    default:
      return {
        primary:   { label: 'Get directions →', href: mapsUrl },
        secondary: null,
      }
  }
}

// Downgrade transactional CTA labels to "Visit website →" for unverified links
// so we don't promise a working booking flow that may just be a homepage.
const TRANSACTIONAL_LABELS = new Set([
  'Reserve a table →', 'Order online →', 'View tickets →',
  'Get tickets →', 'Check availability →', 'View routes →',
])

export function resolveCtaLabel(cta, linkVerified) {
  if (linkVerified || !cta?.primary) return cta
  const primary = TRANSACTIONAL_LABELS.has(cta.primary.label)
    ? { ...cta.primary, label: 'Visit website →' }
    : cta.primary
  return { ...cta, primary }
}

export function typeLabel(type) {
  return {
    reservable:          'Book via Vtopia',
    restaurant_reserve:  'Restaurant — reservation recommended',
    food_walkup:         'Walk in — no reservation needed',
    food_delivery:       'Walk in — order online available',
    outdoor_free:        'Free outdoor experience',
    outdoor_paid:        'Outdoor — entry fee required',
    cultural_free:       'Free admission',
    cultural_paid:       'Entry fee required',
    nightlife_walkin:    'Walk in — no cover required',
    nightlife_ticketed:  'Tickets required',
    ticketed:            'External tickets required',
    shopping:            'Shopping & retail',
    sports_event:        'Sporting event — tickets required',
    transport:           'Getting around',
    hotel:               'Accommodation',
    free_no_booking:     'Free — no booking needed',
    nightlife:           'Nightlife',
    outdoor_info:        'Outdoor experience',
  }[type] ?? 'Experience'
}

/** Whether a card/panel should show an external follow-through CTA at all — false for
 * Vtopia-internal bookings (their action is the internal BookingPanel, not an external link)
 * and for directions-only types (nothing to transact, a link would just be clutter). */
export function hasExternalCta(exp) {
  if (BOOKABLE_VIA_VTOPIA.has(exp.experience_type || 'reservable')) return false
  const cta = resolveCta(exp)
  return cta.primary.label !== 'Get directions →'
}
