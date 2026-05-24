import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const AVATAR_COLORS = [
  '#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6',
  '#EC4899','#06B6D4','#84CC16','#F97316','#6366F1',
]
function randomColor() { return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ── Queries ──────────────────────────────────────────────────────────────────

export function useMyTrips() {
  const user = useAuthStore(s => s.user)
  return useQuery({
    queryKey: ['trips', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id, title, destination, start_date, end_date, trip_type,
          status, share_token, total_budget_cents, is_public, created_at,
          trip_members ( id, user_id, display_name, avatar_color, role, contribution_cents, contribution_status )
        `)
        .or(`created_by.eq.${user.id},trip_members.user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!user?.id,
  })
}

export function useTrip(tripId) {
  return useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id, title, destination, start_date, end_date, trip_type,
          status, share_token, total_budget_cents, is_public, created_by,
          created_at, updated_at,
          trip_members (
            id, user_id, display_name, avatar_color, role,
            contribution_cents, contribution_status, joined_at
          )
        `)
        .eq('id', tripId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!tripId,
  })
}

/** Fetch a trip via its public share_token (used on join page — no auth required) */
export function useTripByToken(shareToken) {
  return useQuery({
    queryKey: ['trip-token', shareToken],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id, title, destination, start_date, end_date, trip_type, status,
          share_token, created_at,
          trip_members ( id, display_name, avatar_color, role )
        `)
        .eq('share_token', shareToken)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!shareToken,
  })
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function useCreateTrip() {
  const qc   = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async ({ title, destination = 'Kansas City', startDate, endDate, tripType = 'solo', totalBudgetCents = 0 }) => {
      // Cancel in-flight requests after 12s so the button never freezes indefinitely
      const ctrl      = new AbortController()
      const timeoutId = setTimeout(() => ctrl.abort(), 12_000)

      try {
        const { data: trip, error } = await supabase
          .from('trips')
          .insert({
            title,
            destination,
            start_date: startDate || null,
            end_date: endDate || null,
            trip_type: tripType,
            total_budget_cents: totalBudgetCents,
            created_by: user.id,
          })
          .select()
          .single()
          .abortSignal(ctrl.signal)
        if (error) throw error

        const profile = useAuthStore.getState().profile
        const { error: memberErr } = await supabase
          .from('trip_members')
          .insert({
            trip_id: trip.id,
            user_id: user.id,
            display_name: profile?.first_name || user.email?.split('@')[0] || 'Traveler',
            avatar_color: randomColor(),
            role: 'owner',
            contribution_status: 'paid',
          })
          .abortSignal(ctrl.signal)
        if (memberErr) throw memberErr

        // Non-critical activity log — fire and forget so it never blocks the mutation
        supabase.from('trip_activity').insert({
          trip_id: trip.id,
          user_id: user.id,
          display_name: profile?.first_name || 'You',
          activity_type: 'member_joined',
          payload: { role: 'owner' },
        })

        return trip
      } catch (err) {
        if (ctrl.signal.aborted) throw new Error('Connection timed out — please try again.')
        throw err
      } finally {
        clearTimeout(timeoutId)
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  })
}

export function useJoinTrip() {
  const qc   = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async (shareToken) => {
      // Resolve token → trip id
      const { data: trip, error: lookupErr } = await supabase
        .from('trips')
        .select('id, title')
        .eq('share_token', shareToken)
        .single()
      if (lookupErr || !trip) throw new Error('Trip not found')

      const profile = useAuthStore.getState().profile
      const displayName = profile?.first_name || user.email?.split('@')[0] || 'Traveler'

      const { error: joinErr } = await supabase.from('trip_members').insert({
        trip_id: trip.id,
        user_id: user.id,
        display_name: displayName,
        avatar_color: randomColor(),
        role: 'member',
      })
      // Ignore unique violation — already a member
      if (joinErr && !joinErr.message.includes('unique')) throw joinErr

      await supabase.from('trip_activity').insert({
        trip_id: trip.id,
        user_id: user.id,
        display_name: displayName,
        activity_type: 'member_joined',
        payload: {},
      })

      return trip
    },
    onSuccess: (_d, _v, _c) => qc.invalidateQueries({ queryKey: ['trips'] }),
  })
}

