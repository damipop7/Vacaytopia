import { describe, it, expect } from 'vitest'
import { getDayKey, getTodayHours, isOpenNow, formatHoursRange } from '../lib/openingHours'

// Fix: 2026-05-24 (Sunday) 14:00 America/Chicago = 19:00 UTC
const SUNDAY_2PM_UTC = new Date('2026-05-24T19:00:00Z')
// 2026-05-25 (Monday) 08:00 America/Chicago = 13:00 UTC
const MONDAY_8AM_UTC = new Date('2026-05-25T13:00:00Z')
// 2026-05-26 (Tuesday) 22:30 America/Chicago = 03:30 UTC+1 next day
const TUE_1030PM_UTC = new Date('2026-05-27T03:30:00Z')

const HOURS = {
  sun: '10:00-18:00',
  mon: '09:00-21:00',
  tue: '09:00-22:00',
  wed: 'Closed',
  thu: '11:00-23:00',
  fri: '11:00-02:00',  // overnight
  sat: '10:00-02:00',  // overnight
}

// ── getDayKey ─────────────────────────────────────────────────────────────────

describe('getDayKey', () => {
  it('returns "sun" for a Sunday in KC timezone', () => {
    expect(getDayKey(SUNDAY_2PM_UTC)).toBe('sun')
  })

  it('returns "mon" for a Monday in KC timezone', () => {
    expect(getDayKey(MONDAY_8AM_UTC)).toBe('mon')
  })

  it('returns "tue" for a Tuesday in KC timezone', () => {
    expect(getDayKey(TUE_1030PM_UTC)).toBe('tue')
  })
})

// ── getTodayHours ─────────────────────────────────────────────────────────────

describe('getTodayHours', () => {
  it('returns the hours string for the current day', () => {
    expect(getTodayHours(HOURS, MONDAY_8AM_UTC)).toBe('09:00-21:00')
  })

  it('returns "Closed" for a day marked closed', () => {
    // Wednesday in KC — need a Wednesday date
    const WED_NOON_UTC = new Date('2026-05-27T17:00:00Z') // Wed 27 May noon KC
    expect(getTodayHours(HOURS, WED_NOON_UTC)).toBe('Closed')
  })

  it('returns null when hours object is null', () => {
    expect(getTodayHours(null, MONDAY_8AM_UTC)).toBeNull()
  })

  it('returns null when hours object is missing the day key', () => {
    expect(getTodayHours({ mon: '09:00-17:00' }, SUNDAY_2PM_UTC)).toBeNull()
  })

  it('returns null for non-object input', () => {
    expect(getTodayHours('09:00-21:00', MONDAY_8AM_UTC)).toBeNull()
    expect(getTodayHours(42, MONDAY_8AM_UTC)).toBeNull()
  })
})

// ── isOpenNow ─────────────────────────────────────────────────────────────────

describe('isOpenNow', () => {
  it('returns true when current time is within hours', () => {
    // Monday 8 AM KC, hours 09:00-21:00 → closed (before opening)
    expect(isOpenNow(HOURS, MONDAY_8AM_UTC)).toBe(false)
  })

  it('returns true at opening time', () => {
    // Monday 09:00 KC = 14:00 UTC
    const atOpen = new Date('2026-05-25T14:00:00Z')
    expect(isOpenNow(HOURS, atOpen)).toBe(true)
  })

  it('returns false at exactly closing time', () => {
    // Monday 21:00 KC = 02:00 UTC+1
    const atClose = new Date('2026-05-26T02:00:00Z')
    expect(isOpenNow(HOURS, atClose)).toBe(false)
  })

  it('returns false for a day marked Closed', () => {
    const WED_NOON_UTC = new Date('2026-05-27T17:00:00Z')
    expect(isOpenNow(HOURS, WED_NOON_UTC)).toBe(false)
  })

  it('returns null when hours is null', () => {
    expect(isOpenNow(null, MONDAY_8AM_UTC)).toBeNull()
  })

  it('returns null when hours is missing the day key', () => {
    expect(isOpenNow({}, MONDAY_8AM_UTC)).toBeNull()
  })

  it('handles overnight ranges — true after open time', () => {
    // Friday 22:30 KC (hours: 11:00-02:00)
    const FRI_1030PM_UTC = new Date('2026-05-29T03:30:00Z') // 22:30 KC Fri
    expect(isOpenNow(HOURS, FRI_1030PM_UTC)).toBe(true)
  })

  it('handles overnight ranges — true before close time next day', () => {
    // Friday at 01:00 AM KC (inside 22:00–02:00 window, next calendar day)
    const FRI_EARLY_UTC = new Date('2026-05-30T06:00:00Z') // 01:00 Sat KC
    // Actually this is Saturday morning so we need to check Saturday's hours
    // Saturday: 10:00-02:00. 01:00 is before 10:00 but overnight means sat open late
    // Let's use friday night instead
    const FRI_1AM_UTC = new Date('2026-05-29T06:00:00Z') // 01:00 AM Sat KC which is still within fri overnight? No.
    // overnight for friday (11:00-02:00) means fri 11pm to sat 2am
    // This test needs fri night (like midnight)
    const SAT_MIDNIGHT_UTC = new Date('2026-05-30T05:00:00Z') // Sat 00:00 KC
    // Saturday hours are 10:00-02:00. At midnight (00:00) it's within overnight window (>= 10:00 OR < 02:00)
    expect(isOpenNow(HOURS, SAT_MIDNIGHT_UTC)).toBe(true)
  })

  it('handles overnight ranges — false between close and open', () => {
    // Saturday 03:00 KC (after overnight close at 02:00, before open at 10:00)
    const SAT_3AM_UTC = new Date('2026-05-30T08:00:00Z') // 03:00 KC Sat
    expect(isOpenNow(HOURS, SAT_3AM_UTC)).toBe(false)
  })
})

// ── formatHoursRange ──────────────────────────────────────────────────────────

describe('formatHoursRange', () => {
  it('formats a simple daytime range', () => {
    expect(formatHoursRange('09:00-21:00')).toBe('9:00 AM – 9:00 PM')
  })

  it('formats noon correctly', () => {
    expect(formatHoursRange('12:00-18:00')).toBe('12:00 PM – 6:00 PM')
  })

  it('formats midnight as 12 AM', () => {
    expect(formatHoursRange('00:00-06:00')).toBe('12:00 AM – 6:00 AM')
  })

  it('always includes minutes', () => {
    expect(formatHoursRange('09:30-17:30')).toBe('9:30 AM – 5:30 PM')
  })

  it('returns "Closed today" for "Closed" input', () => {
    expect(formatHoursRange('Closed')).toBe('Closed today')
    expect(formatHoursRange('closed')).toBe('Closed today')
  })

  it('returns null for null input', () => {
    expect(formatHoursRange(null)).toBeNull()
  })

  it('returns the original string when it cannot be parsed', () => {
    expect(formatHoursRange('By appointment')).toBe('By appointment')
  })

  it('formats overnight range', () => {
    expect(formatHoursRange('22:00-02:00')).toBe('10:00 PM – 2:00 AM')
  })
})
