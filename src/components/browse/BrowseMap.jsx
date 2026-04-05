import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Pilot city centers — same as globe; avoids geocoding APIs (rate/cost free at our scale)
const CITY_CENTERS = {
  'New York City': [40.7128, -74.006],
  Miami: [25.7617, -80.1918],
  Orlando: [28.5383, -81.3792],
  'Las Vegas': [36.1699, -115.1398],
  'New Orleans': [29.9511, -90.0715],
}

const US_CENTER = [39.5, -98.35]

function offsetForId(id) {
  const s = String(id)
  let a = 0
  let b = 0
  for (let i = 0; i < s.length; i++) {
    a = (a + s.charCodeAt(i) * (i + 1)) % 997
    b = (b + s.charCodeAt(i) * (i + 3)) % 991
  }
  const angle = (a / 997) * Math.PI * 2
  const r = 0.003 + ((b % 500) / 500) * 0.012
  return [Math.cos(angle) * r, Math.sin(angle) * r]
}

const pinIcon = L.divIcon({
  className: 'browse-map-pin',
  html: '<div style="width:12px;height:12px;border-radius:9999px;background:#034694;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (!positions.length) return
    const latLngs = positions.map(p => L.latLng(p[0], p[1]))
    if (latLngs.length === 1) {
      map.setView(latLngs[0], 12)
      return
    }
    const b = L.latLngBounds(latLngs)
    map.fitBounds(b, { padding: [36, 36], maxZoom: 12 })
  }, [map, positions])
  return null
}

function MapPopupBody({ experience: exp }) {
  const navigate = useNavigate()
  return (
    <div className="min-w-[160px]">
      <div className="font-bold text-sm text-[#0D1B3E] leading-tight mb-1">{exp.title}</div>
      <div className="text-xs text-gray-500 mb-2">
        {exp.city} · ${Number(exp.price_per_person).toFixed(0)} · ★ {Number(exp.rating).toFixed(1)}
      </div>
      <button
        type="button"
        className="text-xs font-semibold text-blue-brand hover:underline cursor-pointer bg-transparent border-none p-0"
        onClick={() => navigate(`/experience/${exp.id}`)}
      >
        View experience →
      </button>
    </div>
  )
}

export default function BrowseMap({ experiences }) {
  const placed = useMemo(() => {
    return (experiences || []).map(exp => {
      const base = CITY_CENTERS[exp.city] || US_CENTER
      const [dLat, dLng] = offsetForId(exp.id)
      return {
        ...exp,
        lat: base[0] + dLat,
        lng: base[1] + dLng,
      }
    })
  }, [experiences])

  const positions = useMemo(() => placed.map(p => [p.lat, p.lng]), [placed])

  const defaultCenter = placed.length ? [placed[0].lat, placed[0].lng] : US_CENTER
  const defaultZoom = placed.length <= 1 ? 11 : 4

  return (
    <div className="rounded-card border border-blue-brand/10 overflow-hidden bg-white shadow-sm">
      {/* OSM tiles: fine for dev / moderate traffic; swap to a paid tile CDN for heavy production use */}
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="z-0"
        style={{ height: 'min(70vh, 560px)', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {positions.length > 0 && <FitBounds positions={positions} />}
        {placed.map(exp => (
          <Marker key={exp.id} position={[exp.lat, exp.lng]} icon={pinIcon}>
            <Popup>
              <MapPopupBody experience={exp} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
