import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const DUTCH_FACTS = [
  { icon: '🏡', label: 'Base Camp', val: 'Kansas City Current Training Facility, Riverside' },
  { icon: '⚽', label: 'KC Match', val: 'Netherlands vs Tunisia — June 25, 6:00 PM CT' },
  { icon: '👑', label: 'Royal Visit', val: 'King Willem-Alexander & Queen Máxima attending' },
  { icon: '🧡', label: 'Fans Expected', val: '5,000+ from Netherlands + 5,000 Dutch-Americans' },
  { icon: '🚶', label: 'Fan Walk', val: 'Orange fan-walk: Power & Light → FIFA Fan Fest' },
  { icon: '🏋️', label: 'Training Open', val: 'June 10 training session — free tickets available' },
]

const WHERE_TO_GO = [
  {
    name: 'Power & Light District',
    emoji: '⚡',
    forDutch: 'Orange fan-walk starting point. The "Soccer in the City" watch party series has free entry and massive screens. Join the organized Dutch fan-walk to the Fan Festival on match day.',
    tip: 'The Dutch football association has coordinated an organized orange fan-walk from Power & Light to the WWI Memorial Fan Fest. Follow @OranjeKansasCity on social for timing.',
  },
  {
    name: 'FIFA Fan Festival — WWI Museum & Memorial',
    emoji: '🎪',
    forDutch: 'Free entry. This is the destination of the fan-walk. Expect a sea of orange on June 25. Live match broadcast, music, and the full World Cup atmosphere without a ticket.',
    tip: 'Arrive by noon on June 25 — capacity is managed and Dutch fans will be there in force.',
  },
  {
    name: 'Riverside — Dutch Training Ground',
    emoji: '🏟️',
    forDutch: 'The Netherlands trains at the Kansas City Current Training Facility in Riverside. The City of Riverside offered free tickets to the June 10 training session (60 pairs). Check local news for any additional open sessions.',
    tip: 'Riverside is about 15 min north of downtown KC. Worth visiting if you want a glimpse of the team before the match.',
  },
  {
    name: 'Crossroads Arts District',
    emoji: '🎨',
    forDutch: 'Rooftop bars and independent restaurants. Great for a civilized pre-match dinner away from the fan zone crowds. The Dutch tend to want good beer and good food — Crossroads delivers.',
    tip: 'Grünauer (Austrian-inspired, great beer selection) and Westport Brewing are solid options.',
  },
  {
    name: '18th & Vine Jazz District',
    emoji: '🎷',
    forDutch: 'The soul of KC. If you have a free evening before June 25, this is the neighborhood to experience. Six district-wide events run through the tournament — jazz, gospel brunches, and street festivals.',
    tip: 'The American Jazz Museum is one of the best music museums in the US. Budget 2 hours.',
  },
]

const FOOD_PICKS = [
  { name: "Joe's Kansas City Bar-B-Que", order: 'Z-Man sandwich', why: 'The quintessential Kansas City experience. Non-negotiable.' },
  { name: 'Grünauer', order: 'Wiener Schnitzel and Kasespatzle', why: 'Austrian-German cuisine — might feel a little like home. Excellent beer selection.' },
  { name: 'Jack Stack', order: 'Crown prime beef ribs', why: 'The upscale BBQ option. Sit-down experience, great for a pre-match group dinner.' },
  { name: 'Muni', order: 'Whatever is on the daily menu', why: 'River Market neighborhood. Mexican-Thai fusion, open late, relaxed atmosphere.' },
  { name: 'City Market', order: 'Weekend market with 140+ vendors', why: 'River Market neighborhood. The most local, authentic Kansas City food experience. Open weekends.' },
]

