import { describe, it, expect } from 'vitest'
import { isMapsUrl, isWellFormedBookingUrl } from '../lib/linkValidation'
import { resolveCtaLabel } from '../pages/ExperiencePage'

// ── isMapsUrl ─────────────────────────────────────────────────────────────────

describe('isMapsUrl', () => {
  it('recognises maps.google.com', () => {
    expect(isMapsUrl('https://maps.google.com/?q=joeskc')).toBe(true)
  })

  it('recognises google.com/maps deep-links', () => {
    expect(isMapsUrl('https://www.google.com/maps/place/Joe%27s+KC')).toBe(true)
  })

  it('recognises goo.gl short links', () => {
    expect(isMapsUrl('https://goo.gl/maps/abc123')).toBe(true)
  })

  it('recognises maps.app.goo.gl', () => {
    expect(isMapsUrl('https://maps.app.goo.gl/xyz')).toBe(true)
  })

  it('returns false for non-maps URLs', () => {
    expect(isMapsUrl('https://joeskc.com')).toBe(false)
    expect(isMapsUrl('https://yelp.com/biz/joeskc')).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(isMapsUrl(null)).toBe(false)
    expect(isMapsUrl(undefined)).toBe(false)
  })

  it('returns false for malformed URL strings', () => {
    expect(isMapsUrl('not a url')).toBe(false)
  })
})

// ── isWellFormedBookingUrl ────────────────────────────────────────────────────

describe('isWellFormedBookingUrl', () => {
  it('trusts OpenTable URLs', () => {
    expect(isWellFormedBookingUrl('https://www.opentable.com/r/some-restaurant')).toBe(true)
  })

  it('trusts DoorDash URLs', () => {
    expect(isWellFormedBookingUrl('https://www.doordash.com/store/joes-kc-bbq')).toBe(true)
  })

  it('trusts Eventbrite URLs', () => {
    expect(isWellFormedBookingUrl('https://www.eventbrite.com/e/some-event')).toBe(true)
  })

  it('trusts Ticketmaster URLs', () => {
    expect(isWellFormedBookingUrl('https://www.ticketmaster.com/event/abc')).toBe(true)
  })

  it('trusts Instagram URLs', () => {
    expect(isWellFormedBookingUrl('https://www.instagram.com/joeskc')).toBe(true)
  })

  it('trusts Google Maps URLs via isMapsUrl', () => {
    expect(isWellFormedBookingUrl('https://maps.google.com/?q=test')).toBe(true)
  })

  it('trusts URLs with /order in the path', () => {
    expect(isWellFormedBookingUrl('https://somerestaurant.com/order')).toBe(true)
  })

  it('trusts URLs with /reserve in the path', () => {
    expect(isWellFormedBookingUrl('https://someplace.com/reserve-table')).toBe(true)
  })

  it('trusts URLs with /book in the path', () => {
    expect(isWellFormedBookingUrl('https://someplace.com/book-now')).toBe(true)
  })

  it('trusts URLs with /delivery in the path', () => {
    expect(isWellFormedBookingUrl('https://someplace.com/delivery')).toBe(true)
  })

  it('rejects a plain homepage URL', () => {
    expect(isWellFormedBookingUrl('https://joeskc.com')).toBe(false)
  })

  it('rejects null', () => {
    expect(isWellFormedBookingUrl(null)).toBe(false)
  })

  it('rejects malformed URL', () => {
    expect(isWellFormedBookingUrl('not a url')).toBe(false)
  })
})

// ── resolveCtaLabel ───────────────────────────────────────────────────────────

describe('resolveCtaLabel', () => {
  const baseCta = {
    primary:   { label: 'Reserve a table →', href: 'https://opentable.com/r/foo' },
    secondary: { label: 'Get directions →',  href: 'https://maps.google.com/foo' },
  }

  it('leaves CTA unchanged when link is verified', () => {
    const result = resolveCtaLabel(baseCta, true)
    expect(result.primary.label).toBe('Reserve a table →')
  })

  it('downgrades transactional label to "Visit website →" when unverified', () => {
    const result = resolveCtaLabel(baseCta, false)
    expect(result.primary.label).toBe('Visit website →')
  })

  it('preserves href when downgrading label', () => {
    const result = resolveCtaLabel(baseCta, false)
    expect(result.primary.href).toBe('https://opentable.com/r/foo')
  })

  it('does not change non-transactional labels like "Get directions →"', () => {
    const cta = { primary: { label: 'Get directions →', href: 'https://maps.google.com' }, secondary: null }
    expect(resolveCtaLabel(cta, false).primary.label).toBe('Get directions →')
  })

  it('downgrades "Get tickets →" when unverified', () => {
    const cta = { primary: { label: 'Get tickets →', href: 'https://ticketmaster.com' }, secondary: null }
    expect(resolveCtaLabel(cta, false).primary.label).toBe('Visit website →')
  })

  it('downgrades "Order online →" when unverified', () => {
    const cta = { primary: { label: 'Order online →', href: 'https://doordash.com' }, secondary: null }
    expect(resolveCtaLabel(cta, false).primary.label).toBe('Visit website →')
  })

  it('returns cta unchanged when primary is null', () => {
    const cta = { primary: null, secondary: null }
    expect(resolveCtaLabel(cta, false)).toEqual(cta)
  })

  it('returns null cta unchanged', () => {
    expect(resolveCtaLabel(null, false)).toBeNull()
  })

  it('preserves secondary CTA regardless of link status', () => {
    const result = resolveCtaLabel(baseCta, false)
    expect(result.secondary.label).toBe('Get directions →')
  })
})
