import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/**
 * Subscribe to all live changes on a trip — experiences, members, activity.
 * Invalidates React Query caches so the UI updates automatically.
 *
 * Must be called inside a component that is rendered while the trip dashboard
 * is visible. Cleans up the channel on unmount.
 */
export function useTripRealtime(tripId) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!tripId) return

    const channel = supabase
      .channel(`trip:${tripId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_experiences', filter: `trip_id=eq.${tripId}` },
        () => qc.invalidateQueries({ queryKey: ['trip-experiences', tripId] })
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trip_activity', filter: `trip_id=eq.${tripId}` },
        () => qc.invalidateQueries({ queryKey: ['trip-activity', tripId] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${tripId}` },
        () => qc.invalidateQueries({ queryKey: ['trip', tripId] })
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` },
        () => qc.invalidateQueries({ queryKey: ['trip', tripId] })
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tripId, qc])
}
