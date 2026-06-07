import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const MATCH_PLANS = {
  'arg-alg-jun16': {
    teams: 'Argentina vs Algeria',
    flags: '🇦🇷🇩🇿',
    date: 'Tuesday, June 16 · 8:00 PM CT',
    kickoff: '20:00',
    color: 'from-blue-900 to-[#0D1B3E]',
    accent: 'text-blue-400',
    steps: [
      { time: '8:00 AM', icon: '☕', title: 'Coffee & fuel up', desc: 'Start at The Roasterie (River Market) for KC\'s best single-origin coffee. Walk the City Market if it\'s a weekend — 140+ vendors open.' },
      { time: '11:00 AM', icon: '🥩', title: 'BBQ lunch before crowds hit', desc: "Joe's Kansas City Bar-B-Que opens at 11 AM. Get there before noon — the line doubles by 12:30. Order the Z-Man sandwich, burnt ends, and a side of fries. This is non-negotiable." },
      { time: '1:00 PM', icon: '🎨', title: 'Explore Crossroads', desc: 'Walk the Crossroads Arts District. Street murals, galleries, and independent coffee shops. The 2 PM gallery rush hasn\'t started yet — you get the neighborhood to yourself.' },
      { time: '3:30 PM', icon: '🎷', title: 'Quick jazz history stop', desc: '18th & Vine takes 45 minutes and is one of the best music museums in the US. Worth the detour before the match atmosphere starts taking over.' },
      { time: '5:00 PM', icon: '⚡', title: 'Hit the fan zone', desc: 'Power & Light District. Soccer in the City watch parties start early. Get your spot before 5 PM for Argentina match day — this will be the biggest crowd of the tournament.' },
      { time: '6:30 PM', icon: '🍺', title: 'Pre-match drink', desc: 'KC Live! bars are packed. The Shark Bar and No Other Pub are closest. Alternatively: walk to the FIFA Fan Festival at WWI Memorial for the official atmosphere.' },
      { time: '7:00 PM', icon: '🚌', title: 'Head to Arrowhead', desc: 'ConnectKC26 shuttles run from downtown. Rideshare from downtown takes 15 min off-peak — budget 30 min on match day. Be in your seat by 7:30 PM.' },
      { time: '8:00 PM', icon: '⚽', title: 'KICKOFF — Argentina vs Algeria', desc: 'Arrowhead Stadium. 76,000+ fans. Argentina\'s first match of the tournament. Messi is in the building.' },
      { time: '10:00 PM', icon: '🎉', title: 'Post-match', desc: 'Win or lose: Power & Light is the epicenter. If you want the local experience: Westport (20 min away by rideshare) has the bars where KC residents actually go. No tourist markup.' },
      { time: 'Late night', icon: '🌃', title: 'Wind down', desc: 'The Monarch Bar (Power & Light) stays open until 3 AM. Julep on Baltimore (cocktail bar, Crossroads) is the more civilized option. Order a Boulevard Wheat — it\'s brewed in KC.' },
    ],
  },
  'tun-ned-jun25': {
    teams: 'Tunisia vs Netherlands',
    flags: '🇹🇳🇳🇱',
    date: 'Thursday, June 25 · 6:00 PM CT',
    kickoff: '18:00',
    color: 'from-orange-900/50 to-[#0D1B3E]',
    accent: 'text-orange-400',
    steps: [
      { time: '8:00 AM', icon: '🏋️', title: 'Netherlands training (if tickets available)', desc: 'The Netherlands trains at KC Current Training Facility in Riverside. Check the City of Riverside\'s site for any additional open session tickets.' },
      { time: '10:30 AM', icon: '☕', title: 'Brunch in River Market', desc: 'The City Market (140+ vendors) is perfect for a mid-morning wander. Grab Dutch stroopwafel if you find them — someone will be selling them. The Local Pig and Muni are both nearby.' },
      { time: '12:30 PM', icon: '🎪', title: 'FIFA Fan Festival opens', desc: 'Head to the WWI Museum and Memorial early — capacity is managed and Dutch fans will be arriving in the thousands. The orange fan-walk from Power & Light to the Fan Fest is a sight to see.' },
      { time: '2:00 PM', icon: '🥩', title: 'BBQ — go to Q39 for this one', desc: 'Q39 Midtown is the sit-down BBQ experience that handles groups well. The Dutch fans tend to eat together and appreciate table service. Burnt ends and brisket.' },
      { time: '3:30 PM', icon: '🧡', title: 'Join the orange fan-walk', desc: 'The organized Dutch fan-walk departs from Power & Light District toward the Fan Festival. Organize through @OranjeKansasCity (check social media for confirmed timing).' },
      { time: '4:30 PM', icon: '🎷', title: 'Fan Festival / 18th & Vine', desc: 'June 25 has a major 18th & Vine district event as part of the Vine Street FC series. Split your time between the FIFA Fan Festival energy and the jazz district authenticity.' },
      { time: '5:00 PM', icon: '🚌', title: 'Head to Arrowhead', desc: 'Earlier kickoff means earlier departure. Shuttles leave ConnectKC26 hubs from 4 PM. Be in your seat by 5:30 PM — 6 PM kickoffs feel rushed if you\'re not early.' },
      { time: '6:00 PM', icon: '⚽', title: 'KICKOFF — Tunisia vs Netherlands', desc: 'Netherlands plays their final group stage game. 5,000+ Dutch fans in orange. King Willem-Alexander and Queen Máxima are attending. This is the match of the tournament for KC.' },
      { time: '8:00 PM', icon: '🎉', title: 'Post-match celebrations', desc: 'If the Dutch advance: orange everywhere. Power & Light will be the epicenter. The Dutch fan community has organized post-match meetups — check social for locations.' },
      { time: 'Late night', icon: '🌃', title: 'Westport or Crossroads', desc: 'For a calmer close to the night: Corvino Supper Club (Crossroads) or the restored Monarch Bar. Both are within rideshare distance and open late.' },
    ],
  },
}

