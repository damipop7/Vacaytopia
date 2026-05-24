import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const EXP_SELECT = `
  id, trip_id, experience_id, added_by, day_number, time_slot, start_time,
  status, votes_up, votes_down, notes, custom_name, custom_type, custom_url,
  estimated_cost_cents, booked_at, booking_id, sort_order, created_at,
  experiences (
    id, title, city, category, description, price_per_person, price_tier,
    duration_label, image_emoji, image_gradient, image_url,
    rating, review_count, experience_type, tips,
    maps_url, external_url, ticket_url, delivery_url, lat, lng, address
  )
`

export function useTripExperiences(tripId) {
  return useQuery({
    queryKey: ['trip-experiences', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_experiences')
        .select(EXP_SELECT)
        .eq('trip_id', tripId)
        .order('day_number', { ascending: true })
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tripId,
  })
}

export function useMyVotes(tripId) {
  const user = useAuthStore(s => s.user)
  return useQuery({
    queryKey: ['trip-votes', tripId, user?.id],
    queryFn: async () => {
      const expIds = await supabase
        .from('trip_experiences')
        .select('id')
        .eq('trip_id', tripId)
        .then(r => (r.data ?? []).map(e => e.id))

      if (expIds.length === 0) return {}

      const { data, error } = await supabase
        .from('trip_experience_votes')
        .select('trip_experience_id, vote')
        .in('trip_experience_id', expIds)
        .eq('user_id', user.id)
      if (error) throw error

      return Object.fromEntries((data ?? []).map(v => [v.trip_experience_id, v.vote]))
    },
    enabled: !!tripId && !!user?.id,
  })
}

export function useAddTripExperience(tripId) {
  const qc   = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async ({ experienceId, dayNumber, timeSlot, notes = '', customName, customType, customUrl }) => {
      let costCents = 0
      if (experienceId) {
        const { data: exp } = await supabase.from('experiences').select('price_per_person').eq('id', experienceId).single()
        costCents = Math.round((exp?.price_per_person ?? 0) * 100)
      }

      const existing = await supabase
        .from('trip_experiences')
        .select('sort_order')
        .eq('trip_id', tripId)
        .eq('day_number', dayNumber)
        .eq('time_slot', timeSlot)
        .order('sort_order', { ascending: false })
        .limit(1)
      const nextSort = ((existing.data?.[0]?.sort_order) ?? 0) + 1

      const { data, error } = await supabase
        .from('trip_experiences')
        .insert({
          trip_id: tripId,
          experience_id: experienceId || null,
          added_by: user.id,
          day_number: dayNumber,
          time_slot: timeSlot,
          notes,
          custom_name: customName || null,
          custom_type: customType || null,
          custom_url: customUrl || null,
          estimated_cost_cents: costCents,
          sort_order: nextSort,
        })
        .select(EXP_SELECT)
        .single()
      if (error) throw error

      const profile = useAuthStore.getState().profile
      const name = data.experiences?.title ?? customName ?? 'an experience'
      await supabase.from('trip_activity').insert({
        trip_id: tripId, user_id: user.id,
        display_name: profile?.first_name || 'A member',
        activity_type: 'experience_added',
        payload: { experience_name: name, day_number: dayNumber, time_slot: timeSlot },
      })

      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-experiences', tripId] }),
  })
}

export function useVoteTripExperience(tripId) {
  const qc   = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async ({ tripExperienceId, vote }) => {
      const { data: existing } = await supabase
        .from('trip_experience_votes')
        .select('id, vote')
        .eq('trip_experience_id', tripExperienceId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        if (existing.vote === vote) {
          // Toggle off — remove vote
          await supabase.from('trip_experience_votes').delete().eq('id', existing.id)
        } else {
          // Switch vote direction
          await supabase.from('trip_experience_votes').update({ vote }).eq('id', existing.id)
        }
      } else {
        await supabase.from('trip_experience_votes').insert({
          trip_experience_id: tripExperienceId,
          user_id: user.id,
          vote,
        })
      }

      const profile = useAuthStore.getState().profile
      await supabase.from('trip_activity').insert({
        trip_id: tripId, user_id: user.id,
        display_name: profile?.first_name || 'A member',
        activity_type: 'experience_voted',
        payload: { trip_experience_id: tripExperienceId, vote },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trip-experiences', tripId] })
      qc.invalidateQueries({ queryKey: ['trip-votes', tripId, user?.id] })
    },
  })
}

export function useApproveTripExperience(tripId) {
  const qc   = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async ({ tripExperienceId, status }) => {
      const { error } = await supabase
        .from('trip_experiences')
        .update({ status })
        .eq('id', tripExperienceId)
      if (error) throw error

      if (status === 'approved') {
        const profile = useAuthStore.getState().profile
        await supabase.from('trip_activity').insert({
          trip_id: tripId, user_id: user.id,
          display_name: profile?.first_name || 'The owner',
          activity_type: 'experience_approved',
          payload: { trip_experience_id: tripExperienceId },
        })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-experiences', tripId] }),
  })
}

export function useRemoveTripExperience(tripId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tripExperienceId) => {
      const { error } = await supabase.from('trip_experiences').delete().eq('id', tripExperienceId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-experiences', tripId] }),
  })
}

export function useUpdateTripExperienceOrder(tripId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dayNumber, timeSlot, sortOrder }) => {
      const { error } = await supabase
        .from('trip_experiences')
        .update({ day_number: dayNumber, time_slot: timeSlot, sort_order: sortOrder })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-experiences', tripId] }),
  })
}
