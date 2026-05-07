import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function useWishlist() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn:  async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('wishlists')
        .select('experience_id, experiences(*)')
        .eq('user_id', user.id)
      if (error) throw error
      return data.map(w => w.experiences)
    },
    enabled: !!user,
  })

  const savedIds = wishlist.map(e => e?.id).filter(Boolean)

  const toggle = useMutation({
    mutationFn: async (experienceId) => {
      if (!user) throw new Error('Sign in to save experiences')
      const isSaved = savedIds.includes(experienceId)
      if (isSaved) {
        await supabase.from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('experience_id', experienceId)
      } else {
        await supabase.from('wishlists')
          .insert({ user_id: user.id, experience_id: experienceId })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['user-prefs', user?.id] })
    },
    onError: (err) => {
      console.error('Wishlist toggle failed:', err.message)
    },
  })

  return {
    wishlist,
    savedIds,
    isLoading,
    toggleSave:  (id) => toggle.mutate(id),
    isSaved:     (id) => savedIds.includes(id),
    isSaving:    toggle.isPending,
  }
}