export default function WCNetherlandsPage() {
  return (
    <>
      <Helmet>
        <title>Netherlands Fans Guide to Kansas City — World Cup 2026 | Vtopia</title>
        <meta name="description" content="The Netherlands base camp is in Kansas City for World Cup 2026. 5,000+ Dutch fans attending the June 25 match vs Tunisia. Complete KC guide — fan-walk, training ground, where to eat and celebrate." />
        <meta property="og:title" content="Kansas City for Dutch Fans — Netherlands World Cup 2026 Guide | Vtopia" />
        <meta property="og:description" content="The Netherlands is based in KC. Orange fan-walk, training ground visits, and a complete guide to Kansas City for Dutch fans. Netherlands vs Tunisia — June 25." />
        <link rel="canonical" href="https://www.vtopia.world/world-cup/netherlands" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: 'Netherlands vs Tunisia — FIFA World Cup 2026',
          description: 'Netherlands faces Tunisia at GEHA Field at Arrowhead Stadium in Kansas City on June 25, 2026. The Netherlands national team is based in Kansas City for the tournament.',
          startDate: '2026-06-25T18:00:00-05:00',
          location: { '@type': 'Place', name: 'GEHA Field at Arrowhead Stadium', address: { '@type': 'PostalAddress', addressLocality: 'Kansas City', addressRegion: 'MO', addressCountry: 'US' } },
          organizer: { '@type': 'Organization', name: 'FIFA' },
          performer: [
            { '@type': 'SportsTeam', name: 'Netherlands' },
            { '@type': 'SportsTeam', name: 'Tunisia' },
          ],
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-[#070E1F] text-white">

        {/* Hero — Dutch orange accent */}
        <div className="relative overflow-hidden px-6 py-16 md:py-24 text-center" style={{ background: 'linear-gradient(135deg, #0D1B3E 0%, #c0390a 50%, #0D1B3E 100%)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="relative max-w-3xl mx-auto">
            <Link to="/world-cup" className="text-orange-300/70 text-xs hover:text-orange-300 mb-4 inline-block">← Back to KC World Cup Hub</Link>
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 text-orange-300 px-4 py-1.5 rounded-full text-xs font-bold mb-5 uppercase tracking-wider">
              🇳🇱 Netherlands Base Camp · Kansas City
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">
              Kansas City for <span className="text-orange-400">Dutch Fans</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-6 max-w-2xl mx-auto">
              The Netherlands national team chose Kansas City as their 2026 World Cup base camp. They train here. They live here. And on June 25 at 6 PM, they play Tunisia at Arrowhead Stadium — with 10,000+ orange-clad fans watching live.
            </p>
            <p className="text-orange-300 font-semibold text-sm mb-8">King Willem-Alexander and Queen Máxima will be in Kansas City for this match.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/itinerary" className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-full transition">
                ✨ Build My KC Match Day Plan
              </Link>
              <Link to="/browse/kansas-city" className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-full transition">
                Browse KC Experiences →
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12 space-y-14">

          {/* Dutch quick facts */}
          <section>
            <div className="text-xs text-orange-400 uppercase tracking-widest font-bold mb-4">Netherlands in KC — Fast Facts</div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {DUTCH_FACTS.map(f => (
                <div key={f.label} className="bg-white/5 border border-orange-500/15 rounded-xl p-4">
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">{f.label}</div>
                  <div className="text-white text-sm font-semibold mt-1 leading-snug">{f.val}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Match details */}
          <section className="bg-white/5 border border-orange-500/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">⚽ The Match — Netherlands vs Tunisia</h2>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div><div className="text-orange-400 font-bold text-[10px] uppercase tracking-wider mb-1">Date</div><div className="text-white font-semibold">Thursday, June 25, 2026</div></div>
              <div><div className="text-orange-400 font-bold text-[10px] uppercase tracking-wider mb-1">Kickoff</div><div className="text-white font-semibold">6:00 PM Central Time</div></div>
              <div><div className="text-orange-400 font-bold text-[10px] uppercase tracking-wider mb-1">Venue</div><div className="text-white font-semibold">GEHA Field at Arrowhead Stadium</div></div>
            </div>
            <div className="mt-4 bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-xs text-orange-200 leading-relaxed">
              Earlier in the day, King Willem-Alexander and Queen Máxima will attend the Ecuador vs Curaçao match (June 20) in Kansas City before flying back. On June 25, they return specifically for the Netherlands match.
            </div>
          </section>

          {/* Where to go */}
          <section>
            <div className="text-xs text-orange-400 uppercase tracking-widest font-bold mb-2">Where to Be</div>
            <h2 className="text-2xl font-bold mb-2">Kansas City — The Dutch Fan's Map</h2>
            <p className="text-white/50 text-sm mb-6">From the training ground to the fan zone to the post-match bars — here's where to be and when.</p>
            <div className="space-y-4">
              {WHERE_TO_GO.map(place => (
                <div key={place.name} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{place.emoji}</span>
                    <div className="font-bold">{place.name}</div>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed mb-3">{place.forDutch}</p>
                  <div className="bg-black/20 rounded-lg px-3 py-2 text-[11px] text-white/40">
                    <span className="text-orange-400 font-semibold">Tip:</span> {place.tip}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Food picks */}
          <section>
            <div className="text-xs text-orange-400 uppercase tracking-widest font-bold mb-2">Where to Eat</div>
            <h2 className="text-2xl font-bold mb-5">🍺 Food & Drink for Dutch Fans in KC</h2>
            <div className="space-y-3">
              {FOOD_PICKS.map((r, i) => (
                <div key={r.name} className="flex gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="w-8 h-8 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center font-black text-orange-400 flex-shrink-0 text-sm">{i + 1}</div>
                  <div>
                    <div className="font-bold text-sm">{r.name}</div>
                    <div className="text-orange-300 text-[11px] font-semibold mt-0.5">Order: {r.order}</div>
                    <div className="text-white/50 text-xs mt-1">{r.why}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Itinerary CTA */}
          <section className="bg-gradient-to-r from-[#c0390a]/30 to-[#0D1B3E] border border-orange-500/20 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">🧡</div>
            <h2 className="text-xl font-bold mb-2">Build Your Complete KC Match Day — Free</h2>
            <p className="text-white/50 text-sm mb-5 max-w-md mx-auto">
              Vtopia builds a personalized Kansas City day plan — training ground visit, fan-walk timing, pre-match dinner, and post-match celebrations — in 10 seconds.
            </p>
            <Link to="/itinerary" className="inline-block px-8 py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-full transition">
              Plan My June 25 in KC →
            </Link>
          </section>

          {/* More guides */}
          <div className="text-xs text-white/30 uppercase tracking-widest font-bold mb-4">More World Cup Guides</div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link to="/world-cup/kansas-city-guide" className="block p-4 bg-white/5 border border-white/10 hover:border-orange-500/30 rounded-xl transition">
              <div className="text-xl mb-1">🗺️</div>
              <div className="font-semibold text-sm">Complete KC Visitor Guide →</div>
            </Link>
            <Link to="/world-cup/argentina" className="block p-4 bg-white/5 border border-white/10 hover:border-orange-500/30 rounded-xl transition">
              <div className="text-xl mb-1">🇦🇷</div>
              <div className="font-semibold text-sm">Argentina Fans Guide →</div>
            </Link>
            <Link to="/world-cup/match-day-plan" className="block p-4 bg-white/5 border border-white/10 hover:border-orange-500/30 rounded-xl transition">
              <div className="text-xl mb-1">📋</div>
              <div className="font-semibold text-sm">Perfect Match Day Plan →</div>
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