export function useUpdateTrip(tripId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (updates) => {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', tripId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip', tripId] }),
  })
}

export function usePledgeBudget(tripId) {
  const qc   = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async ({ memberId, amountCents, note = '' }) => {
      const { error: contribErr } = await supabase.from('trip_budget_contributions').insert({
        trip_id: tripId, member_id: memberId, amount_cents: amountCents, method: 'pledge', note,
      })
      if (contribErr) throw contribErr

      // Update member contribution total
      const { data: member } = await supabase
        .from('trip_members')
        .select('contribution_cents')
        .eq('id', memberId)
        .single()
      await supabase.from('trip_members').update({
        contribution_cents: (member?.contribution_cents ?? 0) + amountCents,
        contribution_status: 'committed',
      }).eq('id', memberId)

      // Update trip total
      const { data: trip } = await supabase.from('trips').select('total_budget_cents').eq('id', tripId).single()
      await supabase.from('trips').update({
        total_budget_cents: (trip?.total_budget_cents ?? 0) + amountCents,
      }).eq('id', tripId)

      const profile = useAuthStore.getState().profile
      await supabase.from('trip_activity').insert({
        trip_id: tripId, user_id: user.id,
        display_name: profile?.first_name || 'A member',
        activity_type: 'budget_contributed',
        payload: { amount_cents: amountCents },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trip', tripId] })
      qc.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

// ── Itinerary hooks ──────────────────────────────────────────────────────────

export function useMyItineraries() {
  const user = useAuthStore(s => s.user)
  return useQuery({
    queryKey: ['my-itineraries', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itineraries')
        .select('id, city, start_date, end_date, budget, itinerary_data, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return data ?? []
    },
    enabled: !!user?.id,
  })
}

/** Creates a group trip from an AI itinerary and batch-imports all time slots. */
export function useImportItineraryAsGroupTrip() {
  const qc   = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async ({ itinerary, cityLabel, startDate, endDate }) => {
      const { data: profile } = await supabase.from('profiles').select('first_name').eq('id', user.id).single()

      const { data: trip, error: tripErr } = await supabase
        .from('trips')
        .insert({
          title:       itinerary.headline || `${cityLabel || 'KC'} Group Trip`,
          destination: cityLabel || 'Kansas City',
          start_date:  startDate || null,
          end_date:    endDate   || null,
          trip_type:   'group',
          created_by:  user.id,
        })
        .select()
        .single()
      if (tripErr) throw tripErr

      await supabase.from('trip_members').insert({
        trip_id:      trip.id,
        user_id:      user.id,
        display_name: profile?.first_name || user.email?.split('@')[0] || 'Traveler',
        avatar_color: randomColor(),
        role:         'owner',
        contribution_status: 'paid',
      })

      const rows = []
      for (const day of (itinerary.days ?? [])) {
        ;['morning', 'afternoon', 'evening'].forEach((slot, sortIdx) => {
          const slotData = day[slot]
          if (!slotData?.title) return
          const isUuid = UUID_RE.test(slotData.experienceId ?? '')
          rows.push({
            trip_id:       trip.id,
            experience_id: isUuid ? slotData.experienceId : null,
            custom_name:   isUuid ? null : slotData.title,
            custom_type:   isUuid ? null : 'other',
            added_by:      user.id,
            day_number:    day.day,
            time_slot:     slot,
            status:        'suggested',
            notes:         slotData.tip || null,
            sort_order:    sortIdx,
          })
        })
      }
      if (rows.length > 0) {
        const { error: expErr } = await supabase.from('trip_experiences').insert(rows)
        if (expErr) console.warn('Partial import failure:', expErr)
      }

      supabase.from('trip_activity').insert({
        trip_id:       trip.id,
        user_id:       user.id,
        display_name:  profile?.first_name || 'You',
        activity_type: 'member_joined',
        payload:       { role: 'owner', source: 'itinerary_import' },
      })

      return trip
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  })
}
