import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const NEIGHBORHOODS = [
  {
    name: 'Power & Light District',
    emoji: '⚡',
    vibe: 'Fan zone energy',
    desc: 'The official World Cup fan epicenter. KC Live! hosts the "Soccer in the City" watch party series — free entry, massive screens, street food, and 80,000+ fans within a 6-block radius.',
    tip: 'Arrive 90 min before kickoff for best standing spots. Surge pricing on rideshare after the match — walk toward downtown instead.',
  },
  {
    name: 'Crossroads Arts District',
    emoji: '🎨',
    vibe: 'Creative + culinary',
    desc: 'Gallery walks, independent restaurants, and rooftop bars. The most Instagram-worthy neighborhood in KC — murals around every corner. Great for a pre-match brunch or post-match art crawl.',
    tip: 'The Grünauer and Corvino Supper Club are reservation-required. Book now.',
  },
  {
    name: '18th & Vine Jazz District',
    emoji: '🎷',
    vibe: 'Music + history',
    desc: 'The birthplace of Kansas City jazz. Six major district-wide events run through the tournament including live jazz shows and gospel brunches. The American Jazz Museum is essential.',
    tip: '10 min by rideshare from downtown. The Vine Street FC event series runs all tournament — free.',
  },
  {
    name: 'River Market',
    emoji: '🌊',
    vibe: 'Local + walkable',
    desc: 'KC\'s oldest neighborhood. The City Market runs weekends with 140+ vendors. Le Fou Frog and Muni are standout restaurants. Quieter than Power & Light — perfect if you want the city without the crowd.',
    tip: 'The KC streetcar stops here. Free to ride downtown corridor.',
  },
  {
    name: 'Country Club Plaza',
    emoji: '🛍️',
    vibe: 'Upscale + relaxed',
    desc: 'Spanish-inspired architecture, luxury shopping, and KC\'s best hotel district. The Plaza fountains are stunning at night. Great for families or anyone who wants distance from the fan zone noise.',
    tip: '25 min from stadium. Uber/Lyft recommended. Hotel rates here are high — book early.',
  },
  {
    name: 'Westport',
    emoji: '🌆',
    vibe: 'Local nightlife',
    desc: 'Where Kansas City locals actually go. Dive bars, live music, late-night tacos, and none of the tourist premium. This is the post-match spot that doesn\'t show up on tourist maps.',
    tip: 'Stanley\'s Whiskey Bar and Crows Coffee are neighborhood staples. 20 min from stadium.',
  },
]

const BBQ_GUIDE = [
  { name: 'Joe\'s Kansas City Bar-B-Que', order: 'Z-Man sandwich (non-negotiable)', note: 'Inside a working gas station at 3002 W 47th Ave. Cash only at the gas station pumps. Line forms early.', icon: '🥩' },
  { name: 'Q39', order: 'Burnt ends, brisket, and the pulled pork plate', note: 'Best full sit-down BBQ experience. Midtown location is closest to downtown. Reservations accepted.', icon: '🔥' },
  { name: 'Jack Stack', order: 'Crown prime beef ribs and cheesy corn bake', note: 'KC institution since 1957. Fancier than Joe\'s. Multiple locations — Country Club Plaza location is easiest.', icon: '🏆' },
  { name: 'Slap\'s BBQ', order: 'Smoked turkey and brisket sandwich', note: 'Locals-only gem. Less famous than Joe\'s, equally serious about smoke.', icon: '💨' },
  { name: 'Gates Bar-B-Q', order: 'Ribs, yams, and the "Hi, may I help you?"', note: 'KC legend since 1946. The counter greeting is part of the experience.', icon: '🎺' },
]

const TRANSPORT = [
  { icon: '🆓', mode: 'ConnectKC26 Airport Shuttle', desc: 'Free round-trip shuttle between Kansas City International Airport (KCI) and the Downtown Bus Mall — 2 blocks from the FIFA Fan Festival. This is the move if you\'re coming in for just the match.' },
  { icon: '🚊', mode: 'KC Streetcar', desc: 'Free to ride along the Main Street corridor — connects River Market through downtown to Crown Center. Walk on, no ticket needed.' },
  { icon: '🚗', mode: 'Uber / Lyft', desc: 'Order 45–60 min before kickoff on match days. Prices spike 3x post-match. Walk at least 5 blocks from the stadium before requesting — staging zones are chaotic.' },
  { icon: '🚶', mode: 'Walk', desc: 'Power & Light, Crossroads, Crown Center, and Union Station are all within a 20-min walk of each other. Most of the fan activity clusters in a 1.5-mile radius.' },
  { icon: '🅿️', mode: 'Parking', desc: 'Lots fill 3 hours before kickoff. The Power & Light garage is closest to the fan zone. Budget $30–$60 on match days. Reserve in advance at parkwhiz.com.' },
]

