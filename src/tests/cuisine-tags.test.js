import { describe, it, expect } from 'vitest'
import { deriveCuisineTag, mergeCuisineTag } from '../lib/cuisineTags'

describe('deriveCuisineTag', () => {
  it('strips _restaurant suffix', () => {
    expect(deriveCuisineTag(['italian_restaurant', 'restaurant', 'point_of_interest'])).toBe('cuisine:italian')
  })

  it('strips _bar suffix', () => {
    expect(deriveCuisineTag(['wine_bar', 'bar', 'establishment'])).toBe('cuisine:wine')
  })

  it('strips _shop suffix', () => {
    expect(deriveCuisineTag(['coffee_shop', 'food', 'store'])).toBe('cuisine:coffee')
  })

  it('strips _house suffix', () => {
    expect(deriveCuisineTag(['steak_house', 'restaurant'])).toBe('cuisine:steak')
  })

  it('accepts standalone food types with no suffix', () => {
    expect(deriveCuisineTag(['bakery', 'food', 'store'])).toBe('cuisine:bakery')
    expect(deriveCuisineTag(['cafe', 'point_of_interest'])).toBe('cuisine:cafe')
  })

  it('ignores non-food types with no matching suffix', () => {
    expect(deriveCuisineTag(['night_club', 'point_of_interest', 'establishment'])).toBeNull()
    expect(deriveCuisineTag(['parking', 'establishment'])).toBeNull()
  })

  it('returns null for empty or missing types', () => {
    expect(deriveCuisineTag([])).toBeNull()
    expect(deriveCuisineTag(null)).toBeNull()
    expect(deriveCuisineTag(undefined)).toBeNull()
  })

  it('picks the first matching type when multiple are present', () => {
    expect(deriveCuisineTag(['restaurant', 'mexican_restaurant', 'point_of_interest'])).toBe('cuisine:mexican')
  })
})

describe('mergeCuisineTag', () => {
  it('appends a new cuisine tag to existing tags', () => {
    expect(mergeCuisineTag(['Food & Drink'], 'cuisine:italian')).toEqual(['Food & Drink', 'cuisine:italian'])
  })

  it('does not duplicate or overwrite an existing cuisine tag from another source', () => {
    expect(mergeCuisineTag(['cuisine:burger'], 'cuisine:hamburger')).toEqual(['cuisine:burger'])
  })

  it('handles null/missing existing tags', () => {
    expect(mergeCuisineTag(null, 'cuisine:sushi')).toEqual(['cuisine:sushi'])
    expect(mergeCuisineTag(undefined, 'cuisine:sushi')).toEqual(['cuisine:sushi'])
  })

  it('returns existing tags unchanged when there is no cuisine tag to merge', () => {
    expect(mergeCuisineTag(['Food & Drink'], null)).toEqual(['Food & Drink'])
  })
})
