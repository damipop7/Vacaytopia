/**
 * DIAGNOSTIC: Travel quiz label helpers
 *
 * Tests that interest/style/group IDs map to the correct human-readable labels.
 * Failures here mean the profile page would show raw IDs ("food") instead of labels.
 */
import { describe, it, expect } from 'vitest'
import {
  labelInterests,
  labelStyle,
  labelGroups,
  QUIZ_INTERESTS,
  QUIZ_TRAVEL_STYLES,
  QUIZ_GROUP_TYPES,
} from '../lib/travelQuiz'

describe('labelInterests', () => {
  it('returns "Not set" for null', () => {
    expect(labelInterests(null)).toBe('Not set')
  })

  it('returns "Not set" for empty array', () => {
    expect(labelInterests([])).toBe('Not set')
  })

  it('maps "food" to its label', () => {
    const result = labelInterests(['food'])
    expect(result).toContain('Food')
  })

  it('joins multiple interests with ", "', () => {
    const result = labelInterests(['food', 'outdoors', 'nightlife'])
    expect(result).toContain(',')
    const parts = result.split(',').map(s => s.trim())
    expect(parts).toHaveLength(3)
  })

  it('passes through unknown IDs unchanged', () => {
    const result = labelInterests(['unknown-id'])
    expect(result).toBe('unknown-id')
  })

  it('maps every known interest ID to a non-empty label', () => {
    for (const interest of QUIZ_INTERESTS) {
      const result = labelInterests([interest.id])
      expect(result, `Interest "${interest.id}" has no label`).not.toBe(interest.id)
      expect(result.trim()).not.toBe('')
    }
  })
})

describe('labelStyle', () => {
  it('returns "Not set" for undefined', () => {
    expect(labelStyle(undefined)).toBe('Not set')
  })

  it('returns "Not set" for empty string', () => {
    expect(labelStyle('')).toBe('Not set')
  })

  it('maps "solo" to its label', () => {
    expect(labelStyle('solo')).toBe('Solo')
  })

  it('maps "luxury" to "Elevated"', () => {
    expect(labelStyle('luxury')).toBe('Elevated')
  })

  it('maps every known style ID to its label', () => {
    for (const style of QUIZ_TRAVEL_STYLES) {
      const result = labelStyle(style.id)
      expect(result, `Style "${style.id}" → "${result}" should equal "${style.label}"`).toBe(style.label)
    }
  })

  it('returns the raw ID for unknown styles', () => {
    expect(labelStyle('ultra-budget')).toBe('ultra-budget')
  })
})

describe('labelGroups', () => {
  it('returns "Not set" for null', () => {
    expect(labelGroups(null)).toBe('Not set')
  })

  it('returns "Not set" for empty array', () => {
    expect(labelGroups([])).toBe('Not set')
  })

  it('maps "couple" correctly', () => {
    const result = labelGroups(['couple'])
    expect(result).toContain('Partner')
  })

  it('maps "family" correctly', () => {
    const result = labelGroups(['family'])
    expect(result).toContain('Family')
  })

  it('joins multiple groups with ", "', () => {
    const result = labelGroups(['solo', 'couple'])
    expect(result).toContain(',')
  })

  it('maps every known group ID to a non-empty label', () => {
    for (const group of QUIZ_GROUP_TYPES) {
      const result = labelGroups([group.id])
      expect(result, `Group "${group.id}" has no label`).not.toBe(group.id)
      expect(result.trim()).not.toBe('')
    }
  })
})
