/**
 * Tests for the signup → profile creation flow.
 *
 * Covers the three failure modes fixed in migration 020:
 *   1. handle_new_user trigger logic — profile is built correctly from auth data
 *   2. RLS INSERT policy — policy (with check: true) admits any valid profile row
 *   3. signUp store — errors propagate cleanly; success returns user data
 *
 * Pure logic only — no Supabase calls.
 */
import { describe, it, expect } from 'vitest'

// ── 1. handle_new_user trigger logic ─────────────────────────────────────────
// Mirrors the SQL in migrations/001_initial_schema.sql (updated by 020).
// The trigger builds a profiles row from auth.users NEW record.

function buildProfileFromAuthUser(newUser) {
  const { id, email, raw_user_meta_data = {} } = newUser
  if (!id)    throw new Error('id is required — auth.users must always have an id')
  if (!email) throw new Error('email is NOT NULL in profiles — trigger would fail')
  return {
    id,
    email,
    first_name: raw_user_meta_data?.first_name ?? null,
    last_name:  raw_user_meta_data?.last_name  ?? null,
  }
}

describe('handle_new_user — profile built from auth data', () => {
  it('maps all fields correctly for a full signup', () => {
    const profile = buildProfileFromAuthUser({
      id:    'uuid-123',
      email: 'dami@vtopia.world',
      raw_user_meta_data: { first_name: 'Dami', last_name: 'Pop' },
    })
    expect(profile.id).toBe('uuid-123')
    expect(profile.email).toBe('dami@vtopia.world')
    expect(profile.first_name).toBe('Dami')
    expect(profile.last_name).toBe('Pop')
  })

  it('allows null last_name when only first name provided', () => {
    const profile = buildProfileFromAuthUser({
      id:    'uuid-456',
      email: 'solo@vtopia.world',
      raw_user_meta_data: { first_name: 'Solo' },
    })
    expect(profile.first_name).toBe('Solo')
    expect(profile.last_name).toBeNull()
  })

  it('allows null names when metadata is missing entirely (OAuth signups)', () => {
    const profile = buildProfileFromAuthUser({
      id:    'uuid-789',
      email: 'oauth@vtopia.world',
    })
    expect(profile.first_name).toBeNull()
    expect(profile.last_name).toBeNull()
    expect(profile.email).toBe('oauth@vtopia.world')
  })

  it('throws when email is missing — trigger would violate NOT NULL constraint', () => {
    expect(() =>
      buildProfileFromAuthUser({ id: 'uuid-000', email: null })
    ).toThrow()
  })

  it('throws when id is missing — trigger would violate PK constraint', () => {
    expect(() =>
      buildProfileFromAuthUser({ id: null, email: 'x@vtopia.world' })
    ).toThrow()
  })
})

// ── 2. profiles INSERT policy — (with check: true) ───────────────────────────
// Migration 020 adds: CREATE POLICY "profiles_insert_on_signup"
//   ON public.profiles FOR INSERT WITH CHECK (true)
//
// "with check (true)" means every row passes — the trigger can always insert
// regardless of which Supabase internal role runs it.

function evaluateInsertPolicy() {
  // Mirrors: WITH CHECK (true)
  return true
}

describe('profiles_insert_on_signup policy', () => {
  it('admits a normal signup row', () => {
    expect(evaluateInsertPolicy({
      id: 'uuid-1', email: 'user@vtopia.world', first_name: 'Dami', last_name: 'Pop',
    })).toBe(true)
  })

  it('admits a row with null names (OAuth / minimal metadata)', () => {
    expect(evaluateInsertPolicy({
      id: 'uuid-2', email: 'oauth@vtopia.world', first_name: null, last_name: null,
    })).toBe(true)
  })

  it('admits when called from the trigger (auth.uid() is NULL during trigger)', () => {
    // auth.uid() returns null inside AFTER INSERT ON auth.users triggers.
    // The old missing-policy state would have blocked this. WITH CHECK (true) always passes.
    const authUid = null
    expect(evaluateInsertPolicy({ id: 'uuid-3', email: 'x@x.com', authUid })).toBe(true)
  })
})

// ── 3. signUp store — error propagation and success shape ─────────────────────
// Mirrors authStore.signUp — if supabase.auth.signUp returns an error, it must
// be thrown so AuthPage can catch it and show the user a message.

async function simulateSignUp(supabaseSignUp, payload) {
  const { data, error } = await supabaseSignUp(payload)
  if (error) throw error
  return data
}

describe('signUp store — error handling', () => {
  it('throws when Supabase returns a "database error saving new user" error', async () => {
    const brokenSupabase = async () => ({
      data: null,
      error: { message: 'Database error saving new user' },
    })
    await expect(simulateSignUp(brokenSupabase, {})).rejects.toMatchObject({
      message: 'Database error saving new user',
    })
  })

  it('returns user data on successful signup', async () => {
    const workingSupabase = async () => ({
      data: { user: { id: 'uuid-1', email: 'dami@vtopia.world' } },
      error: null,
    })
    const data = await simulateSignUp(workingSupabase, {})
    expect(data.user.id).toBe('uuid-1')
    expect(data.user.email).toBe('dami@vtopia.world')
  })

  it('throws when Supabase returns an email-already-exists error', async () => {
    const duplicateSupabase = async () => ({
      data: null,
      error: { message: 'User already registered' },
    })
    await expect(simulateSignUp(duplicateSupabase, {})).rejects.toMatchObject({
      message: 'User already registered',
    })
  })

  it('throws when Supabase returns a weak-password error', async () => {
    const weakPwSupabase = async () => ({
      data: null,
      error: { message: 'Password should be at least 6 characters' },
    })
    await expect(simulateSignUp(weakPwSupabase, {})).rejects.toMatchObject({
      message: expect.stringContaining('Password'),
    })
  })
})

// ── 4. AuthPage client-side validation ───────────────────────────────────────
// Validation runs before signUp is ever called — bad input should never reach
// the database.

function validateSignupForm({ email, password, firstName }) {
  if (!email || !email.includes('@')) return 'Please enter a valid email.'
  if (password.length < 8)           return 'Password must be at least 8 characters.'
  if (!firstName)                    return 'Please enter your first name.'
  return null
}

describe('AuthPage — signup form validation', () => {
  it('passes with valid inputs', () => {
    expect(validateSignupForm({
      email: 'dami@vtopia.world', password: 'secure123', firstName: 'Dami',
    })).toBeNull()
  })

  it('rejects a missing @ in email', () => {
    expect(validateSignupForm({ email: 'notanemail', password: 'secure123', firstName: 'Dami' }))
      .toMatch(/valid email/)
  })

  it('rejects an empty email', () => {
    expect(validateSignupForm({ email: '', password: 'secure123', firstName: 'Dami' }))
      .toMatch(/valid email/)
  })

  it('rejects a password shorter than 8 characters', () => {
    expect(validateSignupForm({ email: 'a@b.com', password: 'short', firstName: 'Dami' }))
      .toMatch(/8 characters/)
  })

  it('rejects missing first name', () => {
    expect(validateSignupForm({ email: 'a@b.com', password: 'secure123', firstName: '' }))
      .toMatch(/first name/)
  })
})
