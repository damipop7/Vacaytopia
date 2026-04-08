import { useEffect, useRef, useState, useCallback, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'

const GlobeLazy = lazy(() => import('react-globe.gl'))

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
  {
    id: 'kansas-city',
    name: 'Kansas City',
    emoji: '🥩',
    lat: 39.0997,
    lng: -94.5786,
    color: '#ef4444',
    tag: 'BBQ Capital',
    experiences: 180,
    description: 'World-famous BBQ, jazz history, and a thriving arts scene.',
  },
  {
    id: 'austin',
    name: 'Austin',
    emoji: '🎸',
    lat: 30.2672,
    lng: -97.7431,
    color: '#F5A623',
    tag: 'Keep It Weird',
    experiences: 220,
    description: 'Live music capital of the world, tech hub, and incredible food.',
  },
]

const ARCS = [
  { startLat: 40.7128, startLng: -74.0060, endLat: 25.7617, endLng: -80.1918, color: '#F5A623' },
  { startLat: 25.7617, startLng: -80.1918, endLat: 28.5383, endLng: -81.3792, color: '#0ea5e9' },
  { startLat: 28.5383, startLng: -81.3792, endLat: 36.1699, endLng: -115.1398, color: '#a855f7' },
  { startLat: 36.1699, startLng: -115.1398, endLat: 29.9511, endLng: -90.0715, color: '#10b981' },
  { startLat: 29.9511, startLng: -90.0715, endLat: 40.7128, endLng: -74.0060, color: '#F5A623' },
  { startLat: 29.9511, startLng: -90.0715, endLat: 39.0997, endLng: -94.5786, color: '#ef4444' },
  { startLat: 39.0997, startLng: -94.5786, endLat: 30.2672, endLng: -97.7431, color: '#F5A623' },
  { startLat: 30.2672, startLng: -97.7431, endLat: 36.1699, endLng: -115.1398, color: '#a855f7' },
]

// How long the fly-to animation takes (ms) — keep in sync with pointOfView call below
const FLY_DURATION = 1200

