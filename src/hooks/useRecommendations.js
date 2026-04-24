import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const WEIGHTS = {
  categoryMatch: 35,
  budgetFit:     25,
  cityMatch:     20,
  styleMatch:    10,
  rating:         5,
  savedBonus:     5,
}

export function scoreExperience(experience, quizAnswers, savedIds = []) {
  if (!quizAnswers) return experience.rating * 10

  let score = 0

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
    score += WEIGHTS.categoryMatch * 0.5
  }

  const budget = quizAnswers.budget ?? 500
  if (experience.price_per_person <= budget) {
    const budgetRatio = experience.price_per_person / budget
    score += WEIGHTS.budgetFit * (1 - budgetRatio * 0.5)
  }

  const destCity = quizAnswers.destination_city
  if (!destCity || destCity === 'all') {
    score += WEIGHTS.cityMatch * 0.5
  } else if (experience.city === destCity) {
    score += WEIGHTS.cityMatch
  }

  const styleMatchMap = {
    spontaneous: ['Nightlife', 'Outdoors'],
    planner:     ['Arts & Culture', 'Food & Drink'],
    solo:        ['Outdoors', 'Wellness', 'Arts & Culture'],
    social:      ['Food & Drink', 'Nightlife', 'Sports'],
    luxury:      ['Wellness', 'Arts & Culture', 'Food & Drink'],
    budget:      [],
  }
  const styleCategories = styleMatchMap[quizAnswers.travel_style] || []
  if (styleCategories.includes(experience.category)) {
    score += WEIGHTS.styleMatch
  } else {
    score += WEIGHTS.styleMatch * 0.3
  }

  score += (experience.rating / 5) * WEIGHTS.rating

  if (savedIds.includes(experience.id)) {
    score += WEIGHTS.savedBonus
  }

  return Math.round(score)
}

export function useRecommendations(filters = {}) {
  const { user } = useAuthStore()
  const { city, category, maxBudget, limit = 20 } = filters

  // Separate query for user data so it doesn't bust the experiences cache
  const { data: userData } = useQuery({
    queryKey: ['user-prefs', user?.id],
    queryFn: async () => {
      if (!user) return { quizAnswers: null, savedIds: [] }
      const [quizRes, savedRes] = await Promise.all([
        supabase
          .from('quiz_results')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('wishlists')
          .select('experience_id')
          .eq('user_id', user.id),
      ])
      return {
        quizAnswers: quizRes.data ?? null,
        savedIds: (savedRes.data || []).map(w => w.experience_id),
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // cache user prefs for 10 min
    placeholderData: { quizAnswers: null, savedIds: [] },
  })

  const experiencesQuery = useQuery({
    queryKey: ['experiences', city, category, maxBudget, limit],
    queryFn: async () => {
      let query = supabase
        .from('experiences')
        .select(`*, guides ( id, first_name, last_name, avatar_url, rating )`)
        .eq('is_active', true)

      if (city && city !== 'all')          query = query.eq('city', city)
      if (category && category !== 'all')  query = query.eq('category', category)
      if (maxBudget && maxBudget < 500)    query = query.lte('price_per_person', maxBudget)

      // Fetch exactly what we need — no over-fetching
      query = query.limit(limit)

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 5, // cache experiences for 5 min
    placeholderData: [],
  })

  // Score experiences client-side using cached user prefs
  const { quizAnswers = null, savedIds = [] } = userData || {}

  const scored = (experiencesQuery.data || []).map(exp => ({
    ...exp,
    _score:   scoreExperience(exp, quizAnswers, savedIds),
    _isSaved: savedIds.includes(exp.id),
  }))

  scored.sort((a, b) => b._score - a._score)

  return {
    ...experiencesQuery,
    data: scored,
  }
}

export function useExperience(id) {
  return useQuery({
    queryKey: ['experience', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select(`
          *,
          guides ( * ),
          reviews ( *, profiles ( first_name, last_name, avatar_url ) )
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  })
}
