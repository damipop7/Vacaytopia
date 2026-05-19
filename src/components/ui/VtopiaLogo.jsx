/**
 * VtopiaLogo — SVG mark + wordmark.
 *
 * The mark is a bold V shape with a filled circle at the bottom point,
 * reading as a route converging on a destination (location pin).
 *
 * Props:
 *   variant  — "dark" (default, blue mark on light bg) | "light" (white mark on dark bg)
 *   size     — "sm" (24px mark), "md" (32px, default), "lg" (40px)
 */
export default function VtopiaLogo({ variant = 'dark', size = 'md', className = '' }) {
  const sizeMap = { sm: 24, md: 32, lg: 40 }
  const markSize = sizeMap[size] ?? 32

  // Text size scales with mark
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl'

  const markColor  = variant === 'light' ? '#FFFFFF' : '#034694'
  const circleColor = '#F5A623' // gold-brand always

  // The V mark: two lines descend from upper-left and upper-right, meeting at a bottom-center point
  // Viewbox: 0 0 32 36 — 32 wide, 36 tall (extra height for the circle at the tip)
  const vw = 32
  const vh = 36

  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* SVG mark */}
      <svg
        width={markSize}
        height={Math.round(markSize * (vh / vw))}
        viewBox={`0 0 ${vw} ${vh}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        {/* Left arm of the V */}
        <line
          x1="2"
          y1="3"
          x2="16"
          y2="30"
          stroke={markColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Right arm of the V */}
        <line
          x1="30"
          y1="3"
          x2="16"
          y2="30"
          stroke={markColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Destination circle at the bottom apex */}
        <circle cx="16" cy="30" r="4.5" fill={circleColor} />
      </svg>

      {/* Wordmark */}
      <span className={`font-display font-black tracking-tight leading-none ${textSize}`}>
        <span style={{ color: markColor }}>v</span>
        <span style={{ color: circleColor }}>topia</span>
      </span>
    </span>
  )
}
