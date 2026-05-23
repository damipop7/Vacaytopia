/**
 * Unit tests for itinerary experience-ID safety and stall-detection logic.
 * Pure logic — no network calls.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── experienceId guard: only catalog UUIDs should pass through ────────────────

const CATALOG = [
  { id: 'aaa-111', title: 'KC BBQ Tour', experience_type: 'reservable' },
  { id: 'bbb-222', title: 'Nelson-Atkins Museum', experience_type: 'cultural_paid' },
]

function resolveExperienceId(activityTitle, experienceId, catalog) {
  if (!experienceId) return ''
  const match = catalog.find(e => e.id === experienceId)
  if (!match) return ''
  return experienceId
}

describe('resolveExperienceId — guard against hallucinated IDs', () => {
  it('passes through a valid catalog UUID', () => {
    expect(resolveExperienceId('KC BBQ Tour', 'aaa-111', CATALOG)).toBe('aaa-111')
  })

  it('strips a fabricated UUID not in catalog', () => {
    expect(resolveExperienceId('Starbucks', 'fake-uuid-999', CATALOG)).toBe('')
  })

  it('returns empty string when experienceId is empty', () => {
    expect(resolveExperienceId('Generic activity', '', CATALOG)).toBe('')
  })

  it('returns empty string when experienceId is null/undefined', () => {
    expect(resolveExperienceId('Some activity', null, CATALOG)).toBe('')
    expect(resolveExperienceId('Some activity', undefined, CATALOG)).toBe('')
  })

  it('is case-sensitive — partial match does not pass', () => {
    expect(resolveExperienceId('KC BBQ', 'AAA-111', CATALOG)).toBe('')
  })
})

// ── Stall detector: fires abort after silence threshold ───────────────────────

function makeStallDetector(abortFn, stallMs = 15_000, checkIntervalMs = 2_000) {
  let lastByteAt = Date.now()
  const id = setInterval(() => {
    if (Date.now() - lastByteAt > stallMs) {
      clearInterval(id)
      abortFn()
    }
  }, checkIntervalMs)

  return {
    onBytes: () => { lastByteAt = Date.now() },
    clear:   () => clearInterval(id),
  }
}

describe('stall detector', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('does not fire abort if bytes keep arriving', () => {
    const abort = vi.fn()
    const detector = makeStallDetector(abort, 15_000, 2_000)

    vi.advanceTimersByTime(4_000)
    detector.onBytes()
    vi.advanceTimersByTime(4_000)
    detector.onBytes()
    vi.advanceTimersByTime(4_000)

    expect(abort).not.toHaveBeenCalled()
    detector.clear()
  })

  it('fires abort after stallMs of silence', () => {
    const abort = vi.fn()
    makeStallDetector(abort, 15_000, 2_000)

    vi.advanceTimersByTime(16_000)

    expect(abort).toHaveBeenCalledOnce()
  })

  it('does not fire again after abort already called', () => {
    const abort = vi.fn()
    makeStallDetector(abort, 15_000, 2_000)

    vi.advanceTimersByTime(20_000)

    expect(abort).toHaveBeenCalledOnce()
  })

  it('resets timer on new bytes — no abort if bytes arrive just before threshold', () => {
    const abort = vi.fn()
    const detector = makeStallDetector(abort, 15_000, 2_000)

    vi.advanceTimersByTime(14_000)
    detector.onBytes()
    vi.advanceTimersByTime(14_000)
    detector.onBytes()
    vi.advanceTimersByTime(5_000)

    expect(abort).not.toHaveBeenCalled()
    detector.clear()
  })
})

// ── Not-found message: from=itinerary shows different copy ───────────────────

function notFoundMessage(fromItinerary) {
  return fromItinerary
    ? "This spot isn't on Vtopia yet"
    : 'Experience not found'
}

describe('not-found copy', () => {
  it('shows itinerary-specific message when from=itinerary', () => {
    expect(notFoundMessage(true)).toMatch(/isn't on Vtopia/)
  })

  it('shows generic message on direct navigation', () => {
    expect(notFoundMessage(false)).toBe('Experience not found')
  })
})
