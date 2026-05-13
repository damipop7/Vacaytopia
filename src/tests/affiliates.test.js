/**
 * DIAGNOSTIC: Affiliate URL generation
 *
 * Verifies every helper builds a structurally correct URL.
 * Affiliate IDs are empty in test (no env vars) — tests cover the no-ID path.
 */
import { describe, it, expect } from 'vitest'
import {
  bookingHotelUrl,
  bookingCityUrl,
  viatorSearchUrl,
  gygSearchUrl,
  openTableUrl,
  uberDeepLink,
  lyftDeepLink,
  affiliatesEnabled,
} from '../lib/affiliates.config'

describe('bookingHotelUrl', () => {
  it('returns a valid booking.com URL', () => {
    const url = bookingHotelUrl('The Fontaine', 'Kansas City')
    expect(url).toContain('booking.com')
    expect(url).toContain('ss=')
  })

  it('URL-encodes hotel name and city', () => {
    const url = bookingHotelUrl('Hotel & Spa', 'New York City')
    expect(url).toContain('Hotel%20%26%20Spa%20New%20York%20City')
  })

  it('omits affiliate ID when env var is absent', () => {
    const url = bookingHotelUrl('Any Hotel', 'Miami')
    expect(url).not.toContain('aid=')
  })

  it('defaults city to Kansas City when omitted', () => {
    const url = bookingHotelUrl('The Grand')
    expect(url).toContain('Kansas%20City')
  })
})

describe('bookingCityUrl', () => {
  it('returns a city-level booking.com URL', () => {
    const url = bookingCityUrl('Miami')
    expect(url).toContain('booking.com')
    expect(url).toContain('miami')
  })

  it('defaults to Kansas City', () => {
    const url = bookingCityUrl()
    expect(url).toContain('kansas%20city')
  })
})

describe('viatorSearchUrl', () => {
  it('returns a viator.com URL with title and city', () => {
    const url = viatorSearchUrl('Food Tour', 'Miami')
    expect(url).toContain('viator.com')
    expect(url).toContain('Food%20Tour%20Miami')
  })

  it('omits pid when env var is absent', () => {
    const url = viatorSearchUrl('City Walk', 'Austin')
    expect(url).not.toContain('pid=')
  })
})

describe('gygSearchUrl', () => {
  it('returns a getyourguide.com URL', () => {
    const url = gygSearchUrl('Jazz Tour', 'New Orleans')
    expect(url).toContain('getyourguide.com')
    expect(url).toContain('Jazz%20Tour%20New%20Orleans')
  })

  it('omits partner_id when env var is absent', () => {
    const url = gygSearchUrl('Museum Visit', 'NYC')
    expect(url).not.toContain('partner_id=')
  })
})

describe('openTableUrl', () => {
  it('returns an opentable.com URL', () => {
    const url = openTableUrl("Joe's Stone Crab", 'Miami')
    expect(url).toContain('opentable.com')
    expect(url).toContain('term=')
  })

  it('includes covers=2 parameter', () => {
    const url = openTableUrl('The Capital Grille', 'Kansas City')
    expect(url).toContain('covers=2')
  })
})

describe('uberDeepLink', () => {
  it('returns an uber.com URL', () => {
    const url = uberDeepLink('Union Station')
    expect(url).toContain('uber.com')
    expect(url).toContain('Union%20Station')
  })

  it('uses coordinate-based URL when lat/lng provided', () => {
    const url = uberDeepLink('Sprint Center', 39.099, -94.578)
    // URL format: dropoff[latitude]=39.099 — check for bracket-param pattern
    expect(url).toContain('[latitude]=39.099')
    expect(url).toContain('[longitude]=-94.578')
  })

  it('uses address-based URL when no coordinates', () => {
    const url = uberDeepLink('Crown Center')
    expect(url).toContain('formatted_address')
    expect(url).not.toContain('latitude')
  })
})

describe('lyftDeepLink', () => {
  it('returns a lyft.com URL', () => {
    const url = lyftDeepLink('The Nelson-Atkins Museum')
    expect(url).toContain('lyft.com')
  })

  it('uses coordinate-based URL when lat/lng provided', () => {
    const url = lyftDeepLink('Arrowhead Stadium', 38.820, -94.484)
    // 38.820 → JS stringifies as "38.82" (trailing zero dropped); bracket-param format
    expect(url).toContain('[latitude]=38.82')
    expect(url).toContain('[longitude]=-94.484')
  })

  it('falls back to address when no coordinates', () => {
    const url = lyftDeepLink('Power & Light District')
    expect(url).toContain('Power%20%26%20Light%20District')
  })
})

describe('affiliatesEnabled', () => {
  it('all are false when no env vars set', () => {
    // In test environment none of the VITE_ affiliate vars are set
    expect(affiliatesEnabled.booking).toBe(false)
    expect(affiliatesEnabled.viator).toBe(false)
    expect(affiliatesEnabled.gyg).toBe(false)
  })
})
