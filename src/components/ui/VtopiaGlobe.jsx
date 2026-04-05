import { useEffect, useRef, useState, useCallback, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'

// globe.gl is dynamically imported so it doesn't block initial page load
// This is critical for performance — the globe only loads when the hero is visible
const GlobeLazy = lazy(() => import('react-globe.gl'))

// ── Vtopia pilot cities with exact coordinates ──────────────────────
const CITIES = [
  {
    id: 'new-york-city',
    name: 'New York City',
    emoji: '🗽',
    lat: 40.7128,
    lng: -74.0060,
    color: '#F5A623',
    tag: 'Most Popular',
    experiences: 620,
    description: 'Art, food, sport and culture at every corner.',
  },
  {
    id: 'miami',
    name: 'Miami',
    emoji: '🌊',
    lat: 25.7617,
    lng: -80.1918,
    color: '#0ea5e9',
    tag: 'Trending',
    experiences: 380,
    description: 'Sun, Cuban food, art deco, and electric nightlife.',
  },
  {
    id: 'orlando',
    name: 'Orlando',
    emoji: '🎢',
    lat: 28.5383,
    lng: -81.3792,
    color: '#F5A623',
    tag: 'Family Fave',
    experiences: 410,
    description: 'Theme parks, family adventures, and hidden gems.',
  },
  {
    id: 'las-vegas',
    name: 'Las Vegas',
    emoji: '🎰',
    lat: 36.1699,
    lng: -115.1398,
    color: '#a855f7',
    tag: 'Top Rated',
    experiences: 490,
    description: 'Shows, world-class dining, and the Strip.',
  },
  {
    id: 'new-orleans',
    name: 'New Orleans',
    emoji: '🎷',
    lat: 29.9511,
    lng: -90.0715,
    color: '#10b981',
    tag: 'Hidden Gem',
    experiences: 290,
    description: 'Jazz, Creole food, and the most unique culture in America.',
  },
]

// Arc data — visual connections between cities showing the network
const ARCS = [
  { startLat: 40.7128, startLng: -74.0060, endLat: 25.7617, endLng: -80.1918, color: '#F5A623' },
  { startLat: 25.7617, startLng: -80.1918, endLat: 28.5383, endLng: -81.3792, color: '#0ea5e9' },
  { startLat: 28.5383, startLng: -81.3792, endLat: 36.1699, endLng: -115.1398, color: '#a855f7' },
  { startLat: 36.1699, startLng: -115.1398, endLat: 29.9511, endLng: -90.0715, color: '#10b981' },
  { startLat: 29.9511, startLng: -90.0715, endLat: 40.7128, endLng: -74.0060, color: '#F5A623' },
]

export default function VtopiaGlobe({ onCitySelect, onCameraAltitudeChange, immersion = 0 }) {
  const globeRef          = useRef()
  const containerRef      = useRef()
  const altitudeCbRef     = useRef(onCameraAltitudeChange)

  useEffect(() => {
    altitudeCbRef.current = onCameraAltitudeChange
  }, [onCameraAltitudeChange])

  const [size,    setSize]     = useState({ w: 600, h: 600 })
  const [active,  setActive]   = useState(null)
  const [hovered, setHovered]  = useState(null)
  const [ready,   setReady]    = useState(false)

  // Responsive resize — canvas grows as the hero “immerses” so the globe feels central
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return
      const w = containerRef.current.offsetWidth
      const base = Math.min(w, 680)
      const boost = immersion * 220
      setSize({ w, h: Math.min(base + boost, Math.min(920, Math.max(base, w * 0.95))) })
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [immersion])

  // Initial globe setup once it's mounted
  const handleGlobeReady = useCallback(() => {
    setReady(true)
    if (!globeRef.current) return

    // Position camera to show North America nicely on load
    globeRef.current.pointOfView({ lat: 35, lng: -95, altitude: 2.2 }, 0)

    const ctrl = globeRef.current.controls()
    ctrl.autoRotate       = true
    ctrl.autoRotateSpeed  = 0.35
    ctrl.enableZoom       = true
    ctrl.zoomSpeed        = 0.65
    ctrl.enableRotate     = true
    ctrl.rotateSpeed      = 0.48

    const emitAltitude = () => {
      const pov = globeRef.current?.pointOfView?.()
      if (pov && typeof pov.altitude === 'number') {
        altitudeCbRef.current?.(pov.altitude)
      }
    }
    emitAltitude()
    ctrl.addEventListener('change', emitAltitude)
  }, [])

  // Fly to a city when clicked
  const handleCityClick = useCallback((point) => {
    const city = CITIES.find(c => c.id === point.id)
    if (!city) return

    setActive(city.id)
    onCitySelect?.(city)

    if (globeRef.current) {
      // Pause auto-rotate while focused
      globeRef.current.controls().autoRotate = false

      // Smooth fly-to animation
      globeRef.current.pointOfView(
        { lat: city.lat, lng: city.lng, altitude: 1.4 },
        1200  // ms transition
      )

      // Resume rotation after 4 seconds
      setTimeout(() => {
        if (globeRef.current) {
          globeRef.current.controls().autoRotate = true
        }
      }, 4000)
    }
  }, [onCitySelect])

  // Point label renderer
  const pointLabel = useCallback((point) => {
    return `
      <div style="
        background: rgba(3,70,148,0.92);
        backdrop-filter: blur(8px);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-family: DM Sans, sans-serif;
        font-size: 12px;
        font-weight: 600;
        border: 1px solid rgba(245,166,35,0.4);
        pointer-events: none;
        white-space: nowrap;
      ">
        ${point.emoji} ${point.name}
        <span style="color:#F5A623;margin-left:4px;">${point.experiences}+ exp</span>
      </div>
    `
  }, [])

  const activeCity = CITIES.find(c => c.id === active)

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: size.h }}>

      {/* Loading shimmer */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-80 h-80 rounded-full bg-blue-tint animate-pulse flex items-center justify-center">
            <div className="text-blue-brand font-display font-black text-xl">Loading globe...</div>
          </div>
        </div>
      )}

      {/* The globe */}
      <Suspense fallback={null}>
        <GlobeLazy
          ref={globeRef}
          width={size.w}
          height={size.h}

          // Globe appearance
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          atmosphereColor="#034694"
          atmosphereAltitude={0.18}
          backgroundColor="rgba(0,0,0,0)"
          showGraticules={false}

          // City pins
          pointsData={CITIES}
          pointLat="lat"
          pointLng="lng"
          pointColor={p => p.id === active ? '#F5A623' : p.id === hovered ? '#ffffff' : p.color}
          pointAltitude={p => p.id === active ? 0.07 : 0.04}
          pointRadius={p => p.id === active ? 0.65 : 0.52}
          pointLabel={pointLabel}
          onPointClick={handleCityClick}
          onPointHover={p => setHovered(p?.id || null)}

          // Arcs between cities
          arcsData={ARCS}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcAltitude={0.25}
          arcStroke={0.4}
          arcDashLength={0.4}
          arcDashGap={0.15}
          arcDashAnimateTime={2500}
          arcOpacity={0.5}

          // City name rings
          ringsData={CITIES}
          ringLat="lat"
          ringLng="lng"
          ringColor={() => (t) => `rgba(245,166,35,${1 - t})`}
          ringMaxRadius={3}
          ringPropagationSpeed={1.5}
          ringRepeatPeriod={1800}

          onGlobeReady={handleGlobeReady}
          animateIn={true}
        />
      </Suspense>

      {/* City info card — appears when a city is selected */}
      {activeCity && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-72"
          style={{ animation: 'slideUp 0.3s ease' }}
        >
          <div className="bg-white/95 backdrop-blur rounded-[14px] border border-blue-brand/15 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeCity.emoji}</span>
                <div>
                  <div className="font-display font-bold text-base text-[#0D1B3E] leading-tight">
                    {activeCity.name}
                  </div>
                  <div className="text-xs text-gray-400">{activeCity.experiences}+ experiences</div>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-gold-tint text-[#854F0B] border border-gold-brand/25 px-2 py-0.5 rounded-full">
                {activeCity.tag}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">{activeCity.description}</p>
            <Link
              to={`/browse/${activeCity.id}`}
              className="block w-full text-center py-2 bg-gold-brand hover:bg-gold-dark text-white text-sm font-bold rounded-pill transition-colors"
            >
              Explore {activeCity.name} →
            </Link>
          </div>
        </div>
      )}

      {/* Hint text */}
      {!active && ready && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none max-w-[90vw]">
          <span className="text-xs text-blue-brand/60 font-medium bg-white/60 backdrop-blur px-3 py-1.5 rounded-full inline-block leading-snug">
            Drag to rotate · Scroll to zoom · Click a city pin
          </span>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}
