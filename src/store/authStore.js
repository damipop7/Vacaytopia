import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { getAuthCallbackUrl } from '../lib/appUrl'

export const useAuthStore = create((set, get) => ({
  user:    null,
  profile: null,
  loading: true,

  // Called once on app mount — listens for auth state changes
  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      set({ user: session.user })
      await get().fetchProfile(session.user.id)
    } else {
      set({ user: null, profile: null })
    }
    set({ loading: false })

    // FIX: store the unsubscribe handle so we don't leak listeners on HMR
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        set({ user: session.user })
        await get().fetchProfile(session.user.id)
      } else {
        set({ user: null, profile: null })
      }
    })

    // Return cleanup — React StrictMode / HMR calls init twice; this prevents double listeners
    return () => subscription.unsubscribe()
  },

  fetchProfile: async (userId) => {
    if (!userId) return
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    const { data: { user } } = await supabase.auth.getUser()
    set(state => ({
      user: user ?? state.user,
      profile: profile ?? null,
    }))
  },

  signUp: async ({ email, password, firstName, lastName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName }
      }
    })
    if (error) throw error
    return data
  },

  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  signInWithIdToken: async (idToken) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    })
    if (error) throw error
    return data
  },

  // FIX: clear state first so UI updates immediately, then call Supabase
  signOut: async () => {
    set({ user: null, profile: null })
    await supabase.auth.signOut()
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    set({ profile: data })
    return data
  },
}))
