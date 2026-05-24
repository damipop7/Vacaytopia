import { describe, it, expect } from 'vitest'

// Pure mapping logic duplicated from both files — tests the traveler count conversion
const TRAVELER_FROM_TYPE = { solo: 2, couple: 2, friends: 4, family: 4 }

function travelerCount(travelerType) {
  return TRAVELER_FROM_TYPE[travelerType] ?? 2
}

// Prefill builder — mirrors the state shape passed to /trips/new
function buildPrefill({ headline, startDate, endDate, budget, traveler }) {
  return {
    title:      headline   ?? '',
    startDate:  startDate  ?? '',
    endDate:    endDate    ?? '',
    budgetTier: budget     ?? 'mid',
    travelers:  travelerCount(traveler),
  }
}

describe('travelerCount', () => {
  it('maps solo → 2 (minimum group size)', () => {
    expect(travelerCount('solo')).toBe(2)
  })

  it('maps couple → 2', () => {
    expect(travelerCount('couple')).toBe(2)
  })

  it('maps friends → 4', () => {
    expect(travelerCount('friends')).toBe(4)
  })

  it('maps family → 4', () => {
    expect(travelerCount('family')).toBe(4)
  })

  it('falls back to 2 for unknown traveler type', () => {
    expect(travelerCount('unknown')).toBe(2)
    expect(travelerCount(null)).toBe(2)
    expect(travelerCount(undefined)).toBe(2)
  })
})

describe('buildPrefill', () => {
  const base = {
    headline:  'KC World Cup Weekend',
    startDate: '2026-06-19',
    endDate:   '2026-06-22',
    budget:    'mid',
    traveler:  'friends',
  }

  it('maps headline to title', () => {
    expect(buildPrefill(base).title).toBe('KC World Cup Weekend')
  })

  it('passes start and end dates through', () => {
    const p = buildPrefill(base)
    expect(p.startDate).toBe('2026-06-19')
    expect(p.endDate).toBe('2026-06-22')
  })

  it('maps quiz budget tier directly (budget|mid|premium)', () => {
    expect(buildPrefill({ ...base, budget: 'budget'  }).budgetTier).toBe('budget')
    expect(buildPrefill({ ...base, budget: 'mid'     }).budgetTier).toBe('mid')
    expect(buildPrefill({ ...base, budget: 'premium' }).budgetTier).toBe('premium')
  })

  it('converts friends traveler type to 4', () => {
    expect(buildPrefill({ ...base, traveler: 'friends' }).travelers).toBe(4)
  })

  it('converts solo traveler type to 2', () => {
    expect(buildPrefill({ ...base, traveler: 'solo' }).travelers).toBe(2)
  })

  it('falls back to empty strings when fields are missing', () => {
    const p = buildPrefill({})
    expect(p.title).toBe('')
    expect(p.startDate).toBe('')
    expect(p.endDate).toBe('')
  })

  it('falls back to mid budget tier when budget is missing', () => {
    expect(buildPrefill({ ...base, budget: undefined }).budgetTier).toBe('mid')
  })
})
