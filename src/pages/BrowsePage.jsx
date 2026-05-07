import { useState, useEffect, lazy, Suspense, Fragment } from 'react'
import { useParams, useSearchParams, Link, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useRecommendations } from '../hooks/useRecommendations'
import ExperienceCard from '../components/cards/ExperienceCard'
import { isCityActive, SINGLE_CITY_MODE } from '../lib/cityConfig'

const BrowseMap = lazy(() => import('../components/browse/BrowseMap'))

const ALL_CITIES = [
  { value: 'all',           label: '🌍 All Cities' },
  { value: 'Kansas City',   label: '🥩 Kansas City' },  // TODO: re-enable post-World-Cup
  { value: 'Miami',         label: '🌊 Miami' },
  { value: 'New York City', label: '🗽 New York City' },
  { value: 'Orlando',       label: '🎢 Orlando' },
  { value: 'Las Vegas',     label: '🎰 Las Vegas' },
  { value: 'New Orleans',   label: '🎷 New Orleans' },
  { value: 'Austin',        label: '🎸 Austin' },
]

// TODO: re-enable post-World-Cup — filter to ACTIVE_CITIES when set
const CITIES = ALL_CITIES.filter(c =>
  c.value === 'all' || isCityActive(c.value)
)

const CATEGORIES = [
  { value: 'all',           label: '🌍 All',          count: null },
  { value: 'Food & Drink',  label: '🍽️ Food & Drink', count: null },
  { value: 'Outdoors',      label: '🌿 Outdoors',      count: null },
  { value: 'Nightlife',     label: '🌙 Nightlife',     count: null },
  { value: 'Sports',        label: '🏟️ Sports',        count: null },
  { value: 'Arts & Culture',label: '🎨 Arts',          count: null },
  { value: 'Wellness',      label: '🧘 Wellness',      count: null },
]

const SORTS = ['Recommended', 'Price ↑', 'Price ↓', 'Top Rated']

const LIVE_CITIES = new Set(['Kansas City'])

// Globe, marketing URLs, and itinerary quiz keys → display city names stored in DB
const BROWSE_CITY_SLUGS = {
  'new-york-city': 'New York City',
  nyc:             'New York City',
  miami:           'Miami',
  orlando:         'Orlando',
  'las-vegas':     'Las Vegas',
  'new-orleans':   'New Orleans',
  'kansas-city':   'Kansas City',
  austin:          'Austin',
}

function resolveBrowseCityParam(param) {
  if (!param) return null
  return BROWSE_CITY_SLUGS[param] || null
}

