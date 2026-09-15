import { useState, useCallback } from 'react'

// status: 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported' | 'unavailable'
// 'denied' = browser permission actually blocked; 'unavailable' = transient failure
// (timeout or no position fix) that a retry can resolve — these are NOT the same thing.
export function useNearMe() {
  const [status, setStatus] = useState('idle')
  const [coords, setCoords] = useState(null) // { lat, lng }

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported')
      return
    }
    setStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('granted')
      },
      err => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable')
      },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    )
  }, [])

  const clear = useCallback(() => {
    setStatus('idle')
    setCoords(null)
  }, [])

  return { status, coords, request, clear }
}
