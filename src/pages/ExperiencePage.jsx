import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useExperience } from '../hooks/useRecommendations'
import { useWishlist } from '../hooks/useWishlist'

const TIME_OPTIONS = ['7:00 AM', '9:00 AM', '11:00 AM', '1:00 PM', '4:00 PM ✨']

const GRADIENTS = {
  'ci-mia':'from-[#b2e8f8] to-[#7dd8f5]','ci-nyc':'from-[#c7d9f5] to-[#a8c4ef]',
  'ci-orl':'from-[#fde8b4] to-[#fbd580]','ci-lv':'from-[#ddd2f8] to-[#c4b0f3]',
  'ci-no':'from-[#b5e8d4] to-[#82d9b8]','ci-grn':'from-[#c8f0d4] to-[#9de3b4]',
}
const CAT_STYLES = {
  'Food & Drink':'bg-[#fde8b4] text-[#854F0B]','Outdoors':'bg-[#c8f0d4] text-[#27500A]',
  'Nightlife':'bg-[#e8e0fb] text-[#3C3489]','Sports':'bg-[#fde8b4] text-[#854F0B]',
  'Arts & Culture':'bg-[#fce4ef] text-[#72243E]','Wellness':'bg-[#b5e8d4] text-[#085041]',
}

export default function ExperiencePage() {
  const { id } = useParams()
  if (!id) return null
  return <ExperiencePageInner key={id} id={id} />
}

