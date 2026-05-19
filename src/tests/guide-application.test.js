/**
 * Unit tests for guide application form validation logic.
 * Pure functions only — no Supabase calls.
 */
import { describe, it, expect } from 'vitest'

// ── Mirrors the client-side validation in BecomeAGuidePage ────────────────────

function validateGuideApplication({ first_name, last_name, email, city, bio, languages }) {
  if (!first_name?.trim())   return { valid: false, reason: 'first_name is required' }
  if (!last_name?.trim())    return { valid: false, reason: 'last_name is required' }
  if (!email?.trim())        return { valid: false, reason: 'email is required' }
  if (!city?.trim())         return { valid: false, reason: 'city is required' }
  if (!bio?.trim())          return { valid: false, reason: 'bio is required' }
  if (!languages?.length)    return { valid: false, reason: 'at least one language is required' }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(email))  return { valid: false, reason: 'email is invalid' }
  return { valid: true }
}

function normaliseApplication(raw) {
  return {
    first_name:       raw.first_name.trim(),
    last_name:        raw.last_name.trim(),
    email:            raw.email.trim().toLowerCase(),
    city:             raw.city,
    bio:              raw.bio.trim(),
    languages:        raw.languages ?? [],
    specialties:      raw.specialties ?? [],
    experience_years: raw.experience_years ? parseInt(raw.experience_years) : null,
    instagram:        raw.instagram?.trim() || null,
    website:          raw.website?.trim() || null,
    why_vtopia:       raw.why_vtopia?.trim() || null,
  }
}

const VALID_BASE = {
  first_name: 'Alex', last_name: 'Johnson',
  email: 'alex@example.com', city: 'Kansas City',
  bio: 'KC native with 10 years of local knowledge.',
  languages: ['English', 'Spanish'],
}

// ── Required field validation ─────────────────────────────────────────────────

describe('validateGuideApplication — required fields', () => {
  it('returns valid for a complete application', () => {
    expect(validateGuideApplication(VALID_BASE).valid).toBe(true)
  })

  it('invalid when first_name missing', () => {
    const r = validateGuideApplication({ ...VALID_BASE, first_name: '' })
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/first_name/)
  })

  it('invalid when last_name missing', () => {
    const r = validateGuideApplication({ ...VALID_BASE, last_name: '' })
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/last_name/)
  })

  it('invalid when email missing', () => {
    const r = validateGuideApplication({ ...VALID_BASE, email: '' })
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/email/)
  })

  it('invalid when city missing', () => {
    const r = validateGuideApplication({ ...VALID_BASE, city: '' })
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/city/)
  })

  it('invalid when bio missing', () => {
    const r = validateGuideApplication({ ...VALID_BASE, bio: '' })
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/bio/)
  })

  it('invalid when languages empty', () => {
    const r = validateGuideApplication({ ...VALID_BASE, languages: [] })
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/language/)
  })

  it('invalid when languages undefined', () => {
    const { languages: _, ...rest } = VALID_BASE
    const r = validateGuideApplication(rest)
    expect(r.valid).toBe(false)
  })
})

// ── Email format validation ───────────────────────────────────────────────────

describe('validateGuideApplication — email format', () => {
  it('accepts a standard email', () => {
    expect(validateGuideApplication({ ...VALID_BASE, email: 'user@domain.com' }).valid).toBe(true)
  })

  it('rejects email without @', () => {
    const r = validateGuideApplication({ ...VALID_BASE, email: 'notanemail' })
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/invalid/)
  })

  it('rejects email without domain', () => {
    const r = validateGuideApplication({ ...VALID_BASE, email: 'user@' })
    expect(r.valid).toBe(false)
  })
})

// ── normaliseApplication helper ───────────────────────────────────────────────

describe('normaliseApplication', () => {
  it('trims whitespace from text fields', () => {
    const result = normaliseApplication({ ...VALID_BASE, first_name: '  Alex  ', bio: '  Great bio.  ' })
    expect(result.first_name).toBe('Alex')
    expect(result.bio).toBe('Great bio.')
  })

  it('lowercases the email', () => {
    const result = normaliseApplication({ ...VALID_BASE, email: 'ALEX@Example.COM' })
    expect(result.email).toBe('alex@example.com')
  })

  it('converts experience_years string to integer', () => {
    const result = normaliseApplication({ ...VALID_BASE, experience_years: '7' })
    expect(result.experience_years).toBe(7)
  })

  it('sets experience_years to null when blank', () => {
    const result = normaliseApplication({ ...VALID_BASE, experience_years: '' })
    expect(result.experience_years).toBeNull()
  })

  it('normalises instagram to null when blank', () => {
    const result = normaliseApplication({ ...VALID_BASE, instagram: '' })
    expect(result.instagram).toBeNull()
  })

  it('normalises instagram to null when only spaces', () => {
    const result = normaliseApplication({ ...VALID_BASE, instagram: '   ' })
    expect(result.instagram).toBeNull()
  })

  it('preserves non-blank instagram handle', () => {
    const result = normaliseApplication({ ...VALID_BASE, instagram: 'myhandle' })
    expect(result.instagram).toBe('myhandle')
  })

  it('sets specialties to empty array when undefined', () => {
    const result = normaliseApplication(VALID_BASE)
    expect(result.specialties).toEqual([])
  })
})
