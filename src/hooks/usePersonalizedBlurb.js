import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const ITINERARY_KEY = 'vtopia_active_itinerary'

// Reads the quiz answers stored alongside the cached itinerary.
export function readStoredQuizAnswers() {
  try {
    const raw = sessionStorage.getItem(ITINERARY_KEY)
    if (!raw) return null
    return JSON.parse(raw)?.answers ?? null
  } catch {
    return null
  }
}

// Returns a stable cache key that invalidates when budget or traveler type changes.
export function blurbCacheKey(expId, answers) {
  if (!expId || !answers) return null
  return `vtopia_blurb_${expId}_${answers.budget ?? 'mid'}_${answers.traveler ?? 'solo'}`
}

export function usePersonalizedBlurb(experience) {
  const answers = readStoredQuizAnswers()

  return useQuery({
    queryKey: ['personalized-blurb', experience?.id, answers?.budget, answers?.traveler],
    queryFn: async () => {
      const key = blurbCacheKey(experience.id, answers)
      // sessionStorage hit — skip the API call
      try {
        const hit = sessionStorage.getItem(key)
        if (hit) return hit
      } catch { /* private browsing */ }

      const { data, error } = await supabase.functions.invoke('personalize-experience', {
        body: { experience, answers },
      })
      if (error) throw error
      if (!data?.blurb) throw new Error('Empty blurb')

      try { sessionStorage.setItem(key, data.blurb) } catch { /* ignore quota */ }
      return data.blurb
    },
    enabled: !!experience?.id && !!answers,
    staleTime: Infinity,
    retry: false,
  })
}
