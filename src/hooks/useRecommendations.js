import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMENDATION ENGINE — Weighted Interest Scoring
//
// How it works:
//   Each experience gets a score 0–100 based on how well it matches
//   the user's quiz answers and behaviour. Higher score = shown first.
//
// Scoring weights (must sum to 100):
//   Category match (quiz interests)   → 35 pts
//   Budget fit                         → 25 pts
//   City match                         → 20 pts
//   Travel style match                 → 10 pts
//   Rating quality                     →  5 pts
//   Saved/wishlisted by user           →  5 pts  (bonus, not capped)
// ─────────────────────────────────────────────────────────────────────────────

const WEIGHTS = {
  categoryMatch: 35,
  budgetFit:     25,
  cityMatch:     20,
  styleMatch:    10,
  rating:         5,
  savedBonus:     5,
}

/**
 * Score a single experience against a user's quiz preferences.
 * Returns a number 0–105 (105 if saved + all matches).
 */
export function scoreExperience(experience, quizAnswers, savedIds = []) {
  if (!quizAnswers) return experience.rating * 10 // fallback: sort by rating

  let score = 0

  // 1. Category match — does the experience category appear in user interests?
  const interests = quizAnswers.interests || []
  const categoryMap = {
    'Food & Drink':  'food',
    'Outdoors':      'outdoors',
    'Nightlife':     'nightlife',
    'Sports':        'sports',
    'Arts & Culture':'arts',
    'Wellness':      'wellness',
  }
  const expInterestKey = categoryMap[experience.category]
  if (expInterestKey && interests.includes(expInterestKey)) {
    score += WEIGHTS.categoryMatch
  } else if (interests.length === 0) {
    score += WEIGHTS.categoryMatch * 0.5 // no preference = neutral
  }

  // 2. Budget fit — is the experience price within the user's budget?
  const budget = quizAnswers.budget ?? 500
  if (experience.price_per_person <= budget) {
    // Full points if well within budget, partial if at the edge
    const budgetRatio = experience.price_per_person / budget
    score += WEIGHTS.budgetFit * (1 - budgetRatio * 0.5)
  }
  // Zero points if over budget — but still shown (just ranked lower)

  // 3. City match — is the experience in the user's destination city?
  const destCity = quizAnswers.destination_city
  if (!destCity || destCity === 'all') {
    score += WEIGHTS.cityMatch * 0.5 // no city preference = half points
  } else if (experience.city === destCity) {
    score += WEIGHTS.cityMatch
  }

  // 4. Travel style match
  const styleMatchMap = {
    spontaneous: ['Nightlife', 'Outdoors'],
    planner:     ['Arts & Culture', 'Food & Drink'],
    solo:        ['Outdoors', 'Wellness', 'Arts & Culture'],
    social:      ['Food & Drink', 'Nightlife', 'Sports'],
    luxury:      ['Wellness', 'Arts & Culture', 'Food & Drink'],
    budget:      [],  // handled by price scoring already
  }
  const styleCategories = styleMatchMap[quizAnswers.travel_style] || []
  if (styleCategories.includes(experience.category)) {
    score += WEIGHTS.styleMatch
  } else {
    score += WEIGHTS.styleMatch * 0.3
  }

  // 5. Rating quality (0–5 stars mapped to 0–5 points)
  score += (experience.rating / 5) * WEIGHTS.rating

  // 6. Saved bonus — user already saved this experience
  if (savedIds.includes(experience.id)) {
    score += WEIGHTS.savedBonus
  }

  return Math.round(score)
}

/**
 * useRecommendations — main React hook
 *
 * Returns experiences sorted by personalised score.
 * Falls back gracefully if the user has no quiz answers (sorts by rating).
 *
 * @param {object} filters  - { city, category, maxBudget, limit }
 */
export function useRecommendations(filters = {}) {
  const { user, profile } = useAuthStore()
  const { city, category, maxBudget, limit = 20 } = filters

  return useQuery({
    queryKey: ['recommendations', user?.id, city, category, maxBudget],
    queryFn:  async () => {
      // 1. Fetch experiences matching hard filters
      let query = supabase
      .from('experiences')
      .select(`
        *,
        guides ( id, first_name, last_name, avatar_url, rating )
      `)
        .eq('is_active', true)

      if (city && city !== 'all')     query = query.eq('city', city)
      if (category && category !== 'all') query = query.eq('category', category)
      if (maxBudget && maxBudget < 500)   query = query.lte('price_per_person', maxBudget)
      if (limit)                          query = query.limit(limit * 3) // fetch more, then score + slice

      const { data: experiences, error } = await query
      if (error) throw error

      // 2. Fetch user's quiz answers and saved experiences (if logged in)
      let quizAnswers = null
      let savedIds    = []

      if (user) {
        const [quizRes, savedRes] = await Promise.all([
          supabase.from('quiz_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
          supabase.from('wishlists').select('experience_id').eq('user_id', user.id),
        ])
        quizAnswers = quizRes.data   // null if no quiz taken yet
        savedIds    = (savedRes.data || []).map(w => w.experience_id)
      }

      // 3. Score every experience
      const scored = (experiences || []).map(exp => ({
        ...exp,
        _score:   scoreExperience(exp, quizAnswers, savedIds),
        _isSaved: savedIds.includes(exp.id),
      }))

      // 4. Sort by score descending, slice to requested limit
      scored.sort((a, b) => b._score - a._score)
      return scored.slice(0, limit)
    },
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  })
}

/**
 * useExperience — fetch a single experience by id
 */
export function useExperience(id) {
  return useQuery({
    queryKey: ['experience', id],
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select(`
          *,
          cities ( name, slug ),
          guides ( * ),
          reviews ( *, profiles ( first_name, last_name, avatar_url ) )
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}
