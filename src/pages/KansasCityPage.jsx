import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const ITINERARY_TEMPLATES = [
  {
    id: 'match-day',
    emoji: '🏟️',
    title: 'Match Day in KC',
    duration: '1 day',
    budget: 'mid',
    desc: 'Pre-game BBQ at Joe\'s, fan zone at Power & Light, post-match drinks on the rooftop.',
    tags: ['Sports', 'Food & Drink', 'Nightlife'],
    highlights: ['Joe\'s KC BBQ pre-game', 'Power & Light District fan zone', 'GEHA Field Arrowhead', 'Rooftop bar post-match'],
  },
  {
    id: 'bbq-trail',
    emoji: '🥩',
    title: 'KC BBQ Trail',
    duration: '1 day',
    budget: 'budget',
    desc: 'Hit every legendary pit in one day: Joe\'s, Q39, Gates, and Bryant\'s.',
    tags: ['Food & Drink'],
    highlights: ['Joe\'s KC Bar-B-Que', 'Q39 South', 'Gates Bar-B-Q', 'Arthur Bryant\'s'],
  },
  {
    id: 'crossroads-arts',
    emoji: '🎨',
    title: 'Crossroads Arts Afternoon',
    duration: 'Half day',
    budget: 'budget',
    desc: 'Gallery walks, murals, craft cocktails, and live music in KC\'s creative heart.',
    tags: ['Arts & Culture', 'Nightlife'],
    highlights: ['H&R Block Artspace', 'Crossroads street murals', 'Thou Mayest coffee', 'The Brick cocktail bar'],
  },
  {
    id: 'budget-weekend',
    emoji: '💰',
    title: 'Budget KC Weekend',
    duration: '2 days',
    budget: 'budget',
    desc: 'Best of KC under $200 total — free museums, parks, food trucks, and live jazz.',
    tags: ['Outdoors', 'Arts & Culture', 'Food & Drink'],
    highlights: ['Nelson-Atkins Museum (free)', 'Loose Park', 'River Market food trucks', 'Free jazz at 18th & Vine'],
  },
  {
    id: 'luxury-weekend',
    emoji: '✨',
    title: 'Luxury KC Weekend',
    duration: '2 days',
    budget: 'premium',
    desc: 'Loews Kansas City, chef\'s table at Corvino, rooftop bars, and a spa morning.',
    tags: ['Wellness', 'Food & Drink', 'Nightlife'],
    highlights: ['Loews Kansas City Hotel', 'Corvino Supper Club', 'Town Company at Hotel Kansas City', 'KC Wellness spa morning'],
  },
]

const NEIGHBORHOODS = [
  { name: 'Power & Light District', emoji: '⚡', desc: 'KC\'s entertainment hub — 50+ bars, restaurants, and live music venues within walking distance of the convention center.', link: '/browse/kansas-city?category=Nightlife' },
  { name: 'Crossroads Arts District', emoji: '🎨', desc: 'Galleries, studios, and murals. First Fridays bring the whole city here. Best cocktail bars in KC.', link: '/browse/kansas-city?category=Arts+%26+Culture' },
  { name: 'Country Club Plaza', emoji: '🛍️', desc: 'Spanish-inspired architecture, upscale shopping, rooftop dining, and the best hotel strip in the city.', link: '/browse/kansas-city?category=Shopping' },
  { name: 'Westport', emoji: '🎸', desc: 'KC\'s original entertainment district. Dive bars, live music, eclectic restaurants, and a locals-first vibe.', link: '/browse/kansas-city?category=Nightlife' },
  { name: '18th & Vine', emoji: '🎷', desc: 'The birthplace of Kansas City jazz. Live music every night, the American Jazz Museum, and legendary BBQ.', link: '/browse/kansas-city?category=Arts+%26+Culture' },
  { name: 'River Market', emoji: '🌊', desc: 'Farmers market on weekends, international restaurants, and easy streetcar access from downtown.', link: '/browse/kansas-city?category=Food+%26+Drink' },
]

const GETTING_AROUND = [
  { icon: '🚋', title: 'KC Streetcar', desc: 'Free to ride. Runs 2 miles from River Market to Crown Center. Stops near Power & Light, Crossroads, and Union Station.' },
  { icon: '🚗', title: 'Rideshare', desc: 'Uber and Lyft are widely available. Surge pricing after match days — book early or walk a few blocks from the venue.' },
  { icon: '👟', title: 'Walkability', desc: 'Downtown KC, Power & Light, and Crossroads are easily walkable. Country Club Plaza and Westport require a short ride.' },
  { icon: '🅿️', title: 'Parking', desc: 'Plentiful and cheap vs. other major cities. Most garages $5–15/day. Street parking free after 9pm in many neighborhoods.' },
]

