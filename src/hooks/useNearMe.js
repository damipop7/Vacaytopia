import { useState, useCallback } from 'react'

// status: 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
export function useNearMe() {
  const [status, setStatus] = useState('idle')
  const [coords, setCoords] = useState(null) // { lat, lng }

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable')
      return
    }
    setStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('granted')
      },
      () => {
        setStatus('denied')
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