export default function BrowsePage() {
  const { city: cityParam } = useParams()
  const [searchParams]      = useSearchParams()

  // TODO: re-enable post-World-Cup — remove shouldRedirect logic
  const resolvedCityParam = resolveBrowseCityParam(cityParam)
  const shouldRedirect = !!(resolvedCityParam && !isCityActive(resolvedCityParam) && SINGLE_CITY_MODE)

  // All hooks must be called before any early return (Rules of Hooks)
  const [city,     setCity]     = useState(
    () => resolveBrowseCityParam(cityParam) || resolveBrowseCityParam(searchParams.get('city')) || 'all'
  )
  const [category, setCategory] = useState('all')
  const [budget,   setBudget]   = useState(500)
  const [sort,     setSort]     = useState('Recommended')
  const [search,   setSearch]   = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'map'

  useEffect(() => {
    if (!cityParam) return
    const resolved = resolveBrowseCityParam(cityParam)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keep filter in sync when /browse/:city changes
    if (resolved) setCity(resolved)
  }, [cityParam])

  const { data: experiences = [], isLoading, error } = useRecommendations({
    city:      city !== 'all' ? city : undefined,
    category:  category !== 'all' ? category : undefined,
    maxBudget: budget,
    limit:     viewMode === 'map' ? 500 : 40,
  })

  // Client-side search + sort on top of server results
  const filtered = experiences
    .filter(e =>
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.city.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'Price ↑')   return a.price_per_person - b.price_per_person
      if (sort === 'Price ↓')   return b.price_per_person - a.price_per_person
      if (sort === 'Top Rated') return b.rating - a.rating
      return (b._score ?? 0) - (a._score ?? 0) // Recommended = by score
    })

  const cityName    = CITIES.find(c => c.value === city)?.label.split(' ').slice(1).join(' ') || 'All Cities'
  const isComingSoon = city !== 'all' && !LIVE_CITIES.has(city)

  const pageTitle = city !== 'all'
    ? `Things to Do in ${cityName} | Vtopia — World Cup 2026`
    : 'Explore Experiences | Vtopia — US City Travel Guide'
  const pageDesc = city === 'Kansas City'
    ? `Discover the best things to do in Kansas City for FIFA World Cup 2026. BBQ trails, live music, arts, and local experiences — handpicked for World Cup visitors.`
    : city !== 'all'
    ? `Explore handpicked experiences in ${cityName} — food, outdoors, nightlife, arts, and more. Book local adventures with Vtopia.`
    : 'Discover the best local experiences across US cities. Personalized travel recommendations for food, outdoors, nightlife, arts, and wellness.'

  // TODO: re-enable post-World-Cup — remove this redirect
  if (shouldRedirect) return <Navigate to="/browse/kansas-city" replace />

  return (
    <>
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <link rel="canonical" href={`https://www.vtopia.world${city !== 'all' ? `/browse/${city.toLowerCase().replace(/ /g, '-')}` : '/browse'}`} />
    </Helmet>
    <div className="flex min-h-[calc(100vh-64px)]" style={{ background: 'var(--bg)' }}>

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-blue-brand/10 p-5 gap-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto flex-shrink-0">

        {/* City */}
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">Destination</div>
          <div className="flex flex-col gap-1">
            {CITIES.map(c => {
              const isLive = c.value === 'all' || LIVE_CITIES.has(c.value)
              return (
                <button
                  key={c.value}
                  onClick={() => setCity(c.value)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-[9px] text-sm font-medium text-left transition-all ${
                    city === c.value
                      ? 'bg-blue-brand text-white'
                      : 'text-gray-500 hover:bg-blue-tint hover:text-blue-brand border border-blue-brand/10'
                  }`}
                >
                  <span>{c.label}</span>
                  {!isLive && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      city === c.value ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                    }`}>
                      Soon
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Budget */}
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">Budget per experience</div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>$0</span>
            <span className="font-bold text-blue-brand">{budget >= 500 ? '$500+' : `$${budget}`}</span>
          </div>
          <input
            type="range" min={0} max={500} step={5} value={budget}
            onChange={e => setBudget(Number(e.target.value))}
            className="w-full accent-[#034694]"
          />
          <div className="flex justify-between text-[10px] text-gray-300 mt-1">
            <span>Free</span><span>$250</span><span>$500+</span>
          </div>
        </div>

        {/* Category */}
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">Category</div>
          <div className="flex flex-col gap-1">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-[9px] text-sm font-medium text-left transition-all ${
                  category === c.value
                    ? 'bg-blue-brand text-white'
                    : 'text-gray-500 hover:bg-blue-tint hover:text-blue-brand border border-blue-brand/10'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">Sort by</div>
          <div className="flex flex-wrap gap-1.5">
            {SORTS.map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-2.5 py-1 rounded-pill text-xs font-semibold transition-all ${
                  sort === s
                    ? 'bg-blue-brand text-white'
                    : 'border border-blue-brand/15 text-gray-500 hover:border-blue-brand hover:text-blue-brand'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 p-5 min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold text-xl text-[#0D1B3E]">
              Experiences{city !== 'all' ? ` in ${cityName}` : ''}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {isLoading ? 'Finding the best matches...' : `${filtered.length} experience${filtered.length !== 1 ? 's' : ''}`}
            </p>
            <p className="text-[11px] text-gray-400/90 mt-2 max-w-xl leading-relaxed">
              <span className="font-semibold text-gray-500">Transparent pricing:</span> rates are per person unless noted.
              Saved experiences sync everywhere (wishlist) — tune recommendations in{' '}
              <Link to="/interests" className="text-blue-brand font-semibold hover:underline">Interests</Link>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-pill border border-blue-brand/15 p-0.5 bg-white">
              {['grid', 'map'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setViewMode(m)}
                  className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-all ${
                    viewMode === m
                      ? 'bg-blue-brand text-white'
                      : 'text-gray-500 hover:text-blue-brand'
                  }`}
                >
                  {m === 'grid' ? 'Grid' : 'Map'}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Search experiences..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-8 text-sm w-56"
              />
            </div>
          </div>
        </div>

        {/* Recommended banner (shown when user has quiz results) */}
        {sort === 'Recommended' && experiences.some(e => e._score) && (
          <div className="bg-blue-brand text-white rounded-card px-5 py-3 mb-5 flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="font-bold text-sm">✨ Personalised for you</div>
              <div className="text-white/70 text-xs">Results ranked by your interests, budget, and travel style</div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {['Food & Drink','Outdoors','Nightlife'].map(t => (
                <span key={t} className="bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-pill border border-white/20">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-card p-4 mb-5 text-sm">
            Could not load experiences. Check your Supabase connection and make sure the schema has been applied.
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="h-44 bg-blue-tint" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-blue-tint rounded w-1/3" />
                  <div className="h-4 bg-blue-tint rounded w-4/5" />
                  <div className="h-3 bg-blue-tint rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Map (lazy — keeps leaflet off initial bundle) */}
        {!isLoading && filtered.length > 0 && viewMode === 'map' && (
          <Suspense
            fallback={
              <div className="rounded-card border border-blue-brand/10 h-[min(70vh,560px)] bg-blue-tint animate-pulse flex items-center justify-center text-sm text-gray-400">
                Loading map…
              </div>
            }
          >
            <BrowseMap experiences={filtered} />
          </Suspense>
        )}

        {/* Grid */}
        {!isLoading && filtered.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map((exp, idx) => (
              <Fragment key={exp.id}>
                <ExperienceCard experience={exp} showForYou />
                {idx === 5 && (
                  <div className="col-span-full bg-white rounded-card border border-gold-brand/25 px-5 py-4 flex items-center gap-4">
                    <div className="text-3xl">🏨</div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-[#0D1B3E]">
                        Stay close to the action
                        <span className="ml-2 text-[10px] font-bold bg-gold-tint text-[#854F0B] px-1.5 py-0.5 rounded border border-gold-brand/25">SPONSORED</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">Exclusive vtopia hotel rates in {cityName}. Book with your experiences.</div>
                    </div>
                    <button type="button" className="btn-primary text-xs px-4 py-2 flex-shrink-0">View Deal</button>
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        )}

        {/* Coming soon state */}
        {!isLoading && isComingSoon && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🚧</div>
            <div className="font-display font-bold text-xl text-[#0D1B3E] mb-2">{cityName} is coming soon</div>
            <div className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
              We're curating handpicked experiences in {cityName}. Check back soon — or explore what's live now in Kansas City.
            </div>
            <button onClick={() => setCity('Kansas City')} className="btn-primary text-sm">
              Explore Kansas City
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && !error && !isComingSoon && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🗺️</div>
            <div className="font-display font-bold text-xl text-[#0D1B3E] mb-2">No experiences found</div>
            <div className="text-gray-400 text-sm mb-6">Try adjusting your filters or increasing your budget.</div>
            <button
              onClick={() => { setCategory('all'); setBudget(500); setSearch('') }}
              className="btn-primary text-sm"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