const MATCH_SCHEDULE = [
  { date: 'Tue Jun 16', time: '8:00 PM CT', teams: 'Argentina vs Algeria', flags: '🇦🇷🇩🇿', note: 'Messi is in KC. Biggest match of the group stage globally.' },
  { date: 'Sat Jun 20', time: '7:00 PM CT', teams: 'Ecuador vs Curaçao', flags: '🇪🇨🇨🇼', note: 'Group E — lively South American fan presence expected.' },
  { date: 'Thu Jun 25', time: '6:00 PM CT', teams: 'Tunisia vs Netherlands', flags: '🇹🇳🇳🇱', note: 'Dutch base camp is in KC. 5,000+ orange-clad fans.' },
  { date: 'Sat Jun 27', time: '9:00 PM CT', teams: 'Algeria vs Austria', flags: '🇩🇿🇦🇹', note: 'Late kick. Fan zones will be electric.' },
  { date: 'Fri Jul 3', time: '8:30 PM CT', teams: 'Round of 32', flags: '⚽⚽', note: 'Knockout begins. Teams TBD after group stage.' },
  { date: 'Sat Jul 11', time: '8:00 PM CT', teams: 'Quarterfinal', flags: '🏆🏆', note: 'Highest global audience of any KC match.' },
]

export default function WCKansasCityGuidePage() {
  return (
    <>
      <Helmet>
        <title>Kansas City World Cup 2026 Visitor Guide — Things to Do, Eat & Explore | Vtopia</title>
        <meta name="description" content="The complete Kansas City FIFA World Cup 2026 guide for fans. Best BBQ restaurants, neighborhoods, match schedule, transport tips, and a personalized KC itinerary — built for World Cup visitors." />
        <meta property="og:title" content="Kansas City World Cup 2026 Visitor Guide | Vtopia" />
        <meta property="og:description" content="BBQ trails, jazz bars, neighborhoods, transport, and a free personalized itinerary for every fan visiting KC for World Cup 2026." />
        <meta property="og:type" content="article" />
        <link rel="canonical" href="https://www.vtopia.world/world-cup/kansas-city-guide" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'TouristDestination',
          name: 'Kansas City — FIFA World Cup 2026 Host City',
          description: 'Kansas City hosts 6 FIFA World Cup 2026 matches at GEHA Field at Arrowhead Stadium, including a quarterfinal on July 11.',
          url: 'https://www.vtopia.world/world-cup/kansas-city-guide',
          touristType: ['Fans', 'International Visitors', 'Sports Tourists'],
          includesAttraction: [
            { '@type': 'TouristAttraction', name: 'GEHA Field at Arrowhead Stadium' },
            { '@type': 'TouristAttraction', name: 'Power & Light District' },
            { '@type': 'TouristAttraction', name: '18th & Vine Jazz District' },
            { '@type': 'TouristAttraction', name: 'Crossroads Arts District' },
          ],
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-[#070E1F] text-white">

        {/* Hero */}
        <div className="bg-gradient-to-br from-[#0D1B3E] via-[#034694] to-[#0D1B3E] px-6 py-16 md:py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="relative max-w-3xl mx-auto">
            <Link to="/world-cup" className="text-amber-400/70 text-xs hover:text-amber-400 mb-4 inline-block">← Back to KC World Cup Hub</Link>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-xs font-bold mb-5 uppercase tracking-wider">
              ⚽ FIFA World Cup 2026 · Kansas City Host City
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">
              The Complete Visitor's Guide<br />
              to <span className="text-amber-400">Kansas City</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              Kansas City hosts 6 World Cup matches — including the July 11 Quarterfinal. Here's everything fans from around the world need to know: where to eat, what to explore, how to get around, and how to build your perfect KC day.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/itinerary" className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition">
                ✨ Build My KC Itinerary — Free
              </Link>
              <Link to="/browse/kansas-city" className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-full transition">
                Browse All KC Experiences →
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">

          {/* Match Schedule */}
          <section>
            <div className="text-xs text-amber-400 uppercase tracking-widest font-bold mb-2">Full Schedule</div>
            <h2 className="text-2xl font-bold mb-6">⚽ KC Match Schedule</h2>
            <div className="space-y-3">
              {MATCH_SCHEDULE.map((m, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl flex-wrap">
                  <div className="text-2xl flex-shrink-0">{m.flags}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{m.teams}</div>
                    <div className="text-white/40 text-xs mt-0.5">{m.note}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-amber-400 text-xs font-mono font-bold">{m.date}</div>
                    <div className="text-white/40 text-[10px]">{m.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Neighborhoods */}
          <section>
            <div className="text-xs text-amber-400 uppercase tracking-widest font-bold mb-2">Where to Be</div>
            <h2 className="text-2xl font-bold mb-2">KC Neighborhoods for World Cup Fans</h2>
            <p className="text-white/50 text-sm mb-6">Kansas City is compact. These six neighborhoods cover everything — from the official fan zone to where locals actually go.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {NEIGHBORHOODS.map(n => (
                <div key={n.name} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{n.emoji}</span>
                    <div>
                      <div className="font-bold">{n.name}</div>
                      <div className="text-amber-400 text-[11px] font-semibold">{n.vibe}</div>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed mb-3">{n.desc}</p>
                  <div className="bg-black/20 rounded-lg px-3 py-2 text-[11px] text-white/40">
                    <span className="text-amber-400 font-semibold">Tip:</span> {n.tip}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* BBQ Guide */}
          <section>
            <div className="text-xs text-amber-400 uppercase tracking-widest font-bold mb-2">Essential Eating</div>
            <h2 className="text-2xl font-bold mb-2">🥩 The Kansas City BBQ Guide for World Cup Fans</h2>
            <p className="text-white/50 text-sm mb-6">Kansas City has over 100 BBQ restaurants. Here are the five you actually need to hit, in order of priority.</p>
            <div className="space-y-4">
              {BBQ_GUIDE.map((r, i) => (
                <div key={r.name} className="flex gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 flex-shrink-0">{i + 1}</div>
                  <div className="flex-1">
                    <div className="font-bold flex items-center gap-2">{r.icon} {r.name}</div>
                    <div className="text-amber-300 text-xs font-semibold mt-0.5">Order: {r.order}</div>
                    <div className="text-white/50 text-xs mt-1.5 leading-relaxed">{r.note}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-200">
              <span className="font-bold text-amber-400">Pro tip:</span> On match days, BBQ restaurants near the stadium see 2–3 hour waits. Go for lunch before 12 PM, or eat at a location in Crossroads or River Market rather than near Arrowhead.
            </div>
          </section>

          {/* Transport */}
          <section>
            <div className="text-xs text-amber-400 uppercase tracking-widest font-bold mb-2">Getting Around</div>
            <h2 className="text-2xl font-bold mb-6">🚇 Transport Guide for World Cup Fans</h2>
            <div className="space-y-3">
              {TRANSPORT.map(t => (
                <div key={t.mode} className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="text-2xl flex-shrink-0">{t.icon}</div>
                  <div>
                    <div className="font-semibold text-sm">{t.mode}</div>
                    <div className="text-white/50 text-xs mt-1 leading-relaxed">{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Fan Fest */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-3">🎪 FIFA Fan Festival — Free & Open to All</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              The official FIFA Fan Festival runs for 18 days at the <strong className="text-white">National WWI Museum and Memorial</strong> — an extraordinary venue. Entry is free. Expect live match broadcasts, performances (The Chainsmokers, Flo Rida, and more), food vendors, and the full tournament atmosphere without a ticket.
            </p>
            <p className="text-white/40 text-xs">The GA Pass is first-come, first-served subject to capacity. Arrive early on Argentina and Netherlands match days — those will be the largest crowds.</p>
          </section>

          {/* Personalization CTA */}
          <section className="bg-gradient-to-r from-[#034694]/60 to-[#0D1B3E] border border-blue-500/20 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">✨</div>
            <h2 className="text-xl font-bold mb-2">Build Your Personalized KC Plan</h2>
            <p className="text-white/50 text-sm mb-5 max-w-md mx-auto">
              Tell Vtopia which match you're attending, your interests, and your budget — get a complete day plan (pre-game + post-match) built by AI in 10 seconds.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/itinerary" className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition">
                Build My Match Day Plan →
              </Link>
              <Link to="/browse/kansas-city" className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-full transition text-sm">
                Browse All KC Experiences
              </Link>
            </div>
          </section>

          {/* Internal links */}
          <section>
            <div className="text-xs text-white/30 uppercase tracking-widest font-bold mb-4">More World Cup Guides</div>
            <div className="grid sm:grid-cols-3 gap-3">
              <Link to="/world-cup/argentina" className="block p-4 bg-white/5 border border-white/10 hover:border-amber-500/30 rounded-xl transition">
                <div className="text-2xl mb-1">🇦🇷</div>
                <div className="font-semibold text-sm">Argentina Fans Guide</div>
                <div className="text-white/40 text-xs mt-0.5">En inglés y español →</div>
              </Link>
              <Link to="/world-cup/netherlands" className="block p-4 bg-white/5 border border-white/10 hover:border-amber-500/30 rounded-xl transition">
                <div className="text-2xl mb-1">🇳🇱</div>
                <div className="font-semibold text-sm">Netherlands Fans Guide</div>
                <div className="text-white/40 text-xs mt-0.5">Dutch base camp is KC →</div>
              </Link>
              <Link to="/world-cup/match-day-plan" className="block p-4 bg-white/5 border border-white/10 hover:border-amber-500/30 rounded-xl transition">
                <div className="text-2xl mb-1">📋</div>
                <div className="font-semibold text-sm">Perfect Match Day Plan</div>
                <div className="text-white/40 text-xs mt-0.5">Hour-by-hour KC guide →</div>
              </Link>
            </div>
          </section>

        </div>
      </div>
    </>
  )
}
