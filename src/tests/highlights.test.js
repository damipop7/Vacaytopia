import { describe, it, expect } from 'vitest'
import { formatTag, pickHighlights } from '../components/cards/ExperienceCard'

// ── formatTag ─────────────────────────────────────────────────────────────────

describe('formatTag', () => {
  // cuisine
  it('formats cuisine:italian → "Italian"', () => {
    expect(formatTag('cuisine:italian')).toBe('Italian')
  })

  it('formats cuisine:coffee_shop → "Coffee Shop"', () => {
    expect(formatTag('cuisine:coffee_shop')).toBe('Coffee Shop')
  })

  it('formats cuisine:american → "American"', () => {
    expect(formatTag('cuisine:american')).toBe('American')
  })

  it('formats cuisine with semicolon (coffee_shop;pastry) → "Coffee Shop & Pastry"', () => {
    expect(formatTag('cuisine:coffee_shop;pastry')).toBe('Coffee Shop & Pastry')
  })

  it('truncates semicolon list to 2 parts', () => {
    expect(formatTag('cuisine:burger;chicken;pizza')).toBe('Burger & Chicken')
  })

  // sport
  it('formats sport:taekwondo → "Taekwondo"', () => {
    expect(formatTag('sport:taekwondo')).toBe('Taekwondo')
  })

  it('formats sport:weightlifting;crossfit → "Weightlifting & Crossfit"', () => {
    expect(formatTag('sport:weightlifting;crossfit')).toBe('Weightlifting & Crossfit')
  })

  // leisure
  it('formats leisure:disc_golf_course → "Disc Golf"', () => {
    expect(formatTag('leisure:disc_golf_course')).toBe('Disc Golf')
  })

  it('formats leisure:sports_centre → "Sports & Fitness"', () => {
    expect(formatTag('leisure:sports_centre')).toBe('Sports & Fitness')
  })

  it('formats leisure:golf_course → "Golf"', () => {
    expect(formatTag('leisure:golf_course')).toBe('Golf')
  })

  it('formats leisure:bowling_alley → "Bowling"', () => {
    expect(formatTag('leisure:bowling_alley')).toBe('Bowling')
  })

  it('suppresses leisure:park → null', () => {
    expect(formatTag('leisure:park')).toBeNull()
  })

  it('suppresses leisure:garden → null', () => {
    expect(formatTag('leisure:garden')).toBeNull()
  })

  // tourism
  it('formats tourism:museum → "Museum"', () => {
    expect(formatTag('tourism:museum')).toBe('Museum')
  })

  it('suppresses tourism:attraction → null', () => {
    expect(formatTag('tourism:attraction')).toBeNull()
  })

  it('suppresses tourism:yes → null', () => {
    expect(formatTag('tourism:yes')).toBeNull()
  })

  // amenity
  it('formats amenity:theatre → "Theatre"', () => {
    expect(formatTag('amenity:theatre')).toBe('Theatre')
  })

  it('suppresses amenity:bench → null', () => {
    expect(formatTag('amenity:bench')).toBeNull()
  })

  // plain tags
  it('suppresses generic plain tag "food" → null', () => {
    expect(formatTag('food')).toBeNull()
  })

  it('suppresses generic plain tag "outdoor" → null', () => {
    expect(formatTag('outdoor')).toBeNull()
  })

  it('suppresses generic plain tag "attraction" → null', () => {
    expect(formatTag('attraction')).toBeNull()
  })

  it('formats non-generic plain tag "rooftop" → "Rooftop"', () => {
    expect(formatTag('rooftop')).toBe('Rooftop')
  })

  it('suppresses very short plain tag "kc" → null', () => {
    expect(formatTag('kc')).toBeNull()
  })

  // edge cases
  it('returns null for null input', () => {
    expect(formatTag(null)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(formatTag('')).toBeNull()
  })

  it('handles unknown OSM key → null', () => {
    expect(formatTag('building:yes')).toBeNull()
  })
})

// ── pickHighlights ────────────────────────────────────────────────────────────

describe('pickHighlights', () => {
  it('returns empty result for null tags', () => {
    expect(pickHighlights(null)).toEqual({ shown: [], overflow: 0 })
  })

  it('returns empty result for empty array', () => {
    expect(pickHighlights([])).toEqual({ shown: [], overflow: 0 })
  })

  it('picks cuisine over plain tags', () => {
    const { shown } = pickHighlights(['rooftop', 'cuisine:italian', 'food'])
    expect(shown[0]).toBe('Italian')
  })

  it('suppresses tourism:attraction and does not include it', () => {
    const { shown } = pickHighlights(['tourism:attraction', 'cuisine:mexican'])
    expect(shown).not.toContain('Attraction')
    expect(shown).toContain('Mexican')
  })

  it('deduplicates identical labels from different raw tags', () => {
    const { shown } = pickHighlights(['cuisine:italian', 'cuisine:italian'])
    expect(shown.filter(s => s === 'Italian').length).toBe(1)
  })

  it('respects max parameter', () => {
    const tags = ['cuisine:italian', 'sport:golf', 'leisure:bowling_alley', 'tourism:museum']
    const { shown } = pickHighlights(tags, 2)
    expect(shown.length).toBe(2)
  })

  it('counts overflow correctly', () => {
    const tags = ['cuisine:italian', 'sport:golf', 'leisure:bowling_alley', 'tourism:museum']
    const { overflow } = pickHighlights(tags, 2)
    expect(overflow).toBe(2)
  })

  it('suppresses all-generic tags and returns empty shown', () => {
    const { shown } = pickHighlights(['food', 'drink', 'outdoor', 'tourism:attraction'])
    expect(shown.length).toBe(0)
  })

  it('surfaces sport:taekwondo;crossfit correctly joined', () => {
    const { shown } = pickHighlights(['sport:taekwondo;crossfit'])
    expect(shown[0]).toBe('Taekwondo & Crossfit')
  })

  it('orders cuisine > sport > leisure when all present', () => {
    const tags = ['leisure:bowling_alley', 'sport:tennis', 'cuisine:burger']
    const { shown } = pickHighlights(tags, 3)
    expect(shown[0]).toBe('Burger')
    expect(shown[1]).toBe('Tennis')
    expect(shown[2]).toBe('Bowling')
  })
})
