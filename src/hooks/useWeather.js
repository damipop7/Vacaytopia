/**
 * OpenWeatherMap 7-day forecast hook.
 * Gracefully returns null when the API key is not configured.
 * Free tier: 1,000 calls/day — we cache in sessionStorage to minimise usage.
 */
import { useState, useEffect } from 'react'

const API_KEY  = import.meta.env.VITE_OPENWEATHER_API_KEY
const CACHE_MS = 1000 * 60 * 60 // 1 hour

// Kansas City coordinates
const KC_COORDS = { lat: 39.0997, lon: -94.5786 }

const CITY_COORDS = {
  'kansas-city':   { lat: 39.0997, lon: -94.5786 },
  'miami':         { lat: 25.7617, lon: -80.1918 },
  'new-york-city': { lat: 40.7128, lon: -74.0060 },
  'nyc':           { lat: 40.7128, lon: -74.0060 },
  'orlando':       { lat: 28.5384, lon: -81.3789 },
  'las-vegas':     { lat: 36.1699, lon: -115.1398 },
  'new-orleans':   { lat: 29.9511, lon: -90.0715 },
  'austin':        { lat: 30.2672, lon: -97.7431 },
}

function cacheKey(lat, lon) { return `vtopia_weather_${lat}_${lon}` }

function readCache(lat, lon) {
  try {
    const raw = sessionStorage.getItem(cacheKey(lat, lon))
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts < CACHE_MS) return data
    return null
  } catch { return null }
}

function writeCache(lat, lon, data) {
  try {
    sessionStorage.setItem(cacheKey(lat, lon), JSON.stringify({ ts: Date.now(), data }))
  } catch { /* quota */ }
}

export function useWeather(citySlug) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!API_KEY) return  // graceful degrade

    const coords = CITY_COORDS[citySlug] || KC_COORDS
    const cached = readCache(coords.lat, coords.lon)
    if (cached) { setWeather(cached); return }

    setLoading(true)
    fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${coords.lat}&lon=${coords.lon}&exclude=minutely,hourly,alerts&units=imperial&appid=${API_KEY}`
    )
      .then(r => r.json())
      .then(data => {
        const forecast = data.daily?.slice(0, 7).map(day => ({
          dt:          day.dt,
          tempHigh:    Math.round(day.temp.max),
          tempLow:     Math.round(day.temp.min),
          description: day.weather[0]?.description ?? '',
          icon:        day.weather[0]?.icon ?? '',
          isRainy:     ['Rain','Drizzle','Thunderstorm','Snow'].includes(day.weather[0]?.main),
          isHot:       day.temp.max > 95,
          isCold:      day.temp.max < 45,
        })) ?? null
        writeCache(coords.lat, coords.lon, forecast)
        setWeather(forecast)
      })
      .catch(() => setWeather(null))
      .finally(() => setLoading(false))
  }, [citySlug])

  return { weather, loading, available: !!API_KEY }
}
