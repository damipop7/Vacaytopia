/**
 * Unit tests for auth store resilience and quiz fixes.
 * Pure logic — no Supabase calls.
 */
import { describe, it, expect } from 'vitest'

// ── Auth loading guard ────────────────────────────────────────────────────────
// Simulates the init() flow with try/catch/finally so loading always resolves

async function simulateInit(sessionFn, profileFn) {
  const state = { loading: true, user: null, profile: null }
  const set = (patch) => Object.assign(state, patch)

  try {
    const session = await sessionFn()
    if (session?.user) {
      set({ user: session.user })
      try { await profileFn(session.user.id) } catch { /* non-fatal */ }
    } else {
      set({ user: null, profile: null })
    }
  } catch {
    set({ user: null, profile: null })
  } finally {
    set({ loading: false })
  }

  return state
}

describe('auth init — loading always resolves', () => {
  it('sets loading=false and user when session is valid', async () => {
    const state = await simulateInit(
      async () => ({ user: { id: 'u1' } }),
      async () => {}
    )
    expect(state.loading).toBe(false)
    expect(state.user?.id).toBe('u1')
  })

  it('sets loading=false and user=null when no session', async () => {
    const state = await simulateInit(async () => null, async () => {})
    expect(state.loading).toBe(false)
    expect(state.user).toBeNull()
  })

  it('sets loading=false even if fetchProfile throws', async () => {
    const state = await simulateInit(
      async () => ({ user: { id: 'u1' } }),
      async () => { throw new Error('network error') }
    )
    expect(state.loading).toBe(false)
    expect(state.user?.id).toBe('u1')
  })

  it('sets loading=false even if getSession throws', async () => {
    const state = await simulateInit(
      async () => { throw new Error('auth down') },
      async () => {}
    )
    expect(state.loading).toBe(false)
    expect(state.user).toBeNull()
  })
})

// ── Solo travel auto-sets group size ─────────────────────────────────────────

const GROUP_TO_TRAVELER = {
  solo: 'solo', couple: 'couple', friends: 'friends',
  'large-group': 'friends', family: 'family',
}

function applyTravelerGroup(prev, travelerGroup) {
  return {
    ...prev,
    travelerGroup,
    traveler: GROUP_TO_TRAVELER[travelerGroup] ?? 'solo',
    ...(travelerGroup === 'solo' ? { groupSize: 1 } : {}),
  }
}

describe('quiz — solo travel sets groupSize to 1', () => {
  it('solo → groupSize 1', () => {
    const result = applyTravelerGroup({ groupSize: 3 }, 'solo')
    expect(result.groupSize).toBe(1)
    expect(result.traveler).toBe('solo')
  })

  it('couple → keeps existing groupSize', () => {
    const result = applyTravelerGroup({ groupSize: 3 }, 'couple')
    expect(result.groupSize).toBe(3)
    expect(result.traveler).toBe('couple')
  })

  it('friends → keeps existing groupSize', () => {
    const result = applyTravelerGroup({ groupSize: 5 }, 'friends')
    expect(result.groupSize).toBe(5)
  })

  it('large-group → maps to friends traveler type', () => {
    const result = applyTravelerGroup({ groupSize: 8 }, 'large-group')
    expect(result.traveler).toBe('friends')
    expect(result.groupSize).toBe(8)
  })
})
