import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const COMMISSION_RATE = parseFloat(import.meta.env.VITE_COMMISSION_RATE || '0.15')

export function useBookings() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn:  async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('bookings')
        .select(`*, experiences(title, city, category, image_emoji)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const createBooking = useMutation({
    mutationFn: async ({ experienceId, date, time, guests, contactDetails }) => {
      if (!user) throw new Error('Sign in to book')

      // 1. Fetch experience price
      const { data: exp, error: expErr } = await supabase
        .from('experiences')
        .select('price_per_person, title')
        .eq('id', experienceId)
        .single()

      if (expErr || !exp) throw new Error('Experience not found')

      const subtotal   = exp.price_per_person * guests
      const commission = Math.round(subtotal * COMMISSION_RATE * 100) / 100

      // 2. Create booking record (status: pending — Stripe webhook confirms)
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id:       user.id,
          experience_id: experienceId,
          booking_date:  date,
          booking_time:  time,
          guest_count:   guests,
          subtotal,
          commission,
          total_amount:  subtotal,
          status:        'pending',
          contact_name:  contactDetails.name,
          contact_email: contactDetails.email,
          contact_phone: contactDetails.phone || null,
          special_requests: contactDetails.specialRequests || null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings', user?.id])
    },
  })

  return { bookings, isLoading, error, createBooking }
}
