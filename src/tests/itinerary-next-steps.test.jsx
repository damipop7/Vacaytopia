/**
 * Itinerary follow-through: each time slot gets the right next step for its
 * experience type (book on Vtopia vs. reserve / tickets / directions elsewhere),
 * and consecutive stops get a travel-time estimate.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { itineraryExperienceIds, slotAction, dayLegs } from '../lib/itineraryPlan'
import DayCard from '../components/itinerary/DayCard'

const BBQ_ID    = '11111111-1111-4111-8111-111111111111'
const MUSEUM_ID = '22222222-2222-4222-8222-222222222222'
const BAR_ID    = '33333333-3333-4333-8333-333333333333'

// Downtown KC → Nelson-Atkins is ~5 km; the bar sits a couple of blocks from the museum.
const EXPERIENCES = {
  [BBQ_ID]: {
    id: BBQ_ID, title: 'KC BBQ Tour', city: 'Kansas City', experience_type: 'reservable',
    lat: 39.0997, lng: -94.5786,
  },
  [MUSEUM_ID]: {
    id: MUSEUM_ID, title: 'Nelson-Atkins Museum', city: 'Kansas City', experience_type: 'cultural_paid',
    link_status: 'verified', external_url: 'https://nelson-atkins.org/tickets', lat: 39.0449, lng: -94.5809,
  },
  [BAR_ID]: {
    id: BAR_ID, title: 'Plaza Lounge', city: 'Kansas City', experience_type: 'nightlife_walkin',
    lat: 39.0455, lng: -94.5815,
  },
}

const DAY = {
  day: 1,
  theme: 'BBQ and art',
  morning:   { title: 'BBQ tour', description: 'Eat.', experienceId: BBQ_ID },
  afternoon: { title: 'Museum',   description: 'Look.', experienceId: MUSEUM_ID },
  evening:   { title: 'Drinks',   description: 'Sip.', experienceId: BAR_ID },
  lunch: 'Joe\'s', dinner: 'Q39',
}

describe('itineraryExperienceIds', () => {
  it('collects each catalog id once across days', () => {
    const ids = itineraryExperienceIds({ days: [DAY, { ...DAY, day: 2, evening: null }] })
    expect(ids.sort()).toEqual([BBQ_ID, MUSEUM_ID, BAR_ID].sort())
  })

  it('drops empty and non-UUID ids so one bad id cannot fail the whole lookup', () => {
    const day = { ...DAY, afternoon: { title: 'x', experienceId: '' }, evening: { title: 'y', experienceId: 'fake-uuid-999' } }
    expect(itineraryExperienceIds({ days: [day] })).toEqual([BBQ_ID])
  })

  it('handles a missing itinerary', () => {
    expect(itineraryExperienceIds(null)).toEqual([])
    expect(itineraryExperienceIds({})).toEqual([])
  })
})

describe('slotAction', () => {
  it('returns nothing for a slot that is not a catalog experience', () => {
    expect(slotAction({ title: 'Stroll', experienceId: '' }, undefined)).toBeNull()
    expect(slotAction(null, undefined)).toBeNull()
  })

  it('offers Vtopia booking only for reservable experiences', () => {
    const action = slotAction(DAY.morning, EXPERIENCES[BBQ_ID])
    expect(action.kind).toBe('book')
    expect(action.to).toBe(`/experience/${BBQ_ID}?from=itinerary`)
  })

  it('treats a missing experience_type as reservable, matching the experience page', () => {
    expect(slotAction(DAY.morning, { id: BBQ_ID, title: 'Old row', city: 'Kansas City' }).kind).toBe('book')
  })

  it('sends paid attractions to their ticket link, not Vtopia booking', () => {
    const action = slotAction(DAY.afternoon, EXPERIENCES[MUSEUM_ID])
    expect(action.kind).toBe('external')
    expect(action.label).toBe('Get tickets →')
    expect(action.href).toContain('nelson-atkins.org/tickets')
    expect(action.note).toBe('Entry fee required')
  })

  it('sends walk-in places to directions', () => {
    const action = slotAction(DAY.evening, EXPERIENCES[BAR_ID])
    expect(action.kind).toBe('external')
    expect(action.label).toBe('Get directions →')
    expect(action.href).toContain('google.com/maps')
  })

  it('does not promise tickets through an unverified link', () => {
    const exp = { ...EXPERIENCES[MUSEUM_ID], link_status: 'unverified' }
    expect(slotAction(DAY.afternoon, exp).label).toBe('Visit website →')
  })

  it('falls back to a details link when the experience could not be loaded', () => {
    const action = slotAction(DAY.afternoon, undefined)
    expect(action.kind).toBe('details')
    expect(action.to).toBe(`/experience/${MUSEUM_ID}?from=itinerary`)
  })
})

describe('dayLegs', () => {
  it('estimates a ride for far-apart stops and a walk for close ones', () => {
    const legs = dayLegs(DAY, EXPERIENCES)
    expect(legs).toHaveLength(2)
    expect(legs[0]).toMatchObject({ from: 'morning', to: 'afternoon', mode: 'rideshare' })
    expect(legs[0].minutes).toBeGreaterThan(10)
    expect(legs[0].minutes).toBeLessThan(40)
    expect(legs[1]).toMatchObject({ from: 'afternoon', to: 'evening', mode: 'walk' })
    expect(legs[1].minutes).toBeLessThanOrEqual(15)
  })

  it('skips legs touching a slot with no coordinates', () => {
    const noCoords = { ...EXPERIENCES, [MUSEUM_ID]: { ...EXPERIENCES[MUSEUM_ID], lat: null, lng: null } }
    expect(dayLegs(DAY, noCoords)).toEqual([])
  })

  it('does not bridge over an unmatched slot', () => {
    const day = { ...DAY, afternoon: { title: 'Free time', experienceId: '' } }
    expect(dayLegs(day, EXPERIENCES)).toEqual([])
  })

  it('skips a leg when both slots are the same place', () => {
    const day = { ...DAY, afternoon: { ...DAY.afternoon, experienceId: BBQ_ID } }
    expect(dayLegs(day, EXPERIENCES).map((l) => l.from)).toEqual(['afternoon'])
  })

  it('returns no legs before the catalog lookup has loaded', () => {
    expect(dayLegs(DAY)).toEqual([])
  })
})

describe('DayCard', () => {
  function renderDay(experiences) {
    return render(
      <MemoryRouter>
        <DayCard day={DAY} index={0} experiences={experiences} />
      </MemoryRouter>
    )
  }

  it('shows a Vtopia booking link only on the reservable slot', () => {
    renderDay(EXPERIENCES)
    const bookLinks = screen.getAllByRole('link', { name: /book on vtopia/i })
    expect(bookLinks).toHaveLength(1)
    expect(bookLinks[0]).toHaveAttribute('href', `/experience/${BBQ_ID}?from=itinerary`)
  })

  it('links ticketed and walk-in slots out, opening in a new tab', () => {
    renderDay(EXPERIENCES)
    const tickets = screen.getByRole('link', { name: 'Get tickets →' })
    expect(tickets).toHaveAttribute('target', '_blank')
    expect(tickets.getAttribute('href')).toContain('nelson-atkins.org/tickets')
    expect(screen.getByRole('link', { name: 'Get directions →' })).toBeInTheDocument()
  })

  it('shows travel time between stops', () => {
    renderDay(EXPERIENCES)
    expect(screen.getByText(/min ride to your next stop/)).toBeInTheDocument()
    expect(screen.getByText(/min walk to your next stop/)).toBeInTheDocument()
  })

  it('renders without a catalog lookup', () => {
    renderDay(undefined)
    expect(screen.getByText('BBQ tour')).toBeInTheDocument()
    expect(screen.queryByText(/to your next stop/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'View details →' })).toHaveLength(3)
  })
})
