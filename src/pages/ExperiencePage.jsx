import { useState, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useExperience } from '../hooks/useRecommendations'
import { useWishlist } from '../hooks/useWishlist'
import { PriceTier, getPhotoUrl, pickHighlights } from '../components/cards/ExperienceCard'
import { openTableUrl, viatorSearchUrl, uberDeepLink, lyftDeepLink } from '../lib/affiliates.config'
import { MapPin, Clock, Users, Heart, Share2, ShieldCheck } from 'lucide-react'
import ExperienceConcierge from '../components/ui/ExperienceConcierge'

// Only these types go through the Vtopia internal booking flow
const BOOKABLE_VIA_VTOPIA = new Set(['reservable'])

const TIME_OPTIONS = ['7:00 AM', '9:00 AM', '11:00 AM', '1:00 PM', '4:00 PM ✨']

const GRAD_MAP = {
  'ci-mia':'from-[#b2e8f8] to-[#7dd8f5]','ci-nyc':'from-[#c7d9f5] to-[#a8c4ef]',
  'ci-orl':'from-[#fde8b4] to-[#fbd580]','ci-lv':'from-[#ddd2f8] to-[#c4b0f3]',
  'ci-no':'from-[#b5e8d4] to-[#82d9b8]','ci-grn':'from-[#c8f0d4] to-[#9de3b4]',
}
const CAT_STYLES = {
  'Food & Drink':'bg-[#fde8b4] text-[#854F0B]','Outdoors':'bg-[#c8f0d4] text-[#27500A]',
  'Nightlife':'bg-[#e8e0fb] text-[#3C3489]','Sports':'bg-[#fde8b4] text-[#854F0B]',
  'Arts & Culture':'bg-[#fce4ef] text-[#72243E]','Wellness':'bg-[#b5e8d4] text-[#085041]',
}

const UTM = 'utm_source=vtopia&utm_medium=referral&utm_campaign=wc2026'

function addUtm(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    u.searchParams.set('utm_source', 'vtopia')
    u.searchParams.set('utm_medium', 'referral')
    u.searchParams.set('utm_campaign', 'wc2026')
    return u.toString()
  } catch {
    return url.includes('?') ? `${url}&${UTM}` : `${url}?${UTM}`
  }
}

function resolveCta(exp) {
  const type        = exp.experience_type || 'reservable'
  const linkOk      = !exp.link_status || exp.link_status === 'verified'
  const external    = linkOk ? (exp.external_url || exp.website || null) : null
  const mapsUrl     = addUtm(exp.maps_url) ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${exp.title} ${exp.city}`)}&${UTM}`
  const ticketLink  = addUtm(linkOk ? exp.ticket_url : null) || addUtm(external) || mapsUrl
  const deliveryLink= addUtm(linkOk ? exp.delivery_url : null) || addUtm(external) || mapsUrl
  const extLink     = addUtm(external) || mapsUrl

  switch (type) {
    case 'restaurant_reserve':
      return {
        primary:   { label: 'Reserve a table →', href: extLink },
        secondary: { label: 'Get directions →',  href: mapsUrl },
      }
    case 'food_walkup':
    case 'food_delivery':
      return {
        primary:   { label: 'Order online →',   href: deliveryLink },
        secondary: { label: 'Get directions →', href: mapsUrl },
      }
    case 'outdoor_free':
    case 'free_no_booking':
    case 'outdoor_info':
      return {
        primary:   { label: 'Get directions →', href: mapsUrl },
        secondary: null,
      }
    case 'outdoor_paid':
      return {
        primary:   { label: 'View tickets →',   href: extLink },
        secondary: { label: 'Get directions →', href: mapsUrl },
      }
    case 'cultural_free':
      return {
        primary:   { label: 'Get directions →', href: mapsUrl },
        secondary: external ? { label: 'Visit website →', href: extLink } : null,
      }
    case 'cultural_paid':
      return {
        primary:   { label: 'Get tickets →',    href: extLink },
        secondary: { label: 'Get directions →', href: mapsUrl },
      }
    case 'nightlife_walkin':
    case 'nightlife':
      return {
        primary:   { label: 'Get directions →', href: mapsUrl },
        secondary: external ? { label: 'Visit website →', href: extLink } : null,
      }
    case 'nightlife_ticketed':
      return {
        primary:   { label: 'Get tickets →',    href: ticketLink },
        secondary: { label: 'Get directions →', href: mapsUrl },
      }
    case 'ticketed':
      return {
        primary:   { label: 'Get tickets →',    href: ticketLink },
        secondary: { label: 'Get directions →', href: mapsUrl },
      }
    case 'shopping':
      return {
        primary:   { label: external ? 'Visit website →' : 'Get directions →', href: external ? extLink : mapsUrl },
        secondary: external ? { label: 'Get directions →', href: mapsUrl } : null,
      }
    case 'sports_event':
      return {
        primary:   { label: 'Get tickets →',    href: ticketLink },
        secondary: { label: 'Get directions →', href: mapsUrl },
      }
    case 'transport':
      return {
        primary:   { label: 'View routes →', href: extLink },
        secondary: null,
      }
    case 'hotel':
      return {
        primary:   { label: 'Check availability →', href: extLink },
        secondary: null,
      }
    default:
      return {
        primary:   { label: 'Get directions →', href: mapsUrl },
        secondary: null,
      }
  }
}

