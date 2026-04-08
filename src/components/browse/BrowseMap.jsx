import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const CITY_CENTERS = {
  'New York City': [40.7128, -74.006],
  Miami:           [25.7617, -80.1918],
  Orlando:         [28.5383, -81.3792],
  'Las Vegas':     [36.1699, -115.1398],
  'New Orleans':   [29.9511, -90.0715],
  'Kansas City':   [39.0997, -94.5786],
  'Austin':        [30.2672, -97.7431],
}

const US_CENTER = [39.5, -98.35]

// Individual experience pin
const pinIcon = L.divIcon({
  className: 'browse-map-pin',
  html: '<div style="width:12px;height:12px;border-radius:9999px;background:#034694;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

// City dot shown when zoomed out
function makeCityIcon(count) {
  const size = count > 50 ? 44 : count > 20 ? 38 : 32
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:#034694;color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;
      border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);
      cursor:pointer;
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function offsetForId(id) {
  const s = String(id)
  let a = 0, b = 0
  for (let i = 0; i < s.length; i++) {
    a = (a + s.charCodeAt(i) * (i + 1)) % 997
    b = (b + s.charCodeAt(i) * (i + 3)) % 991
  }
  const angle = (a / 997) * Math.PI * 2
  const r = 0.003 + ((b % 500) / 500) * 0.012
  return [Math.cos(angle) * r, Math.sin(angle) * r]
}

function getLatLng(exp) {
  if (exp.lat && exp.lng) return [Number(exp.lat), Number(exp.lng)]
  const base = CITY_CENTERS[exp.city] || US_CENTER
  const [dLat, dLng] = offsetForId(exp.id)
  return [base[0] + dLat, base[1] + dLng]
}

// Zoom threshold — below this shows city dots, above shows individual pins
const ZOOM_THRESHOLD = 9

function ClusterLayer({ experiences, navigate }) {
  const map = useMap()
  const layerRef = useRef(null)
  const navigateRef = useRef(navigate)
  useEffect(() => { navigateRef.current = navigate }, [navigate])

  const byCity = useMemo(() => {
    const groups = {}
    for (const exp of experiences || []) {
      if (!groups[exp.city]) groups[exp.city] = []
      groups[exp.city].push(exp)
    }
    return groups
  }, [experiences])

  useEffect(() => {
    if (layerRef.current) map.removeLayer(layerRef.current)

    const group = L.layerGroup()
    layerRef.current = group

    // Expose navigate for popup buttons
    window.__vtopiaNav = (path) => {
      navigateRef.current(path)
      map.closePopup()
    }

    function render() {
      group.clearLayers()
      const zoom = map.getZoom()

      if (zoom < ZOOM_THRESHOLD) {
        // One dot per city
        for (const [city, exps] of Object.entries(byCity)) {
          const center = CITY_CENTERS[city]
          if (!center) continue

          const marker = L.marker(center, { icon: makeCityIcon(exps.length) })
          const slug = city.toLowerCase().replace(/ /g, '-')

          marker.bindPopup(`
            <div style="min-width:140px;font-family:'DM Sans',sans-serif;">
              <div style="font-weight:700;font-size:13px;color:#0D1B3E;margin-bottom:3px;">${city}</div>
              <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">${exps.length} experience${exps.length !== 1 ? 's' : ''}</div>
              <button onclick="window.__vtopiaNav('/browse/${slug}')"
                style="font-size:12px;font-weight:600;color:#034694;background:none;border:none;cursor:pointer;padding:0;">
                Explore ${city} →
              </button>
            </div>
          `)

          marker.on('click', () => map.flyTo(center, 11, { duration: 0.8 }))
          group.addLayer(marker)
        }
      } else {
        // Individual experience pins
        for (const exp of (experiences || [])) {
          const [lat, lng] = getLatLng(exp)
          const marker = L.marker([lat, lng], { icon: pinIcon })

          marker.bindPopup(`
            <div style="min-width:160px;font-family:'DM Sans',sans-serif;">
              <div style="font-weight:700;font-size:13px;color:#0D1B3E;line-height:1.3;margin-bottom:4px;">${exp.title}</div>
              <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">
                ${exp.city} · $${Number(exp.price_per_person).toFixed(0)} · ★ ${Number(exp.rating).toFixed(1)}
              </div>
              <button onclick="window.__vtopiaNav('/experience/${exp.id}')"
                style="font-size:12px;font-weight:600;color:#034694;background:none;border:none;cursor:pointer;padding:0;">
                View experience →
              </button>
            </div>
          `)

          group.addLayer(marker)
        }
      }
    }

    render()
    map.on('zoomend', render)
    group.addTo(map)

    return () => {
      map.off('zoomend', render)
      map.removeLayer(group)
      delete window.__vtopiaNav
    }
  }, [map, byCity, experiences])

  return null
}

function FitBounds({ experiences }) {
  const map = useMap()
  useEffect(() => {
    if (!experiences?.length) return
    const cities = [...new Set(experiences.map(e => e.city))]
    if (cities.length === 1) {
      const center = CITY_CENTERS[cities[0]]
      if (center) map.setView(center, 11)
      return
    }
    const points = cities.map(c => CITY_CENTERS[c]).filter(Boolean).map(p => L.latLng(p[0], p[1]))
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 8 })
  }, [map, experiences])
  return null
}

export default function BrowseMap({ experiences }) {
  const navigate = useNavigate()

  const cities = useMemo(() => [...new Set((experiences || []).map(e => e.city))], [experiences])
  const hasMultipleCities = cities.length > 1

  const defaultCenter = useMemo(() => {
    if (!experiences?.length) return US_CENTER
    if (cities.length === 1 && CITY_CENTERS[cities[0]]) return CITY_CENTERS[cities[0]]
    return US_CENTER
  }, [experiences, cities])

  return (
    <div className="rounded-card border border-blue-brand/10 overflow-hidden bg-white shadow-sm">
      <MapContainer
        center={defaultCenter}
        zoom={hasMultipleCities ? 4 : 11}
        className="z-0"
        style={{ height: 'min(70vh, 560px)', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds experiences={experiences} />
        <ClusterLayer experiences={experiences} navigate={navigate} />
      </MapContainer>
    </div>
  )
}