export default function VtopiaGlobe({ onCitySelect, onCameraAltitudeChange, immersion = 0 }) {
  const globeRef      = useRef()
  const containerRef  = useRef()
  const altitudeCbRef = useRef(onCameraAltitudeChange)
  // Tracks the auto-dismiss timer so we can cancel it if user clicks another city
  const dismissTimer  = useRef(null)

  useEffect(() => {
    altitudeCbRef.current = onCameraAltitudeChange
  }, [onCameraAltitudeChange])

  const [size,    setSize]    = useState({ w: 600, h: 600 })
  const [active,  setActive]  = useState(null)   // city id currently shown in card
  const [hovered, setHovered] = useState(null)
  const [ready,   setReady]   = useState(false)
  // Controls the CSS opacity so we can fade-out before unmounting
  const [cardVisible, setCardVisible] = useState(false)

  // Responsive resize
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

  // ── Dismiss helpers ────────────────────────────────────────────────
  const dismissCard = useCallback(() => {
    // Fade out first, then remove from DOM after transition
    setCardVisible(false)
    setTimeout(() => setActive(null), 280)
  }, [])

  const scheduleAutoDismiss = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    // Auto-dismiss 2.8 s after the fly animation finishes
    dismissTimer.current = setTimeout(dismissCard, FLY_DURATION + 2800)
  }, [dismissCard])

  // Clean up timer on unmount
  useEffect(() => () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
  }, [])

  // ── Globe ready ────────────────────────────────────────────────────
  const handleGlobeReady = useCallback(() => {
    setReady(true)
    if (!globeRef.current) return

    globeRef.current.pointOfView({ lat: 35, lng: -95, altitude: 2.2 }, 0)

    const ctrl = globeRef.current.controls()
    ctrl.autoRotate      = true
    ctrl.autoRotateSpeed = 0.35
    ctrl.enableZoom      = true
    ctrl.zoomSpeed       = 0.65
    ctrl.enableRotate    = true
    ctrl.rotateSpeed     = 0.48

    const emitAltitude = () => {
      const pov = globeRef.current?.pointOfView?.()
      if (pov && typeof pov.altitude === 'number') {
        altitudeCbRef.current?.(pov.altitude)
      }
    }
    emitAltitude()
    ctrl.addEventListener('change', emitAltitude)
  }, [])

  // ── City click ────────────────────────────────────────────────────
  const handleCityClick = useCallback((point) => {
    const city = CITIES.find(c => c.id === point.id)
    if (!city) return

    // Cancel any pending auto-dismiss from a previous click
    if (dismissTimer.current) clearTimeout(dismissTimer.current)

    // Swap card content instantly, then fade it in
    setActive(city.id)
    setCardVisible(false)
    // Small rAF delay so React can mount the card before we trigger the fade-in
    requestAnimationFrame(() => requestAnimationFrame(() => setCardVisible(true)))

    onCitySelect?.(city)

    if (globeRef.current) {
      globeRef.current.controls().autoRotate = false
      globeRef.current.pointOfView(
        { lat: city.lat, lng: city.lng, altitude: 1.4 },
        FLY_DURATION
      )
      setTimeout(() => {
        globeRef.current?.controls() && (globeRef.current.controls().autoRotate = true)
      }, 4000)
    }

    scheduleAutoDismiss()
  }, [onCitySelect, scheduleAutoDismiss])

  // ── Point label (hover tooltip) ───────────────────────────────────
  const pointLabel = useCallback((point) => `
    <div style="
      background:rgba(3,70,148,0.92);
      backdrop-filter:blur(8px);
      color:#fff;
      padding:6px 12px;
      border-radius:20px;
      font-family:DM Sans,sans-serif;
      font-size:12px;
      font-weight:600;
      border:1px solid rgba(245,166,35,0.4);
      pointer-events:none;
      white-space:nowrap;
    ">
      ${point.emoji} ${point.name}
      <span style="color:#F5A623;margin-left:4px;">${point.experiences}+ exp</span>
    </div>
  `, [])

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

      {/* Globe */}
      <Suspense fallback={null}>
        <GlobeLazy
          ref={globeRef}
          width={size.w}
          height={size.h}

          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          atmosphereColor="#034694"
          atmosphereAltitude={0.18}
          backgroundColor="rgba(0,0,0,0)"
          showGraticules={false}

          pointsData={CITIES}
          pointLat="lat"
          pointLng="lng"
          pointColor={p => p.id === active ? '#F5A623' : p.id === hovered ? '#ffffff' : p.color}
          pointAltitude={p => p.id === active ? 0.07 : 0.04}
          pointRadius={p => p.id === active ? 0.65 : 0.52}
          pointLabel={pointLabel}
          onPointClick={handleCityClick}
          onPointHover={p => setHovered(p?.id || null)}

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

      {/* City info card */}
      {activeCity && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-72"
          style={{
            transition: 'opacity 0.28s ease, transform 0.28s ease',
            opacity: cardVisible ? 1 : 0,
            transform: `translateX(-50%) translateY(${cardVisible ? 0 : 10}px)`,
            pointerEvents: cardVisible ? 'auto' : 'none',
          }}
        >
          <div className="bg-white/95 backdrop-blur rounded-[14px] border border-blue-brand/15 p-4 shadow-xl">
            {/* Header row */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeCity.emoji}</span>
                <div>
                  <div className="font-display font-bold text-base text-[#0D1B3E] leading-tight">
                    {activeCity.name}
                  </div>
                  <div className="text-xs text-gray-400">{activeCity.experiences}+ experiences</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] font-bold bg-gold-tint text-[#854F0B] border border-gold-brand/25 px-2 py-0.5 rounded-full">
                  {activeCity.tag}
                </span>
                {/* Close button */}
                <button
                  onClick={dismissCard}
                  className="w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-xs leading-none"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
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

      {/* Drag/click hint */}
      {!active && ready && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none max-w-[90vw]">
          <span className="text-xs text-blue-brand/60 font-medium bg-white/60 backdrop-blur px-3 py-1.5 rounded-full inline-block leading-snug">
            Drag to rotate · Scroll to zoom · Click a city pin
          </span>
        </div>
      )}
    </div>
  )
}