function typeLabel(type) {
  return {
    reservable:          'Book via Vtopia',
    restaurant_reserve:  'Restaurant — reservation recommended',
    food_walkup:         'Walk in — no reservation needed',
    food_delivery:       'Walk in — order online available',
    outdoor_free:        'Free outdoor experience',
    outdoor_paid:        'Outdoor — entry fee required',
    cultural_free:       'Free admission',
    cultural_paid:       'Entry fee required',
    nightlife_walkin:    'Walk in — no cover required',
    nightlife_ticketed:  'Tickets required',
    ticketed:            'External tickets required',
    shopping:            'Shopping & retail',
    sports_event:        'Sporting event — tickets required',
    transport:           'Getting around',
    hotel:               'Accommodation',
    free_no_booking:     'Free — no booking needed',
    nightlife:           'Nightlife',
    outdoor_info:        'Outdoor experience',
  }[type] ?? 'Experience'
}

// ── ActionPanel — right-side panel for non-reservable experiences ────────────
function ActionPanel({ exp, saved, onSave }) {
  const [copied, setCopied] = useState(false)
  const cta   = resolveCta(exp)
  const grad  = GRAD_MAP[exp.image_gradient] || GRAD_MAP['ci-mia']

  const resolvedTier = (exp.price_tier !== undefined && exp.price_tier !== null)
    ? exp.price_tier
    : exp.price_per_person > 0
      ? exp.price_per_person < 15 ? 1 : exp.price_per_person < 40 ? 2 : exp.price_per_person < 80 ? 3 : 4
      : null

  const copyLink = () => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  const tipLines = exp.tips
    ? exp.tips.split('\n').map(l => l.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean)
    : []

  return (
    <div className="bg-white rounded-card border border-blue-brand/10 p-6 shadow-sm">
      {/* Header */}
      <div className="flex gap-3 items-center mb-5 pb-4 border-b border-blue-brand/8">
        <div className={`w-12 h-12 rounded-[9px] bg-gradient-to-br ${grad} flex items-center justify-center text-2xl flex-shrink-0`}>
          {exp.image_emoji || '🌍'}
        </div>
        <div className="min-w-0">
          <div className="font-display font-bold text-sm text-[#0D1B3E] leading-tight line-clamp-2">{exp.title}</div>
          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>{exp.city}</span>
            {exp.rating > 0 && (
              <span>· <span className="text-gold-brand font-semibold">★ {exp.rating}</span></span>
            )}
          </div>
        </div>
      </div>

      {/* Price + type */}
      <div className="flex items-center gap-2 mb-5">
        <PriceTier tier={resolvedTier} className="text-sm" />
        <span className="text-gray-200 text-xs">·</span>
        <span className="text-xs text-gray-400">{typeLabel(exp.experience_type)}</span>
      </div>

      {/* Primary CTA */}
      {cta.primary && (
        <a
          href={cta.primary.href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full mb-3 flex items-center justify-center min-h-[44px] text-sm"
        >
          {cta.primary.label}
        </a>
      )}

      {/* Secondary CTA */}
      {cta.secondary && (
        <a
          href={cta.secondary.href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline w-full mb-4 flex items-center justify-center min-h-[44px] text-sm"
        >
          {cta.secondary.label}
        </a>
      )}

      {/* Affiliate CTAs — restaurant gets OpenTable, others get Viator + Uber/Lyft */}
      {exp.experience_type === 'restaurant_reserve' && (
        <a href={openTableUrl(exp.title, exp.city)} target="_blank" rel="noopener noreferrer"
          className="w-full mb-2 flex items-center justify-center gap-2 py-2.5 rounded-pill border border-[#DA3743]/30 text-[#DA3743] bg-[#DA3743]/5 hover:bg-[#DA3743]/10 text-sm font-semibold transition-all min-h-[40px]"
          aria-label={`Reserve a table at ${exp.title} on OpenTable`}>
          Reserve on OpenTable
        </a>
      )}
      {exp.experience_type && !['outdoor_free','cultural_free','transport','free_no_booking','outdoor_info'].includes(exp.experience_type) && exp.experience_type !== 'restaurant_reserve' && (
        <a href={viatorSearchUrl(exp.title, exp.city)} target="_blank" rel="noopener noreferrer"
          className="w-full mb-2 flex items-center justify-center gap-2 py-2.5 rounded-pill border border-blue-brand/25 text-blue-brand bg-blue-tint hover:bg-blue-brand/10 text-sm font-semibold transition-all min-h-[40px]"
          aria-label={`Book ${exp.title} on Viator`}>
          Also on Viator
        </a>
      )}
      {/* One-tap Uber / Lyft */}
      <div className="flex gap-2 mb-3">
        <a href={uberDeepLink(exp.title, exp.lat, exp.lng)} target="_blank" rel="noopener noreferrer" aria-label={`Uber to ${exp.title}`}
          className="flex-1 py-2 rounded-pill bg-black text-white text-xs font-semibold text-center hover:bg-gray-800 transition min-h-[36px] flex items-center justify-center">
          Get Uber
        </a>
        <a href={lyftDeepLink(exp.title, exp.lat, exp.lng)} target="_blank" rel="noopener noreferrer" aria-label={`Lyft to ${exp.title}`}
          className="flex-1 py-2 rounded-pill bg-pink-600 text-white text-xs font-semibold text-center hover:bg-pink-500 transition min-h-[36px] flex items-center justify-center">
          Get Lyft
        </a>
      </div>

      {/* Local tips */}
      {tipLines.length > 0 && (
        <div className="bg-blue-tint rounded-lg p-4 mb-4">
          <div className="text-xs font-bold text-blue-brand mb-2">💡 Local tips</div>
          {tipLines.length === 1 ? (
            <p className="text-xs text-gray-500 leading-relaxed">{tipLines[0]}</p>
          ) : (
            <ul className="space-y-1.5">
              {tipLines.map((line, i) => (
                <li key={i} className="text-xs text-gray-500 flex gap-1.5">
                  <span className="text-blue-brand/40 mt-0.5 flex-shrink-0">•</span>
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Save + share */}
      <button
        onClick={onSave}
        aria-label={saved ? 'Remove from saved' : 'Save to Wishlist'}
        className={`w-full py-2.5 rounded-pill text-sm font-semibold border transition-all mb-2 min-h-[44px] flex items-center justify-center gap-2 ${
          saved ? 'bg-red-50 border-red-200 text-red-500' : 'btn-outline'
        }`}
      >
        <Heart size={15} aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />
        {saved ? 'Saved' : 'Save to Wishlist'}
      </button>

      <button
        type="button"
        onClick={copyLink}
        aria-label={copied ? 'Link copied' : 'Share this experience'}
        className="w-full py-2 text-xs text-gray-400 hover:text-blue-brand transition-colors flex items-center justify-center gap-1.5"
      >
        <Share2 size={12} aria-hidden="true" />
        {copied ? 'Link copied' : 'Share this experience'}
      </button>

      {/* Trust badges */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-blue-brand/8">
        {[['SSL Secured', ShieldCheck], ['GDPR Safe', ShieldCheck], ['Free to browse', ShieldCheck]].map(([t]) => (
          <span key={t} className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">{t}</span>
        ))}
      </div>
    </div>
  )
}

// ── BookingPanel — right-side panel for reservable experiences only ──────────
function BookingPanel({ exp, saved, onSave }) {
  const navigate  = useNavigate()
  const [guests, setGuests]     = useState(2)
  const [prefDate, setPrefDate] = useState('')
  const [prefTime, setPrefTime] = useState('11:00 AM')
  const [copied, setCopied]     = useState(false)

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const grad  = GRAD_MAP[exp.image_gradient] || GRAD_MAP['ci-mia']
  const maxG  = Math.min(Number(exp.max_guests) || 8, 20)
  const safeGuests = Math.min(Math.max(1, guests), maxG)
  const subtotal   = Number(exp.price_per_person) * safeGuests

  const bumpGuests = (delta) => setGuests(g => Math.min(maxG, Math.max(1, g + delta)))

  const goBook = () => navigate(`/book/${exp.id}`, { state: { guests: safeGuests, date: prefDate, time: prefTime } })

  const copyLink = () => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-white rounded-card border border-blue-brand/10 p-6 shadow-sm">
      <div className="flex gap-3 items-center mb-4 pb-4 border-b border-blue-brand/8">
        <div className={`w-12 h-12 rounded-[9px] bg-gradient-to-br ${grad} flex items-center justify-center text-2xl flex-shrink-0`}>
          {exp.image_emoji || '🌍'}
        </div>
        <div className="min-w-0">
          <div className="font-display font-bold text-sm text-[#0D1B3E] leading-tight line-clamp-2">{exp.title}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {exp.city}
            {exp.rating > 0 && (
              <span> · <span className="text-gold-brand font-semibold">★ {exp.rating}</span></span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4 text-xs">
        <div>
          <div className="text-gray-400 mb-1">📅 Date</div>
          <input type="date" min={today} value={prefDate} onChange={e => setPrefDate(e.target.value)} className="input-field text-xs py-2" />
          {!prefDate && <p className="text-[10px] text-gray-400 mt-1">Optional — you can confirm on the next step</p>}
        </div>
        <div>
          <div className="text-gray-400 mb-1">🕐 Preferred time</div>
          <select value={prefTime} onChange={e => setPrefTime(e.target.value)} className="input-field text-xs py-2">
            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div className="text-gray-400 mb-2">👥 Guests</div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#0D1B3E] font-medium">{safeGuests} adult{safeGuests !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Fewer guests" onClick={() => bumpGuests(-1)} disabled={safeGuests <= 1}
                className="w-9 h-9 rounded-full border border-blue-brand/20 text-blue-brand font-bold text-lg leading-none hover:bg-blue-tint transition-colors disabled:opacity-35 disabled:cursor-not-allowed">−</button>
              <span className="w-7 text-center font-bold text-sm tabular-nums">{safeGuests}</span>
              <button type="button" aria-label="More guests" onClick={() => bumpGuests(1)} disabled={safeGuests >= maxG}
                className="w-9 h-9 rounded-full border border-blue-brand/20 text-blue-brand font-bold text-lg leading-none hover:bg-blue-tint transition-colors disabled:opacity-35 disabled:cursor-not-allowed">+</button>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Max {maxG} per experience</p>
        </div>
      </div>

      <div className="border-t border-blue-brand/8 pt-4 mb-4 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">${Number(exp.price_per_person).toFixed(0)} × {safeGuests} guest{safeGuests !== 1 ? 's' : ''}</span>
          <span className="font-medium text-[#0D1B3E]">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Booking fee</span>
          <span className="font-medium text-[#10b981]">Free</span>
        </div>
        <div className="flex justify-between items-baseline pt-2 border-t border-blue-brand/8">
          <span className="font-bold text-sm text-[#0D1B3E]">Total</span>
          <span className="font-display font-black text-xl text-blue-brand">${subtotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-[10px] font-bold bg-blue-tint text-blue-brand px-2 py-0.5 rounded-full border border-blue-brand/15">Per-person pricing</span>
        <span className="text-[10px] font-bold bg-[#d1fae5] text-[#065f46] px-2 py-0.5 rounded-full">No hidden fees</span>
      </div>
      <p className="text-[10px] text-gray-400 mb-3 leading-snug">Total updates with guest count. Taxes included where applicable.</p>
      <div className="text-xs text-gray-400 mb-4">Free cancellation · No booking fee · Instant itinerary hold</div>

      <button type="button" onClick={goBook} className="btn-primary w-full mb-3 min-h-[44px]">Book via Vtopia →</button>
      <button
        onClick={onSave}
        aria-label={saved ? 'Remove from saved' : 'Save to Wishlist'}
        className={`w-full py-2.5 rounded-pill text-sm font-semibold border transition-all min-h-[44px] flex items-center justify-center gap-2 ${
          saved ? 'bg-red-50 border-red-200 text-red-500' : 'btn-outline'
        }`}
      >
        <Heart size={15} aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />
        {saved ? 'Saved' : 'Save to Wishlist'}
      </button>

      <button type="button" onClick={copyLink} aria-label={copied ? 'Link copied' : 'Share this experience'}
        className="w-full py-2 text-xs text-gray-400 hover:text-blue-brand transition-colors mt-2 flex items-center justify-center gap-1.5">
        <Share2 size={12} aria-hidden="true" />
        {copied ? 'Link copied' : 'Share this experience'}
      </button>

      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-blue-brand/8">
        {['SSL Secured', 'Free cancellation', 'GDPR Safe'].map(t => (
          <span key={t} className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">{t}</span>
        ))}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ExperiencePage() {
  const { id } = useParams()
  if (!id) return null
  return <ExperiencePageInner key={id} id={id} />
}

function ExperiencePageInner({ id }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromItinerary = searchParams.get('from') === 'itinerary'
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const { data: exp, isLoading, error } = useExperience(id)
  const { isSaved, toggleSave } = useWishlist()

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-pulse">
      <div className="h-64 bg-blue-tint rounded-card mb-6" />
      <div className="h-8 bg-blue-tint rounded w-2/3 mb-3" />
      <div className="h-4 bg-blue-tint rounded w-1/2" />
    </div>
  )

  if (error || !exp) return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-center">
      <div className="text-4xl mb-4">😕</div>
      <h2 className="font-display font-bold text-xl text-[#0D1B3E] mb-2">Experience not found</h2>
      <button type="button" onClick={() => navigate('/browse')} className="btn-primary mt-4 text-sm">Browse All</button>
    </div>
  )

  const isBookable = !exp.experience_type || BOOKABLE_VIA_VTOPIA.has(exp.experience_type)
  const saved      = isSaved(exp.id)
  const grad       = GRAD_MAP[exp.image_gradient] || GRAD_MAP['ci-mia']
  const catStyle   = CAT_STYLES[exp.category] || 'bg-gray-100 text-gray-600'

  const resolvedTier = (exp.price_tier !== undefined && exp.price_tier !== null)
    ? exp.price_tier
    : exp.price_per_person > 0
      ? exp.price_per_person < 15 ? 1 : exp.price_per_person < 40 ? 2 : exp.price_per_person < 80 ? 3 : 4
      : null

  const pageTitle = `${exp.title} in ${exp.city} | Vtopia`
  const pageDesc  = exp.description
    ? exp.description.slice(0, 155) + (exp.description.length > 155 ? '…' : '')
    : `${exp.title} in ${exp.city}. ${exp.duration_label ? `Duration: ${exp.duration_label}.` : ''} ${typeLabel(exp.experience_type)}.`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: exp.title,
    description: exp.description || pageDesc,
    address: { '@type': 'PostalAddress', addressLocality: exp.city, addressCountry: 'US' },
    ...(exp.rating > 0 && {
      aggregateRating: { '@type': 'AggregateRating', ratingValue: exp.rating, reviewCount: exp.review_count || 1 },
    }),
    ...(resolvedTier !== null && isBookable && {
      offers: { '@type': 'Offer', priceCurrency: 'USD', price: exp.price_per_person, availability: 'https://schema.org/InStock' },
    }),
  }

  const tipLines = exp.tips
    ? exp.tips.split('\n').map(l => l.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean)
    : []

  return (
    <>
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <link rel="canonical" href={`https://www.vtopia.world/experience/${exp.id}`} />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
    <div style={{ background:'var(--bg)' }}>
      {fromItinerary && !bannerDismissed && (
        <div className="sticky top-[57px] z-40 bg-blue-brand text-white px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="font-semibold hover:underline flex items-center gap-1.5"
          >
            ← Back to your itinerary
          </button>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss"
            className="text-white/60 hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-brand mb-6 transition-colors">
          ← Back
        </button>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* ── Left column ── */}
          <div>
            {/* Hero */}
            <div className={`h-64 md:h-80 rounded-card bg-gradient-to-br ${grad} overflow-hidden mb-6 relative`}>
              {exp.image_url ? (
                <img
                  src={exp.image_url}
                  alt={`${exp.title} in ${exp.city}`}
                  width={800}
                  height={320}
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none' }}
                />
              ) : (
                <img
                  src={getPhotoUrl(exp.category, exp.city)}
                  alt={`${exp.category} experience in ${exp.city}`}
                  width={800}
                  height={320}
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none' }}
                />
              )}
              {exp.is_featured && (
                <div className="absolute top-4 left-4 bg-gold-brand text-white text-xs font-bold px-3 py-1 rounded-full">Featured</div>
              )}
            </div>

            {/* Title & meta */}
            <div className="mb-6">
              <span className={`tag-category ${catStyle} mb-3`}>{exp.category}</span>
              <h1 className="font-display font-black text-3xl text-[#0D1B3E] mb-3 leading-tight">{exp.title}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
                <span className="flex items-center gap-1"><MapPin size={14} aria-hidden="true" />{exp.city}</span>
                {exp.duration_label && <><span>·</span><span className="flex items-center gap-1"><Clock size={14} aria-hidden="true" />{exp.duration_label}</span></>}
                {exp.max_guests && isBookable && <><span>·</span><span className="flex items-center gap-1"><Users size={14} aria-hidden="true" />Max {exp.max_guests}</span></>}
                {exp.rating > 0 && <><span>·</span><span className="text-gold-brand font-semibold">★ {exp.rating} ({exp.review_count?.toLocaleString()} reviews)</span></>}
              </div>

              {/* Price tier badge (left column, visible on mobile before right panel) */}
              <div className="flex items-center gap-2 mt-3">
                <PriceTier tier={resolvedTier} className="text-sm" />
                <span className="text-xs text-gray-400">{typeLabel(exp.experience_type)}</span>
              </div>
            </div>

            {/* Description */}
            {exp.description && (
              <div className="bg-white rounded-card border border-blue-brand/10 p-6 mb-4">
                <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-3">About this experience</h2>
                <p className="text-gray-500 text-sm leading-relaxed">{exp.description}</p>
              </div>
            )}

            {/* Local tips (shown in left column for non-bookable on mobile, hidden on desktop where ActionPanel shows them) */}
            {tipLines.length > 0 && (
              <div className="bg-blue-tint rounded-card border border-blue-brand/10 p-6 mb-4 lg:hidden">
                <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-3">💡 Local tips</h2>
                {tipLines.length === 1 ? (
                  <p className="text-gray-500 text-sm leading-relaxed">{tipLines[0]}</p>
                ) : (
                  <ul className="space-y-2">
                    {tipLines.map((line, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-500">
                        <span className="text-blue-brand/40 flex-shrink-0">•</span>
                        <span className="leading-relaxed">{line}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* What's included */}
            {exp.what_is_included?.length > 0 && (
              <div className="bg-white rounded-card border border-blue-brand/10 p-6 mb-4">
                <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-3">What's included</h2>
                <div className="flex flex-col gap-2">
                  {exp.what_is_included.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-gray-500">
                      <div className="w-5 h-5 rounded-full bg-[#d1fae5] text-[#065f46] flex items-center justify-center text-xs font-bold flex-shrink-0">✓</div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guide */}
            {exp.guides && (
              <div className="bg-white rounded-card border border-blue-brand/10 p-6 mb-4">
                <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-3">Your guide</h2>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-brand text-white font-display font-black text-lg flex items-center justify-center flex-shrink-0">
                    {exp.guides.first_name?.[0]}{exp.guides.last_name?.[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-[#0D1B3E]">{exp.guides.first_name} {exp.guides.last_name}</div>
                    <div className="text-xs text-gray-400">
                      {exp.city} local · ★ {exp.guides.rating} · {exp.guides.review_count?.toLocaleString()} reviews
                      {Number(exp.guides.response_rate) > 0 && (
                        <span> · Responds {exp.guides.response_rate}% of the time</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => navigate(`/guide/${exp.guides.id}`)} className="btn-outline text-xs px-3 py-1.5">View Profile</button>
                </div>
              </div>
            )}

            {/* Tags / Highlights */}
            {(() => {
              const { shown, overflow } = pickHighlights(exp.tags, 4)
              if (!shown.length) return null
              return (
                <div className="bg-white rounded-card border border-blue-brand/10 p-6 mb-4">
                  <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-3">Highlights</h2>
                  <div className="flex flex-wrap gap-2">
                    {shown.map((tag, i) => (
                      <span key={i} className="text-xs font-semibold text-blue-brand bg-blue-tint border border-blue-brand/15 px-3 py-1 rounded-pill">
                        {tag}
                      </span>
                    ))}
                    {overflow > 0 && (
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-pill">
                        +{overflow} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Good to know — only for bookable experiences */}
            {isBookable && (
              <div className="bg-white rounded-card border border-blue-brand/10 mb-4 overflow-hidden">
                <details className="group">
                  <summary className="font-display font-bold text-lg text-[#0D1B3E] p-6 cursor-pointer list-none flex items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                    Good to know
                    <span className="text-gray-400 text-sm font-sans font-normal group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-6 pb-6 pt-0 space-y-3 text-sm text-gray-500 border-t border-blue-brand/8">
                    {exp.duration_minutes > 0 && (
                      <div className="flex gap-2 pt-4">
                        <span className="text-gray-400 flex-shrink-0">⏱</span>
                        <span>Runs about <strong className="text-[#0D1B3E]">{Math.round(exp.duration_minutes / 60)} hours</strong>{exp.duration_label ? ` (${exp.duration_label})` : ''}.</span>
                      </div>
                    )}
                    {!(exp.duration_minutes > 0) && exp.duration_label && (
                      <div className="flex gap-2 pt-4">
                        <span className="text-gray-400">⏱</span>
                        <span>Typical duration: <strong className="text-[#0D1B3E]">{exp.duration_label}</strong></span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="text-gray-400">👥</span>
                      <span>Small groups — up to <strong className="text-[#0D1B3E]">{Math.min(Number(exp.max_guests) || 8, 20)} guests</strong> per booking.</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-400">✉️</span>
                      <span>Meeting point and host contact are sent in your confirmation email after you reserve.</span>
                    </div>
                  </div>
                </details>
              </div>
            )}

            {/* Cancellation policy — only for bookable */}
            {isBookable && exp.cancellation_policy && (
              <div className="bg-white rounded-card border border-blue-brand/10 mb-4 overflow-hidden">
                <details className="group">
                  <summary className="font-display font-bold text-lg text-[#0D1B3E] p-6 cursor-pointer list-none flex items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                    Cancellation policy
                    <span className="text-gray-400 text-sm font-sans font-normal group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="px-6 pb-6 pt-4 text-sm text-gray-500 leading-relaxed border-t border-blue-brand/8">
                    {exp.cancellation_policy}
                  </p>
                </details>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <button type="button" onClick={() => {
                void navigator.clipboard.writeText(window.location.href)
              }} className="btn-outline text-xs px-4 py-2">
                🔗 Share this experience
              </button>
            </div>

            {/* Reviews */}
            {exp.reviews?.length > 0 && (
              <div className="bg-white rounded-card border border-blue-brand/10 p-6">
                <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-4">
                  Reviews <span className="text-gray-400 font-normal text-sm">({exp.reviews.length})</span>
                </h2>
                <div className="flex flex-col gap-4">
                  {exp.reviews.slice(0, 3).map(r => (
                    <div key={r.id} className="pb-4 border-b border-blue-brand/8 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-tint text-blue-brand text-xs font-bold flex items-center justify-center">
                          {r.profiles?.first_name?.[0]}{r.profiles?.last_name?.[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{r.profiles?.first_name} {r.profiles?.last_name?.[0]}.</div>
                          <div className="flex gap-0.5">{Array.from({length:5}).map((_,i) => <span key={i} className={`text-xs ${i < r.rating ? 'text-gold-brand' : 'text-gray-200'}`}>★</span>)}</div>
                        </div>
                        <div className="ml-auto text-xs text-gray-300">{new Date(r.created_at).toLocaleDateString('en-US',{month:'short',year:'numeric'})}</div>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{r.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="sticky top-20">
            {isBookable ? (
              <BookingPanel exp={exp} saved={saved} onSave={() => toggleSave(exp.id)} />
            ) : (
              <ActionPanel exp={exp} saved={saved} onSave={() => toggleSave(exp.id)} />
            )}
          </div>
        </div>
      </div>
    </div>

    {/* AI Concierge — floating chat button */}
    <ExperienceConcierge exp={exp} />
    </>
  )
}
