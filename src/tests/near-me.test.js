/**
 * Unit tests for useNearMe — a real user report showed "Location access was denied"
 * even when the browser never actually blocked the permission. Root cause: the error
 * callback lumped every geolocation failure (timeout, position unavailable, actual
 * permission denial) into a single 'denied' status. These tests pin the fix: only
 * GeolocationPositionError.PERMISSION_DENIED (code 1) should map to 'denied'.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNearMe } from '../hooks/useNearMe'

function mockGeolocation(getCurrentPosition) {
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition },
    configurable: true,
  })
}

const PERMISSION_DENIED = 1
const POSITION_UNAVAILABLE = 2
const TIMEOUT = 3

afterEach(() => {
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition: () => {} },
    configurable: true,
  })
})

describe('useNearMe', () => {
  it('starts idle with no coords', () => {
    const { result } = renderHook(() => useNearMe())
    expect(result.current.status).toBe('idle')
    expect(result.current.coords).toBeNull()
  })

  it('sets unsupported when the browser has no geolocation API', () => {
    Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true })
    const { result } = renderHook(() => useNearMe())
    act(() => result.current.request())
    expect(result.current.status).toBe('unsupported')
  })

  it('sets granted with coords on success', () => {
    mockGeolocation((success) => success({ coords: { latitude: 39.1, longitude: -94.6 } }))
    const { result } = renderHook(() => useNearMe())
    act(() => result.current.request())
    expect(result.current.status).toBe('granted')
    expect(result.current.coords).toEqual({ lat: 39.1, lng: -94.6 })
  })

  it('sets denied for an actual PERMISSION_DENIED error', () => {
    mockGeolocation((_success, error) => error({ code: PERMISSION_DENIED, PERMISSION_DENIED }))
    const { result } = renderHook(() => useNearMe())
    act(() => result.current.request())
    expect(result.current.status).toBe('denied')
  })

  it('does NOT report denied for a POSITION_UNAVAILABLE error', () => {
    mockGeolocation((_success, error) => error({ code: POSITION_UNAVAILABLE, PERMISSION_DENIED }))
    const { result } = renderHook(() => useNearMe())
    act(() => result.current.request())
    expect(result.current.status).toBe('unavailable')
  })

  it('does NOT report denied for a TIMEOUT error', () => {
    mockGeolocation((_success, error) => error({ code: TIMEOUT, PERMISSION_DENIED }))
    const { result } = renderHook(() => useNearMe())
    act(() => result.current.request())
    expect(result.current.status).toBe('unavailable')
  })

  it('clear() resets status to idle and drops coords', () => {
    mockGeolocation((success) => success({ coords: { latitude: 39.1, longitude: -94.6 } }))
    const { result } = renderHook(() => useNearMe())
    act(() => result.current.request())
    expect(result.current.status).toBe('granted')

    act(() => result.current.clear())
    expect(result.current.status).toBe('idle')
    expect(result.current.coords).toBeNull()
  })
})
