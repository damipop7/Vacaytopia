import { describe, it, expect } from 'vitest'
import { resolveCta, hasExternalCta, BOOKABLE_VIA_VTOPIA } from '../lib/experienceCta'

const base = { title: 'Test Place', city: 'Kansas City' }

describe('resolveCta', () => {
  it('gives restaurant_reserve a reserve CTA', () => {
    const cta = resolveCta({ ...base, experience_type: 'restaurant_reserve', external_url: 'https://x.com' })
    expect(cta.primary.label).toBe('Reserve a table →')
  })

  it('gives food_walkup an order-online CTA, not a booking CTA', () => {
    const cta = resolveCta({ ...base, experience_type: 'food_walkup', delivery_url: 'https://doordash.com/x' })
    expect(cta.primary.label).toBe('Order online →')
  })

  it('gives nightlife_walkin directions only — no fake booking action', () => {
    const cta = resolveCta({ ...base, experience_type: 'nightlife_walkin', external_url: 'https://bar.com' })
    expect(cta.primary.label).toBe('Get directions →')
  })

  it('gives outdoor_free directions only', () => {
    const cta = resolveCta({ ...base, experience_type: 'outdoor_free' })
    expect(cta.primary.label).toBe('Get directions →')
  })

  it('defaults unknown/missing type to directions only', () => {
    expect(resolveCta({ ...base }).primary.label).toBe('Get directions →')
    expect(resolveCta({ ...base, experience_type: 'something_new' }).primary.label).toBe('Get directions →')
  })
})

describe('hasExternalCta — decides whether ExperienceCard shows a follow-through icon', () => {
  it('is false for Vtopia-internal bookings (reservable) — their action is the internal BookingPanel, not an external link', () => {
    expect(BOOKABLE_VIA_VTOPIA.has('reservable')).toBe(true)
    expect(hasExternalCta({ ...base, experience_type: 'reservable' })).toBe(false)
    expect(hasExternalCta({ ...base })).toBe(false) // missing type defaults to reservable
  })

  it('is false for directions-only types — a link would just be clutter (regression: previously only outdoor_free/cultural_free were excluded)', () => {
    expect(hasExternalCta({ ...base, experience_type: 'food_walkup' })).toBe(true) // has a real order-online action
    expect(hasExternalCta({ ...base, experience_type: 'nightlife_walkin' })).toBe(false)
    expect(hasExternalCta({ ...base, experience_type: 'outdoor_free' })).toBe(false)
    expect(hasExternalCta({ ...base, experience_type: 'cultural_free' })).toBe(false)
  })

  it('is true for types with a genuine transactional action', () => {
    expect(hasExternalCta({ ...base, experience_type: 'restaurant_reserve' })).toBe(true)
    expect(hasExternalCta({ ...base, experience_type: 'outdoor_paid' })).toBe(true)
    expect(hasExternalCta({ ...base, experience_type: 'cultural_paid' })).toBe(true)
    expect(hasExternalCta({ ...base, experience_type: 'ticketed' })).toBe(true)
    expect(hasExternalCta({ ...base, experience_type: 'sports_event' })).toBe(true)
    expect(hasExternalCta({ ...base, experience_type: 'transport' })).toBe(true)
    expect(hasExternalCta({ ...base, experience_type: 'hotel' })).toBe(true)
  })
})
