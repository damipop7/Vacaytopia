import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const KC_CENTER = [39.0997, -94.5786]

const DAY_COLORS = ['#3B82F6', '#F97316', '#22C55E', '#A855F7', '#EC4899', '#EAB308', '#14B8A6']
const STATUS_COLORS = { approved: '#22C55E', suggested: '#F59E0B', booked: '#6366F1' }
const SLOT_LABELS = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night' }

// eslint-disable-next-line react-refresh/only-export-components
export function dayColor(dayNumber) {
  return DAY_COLORS[((dayNumber ?? 1) - 1) % DAY_COLORS.length]
}

// Returns a flat array of pin-ready objects, filtering out rejected items and those without coords.
// eslint-disable-next-line react-refresh/only-export-components
export function getTripMapPins(experiences) {
  return (experiences ?? [])
    .filter(e => e.experiences?.lat && e.experiences?.lng && e.status !== 'rejected')
    .map(e => ({
      id:           e.id,
      title:        e.experiences?.title ?? e.custom_name ?? 'Experience',
      lat:          Number(e.experiences.lat),
      lng:          Number(e.experiences.lng),
      dayNumber:    e.day_number ?? 1,
      timeSlot:     e.time_slot,
      status:       e.status,
      experienceId: e.experience_id ?? null,
    }))
}

function makePinIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:9999px;background:${color};border:2.5px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.45)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  })
}

function PinLayer({ pins, navigateRef }) {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    if (layerRef.current) map.removeLayer(layerRef.current)
    const group = L.layerGroup()
    layerRef.current = group

    window.__vtopiaNav = (path) => {
      navigateRef.current(path)
      map.closePopup()
    }

    const latlngs = []

    for (const pin of pins) {
      const color       = dayColor(pin.dayNumber)
      const statusColor = STATUS_COLORS[pin.status] ?? '#9CA3AF'
      const slotLabel   = SLOT_LABELS[pin.timeSlot] ?? pin.timeSlot ?? ''
      const viewLink    = pin.experienceId
        ? `<button onclick="window.__vtopiaNav('/experience/${pin.experienceId}')" style="font-size:11px;font-weight:600;color:#3B82F6;background:none;border:none;cursor:pointer;padding:0;margin-top:5px;display:block;">View experience →</button>`
        : ''

      const marker = L.marker([pin.lat, pin.lng], { icon: makePinIcon(color) })
      marker.bindPopup(`
        <div style="min-width:165px;font-family:'DM Sans',sans-serif;line-height:1.45;">
          <div style="font-weight:700;font-size:13px;color:#0D1B3E;margin-bottom:4px;">${pin.title}</div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:3px;">Day ${pin.dayNumber} · ${slotLabel}</div>
          <span style="font-size:10px;font-weight:700;color:${statusColor};text-transform:capitalize;">${pin.status}</span>
          ${viewLink}
        </div>
      `)
      group.addLayer(marker)
      latlngs.push([pin.lat, pin.lng])
    }

    group.addTo(map)

    if (latlngs.length > 1) {
      map.fitBounds(
        L.latLngBounds(latlngs.map(p => L.latLng(p[0], p[1]))),
        { padding: [40, 40], maxZoom: 15 }
      )
    } else if (latlngs.length === 1) {
      map.setView(latlngs[0], 15)
    }

    return () => {
      map.removeLayer(group)
      delete window.__vtopiaNav
    }
  }, [map, pins, navigateRef])

  return null
}

export default function TripMap({ experiences }) {
  const navigate    = useNavigate()
  const navigateRef = useRef(navigate)
  useEffect(() => { navigateRef.current = navigate }, [navigate])

  const pins = getTripMapPins(experiences)

  if (pins.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl">
        <span className="text-3xl">🗺️</span>
        <p className="text-white/40 text-sm text-center px-4">
          No mapped experiences yet — approved experiences with location data will appear here.
        </p>
      </div>
    )
  }

  const days = [...new Set(pins.map(p => p.dayNumber))].sort((a, b) => a - b)

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      <MapContainer
        center={KC_CENTER}
        zoom={12}
        style={{ height: 460, width: '100%' }}
        scrollWheelZoom
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PinLayer pins={pins} navigateRef={navigateRef} />
      </MapContainer>

      {/* Day colour legend */}
      <div className="flex flex-wrap gap-3 px-4 py-3 bg-white/[0.02] border-t border-white/10">
        {days.map(day => (
          <div key={day} className="flex items-center gap-1.5 text-xs text-white/60">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: dayColor(day) }} />
            Day {day}
          </div>
        ))}
        <span className="ml-auto text-xs text-white/30">{pins.length} pin{pins.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}
