import { describe, it, expect } from 'vitest'
import { dayColor, getTripMapPins } from '../components/trips/TripMap'

// ── dayColor ──────────────────────────────────────────────────────────────────

describe('dayColor', () => {
  it('returns a hex color string', () => {
    expect(dayColor(1)).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('day 1 is blue', () => {
    expect(dayColor(1)).toBe('#3B82F6')
  })

  it('day 2 is orange', () => {
    expect(dayColor(2)).toBe('#F97316')
  })

  it('cycles back after 7 days', () => {
    expect(dayColor(8)).toBe(dayColor(1))
    expect(dayColor(9)).toBe(dayColor(2))
  })

  it('handles null/undefined gracefully (defaults to day 1 color)', () => {
    expect(dayColor(null)).toBe(dayColor(1))
    expect(dayColor(undefined)).toBe(dayColor(1))
  })
})

// ── getTripMapPins ────────────────────────────────────────────────────────────

function makeItem(overrides = {}) {
  return {
    id:            'te-1',
    trip_id:       'trip-1',
    experience_id: 'exp-1',
    day_number:    1,
    time_slot:     'morning',
    status:        'approved',
    custom_name:   null,
    experiences: {
      id:    'exp-1',
      title: "Joe's KC BBQ",
      lat:   39.0997,
      lng:   -94.5786,
    },
    ...overrides,
  }
}

describe('getTripMapPins', () => {
  it('returns empty array for null input', () => {
    expect(getTripMapPins(null)).toEqual([])
  })

  it('returns empty array for empty list', () => {
    expect(getTripMapPins([])).toEqual([])
  })

  it('maps an approved experience with coords to a pin', () => {
    const [pin] = getTripMapPins([makeItem()])
    expect(pin.title).toBe("Joe's KC BBQ")
    expect(pin.lat).toBe(39.0997)
    expect(pin.lng).toBe(-94.5786)
    expect(pin.dayNumber).toBe(1)
    expect(pin.status).toBe('approved')
  })

  it('filters out rejected experiences', () => {
    const items = [makeItem({ status: 'rejected' }), makeItem({ id: 'te-2', status: 'approved' })]
    const pins = getTripMapPins(items)
    expect(pins).toHaveLength(1)
    expect(pins[0].status).toBe('approved')
  })

  it('filters out experiences with no lat/lng', () => {
    const item = makeItem({ experiences: { id: 'exp-1', title: 'No coords', lat: null, lng: null } })
    expect(getTripMapPins([item])).toHaveLength(0)
  })

  it('filters out experiences with no experiences join (custom entries)', () => {
    const item = makeItem({ experiences: null, custom_name: 'My spot', experience_id: null })
    expect(getTripMapPins([item])).toHaveLength(0)
  })

  it('falls back to custom_name when experiences join is missing title', () => {
    const item = makeItem({
      custom_name: 'Secret rooftop',
      experiences: { id: 'exp-1', title: null, lat: 39.1, lng: -94.6 },
    })
    const [pin] = getTripMapPins([item])
    expect(pin.title).toBe('Secret rooftop')
  })

  it('coerces lat/lng to numbers', () => {
    const item = makeItem({ experiences: { id: 'exp-1', title: 'Test', lat: '39.0997', lng: '-94.5786' } })
    const [pin] = getTripMapPins([item])
    expect(typeof pin.lat).toBe('number')
    expect(typeof pin.lng).toBe('number')
  })

  it('sets experienceId to null when experience_id is absent', () => {
    const item = makeItem({ experience_id: null })
    const [pin] = getTripMapPins([item])
    expect(pin.experienceId).toBeNull()
  })

  it('maps multiple items preserving order', () => {
    const items = [
      makeItem({ id: 'te-1', day_number: 1 }),
      makeItem({ id: 'te-2', day_number: 2, experiences: { id: 'exp-2', title: 'Day2 exp', lat: 39.1, lng: -94.6 } }),
    ]
    const pins = getTripMapPins(items)
    expect(pins).toHaveLength(2)
    expect(pins[0].dayNumber).toBe(1)
    expect(pins[1].dayNumber).toBe(2)
  })

  it('includes suggested status experiences', () => {
    const [pin] = getTripMapPins([makeItem({ status: 'suggested' })])
    expect(pin.status).toBe('suggested')
  })
})
