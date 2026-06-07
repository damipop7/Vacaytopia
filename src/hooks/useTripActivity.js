import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function useTripActivity(tripId) {
  return useQuery({
    queryKey: ['trip-activity', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_activity')
        .select('id, user_id, display_name, activity_type, payload, created_at')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data ?? []
    },
    enabled: !!tripId,
  })
}

export function useSendTripMessage(tripId) {
  const qc   = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async (text) => {
      const profile = useAuthStore.getState().profile
      const { error } = await supabase.from('trip_activity').insert({
        trip_id: tripId,
        user_id: user.id,
        display_name: profile?.first_name || user.email?.split('@')[0] || 'Traveler',
        activity_type: 'message',
        payload: { text },
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-activity', tripId] }),
  })
}

const ACTIVITY_LABELS = {
  member_joined:       (p, name) => `${name} joined the trip`,
  experience_added:    (p, name) => `${name} added "${p?.experience_name}" to Day ${p?.day_number}`,
  experience_voted:    (p, name) => `${name} voted ${p?.vote === 1 ? '👍' : '👎'} on an experience`,
  experience_approved: (p, name) => `${name} approved an experience`,
  budget_contributed:  (p, name) => `${name} pledged $${Math.round((p?.amount_cents ?? 0) / 100)} to the trip budget`,
  booking_made:        (p, name) => `${name} booked an experience for the group`,
  itinerary_generated: (p, name) => `${name} generated an AI itinerary`,
  dates_set:           (p, name) => `${name} set the trip dates`,
  note_added:          (p, name) => `${name} added a note`,
  message:             p => p?.text ?? '',
}

export function activityLabel(item) {
  const fn = ACTIVITY_LABELS[item.activity_type]
  return fn ? fn(item.payload, item.display_name ?? 'Someone') : item.activity_type
}
