/**
 * Unit tests for experience claim and guide application updates.
 * Pure validation logic — no Supabase calls.
 */
import { describe, it, expect } from 'vitest'

// ── Claim form validation ─────────────────────────────────────────────────────

const VALID_ROLES = ['owner', 'manager', 'marketing', 'other']

function validateClaim({ claimant_name, claimant_email, business_role, experience_id }) {
  if (!experience_id)            return { valid: false, reason: 'experience_id is required' }
  if (!claimant_name?.trim())    return { valid: false, reason: 'claimant_name is required' }
  if (!claimant_email?.trim())   return { valid: false, reason: 'claimant_email is required' }
  if (!business_role)            return { valid: false, reason: 'business_role is required' }
  if (!VALID_ROLES.includes(business_role)) {
    return { valid: false, reason: `business_role must be one of: ${VALID_ROLES.join(', ')}` }
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(claimant_email)) return { valid: false, reason: 'claimant_email is invalid' }
  return { valid: true }
}

const VALID_CLAIM = {
  experience_id:  'exp-abc',
  claimant_name:  'Jane Smith',
  claimant_email: 'jane@bbqkc.com',
  business_role:  'owner',
}

describe('validateClaim — required fields', () => {
  it('accepts a valid claim', () => {
    expect(validateClaim(VALID_CLAIM).valid).toBe(true)
  })

  it('rejects missing experience_id', () => {
    const { experience_id: _, ...rest } = VALID_CLAIM
    const r = validateClaim(rest)
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/experience_id/)
  })

  it('rejects missing claimant_name', () => {
    const r = validateClaim({ ...VALID_CLAIM, claimant_name: '' })
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/claimant_name/)
  })

  it('rejects missing claimant_email', () => {
    const r = validateClaim({ ...VALID_CLAIM, claimant_email: '' })
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/claimant_email/)
  })

  it('rejects missing business_role', () => {
    const r = validateClaim({ ...VALID_CLAIM, business_role: '' })
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/business_role/)
  })

  it('rejects an invalid business_role', () => {
    const r = validateClaim({ ...VALID_CLAIM, business_role: 'ceo' })
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/business_role/)
  })

  it('accepts all valid roles', () => {
    for (const role of VALID_ROLES) {
      expect(validateClaim({ ...VALID_CLAIM, business_role: role }).valid).toBe(true)
    }
  })

  it('rejects invalid email format', () => {
    const r = validateClaim({ ...VALID_CLAIM, claimant_email: 'notanemail' })
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/invalid/)
  })
})

// ── Guide application — consent + rate validation ─────────────────────────────

function validateGuideApplicationV2({ first_name, last_name, email, city, bio, languages, rate_text, consent }) {
  if (!first_name?.trim())  return { valid: false, reason: 'first_name is required' }
  if (!last_name?.trim())   return { valid: false, reason: 'last_name is required' }
  if (!email?.trim())       return { valid: false, reason: 'email is required' }
  if (!city?.trim())        return { valid: false, reason: 'city is required' }
  if (!bio?.trim())         return { valid: false, reason: 'bio is required' }
  if (!languages?.length)   return { valid: false, reason: 'at least one language required' }
  if (!rate_text?.trim())   return { valid: false, reason: 'rate_text is required' }
  if (!consent)             return { valid: false, reason: 'background check consent is required' }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(email)) return { valid: false, reason: 'email is invalid' }
  return { valid: true }
}

const VALID_GUIDE = {
  first_name: 'Alex', last_name: 'Johnson',
  email: 'alex@example.com', city: 'Kansas City',
  bio: 'KC native with 10 years of local knowledge.',
  languages: ['English'], rate_text: '$75/person', consent: true,
}

describe('validateGuideApplicationV2 — new fields', () => {
  it('accepts a complete application', () => {
    expect(validateGuideApplicationV2(VALID_GUIDE).valid).toBe(true)
  })

  it('rejects missing rate_text', () => {
    const r = validateGuideApplicationV2({ ...VALID_GUIDE, rate_text: '' })
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/rate/)
  })

  it('rejects when consent is false', () => {
    const r = validateGuideApplicationV2({ ...VALID_GUIDE, consent: false })
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/consent/)
  })

  it('rejects when consent is undefined', () => {
    const { consent: _, ...rest } = VALID_GUIDE
    const r = validateGuideApplicationV2(rest)
    expect(r.valid).toBe(false)
    expect(r.reason).toMatch(/consent/)
  })

  it('accepts any non-empty rate string', () => {
    for (const rate of ['$50/hr', '$100/person', 'Free', '€75']) {
      expect(validateGuideApplicationV2({ ...VALID_GUIDE, rate_text: rate }).valid).toBe(true)
    }
  })
})

// ── Claim approval side-effect logic ─────────────────────────────────────────

function applyClaimApproval(experience, claim) {
  return {
    ...experience,
    is_claimed:           true,
    verified_owner_email: claim.claimant_email,
  }
}

describe('applyClaimApproval', () => {
  it('sets is_claimed to true', () => {
    const exp    = { id: 'exp-1', title: 'BBQ Tour', is_claimed: false }
    const claim  = { claimant_email: 'jane@bbqkc.com' }
    const result = applyClaimApproval(exp, claim)
    expect(result.is_claimed).toBe(true)
  })

  it('stores the claimant email as verified_owner_email', () => {
    const exp    = { id: 'exp-1', title: 'BBQ Tour', is_claimed: false }
    const claim  = { claimant_email: 'owner@example.com' }
    const result = applyClaimApproval(exp, claim)
    expect(result.verified_owner_email).toBe('owner@example.com')
  })

  it('preserves all other experience fields', () => {
    const exp    = { id: 'exp-1', title: 'BBQ Tour', city: 'Kansas City', is_claimed: false }
    const result = applyClaimApproval(exp, { claimant_email: 'x@y.com' })
    expect(result.title).toBe('BBQ Tour')
    expect(result.city).toBe('Kansas City')
  })
})