const ALL_TIPS = [
  { icon: '📱', title: 'Rideshare strategy', tip: 'Request Uber/Lyft from 5+ blocks away from the stadium. The pickup zones are chaotic. Walk toward downtown before opening the app.' },
  { icon: '💳', title: 'Cash at Joe\'s', tip: "Joe's Kansas City BBQ at the gas station location is cash-preferred at the pumps. ATM inside the gas station. Don't skip it because of this." },
  { icon: '🌡️', title: 'KC heat in June/July', tip: 'Kansas City in late June averages 87–91°F. Hydrate before the match. Arrowhead is open air. Sunscreen for afternoon matches.' },
  { icon: '🅿️', title: 'Parking reality', tip: 'Stadium lots fill 3 hours before kickoff. Pre-book at parkwhiz.com. The Power & Light garage is the best alternative hub — walk 20 min to Fan Fest.' },
  { icon: '🍺', title: 'Boulevard Wheat', tip: 'Kansas City\'s home brewery. If you see Boulevard Wheat on tap anywhere, order it. You\'re in their city.' },
  { icon: '🚊', title: 'Free streetcar', tip: 'The KC Streetcar runs free on Main Street from River Market through downtown to Crown Center. No ticket. Walk on.' },
]

export default function WCMatchDayPage() {
  const [selected, setSelected] = useState('arg-alg-jun16')
  const plan = MATCH_PLANS[selected]

  return (
    <>
      <Helmet>
        <title>Perfect Kansas City Match Day Plan — FIFA World Cup 2026 | Vtopia</title>
        <meta name="description" content="Hour-by-hour Kansas City match day plans for FIFA World Cup 2026. BBQ timing, fan zone strategy, transport, and post-match nightlife — built for World Cup visitors at Arrowhead Stadium." />
        <meta property="og:title" content="The Perfect Kansas City Match Day Plan — World Cup 2026 | Vtopia" />
        <meta property="og:description" content="Hour-by-hour KC day plans for each World Cup match. From 8 AM coffee to post-match celebrations — the insider guide for fans attending matches at Arrowhead Stadium." />
        <link rel="canonical" href="https://www.vtopia.world/world-cup/match-day-plan" />
      </Helmet>

      <div className="min-h-screen bg-[#070E1F] text-white">

        {/* Hero */}
        <div className="bg-gradient-to-br from-[#0D1B3E] via-[#034694] to-[#0D1B3E] px-6 py-16 md:py-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="relative max-w-3xl mx-auto">
            <Link to="/world-cup" className="text-amber-400/70 text-xs hover:text-amber-400 mb-4 inline-block">← Back to KC World Cup Hub</Link>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-xs font-bold mb-5 uppercase tracking-wider">
              ⚽ Hour-by-Hour Match Day Guides
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">
              The Perfect Kansas City<br /><span className="text-amber-400">Match Day Plan</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              Don't waste your match day figuring it out. Here's the hour-by-hour guide — from morning coffee to post-match celebrations — built for each Kansas City World Cup match.
            </p>
            <Link to="/itinerary" className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition">
              ✨ Build My Personalized Plan Instead →
            </Link>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">

          {/* Match selector */}
          <section>
            <div className="text-xs text-amber-400 uppercase tracking-widest font-bold mb-4">Select Your Match</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(MATCH_PLANS).map(([id, m]) => (
                <button
                  key={id}
                  onClick={() => setSelected(id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition border ${
                    selected === id
                      ? 'bg-amber-500 text-black border-amber-500'
                      : 'bg-white/5 border-white/10 text-white/70 hover:border-amber-500/30'
                  }`}
                >
                  {m.flags} {m.teams.split(' vs ')[0]} vs {m.teams.split(' vs ')[1]}
                  <span className="block text-[10px] font-normal mt-0.5 opacity-70">{m.date.split(' · ')[0]}</span>
                </button>
              ))}
              <div className="px-4 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/5 text-white/30">
                <div>+ 4 more match plans</div>
                <div className="text-[10px] mt-0.5">Build via itinerary →</div>
              </div>
            </div>
          </section>

          {/* Selected plan */}
          <section>
            <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${plan.color} border border-white/10 rounded-full px-4 py-1.5 text-sm font-bold mb-6`}>
              {plan.flags} {plan.teams} · {plan.date}
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-white/10" />

              <div className="space-y-6">
                {plan.steps.map((step, i) => (
                  <div key={i} className="flex gap-4 relative">
                    {/* Dot */}
                    <div className={`w-9 h-9 rounded-xl ${i === plan.steps.findIndex(s => s.icon === '⚽') ? 'bg-amber-500/30 border-2 border-amber-500' : 'bg-white/10 border border-white/20'} flex items-center justify-center text-base flex-shrink-0 relative z-10`}>
                      {step.icon}
                    </div>
                    <div className={`flex-1 pb-2 ${i === plan.steps.findIndex(s => s.icon === '⚽') ? 'bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 -mt-1' : ''}`}>
                      <div className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${i === plan.steps.findIndex(s => s.icon === '⚽') ? 'text-amber-400' : 'text-white/30'}`}>{step.time}</div>
                      <div className="font-bold text-sm text-white">{step.title}</div>
                      <div className="text-white/50 text-xs mt-1.5 leading-relaxed">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Pro tips */}
          <section>
            <div className="text-xs text-amber-400 uppercase tracking-widest font-bold mb-4">Insider Tips — All Match Days</div>
            <div className="grid sm:grid-cols-2 gap-3">
              {ALL_TIPS.map(tip => (
                <div key={tip.title} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{tip.icon}</span>
                    <span className="font-bold text-sm">{tip.title}</span>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">{tip.tip}</p>
                </div>
              ))}
            </div>
          </section>

          {/* AI CTA */}
          <section className="bg-gradient-to-r from-[#034694]/60 to-[#0D1B3E] border border-blue-500/20 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">✨</div>
            <h2 className="text-xl font-bold mb-2">Want a Plan Built Just for You?</h2>
            <p className="text-white/50 text-sm mb-5 max-w-md mx-auto">
              Tell Vtopia your match, interests, group size, and budget. Get a complete personalized KC day — not a template, a plan built for you.
            </p>
            <Link to="/itinerary" className="inline-block px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition">
              Build My Personalized Match Day Plan →
            </Link>
          </section>

          {/* Guide links */}
          <div className="grid sm:grid-cols-3 gap-3">
            <Link to="/world-cup/kansas-city-guide" className="block p-4 bg-white/5 border border-white/10 hover:border-amber-500/30 rounded-xl transition">
              <div className="text-xl mb-1">🗺️</div>
              <div className="font-semibold text-sm">Complete KC Guide →</div>
            </Link>
            <Link to="/world-cup/argentina" className="block p-4 bg-white/5 border border-white/10 hover:border-amber-500/30 rounded-xl transition">
              <div className="text-xl mb-1">🇦🇷</div>
              <div className="font-semibold text-sm">Argentina Fans →</div>
            </Link>
            <Link to="/world-cup/netherlands" className="block p-4 bg-white/5 border border-white/10 hover:border-amber-500/30 rounded-xl transition">
              <div className="text-xl mb-1">🇳🇱</div>
              <div className="font-semibold text-sm">Netherlands Fans →</div>
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