export default function KansasCityPage() {
  const navigate = useNavigate()

  return (
    <>
      <Helmet>
        <title>Kansas City World Cup 2026 Guide — Vtopia</title>
        <meta name="description" content="The complete Kansas City guide for FIFA World Cup 2026 visitors. BBQ trails, live music, arts, neighborhoods, and getting around KC." />
        <meta property="og:title" content="Kansas City World Cup 2026 Guide — Vtopia" />
        <meta property="og:description" content="Everything you need for your KC World Cup trip — curated itineraries, neighborhood guides, BBQ trails, and local tips." />
        <link rel="canonical" href="https://www.vtopia.world/kansas-city" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TouristDestination",
          "name": "Kansas City",
          "description": "Official 2026 FIFA World Cup host city — home of world-famous BBQ, jazz, and Midwestern hospitality.",
          "touristType": ["Tourists", "Sports fans", "Food lovers"],
          "url": "https://www.vtopia.world/kansas-city",
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-950 text-white">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-900/80 via-gray-950 to-gray-950 px-4 py-20 md:py-28 text-center">
          <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&auto=format')] bg-cover bg-center" />
          <div className="relative max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
              🏆 Official FIFA World Cup 2026 Host City
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
              Explore Kansas City
            </h1>
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              World-class BBQ, legendary jazz, Midwestern hospitality, and a city that's ready to show the world what it's got.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => navigate('/itinerary')}
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold rounded-xl transition-all shadow-lg shadow-amber-400/30"
              >
                ✨ Plan my KC trip with AI
              </button>
              <Link
                to="/browse/kansas-city"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all"
              >
                Browse all experiences →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Curated Itineraries ── */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">Ready-made plans</div>
            <h2 className="text-3xl font-bold">5 Curated KC Itineraries</h2>
            <p className="text-white/50 mt-2">Load instantly — no AI wait. Personalise with the button below.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ITINERARY_TEMPLATES.map(tmpl => (
              <div key={tmpl.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-amber-400/40 transition-all group">
                <div className="text-4xl mb-3">{tmpl.emoji}</div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-base group-hover:text-amber-300 transition-colors">{tmpl.title}</h3>
                  <span className="text-[10px] bg-white/10 text-white/50 px-2 py-0.5 rounded-full">{tmpl.duration}</span>
                </div>
                <p className="text-white/50 text-sm mb-3 leading-relaxed">{tmpl.desc}</p>
                <ul className="space-y-1 mb-4">
                  {tmpl.highlights.map(h => (
                    <li key={h} className="text-xs text-white/40 flex items-center gap-1.5">
                      <span className="text-amber-400/60">→</span> {h}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/itinerary', { state: { prefill: { city: 'kansas-city', budget: tmpl.budget } } })}
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-semibold"
                >
                  Use as starting point →
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Neighborhoods ── */}
        <section className="bg-white/3 border-y border-white/8 py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">Where to go</div>
              <h2 className="text-3xl font-bold">KC Neighborhoods</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {NEIGHBORHOODS.map(n => (
                <Link key={n.name} to={n.link} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/30 transition-all group">
                  <div className="text-3xl mb-2">{n.emoji}</div>
                  <h3 className="font-bold text-sm mb-1 group-hover:text-amber-300 transition-colors">{n.name}</h3>
                  <p className="text-white/50 text-xs leading-relaxed">{n.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Getting Around ── */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">Logistics</div>
            <h2 className="text-3xl font-bold">Getting Around KC</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {GETTING_AROUND.map(item => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="bg-gradient-to-r from-blue-900/60 to-amber-900/30 border-t border-white/10 py-16 px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to plan your KC trip?</h2>
          <p className="text-white/50 mb-6 max-w-md mx-auto">Tell our AI your dates and interests — it builds your full day-by-day itinerary in 30 seconds.</p>
          <button
            onClick={() => navigate('/itinerary')}
            className="px-8 py-4 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold rounded-xl transition-all shadow-lg shadow-amber-400/30 text-base"
          >
            ✨ Generate my itinerary — it's free
          </button>
        </section>

      </div>
    </>
  )
}
