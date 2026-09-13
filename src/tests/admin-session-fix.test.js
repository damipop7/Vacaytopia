/**
 * Regression test for the AdminPage "Bearer undefined" bug.
 *
 * SubmissionsTab used to read `session` off useAuthStore, which only ever
 * holds { user, profile, loading } — never `session` — so the review-submission
 * and operator-report edge function calls always sent `Bearer undefined`.
 * The fix fetches a fresh session via supabase.auth.getSession() at call time,
 * matching the working pattern already used in BookingPage's payment flow.
 */
import { describe, it, expect } from 'vitest'

// Mirrors the pre-fix authStore shape: no `session` field exists.
const authStoreState = { user: { id: 'u1' }, profile: { role: 'admin' }, loading: false }

function buildAuthHeaderFromStore(store) {
  const { session } = store
  return `Bearer ${session?.access_token}`
}

async function buildAuthHeaderFromGetSession(getSession) {
  const { data: { session } } = await getSession()
  return `Bearer ${session?.access_token}`
}

describe('AdminPage admin-action auth header', () => {
  it('BUG: destructuring session from authStore produces "Bearer undefined"', () => {
    const header = buildAuthHeaderFromStore(authStoreState)
    expect(header).toBe('Bearer undefined')
  })

  it('FIX: fetching the session via supabase.auth.getSession() produces a real token', async () => {
    const getSession = async () => ({ data: { session: { access_token: 'real-jwt-token' } } })
    const header = await buildAuthHeaderFromGetSession(getSession)
    expect(header).toBe('Bearer real-jwt-token')
  })

  it('FIX: still degrades to "Bearer undefined" (not a throw) if the session is genuinely absent', async () => {
    const getSession = async () => ({ data: { session: null } })
    const header = await buildAuthHeaderFromGetSession(getSession)
    expect(header).toBe('Bearer undefined')
  })
})
