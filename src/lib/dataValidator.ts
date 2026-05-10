/**
 * Canonical experience schema validator.
 * Run before inserting any new experience record to ensure data quality.
 * Returns a quality score (0–100) and a list of issues.
 */

export interface ExperienceInput {
  id?: string
  title?: string
  description?: string
  city?: string
  category?: string
  experience_type?: string
  price_per_person?: number
  price_tier?: number | null
  lat?: number | null
  lng?: number | null
  image_url?: string | null
  hours?: Record<string, string> | null  // e.g. { mon: "09:00-21:00", ... }
  rating?: number | null
  review_count?: number | null
  is_active?: boolean
  tags?: string[]
  external_url?: string | null
  google_place_id?: string | null
  data_freshness?: string | null  // ISO date
}

export interface ValidationResult {
  valid: boolean
  qualityScore: number   // 0–100
  issues: string[]
  warnings: string[]
}

const VALID_CATEGORIES = new Set([
  'Food & Drink', 'Outdoors', 'Nightlife', 'Sports', 'Arts & Culture', 'Wellness',
])

const VALID_TYPES = new Set([
  'reservable','ticketed','restaurant_reserve','food_walkup','food_delivery',
  'outdoor_free','outdoor_paid','cultural_free','cultural_paid',
  'nightlife_walkin','nightlife_ticketed','nightlife','shopping','hotel',
  'sports_event','transport','free_no_booking','outdoor_info',
])

export function validateExperience(exp: ExperienceInput): ValidationResult {
  const issues: string[]   = []
  const warnings: string[] = []
  let score = 100

  // ── Required fields ─────────────────────────────────────────────────────
  if (!exp.title?.trim()) { issues.push('Missing title'); score -= 25 }
  else if (exp.title.length < 5) { warnings.push('Title very short'); score -= 5 }

  if (!exp.city?.trim()) { issues.push('Missing city'); score -= 10 }
  if (!exp.category || !VALID_CATEGORIES.has(exp.category)) {
    issues.push(`Invalid or missing category (got: ${exp.category})`); score -= 10
  }
  if (!exp.experience_type || !VALID_TYPES.has(exp.experience_type)) {
    issues.push(`Invalid or missing experience_type (got: ${exp.experience_type})`); score -= 10
  }

  // ── Content quality ──────────────────────────────────────────────────────
  if (!exp.description?.trim()) { warnings.push('No description'); score -= 10 }
  else if (exp.description.length < 40) { warnings.push('Description very short (<40 chars)'); score -= 5 }

  // ── Location ──────────────────────────────────────────────────────────────
  if (exp.lat == null || exp.lng == null) { warnings.push('Missing lat/lng coordinates'); score -= 10 }
  else {
    if (exp.lat < 35 || exp.lat > 42 || exp.lng < -96 || exp.lng > -90) {
      warnings.push('Coordinates outside Kansas City region — verify location')
    }
  }

  // ── Media ──────────────────────────────────────────────────────────────────
  if (!exp.image_url) { warnings.push('No image URL'); score -= 5 }

  // ── Hours ─────────────────────────────────────────────────────────────────
  if (!exp.hours || Object.keys(exp.hours).length === 0) {
    warnings.push('No hours data — "Open now" filter will not work'); score -= 5
  }

  // ── Pricing ───────────────────────────────────────────────────────────────
  if (exp.price_per_person == null && exp.price_tier == null) {
    warnings.push('No price information')
  }

  // ── Data freshness ────────────────────────────────────────────────────────
  if (exp.data_freshness) {
    const ageMs = Date.now() - new Date(exp.data_freshness).getTime()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)
    if (ageDays > 30) { warnings.push(`Data stale (${Math.round(ageDays)} days old)`); score -= 5 }
  } else {
    warnings.push('No data_freshness timestamp')
  }

  score = Math.max(0, score)

  return {
    valid:        issues.length === 0,
    qualityScore: score,
    issues,
    warnings,
  }
}

/** Batch-validate and return only records below a quality threshold. */
export function findLowQualityRecords(
  experiences: ExperienceInput[],
  minScore = 60
): Array<ExperienceInput & { _validation: ValidationResult }> {
  return experiences
    .map(exp => ({ ...exp, _validation: validateExperience(exp) }))
    .filter(e => e._validation.qualityScore < minScore)
    .sort((a, b) => a._validation.qualityScore - b._validation.qualityScore)
}
