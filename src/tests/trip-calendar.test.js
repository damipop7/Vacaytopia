import { describe, it, expect } from 'vitest'
import { buildCalendarGrid } from '../components/trips/TripCalendarView'

function makeItem(overrides = {}) {
  return {
    id:          'te-1',
    day_number:  1,
    time_slot:   'morning',
    status:      'approved',
    custom_name: null,
    experiences: { title: "Joe's KC BBQ" },
    ...overrides,
  }
}

const DAYS = [{ day: 1, date: '2026-06-19' }, { day: 2, date: '2026-06-20' }, { day: 3, date: '2026-06-21' }]

describe('buildCalendarGrid', () => {
  it('returns an empty grid for no experiences', () => {
    const grid = buildCalendarGrid(DAYS, [])
    expect(grid[1].morning).toEqual([])
    expect(grid[2].afternoon).toEqual([])
    expect(grid[3].evening).toEqual([])
  })

  it('places an experience in the correct day and slot', () => {
    const item = makeItem({ day_number: 2, time_slot: 'afternoon' })
    const grid = buildCalendarGrid(DAYS, [item])
    expect(grid[2].afternoon).toHaveLength(1)
    expect(grid[2].afternoon[0].id).toBe('te-1')
  })

  it('stacks multiple experiences in the same cell', () => {
    const items = [
      makeItem({ id: 'te-1', day_number: 1, time_slot: 'morning' }),
      makeItem({ id: 'te-2', day_number: 1, time_slot: 'morning' }),
    ]
    const grid = buildCalendarGrid(DAYS, items)
    expect(grid[1].morning).toHaveLength(2)
  })

  it('puts experiences in separate cells for different slots', () => {
    const items = [
      makeItem({ id: 'te-1', day_number: 1, time_slot: 'morning' }),
      makeItem({ id: 'te-2', day_number: 1, time_slot: 'evening' }),
    ]
    const grid = buildCalendarGrid(DAYS, items)
    expect(grid[1].morning).toHaveLength(1)
    expect(grid[1].evening).toHaveLength(1)
    expect(grid[1].afternoon).toHaveLength(0)
  })

  it('puts experiences in separate cells for different days', () => {
    const items = [
      makeItem({ id: 'te-1', day_number: 1, time_slot: 'morning' }),
      makeItem({ id: 'te-2', day_number: 3, time_slot: 'morning' }),
    ]
    const grid = buildCalendarGrid(DAYS, items)
    expect(grid[1].morning).toHaveLength(1)
    expect(grid[2].morning).toHaveLength(0)
    expect(grid[3].morning).toHaveLength(1)
  })

  it('ignores experiences with a day_number not in the days array', () => {
    const item = makeItem({ day_number: 99, time_slot: 'morning' })
    const grid = buildCalendarGrid(DAYS, [item])
    expect(grid[99]).toBeUndefined()
  })

  it('ignores experiences with an unknown time_slot', () => {
    const item = makeItem({ time_slot: 'brunch' })
    const grid = buildCalendarGrid(DAYS, [item])
    expect(grid[1].morning).toHaveLength(0)
  })

  it('handles null experiences gracefully', () => {
    expect(() => buildCalendarGrid(DAYS, null)).not.toThrow()
    const grid = buildCalendarGrid(DAYS, null)
    expect(grid[1].morning).toEqual([])
  })

  it('creates a key for every day in the days array', () => {
    const grid = buildCalendarGrid(DAYS, [])
    expect(Object.keys(grid).map(Number).sort((a, b) => a - b)).toEqual([1, 2, 3])
  })

  it('initialises all four slot arrays for each day', () => {
    const grid = buildCalendarGrid(DAYS, [])
    for (const day of [1, 2, 3]) {
      expect(grid[day]).toHaveProperty('morning')
      expect(grid[day]).toHaveProperty('afternoon')
      expect(grid[day]).toHaveProperty('evening')
      expect(grid[day]).toHaveProperty('night')
    }
  })

  it('handles empty days array', () => {
    const grid = buildCalendarGrid([], [makeItem()])
    expect(Object.keys(grid)).toHaveLength(0)
  })
})
