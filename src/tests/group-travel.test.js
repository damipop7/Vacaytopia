import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { generateICS, buildVEvent, googleCalendarUrl } from '../lib/tripCalendar'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TRIP_START = new Date('2026-06-19T00:00:00')
const TRIP_ID    = 'test-trip-abc'

function makeExp(overrides = {}) {
  return {
    id: 'te-1',
    day_number: 1,
    time_slot: 'morning',
    start_time: null,
    status: 'approved',
    votes_up: 2,
    votes_down: 0,
    notes: '',
    estimated_cost_cents: 3000,
    experiences: {
      id: 'exp-1',
      title: "Joe's Kansas City BBQ",
      city: 'Kansas City',
      tips: 'Order the Z-Man sandwich',
      address: '3002 W 47th Ave, Kansas City',
      external_url: 'https://joeskc.com',
      maps_url: 'https://maps.google.com/?q=joeskc',
    },
    ...overrides,
  }
}

// ── tripCalendar utility tests ────────────────────────────────────────────────

describe('buildVEvent', () => {
  it('returns a string beginning with BEGIN:VEVENT', () => {
    const event = buildVEvent(makeExp(), TRIP_START, TRIP_ID)
    expect(event).toMatch(/^BEGIN:VEVENT/)
  })

  it('includes the experience title in SUMMARY', () => {
    const event = buildVEvent(makeExp(), TRIP_START, TRIP_ID)
    expect(event).toContain("SUMMARY:Joe's Kansas City BBQ")
  })

  it('maps morning slot to 09:00 start time', () => {
    const event = buildVEvent(makeExp({ time_slot: 'morning' }), TRIP_START, TRIP_ID)
    expect(event).toContain('T090000')
  })

  it('maps afternoon slot to 14:00 start time', () => {
    const event = buildVEvent(makeExp({ time_slot: 'afternoon' }), TRIP_START, TRIP_ID)
    expect(event).toContain('T140000')
  })

  it('maps evening slot to 19:00 start time', () => {
    const event = buildVEvent(makeExp({ time_slot: 'evening' }), TRIP_START, TRIP_ID)
    expect(event).toContain('T190000')
  })

  it('uses explicit start_time when provided', () => {
    const event = buildVEvent(makeExp({ start_time: '2:30 PM' }), TRIP_START, TRIP_ID)
    // 2:30 PM = 14:30 local time
    expect(event).toContain('T1430')
  })

  it('offsets date correctly for day_number 2', () => {
    const event = buildVEvent(makeExp({ day_number: 2 }), TRIP_START, TRIP_ID)
    // Day 2 = June 20
    expect(event).toContain('20260620')
  })

  it('falls back gracefully for a custom experience with no experiences join', () => {
    const exp = makeExp({ experiences: null, custom_name: 'My secret spot' })
    const event = buildVEvent(exp, TRIP_START, TRIP_ID)
    expect(event).toContain('My secret spot')
  })

  it('includes Vtopia deep-link in DESCRIPTION', () => {
    const event = buildVEvent(makeExp(), TRIP_START, TRIP_ID)
    expect(event).toContain(`/trips/${TRIP_ID}`)
  })
})

describe('generateICS', () => {
  it('wraps events in a VCALENDAR', () => {
    const ics = generateICS('KC Trip', [makeExp()], TRIP_START, TRIP_ID)
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
  })

  it('includes the calendar name', () => {
    const ics = generateICS('My KC Trip', [makeExp()], TRIP_START, TRIP_ID)
    expect(ics).toContain('X-WR-CALNAME:My KC Trip')
  })

  it('generates one VEVENT per experience', () => {
    const exps = [makeExp({ id: 'te-1' }), makeExp({ id: 'te-2', day_number: 2 })]
    const ics  = generateICS('KC Trip', exps, TRIP_START, TRIP_ID)
    const count = (ics.match(/BEGIN:VEVENT/g) ?? []).length
    expect(count).toBe(2)
  })

  it('handles empty experiences list gracefully', () => {
    const ics = generateICS('KC Trip', [], TRIP_START, TRIP_ID)
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).not.toContain('BEGIN:VEVENT')
  })
})

describe('googleCalendarUrl', () => {
  it('returns a Google Calendar URL', () => {
    const url = googleCalendarUrl(makeExp(), TRIP_START)
    expect(url).toMatch(/^https:\/\/calendar\.google\.com\/calendar\/render/)
  })

  it('includes the experience title in the URL', () => {
    const url = googleCalendarUrl(makeExp(), TRIP_START)
    // title is %20-encoded by encodeURIComponent
    expect(decodeURIComponent(url)).toContain("Joe's Kansas City BBQ")
  })

  it('includes the address as location', () => {
    const url = googleCalendarUrl(makeExp(), TRIP_START)
    expect(decodeURIComponent(url)).toContain('3002 W 47th Ave')
  })

  it('encodes dates in local-time ISO compact format for morning slot', () => {
    const url = googleCalendarUrl(makeExp(), TRIP_START)
    // morning slot = 09:00 local, end = 11:00 local; dates param is not encoded
    expect(url).toContain('20260619T0900')
  })
})

// ── activityLabel tests ───────────────────────────────────────────────────────

import { activityLabel } from '../hooks/useTripActivity'

describe('activityLabel', () => {
  it('formats member_joined correctly', () => {
    const label = activityLabel({ activity_type: 'member_joined', display_name: 'Alex', payload: {} })
    expect(label).toBe('Alex joined the trip')
  })

  it('formats experience_added with day and name', () => {
    const label = activityLabel({
      activity_type: 'experience_added',
      display_name: 'Sam',
      payload: { experience_name: "Joe's KC BBQ", day_number: 2 },
    })
    expect(label).toContain('Sam')
    expect(label).toContain("Joe's KC BBQ")
    expect(label).toContain('Day 2')
  })

  it('formats budget_contributed with dollar amount', () => {
    const label = activityLabel({
      activity_type: 'budget_contributed',
      display_name: 'Jordan',
      payload: { amount_cents: 16700 },
    })
    expect(label).toContain('Jordan')
    expect(label).toContain('$167')
  })

  it('returns message text directly for message type', () => {
    const label = activityLabel({
      activity_type: 'message',
      display_name: 'Alex',
      payload: { text: 'Should we do the bus tour?' },
    })
    expect(label).toBe('Should we do the bus tour?')
  })

  it('handles unknown activity_type without throwing', () => {
    const label = activityLabel({ activity_type: 'future_type', display_name: 'X', payload: {} })
    expect(typeof label).toBe('string')
  })

  it('uses "Someone" for null display_name', () => {
    const label = activityLabel({ activity_type: 'member_joined', display_name: null, payload: {} })
    expect(label).toContain('Someone')
  })
})
