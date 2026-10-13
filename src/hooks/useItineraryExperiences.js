import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { itineraryExperienceIds } from '../lib/itineraryPlan'

const SELECT = `
  id, title, city, experience_type, link_status,
  external_url, website, maps_url, ticket_url, delivery_url, lat, lng
`

/** Catalog rows for every experience an itinerary's slots point at, keyed by id. */
export function useItineraryExperiences(itinerary) {
  const ids = useMemo(() => itineraryExperienceIds(itinerary).sort(), [itinerary])
  return useQuery({
    queryKey: ['itinerary-experiences', ids],
    queryFn: async () => {
      const { data, error } = await supabase.from('experiences').select(SELECT).in('id', ids)
      if (error) throw error
      return Object.fromEntries((data ?? []).map((exp) => [exp.id, exp]))
    },
    enabled: ids.length > 0,
  })
}
