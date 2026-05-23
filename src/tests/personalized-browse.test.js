/**
 * Unit tests for "Personalized for you" browse section logic.
 * Pure filtering/scoring — no Supabase or React.
 */
import { describe, it, expect } from 'vitest'
import { scoreExperience } from '../hooks/useRecommendations'

const QUIZ_INTERESTS = [
  { id: 'food',      label: 'Food & drink',       emoji: '🍽️' },
  { id: 'outdoors',  label: 'Outdoors & nature',  emoji: '🌿' },
  { id: 'nightlife', label: 'Nightlife',           emoji: '🌙' },
  { id: 'sports',    label: 'Sports & games',      emoji: '🏟️' },
  { id: 'arts',      label: 'Arts & culture',      emoji: '🎨' },
  { id: 'wellness',  label: 'Wellness',            emoji: '🧘' },
]

const CATEGORY_MAP = {
  food: 'Food & Drink', outdoors: 'Outdoors', nightlife: 'Nightlife',
  sports: 'Sports', arts: 'Arts & Culture', wellness: 'Wellness',
}

function getPersonalizedPicks(experiences, quizData, max = 6) {
  if (!quizData?.interests?.length) return []
  const categories = new Set(quizData.interests.map(i => CATEGORY_MAP[i]).filter(Boolean))
  return experiences.filter(e => categories.has(e.category)).slice(0, max)
}

const EXPERIENCES = [
  { id: '1', title: 'BBQ Joint',         category: 'Food & Drink',  price_per_person: 20, rating: 4.5 },
  { id: '2', title: 'Nature Trail',      category: 'Outdoors',       price_per_person: 0,  rating: 4.8 },
  { id: '3', title: 'Jazz Bar',          category: 'Nightlife',      price_per_person: 15, rating: 4.2 },
  { id: '4', title: 'Art Museum',        category: 'Arts & Culture', price_per_person: 12, rating: 4.6 },
  { id: '5', title: 'Yoga Studio',       category: 'Wellness',       price_per_person: 25, rating: 4.3 },
  { id: '6', title: 'Soccer Stadium',    category: 'Sports',         price_per_person: 40, rating: 4.7 },
  { id: '7', title: 'Taco Stand',        category: 'Food & Drink',  price_per_person: 10, rating: 4.1 },
]

describe('getPersonalizedPicks', () => {
  it('returns only experiences matching user interests', () => {
    const picks = getPersonalizedPicks(EXPERIENCES, { interests: ['food', 'outdoors'] })
    const categories = [...new Set(picks.map(e => e.category))]
    expect(categories.every(c => ['Food & Drink', 'Outdoors'].includes(c))).toBe(true)
  })

  it('returns empty array when no quiz data', () => {
    expect(getPersonalizedPicks(EXPERIENCES, null)).toEqual([])
    expect(getPersonalizedPicks(EXPERIENCES, { interests: [] })).toEqual([])
  })

  it('caps at max results', () => {
    const picks = getPersonalizedPicks(EXPERIENCES, { interests: ['food', 'outdoors', 'nightlife', 'arts', 'wellness', 'sports'] }, 4)
    expect(picks.length).toBeLessThanOrEqual(4)
  })

  it('returns all matching when fewer than max', () => {
    const picks = getPersonalizedPicks(EXPERIENCES, { interests: ['wellness'] })
    expect(picks.length).toBe(1)
    expect(picks[0].category).toBe('Wellness')
  })

  it('handles unknown interest ids gracefully', () => {
    const picks = getPersonalizedPicks(EXPERIENCES, { interests: ['food', 'unknown_interest'] })
    expect(picks.every(e => e.category === 'Food & Drink')).toBe(true)
  })
})

describe('scoreExperience — interest matching', () => {
  it('scores food experience higher when user has food interest', () => {
    const quiz = { interests: ['food'], budget: 500, travel_style: '' }
    const foodExp = { id: '1', category: 'Food & Drink', price_per_person: 20, rating: 4.0, city: 'Kansas City' }
    const sportExp = { id: '2', category: 'Sports', price_per_person: 20, rating: 4.0, city: 'Kansas City' }
    expect(scoreExperience(foodExp, quiz)).toBeGreaterThan(scoreExperience(sportExp, quiz))
  })

  it('falls back to rating-only score when no quiz answers', () => {
    const exp = { id: '1', category: 'Food & Drink', price_per_person: 20, rating: 4.5 }
    expect(scoreExperience(exp, null)).toBe(4.5 * 10)
  })

  it('saved experiences get a bonus score', () => {
    const quiz = { interests: ['food'], budget: 500, travel_style: '' }
    const exp = { id: 'saved-1', category: 'Food & Drink', price_per_person: 20, rating: 4.0, city: 'Kansas City' }
    const unsaved = scoreExperience(exp, quiz, [])
    const saved   = scoreExperience(exp, quiz, ['saved-1'])
    expect(saved).toBeGreaterThan(unsaved)
  })
})