function ExperiencePageInner({ id }) {
  const navigate = useNavigate()
  const { data: exp, isLoading, error } = useExperience(id)
  const { isSaved, toggleSave } = useWishlist()

  const [guests, setGuests] = useState(2)
  const [prefDate, setPrefDate] = useState('')
  const [prefTime, setPrefTime] = useState('11:00 AM')
  const [copied, setCopied] = useState(false)

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

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

  const maxG = Math.min(Number(exp.max_guests) || 8, 20)
  const grad = GRADIENTS[exp.image_gradient] || GRADIENTS['ci-mia']
  const catStyle = CAT_STYLES[exp.category] || 'bg-gray-100 text-gray-600'
  const saved = isSaved(exp.id)
  const safeGuests = Math.min(Math.max(1, guests), maxG)
  const subtotal = Number(exp.price_per_person) * safeGuests

  const bumpGuests = (delta) => {
    setGuests(g => Math.min(maxG, Math.max(1, g + delta)))
  }

  const goBook = () => {
    navigate(`/book/${exp.id}`, {
      state: {
        guests: safeGuests,
        date: prefDate,
        time: prefTime,
      },
    })
  }

  const copyLink = () => {
    const url = window.location.href
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  const pageTitle = `${exp.title} in ${exp.city} | Vtopia`
  const pageDesc  = exp.description
    ? exp.description.slice(0, 155) + (exp.description.length > 155 ? '…' : '')
    : `Book ${exp.title} in ${exp.city}. ${exp.duration_label ? `Duration: ${exp.duration_label}.` : ''} From $${exp.price_per_person}/person.`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: exp.title,
    description: exp.description || pageDesc,
    address: { '@type': 'PostalAddress', addressLocality: exp.city, addressCountry: 'US' },
    ...(exp.rating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: exp.rating,
        reviewCount: exp.review_count || 1,
      },
    }),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: exp.price_per_person,
      availability: 'https://schema.org/InStock',
    },
  }

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
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-brand mb-6 transition-colors">
          ← Back
        </button>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* Left */}
          <div>
            {/* Hero image */}
            <div className={`h-64 md:h-80 rounded-card bg-gradient-to-br ${grad} flex items-center justify-center text-8xl mb-6 relative`}>
              <span style={{fontSize:80}}>{exp.image_emoji || '🌍'}</span>
              {exp.is_featured && (
                <div className="absolute top-4 left-4 bg-gold-brand text-white text-xs font-bold px-3 py-1 rounded-full">✨ Featured</div>
              )}
            </div>

            {/* Title & meta */}
            <div className="mb-6">
              <span className={`tag-category ${catStyle} mb-3`}>{exp.category}</span>
              <h1 className="font-display font-black text-3xl text-[#0D1B3E] mb-3 leading-tight">{exp.title}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
                <span>📍 {exp.city}</span>
                {exp.duration_label && <><span>·</span><span>⏱ {exp.duration_label}</span></>}
                {exp.max_guests && <><span>·</span><span>👥 Max {exp.max_guests} guests</span></>}
                {exp.rating > 0 && <><span>·</span><span className="text-gold-brand font-semibold">★ {exp.rating} ({exp.review_count?.toLocaleString()} reviews)</span></>}
              </div>
            </div>

            {/* Description */}
            {exp.description && (
              <div className="bg-white rounded-card border border-blue-brand/10 p-6 mb-4">
                <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-3">About this experience</h2>
                <p className="text-gray-500 text-sm leading-relaxed">{exp.description}</p>
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

            {/* Tags */}
            {exp.tags?.length > 0 && (
              <div className="bg-white rounded-card border border-blue-brand/10 p-6 mb-4">
                <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-3">Highlights</h2>
                <div className="flex flex-wrap gap-2">
                  {exp.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs font-semibold text-blue-brand bg-blue-tint border border-blue-brand/15 px-3 py-1 rounded-pill"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Collapsible: need to know */}
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
                      <span>
                        Runs about <strong className="text-[#0D1B3E]">{Math.round(exp.duration_minutes / 60)} hours</strong>
                        {exp.duration_label ? ` (${exp.duration_label})` : ''}.
                      </span>
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
                    <span>
                      Small groups — up to <strong className="text-[#0D1B3E]">{maxG} guests</strong> per booking.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400">✉️</span>
                    <span>Meeting point and host contact are sent in your confirmation email after you reserve.</span>
                  </div>
                </div>
              </details>
            </div>

            {exp.cancellation_policy && (
              <div className="bg-white rounded-card border border-blue-brand/10 mb-4 overflow-hidden">
                <details className="group">
                  <summary className="font-display font-bold text-lg text-[#0D1B3E] p-6 cursor-pointer list-none flex items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                    Cancellation policy
                    <span className="text-gray-400 text-sm font-sans font-normal group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="px-6 pb-6 pt-0 text-sm text-gray-500 leading-relaxed border-t border-blue-brand/8 pt-4">
                    {exp.cancellation_policy}
                  </p>
                </details>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={copyLink}
                className="btn-outline text-xs px-4 py-2"
              >
                {copied ? '✓ Link copied' : '🔗 Share this experience'}
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

          {/* Right — sticky booking card */}
          <div className="sticky top-20">
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
                      <span>
                        {' '}
                        · <span className="text-gold-brand font-semibold">★ {exp.rating}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4 text-xs">
                <div>
                  <div className="text-gray-400 mb-1">📅 Date</div>
                  <input
                    type="date"
                    min={today}
                    value={prefDate}
                    onChange={e => setPrefDate(e.target.value)}
                    className="input-field text-xs py-2"
                  />
                  {!prefDate && <p className="text-[10px] text-gray-400 mt-1">Optional — you can confirm on the next step</p>}
                </div>
                <div>
                  <div className="text-gray-400 mb-1">🕐 Preferred time</div>
                  <select
                    value={prefTime}
                    onChange={e => setPrefTime(e.target.value)}
                    className="input-field text-xs py-2"
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-gray-400 mb-2">👥 Guests</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#0D1B3E] font-medium">
                      {safeGuests} adult{safeGuests !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Fewer guests"
                        onClick={() => bumpGuests(-1)}
                        disabled={safeGuests <= 1}
                        className="w-9 h-9 rounded-full border border-blue-brand/20 text-blue-brand font-bold text-lg leading-none hover:bg-blue-tint transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <span className="w-7 text-center font-bold text-sm tabular-nums">{safeGuests}</span>
                      <button
                        type="button"
                        aria-label="More guests"
                        onClick={() => bumpGuests(1)}
                        disabled={safeGuests >= maxG}
                        className="w-9 h-9 rounded-full border border-blue-brand/20 text-blue-brand font-bold text-lg leading-none hover:bg-blue-tint transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Max {maxG} per experience</p>
                </div>
              </div>

              <div className="border-t border-blue-brand/8 pt-4 mb-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    ${Number(exp.price_per_person).toFixed(0)} × {safeGuests} guest{safeGuests !== 1 ? 's' : ''}
                  </span>
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
                <span className="text-[10px] font-bold bg-blue-tint text-blue-brand px-2 py-0.5 rounded-full border border-blue-brand/15">
                  Per-person pricing
                </span>
                <span className="text-[10px] font-bold bg-[#d1fae5] text-[#065f46] px-2 py-0.5 rounded-full">No hidden fees</span>
              </div>
              <p className="text-[10px] text-gray-400 mb-3 leading-snug">
                Total updates with guest count. Taxes included where applicable — Expedia-style clarity before you pay.
              </p>
              <div className="text-xs text-gray-400 mb-4">Free cancellation · No booking fee · Instant itinerary hold</div>

              <button type="button" onClick={goBook} className="btn-primary w-full mb-3">
                Reserve Now →
              </button>
              <button
                onClick={() => toggleSave(exp.id)}
                className={`w-full py-2.5 rounded-pill text-sm font-semibold border transition-all ${
                  saved ? 'bg-red-50 border-red-200 text-red-500' : 'btn-outline'
                }`}
              >
                {saved ? '♥ Saved' : '♡ Save to Wishlist'}
              </button>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-blue-brand/8">
                {['🔒 SSL Secured','✓ Free cancellation','🛡 GDPR Safe'].map(t => (
                  <span key={t} className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
