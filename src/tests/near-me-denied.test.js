import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNearMe } from '../hooks/useNearMe'

describe('useNearMe — denied/retry/dismiss flow', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: vi.fn() } })
  })

  it('transitions to denied when the browser rejects the permission prompt', () => {
    navigator.geolocation.getCurrentPosition.mockImplementation((_success, error) => error())
    const { result } = renderHook(() => useNearMe())

    act(() => result.current.request())

    expect(result.current.status).toBe('denied')
    expect(result.current.coords).toBeNull()
  })

  it('"Try again" (request) re-prompts and can succeed after a prior denial', () => {
    const coords = { coords: { latitude: 39.1, longitude: -94.6 } }
    navigator.geolocation.getCurrentPosition
      .mockImplementationOnce((_success, error) => error())
      .mockImplementationOnce(success => success(coords))
    const { result } = renderHook(() => useNearMe())

    act(() => result.current.request())
    expect(result.current.status).toBe('denied')

    act(() => result.current.request())
    expect(result.current.status).toBe('granted')
    expect(result.current.coords).toEqual({ lat: 39.1, lng: -94.6 })
  })

  it('"Dismiss" (clear) resets a denied state back to idle with no coords', () => {
    navigator.geolocation.getCurrentPosition.mockImplementation((_success, error) => error())
    const { result } = renderHook(() => useNearMe())

    act(() => result.current.request())
    expect(result.current.status).toBe('denied')

    act(() => result.current.clear())
    expect(result.current.status).toBe('idle')
    expect(result.current.coords).toBeNull()
  })

  it('reports unavailable when the browser has no geolocation API', () => {
    vi.stubGlobal('navigator', {})
    const { result } = renderHook(() => useNearMe())

    act(() => result.current.request())

    expect(result.current.status).toBe('unavailable')
  })
})
