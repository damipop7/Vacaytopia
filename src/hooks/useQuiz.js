import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function useLatestQuiz() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['quiz', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

export function useSaveQuiz() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async payload => {
      if (!user) throw new Error('Sign in required')

      const { error } = await supabase.from('quiz_results').insert({
        user_id: user.id,
        interests: payload.interests,
        budget: payload.budget,
        travel_style: payload.travel_style || null,
        group_type: payload.group_type?.length ? payload.group_type : [],
        destination_city:
          payload.destination_city && payload.destination_city !== 'all'
            ? payload.destination_city
            : null,
        arrive_date: payload.arrive_date || null,
        depart_date: payload.depart_date || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })
}
