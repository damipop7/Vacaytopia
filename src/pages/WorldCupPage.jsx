import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'

/* ── Feature flag guard ─────────────────────────────────────────────── */
const WC_ENABLED = import.meta.env.VITE_FEATURE_WORLD_CUP === 'true'

/* ── Static data ────────────────────────────────────────────────────── */
const TOP_EXPERIENCES = [
  { emoji: '🥩', title: 'KC BBQ Trail',          desc: 'Hit Joe\'s, Q39, and Gates — the holy trinity of Kansas City smoke.',          tag: 'Food & Drink',  link: '/browse/kansas-city?category=Food+%26+Drink' },
  { emoji: '🎨', title: 'Crossroads Arts District', desc: 'Gallery walks, murals, and craft cocktails in KC\'s creative heart.',        tag: 'Arts & Culture',link: '/browse/kansas-city?category=Arts+%26+Culture' },
  { emoji: '🎷', title: 'Jazz & Blues Row',        desc: 'Live jazz every night on 18th & Vine — the birthplace of KC jazz.',           tag: 'Nightlife',     link: '/browse/kansas-city?category=Nightlife' },
  { emoji: '🌳', title: 'Loose Park & Trails',     desc: 'Miles of green trails for morning runs before the match.',                    tag: 'Outdoors',      link: '/browse/kansas-city?category=Outdoors' },
  { emoji: '🏟️', title: 'GEHA Field Area',         desc: 'The stadium district — bars, restaurants, and fan zones within walking distance.', tag: 'Sports',   link: '/browse/kansas-city?category=Sports' },
  { emoji: '🧘', title: 'Westport Wellness',       desc: 'Spa day between matches — KC\'s best wellness studios.',                      tag: 'Wellness',      link: '/browse/kansas-city?category=Wellness' },
]

const NEIGHBORHOODS = [
  { name: 'Power & Light District',  emoji: '⚡', desc: 'The fan zone. Bars, big screens, and the energy of 80,000 visitors.',       walk: '12 min from Union Station' },
  { name: 'Crossroads Arts District',emoji: '🎨', desc: 'Galleries, rooftop bars, and the best brunch spots in the city.',            walk: '15 min from downtown' },
  { name: '18th & Vine',             emoji: '🎷', desc: 'Jazz heritage district — the soul of Kansas City.',                          walk: '10 min by rideshare' },
  { name: 'Westport',                emoji: '🌆', desc: 'Dive bars, live music, and late-night tacos. The locals\' pick.',             walk: '20 min from stadium' },
  { name: 'Country Club Plaza',      emoji: '🛍️', desc: 'Spanish-inspired outdoor shopping with KC\'s best restaurants.',             walk: '25 min from downtown' },
]

const CURATED_ROUTES = [
  {
    id:    'match-day',
    title: '⚽ Match Day in KC',
    desc:  'The perfect pre-game and post-game plan.',
    tags:  ['Sports', 'Food & Drink', 'Nightlife'],
    steps: [
      { time: '10:00 AM', act: 'BBQ breakfast at Joe\'s Kansas City' },
      { time: '12:00 PM', act: 'Walk the Power & Light District fan zone' },
      { time: '2:00 PM',  act: 'Pre-match drinks at No Other Pub' },
      { time: '5:00 PM',  act: 'GEHA Field — World Cup match' },
      { time: '9:30 PM',  act: 'Post-match celebration on the Crossroads rooftops' },
    ],
  },
  {
    id:    'bbq-trail',
    title: '🥩 Kansas City BBQ Trail',
    desc:  'The definitive smoked meat crawl — one day, four legends.',
    tags:  ['Food & Drink'],
    steps: [
      { time: '11:00 AM', act: 'Q39 — burnt ends and brisket' },
      { time: '1:30 PM',  act: 'Joe\'s Kansas City Bar-B-Que — the Z-Man sandwich' },
      { time: '3:30 PM',  act: 'Gates Bar-B-Q — the classic counter experience' },
      { time: '5:30 PM',  act: 'Arthur Bryant\'s — the original, since 1908' },
      { time: '8:00 PM',  act: 'Recover at a Westport craft beer bar' },
    ],
  },
  {
    id:    'arts-afternoon',
    title: '🎨 Crossroads Arts Afternoon',
    desc:  'Culture, coffee, and cocktails in KC\'s most creative district.',
    tags:  ['Arts & Culture', 'Food & Drink'],
    steps: [
      { time: '10:00 AM', act: 'First Fridays gallery walk (or self-guided murals)' },
      { time: '12:00 PM', act: 'Brunch at Succotash' },
      { time: '2:00 PM',  act: 'Nelson-Atkins Museum of Art' },
      { time: '5:00 PM',  act: 'Rooftop cocktails at Corvino Supper Club' },
      { time: '7:30 PM',  act: 'Jazz at The Mutual Musicians Foundation (18th & Vine)' },
    ],
  },
]

const GETTING_AROUND = [
  { icon: '🚋', mode: 'KC Streetcar',   desc: 'Free! Runs from River Market to Crown Center, right through downtown. Best option for Power & Light to Union Station.' },
  { icon: '🚗', mode: 'Uber / Lyft',   desc: 'Fastest for stadium trips. Surge pricing expected on match days — order 45 min before kickoff or share a ride.' },
  { icon: '🚶', mode: 'Walk',           desc: 'Downtown KC is very walkable. Power & Light, Crossroads, and Union Station are all within a 20-min walk of each other.' },
  { icon: '🅿️', mode: 'Parking',        desc: 'Arrive early — lots fill 3 hrs before kickoff. Garage at Power & Light is closest to the fan zone.' },
]

const MATCH_SCHEDULE_STUB = [
  { date: 'Tue 16 Jun · 8:00 PM CT', teams: 'Argentina vs Algeria',   venue: 'GEHA Field at Arrowhead Stadium', note: 'Group J — Match 19' },
  { date: 'Sat 20 Jun · 7:00 PM CT', teams: 'Ecuador vs Curaçao',     venue: 'GEHA Field at Arrowhead Stadium', note: 'Group E — Match 34' },
  { date: 'Thu 25 Jun · 6:00 PM CT', teams: 'Tunisia vs Netherlands', venue: 'GEHA Field at Arrowhead Stadium', note: 'Group F — Match 58' },
  { date: 'Sat 27 Jun · 9:00 PM CT', teams: 'Algeria vs Austria',     venue: 'GEHA Field at Arrowhead Stadium', note: 'Group J — Match 69' },
  { date: 'Fri  3 Jul · 8:30 PM CT', teams: 'Round of 32',            venue: 'GEHA Field at Arrowhead Stadium', note: 'Match 87 — teams TBD after group stage' },
  { date: 'Sat 11 Jul · 8:00 PM CT', teams: 'Quarter-Final',          venue: 'GEHA Field at Arrowhead Stadium', note: 'Match 100 — teams TBD after Round of 32' },
]

// ── KC match data with ticket affiliate search links ─────────────────────────
// Replace STUBHUB_AFFILIATE, VIVIDSEATS_AFFILIATE, SEATGEEK_AFFILIATE with
// your actual affiliate tracking URLs once approved (CJ / Impact / SeatGeek partner portal)
const STUBHUB_BASE    = 'https://www.stubhub.com/search?q='
const VIVIDSEATS_BASE = 'https://www.vividseats.com/search?searchTerm='
const SEATGEEK_BASE   = 'https://seatgeek.com/search?q='

const KC_MATCHES = [
  { id: 'arg-alg-jun16',  date: 'Tue Jun 16',  time: '8:00 PM CT',  teams: 'Argentina vs Algeria',   flag1: '🇦🇷', flag2: '🇩🇿', stage: 'Group J',       hot: true  },
  { id: 'ecu-cur-jun20',  date: 'Sat Jun 20',  time: '7:00 PM CT',  teams: 'Ecuador vs Curaçao',     flag1: '🇪🇨', flag2: '🇨🇼', stage: 'Group E',       hot: false },
  { id: 'tun-ned-jun25',  date: 'Thu Jun 25',  time: '6:00 PM CT',  teams: 'Tunisia vs Netherlands', flag1: '🇹🇳', flag2: '🇳🇱', stage: 'Group F',       hot: false },
  { id: 'alg-aut-jun27',  date: 'Sat Jun 27',  time: '9:00 PM CT',  teams: 'Algeria vs Austria',     flag1: '🇩🇿', flag2: '🇦🇹', stage: 'Group J',       hot: false },
  { id: 'r32-jul3',       date: 'Fri Jul 3',   time: '8:30 PM CT',  teams: 'Round of 32',            flag1: '⚽',   flag2: '⚽',   stage: 'Knockout',      hot: false },
  { id: 'qf-jul11',       date: 'Sat Jul 11',  time: '8:00 PM CT',  teams: 'Quarterfinal',           flag1: '🏆',   flag2: '🏆',   stage: 'Quarterfinal',  hot: true  },
]

function ticketSearchUrl(base, match) {
  const q = encodeURIComponent(`FIFA World Cup 2026 Kansas City ${match.teams}`)
  return `${base}${q}`
}

/* ── Tickets section ────────────────────────────────────────────────── */
function TicketsSection() {
  const [alertEmail, setAlertEmail]   = useState('')
  const [alertMatch, setAlertMatch]   = useState(KC_MATCHES[0].id)
  const [alertStatus, setAlertStatus] = useState(null) // null | 'loading' | 'done' | 'error'

  async function handleAlertSubmit(e) {
    e.preventDefault()
    if (!alertEmail.includes('@')) return
    setAlertStatus('loading')
    const match = KC_MATCHES.find(m => m.id === alertMatch)
    const { error } = await supabase.from('ticket_alerts').insert({
      email:      alertEmail,
      match_id:   alertMatch,
      match_name: match?.teams ?? alertMatch,
    })
    setAlertStatus(error ? 'error' : 'done')
  }

  return (
    <div className="space-y-6">

      {/* Match cards */}
      <div className="grid gap-3">
        {KC_MATCHES.map(match => (
          <div key={match.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">

            {/* Match info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="text-2xl flex-shrink-0">{match.flag1}{match.flag2}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-white">{match.teams}</span>
                  {match.hot && (
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full">🔥 High demand</span>
                  )}
                </div>
                <div className="text-white/50 text-xs mt-0.5">
                  {match.date} · {match.time} · GEHA Field · {match.stage}
                </div>
              </div>
            </div>

            {/* Ticket buy buttons */}
            <div className="flex gap-2 flex-wrap flex-shrink-0">
              <a
                href={ticketSearchUrl(STUBHUB_BASE, match)}
                target="_blank" rel="noopener noreferrer"
                className="px-3 py-2 bg-[#1A1A1A] hover:bg-[#333] border border-white/10 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                StubHub →
              </a>
              <a
                href={ticketSearchUrl(VIVIDSEATS_BASE, match)}
                target="_blank" rel="noopener noreferrer"
                className="px-3 py-2 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                Vivid Seats →
              </a>
              <a
                href={ticketSearchUrl(SEATGEEK_BASE, match)}
                target="_blank" rel="noopener noreferrer"
                className="px-3 py-2 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/30 text-blue-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                SeatGeek →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Affiliate disclosure */}
      <p className="text-white/25 text-[11px] text-center">
        Vtopia earns a commission on ticket purchases through the links above at no extra cost to you.
        Prices are set by sellers and change in real time.
      </p>

      {/* Price alert capture */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
        <div className="font-bold text-amber-400 mb-1">🔔 Notify me when prices drop</div>
        <p className="text-white/50 text-xs mb-4">We'll email you when ticket prices for your match fall below your target.</p>
        {alertStatus === 'done' ? (
          <div className="text-green-400 font-semibold text-sm">✅ You're on the list — we'll alert you when prices move.</div>
        ) : (
          <form onSubmit={handleAlertSubmit} className="flex flex-col sm:flex-row gap-2">
            <select
              value={alertMatch}
              onChange={e => setAlertMatch(e.target.value)}
              className="bg-white/10 border border-white/15 text-white text-xs rounded-xl px-3 py-2.5 flex-1"
            >
              {KC_MATCHES.filter(m => !m.id.startsWith('r32') && !m.id.startsWith('qf')).map(m => (
                <option key={m.id} value={m.id} className="bg-[#0D1B3E]">{m.date} — {m.teams}</option>
              ))}
            </select>
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={alertEmail}
              onChange={e => setAlertEmail(e.target.value)}
              className="bg-white/10 border border-white/15 text-white placeholder:text-white/30 text-xs rounded-xl px-3 py-2.5 flex-1"
            />
            <button
              type="submit"
              disabled={alertStatus === 'loading'}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition disabled:opacity-50 flex-shrink-0"
            >
              {alertStatus === 'loading' ? 'Saving…' : 'Notify me'}
            </button>
          </form>
        )}
        {alertStatus === 'error' && (
          <p className="text-red-400 text-xs mt-2">Something went wrong — try again.</p>
        )}
      </div>

      {/* Bundle CTA */}
      <div className="bg-gradient-to-r from-blue-900/60 to-[#034694]/60 border border-blue-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="font-bold text-white mb-1">⚽ Got your ticket? Now plan the full day.</div>
          <div className="text-white/50 text-xs">Vtopia builds you a complete match-day itinerary — pre-game BBQ, fan zones, post-match bars — in 10 seconds.</div>
        </div>
        <Link
          to="/itinerary"
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition flex-shrink-0"
        >
          Build my match day →
        </Link>
      </div>
    </div>
  )
}

const SHARE_LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'ar', label: 'العربية',    flag: '🇸🇦' },
]

/* ── Share card ─────────────────────────────────────────────────────── */
function ShareCard() {
  const [copied, setCopied] = useState(false)
  const [lang, setLang]     = useState('en')

  const MESSAGES = {
    en: `🌍 I'm exploring Kansas City for FIFA World Cup 2026! Find the best local experiences at vtopia.world`,
    es: `🌍 ¡Estoy explorando Kansas City para la Copa Mundial FIFA 2026! Encuentra las mejores experiencias en vtopia.world`,
    pt: `🌍 Estou explorando Kansas City para a Copa do Mundo FIFA 2026! Encontre as melhores experiências em vtopia.world`,
    fr: `🌍 J'explore Kansas City pour la Coupe du Monde FIFA 2026 ! Découvrez les meilleures expériences sur vtopia.world`,
    de: `🌍 Ich erkunde Kansas City für die FIFA Weltmeisterschaft 2026! Die besten Erlebnisse auf vtopia.world`,
    ar: `🌍 أستكشف مدينة كانساس سيتي لكأس العالم فيفا 2026! اكتشف أفضل التجارب على vtopia.world`,
  }

  const handleShare = async () => {
    const msg = MESSAGES[lang]
    const url = 'https://www.vtopia.world/world-cup'
    if (navigator.share) {
      try { await navigator.share({ title: 'Vtopia × FIFA World Cup 2026', text: msg, url }); return } catch { /* user dismissed share sheet */ }
    }
    await navigator.clipboard.writeText(`${msg}\n${url}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h3 className="font-bold text-lg mb-1">🔗 Share your KC adventure</h3>
      <p className="text-white/50 text-sm mb-4">Tell your followers you're here — in their language.</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {SHARE_LANGUAGES.map(l => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              lang === l.code
                ? 'bg-amber-500 text-black'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {l.flag} {l.label}
          </button>
        ))}
      </div>
      <div className="bg-black/20 rounded-xl p-4 mb-4 text-sm text-white/80 leading-relaxed" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {MESSAGES[lang]}
      </div>
      <button
        onClick={handleShare}
        className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition"
      >
        {copied ? '✅ Copied to clipboard!' : '📤 Share now'}
      </button>
    </div>
  )
}

/* ── Match schedule stub ────────────────────────────────────────────── */
function MatchSchedule() {
  return (
    <div className="space-y-3">
      {MATCH_SCHEDULE_STUB.map((m, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl flex-shrink-0">⚽</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{m.teams}</div>
            <div className="text-white/50 text-xs mt-0.5">{m.venue}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-amber-400 text-xs font-mono font-bold">{m.date}</div>
            <div className="text-white/30 text-[10px]">{m.note}</div>
          </div>
        </div>
      ))}
      <p className="text-white/30 text-xs text-center pt-2">
        All times Central. Knockout round opponents confirmed after the group stage.{' '}
        <a href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">Full schedule at fifa.com</a>
      </p>
    </div>
  )
}

/* ── Main page ──────────────────────────────────────────────────────── */
export default function WorldCupPage() {
  const navigate = useNavigate()
  const [activeRoute, setActiveRoute] = useState(null)

  if (!WC_ENABLED) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center" style={{ background: 'var(--bg)' }}>
        <div>
          <div className="text-5xl mb-4">🚧</div>
          <h1 className="font-display font-black text-2xl text-[#0D1B3E] mb-2">Coming Soon</h1>
          <p className="text-gray-400 text-sm mb-6">The World Cup visitor guide is launching soon. Stay tuned.</p>
          <button onClick={() => navigate('/browse/kansas-city')} className="btn-primary text-sm">Explore Kansas City Now</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Kansas City FIFA World Cup 2026 Visitor Guide | Vtopia</title>
        <meta name="description" content="Everything World Cup visitors need to know about Kansas City — the best BBQ, bars, neighborhoods, getting around, and local experiences for FIFA World Cup 2026." />
        <meta property="og:title" content="Kansas City FIFA World Cup 2026 Visitor Guide | Vtopia" />
        <meta property="og:description" content="Your complete guide to Kansas City for the 2026 FIFA World Cup. Curated itineraries, BBQ trails, top neighborhoods, and insider tips." />
        <link rel="canonical" href="https://www.vtopia.world/world-cup" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: 'FIFA World Cup 2026 — Kansas City',
          description: 'FIFA World Cup 2026 matches hosted at GEHA Field at Arrowhead Stadium in Kansas City, Missouri.',
          location: { '@type': 'Place', name: 'GEHA Field at Arrowhead Stadium', address: { '@type': 'PostalAddress', addressLocality: 'Kansas City', addressRegion: 'MO', addressCountry: 'US' } },
          startDate: '2026-06-11',
          endDate: '2026-07-19',
          organizer: { '@type': 'Organization', name: 'FIFA', url: 'https://www.fifa.com' },
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-[#070E1F] text-white">

        {/* ── HERO ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0D1B3E] via-[#034694] to-[#0D1B3E] px-6 py-20 md:py-28 text-center">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="relative max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-xs font-bold mb-6 tracking-wider uppercase">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              FIFA World Cup 2026 · Kansas City Host City
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-5">
              Your Ultimate<br />
              <span className="text-amber-400">Kansas City</span><br />
              World Cup Guide
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              GEHA Field at Arrowhead Stadium hosts the world. Vtopia helps you discover everything Kansas City has to offer — beyond the stadium.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/browse/kansas-city" className="px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition text-base">
                Browse KC Experiences →
              </Link>
              <Link to="/itinerary" className="px-7 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-full transition text-base">
                ✨ Build My Itinerary
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-12 space-y-16">

          {/* ── TICKETS ── */}
          <section>
            <div className="text-xs text-amber-400 uppercase tracking-widest font-bold mb-2">Tickets</div>
            <h2 className="text-2xl font-bold mb-2">🎟️ Get Your KC Match Tickets</h2>
            <p className="text-white/50 text-sm mb-6">
              Primary tickets are sold out. Find verified resale tickets below — prices update in real time.
            </p>
            <TicketsSection />
          </section>

          {/* ── MATCH SCHEDULE ── */}
          <section>
            <div className="text-xs text-amber-400 uppercase tracking-widest font-bold mb-2">FIFA Schedule</div>
            <h2 className="text-2xl font-bold mb-6">⚽ Kansas City Match Schedule</h2>
            <MatchSchedule />
          </section>

          {/* ── CURATED ROUTES ── */}
          <section>
            <div className="text-xs text-amber-400 uppercase tracking-widest font-bold mb-2">Pre-Built Itineraries</div>
            <h2 className="text-2xl font-bold mb-2">Curated KC Day Trips</h2>
            <p className="text-white/50 text-sm mb-6">Shareable day-by-day plans built for World Cup visitors.</p>
            <div className="grid md:grid-cols-3 gap-4">
              {CURATED_ROUTES.map(route => (
                <div
                  key={route.id}
                  className={`rounded-2xl border p-5 cursor-pointer transition-all ${
                    activeRoute === route.id
                      ? 'border-amber-500/60 bg-amber-500/5'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                  }`}
                  onClick={() => setActiveRoute(activeRoute === route.id ? null : route.id)}
                >
                  <h3 className="font-bold text-base mb-1">{route.title}</h3>
                  <p className="text-white/50 text-sm mb-3">{route.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {route.tags.map(t => (
                      <span key={t} className="text-[10px] font-bold bg-white/10 text-white/60 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                  {activeRoute === route.id && (
                    <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                      {route.steps.map((s, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <span className="text-amber-400 font-mono text-xs flex-shrink-0 pt-0.5">{s.time}</span>
                          <span className="text-white/70">{s.act}</span>
                        </div>
                      ))}
                      <div className="pt-3 flex gap-2">
                        <Link
                          to={`/itinerary?preset=${route.id}`}
                          className="flex-1 py-2 text-center text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition"
                        >
                          Build full itinerary →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── TOP EXPERIENCES ── */}
          <section>
            <div className="text-xs text-amber-400 uppercase tracking-widest font-bold mb-2">Top Picks</div>
            <h2 className="text-2xl font-bold mb-6">The Best of Kansas City</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TOP_EXPERIENCES.map(exp => (
                <Link key={exp.title} to={exp.link} className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group">
                  <div className="text-3xl mb-3">{exp.emoji}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">{exp.tag}</div>
                  <h3 className="font-bold text-base mb-2 group-hover:text-amber-300 transition-colors">{exp.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{exp.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* ── NEIGHBORHOODS ── */}
          <section>
            <div className="text-xs text-amber-400 uppercase tracking-widest font-bold mb-2">Where to Explore</div>
            <h2 className="text-2xl font-bold mb-6">Kansas City Neighborhoods</h2>
            <div className="space-y-3">
              {NEIGHBORHOODS.map(n => (
                <div key={n.name} className="flex items-start gap-4 p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/20 transition">
                  <div className="text-2xl flex-shrink-0">{n.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{n.name}</div>
                    <p className="text-white/50 text-sm mt-0.5">{n.desc}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-white/30 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">🚶 {n.walk}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── GETTING AROUND ── */}
          <section>
            <div className="text-xs text-amber-400 uppercase tracking-widest font-bold mb-2">Transport</div>
            <h2 className="text-2xl font-bold mb-6">Getting Around Kansas City</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {GETTING_AROUND.map(t => (
                <div key={t.mode} className="flex gap-4 p-5 rounded-2xl border border-white/10 bg-white/[0.03]">
                  <div className="text-2xl flex-shrink-0">{t.icon}</div>
                  <div>
                    <div className="font-semibold mb-1">{t.mode}</div>
                    <p className="text-white/50 text-sm leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── SOCIAL SHARING ── */}
          <section>
            <div className="text-xs text-amber-400 uppercase tracking-widest font-bold mb-2">Share the Experience</div>
            <h2 className="text-2xl font-bold mb-6">Let the world know you're here</h2>
            <ShareCard />
          </section>

          {/* ── VENUE PROXIMITY CTA ── */}
          <section className="rounded-2xl bg-gradient-to-br from-[#034694]/40 to-[#0D1B3E]/80 border border-blue-500/20 p-8 text-center">
            <div className="text-4xl mb-4">🏟️</div>
            <h2 className="text-2xl font-bold mb-2">Near GEHA Field?</h2>
            <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
              Find the best food, bars, and experiences within walking distance of Arrowhead Stadium — perfect before or after the match.
            </p>
            <Link
              to="/browse/kansas-city?category=Food+%26+Drink"
              className="inline-block px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition"
            >
              Find Nearby Experiences →
            </Link>
          </section>

          {/* ── OFFLINE NOTICE ── */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex gap-4 items-start">
            <div className="text-2xl flex-shrink-0">📶</div>
            <div>
              <div className="font-semibold mb-1">Spotty stadium WiFi? We've got you.</div>
              <p className="text-white/50 text-sm leading-relaxed">
                Vtopia works on slow connections. Keep this guide open in your browser — key pages are cached so you can access them even when signal drops in the crowd.
              </p>
            </div>
          </section>

        </div>

        {/* ── FOOTER CTA ── */}
        <div className="border-t border-white/10 py-12 px-4 text-center">
          <p className="text-white/40 text-sm mb-3">Powered by Vtopia · The local travel platform for World Cup 2026</p>
          <Link to="/browse/kansas-city" className="text-amber-400 hover:text-amber-300 font-semibold text-sm transition">
            Explore all Kansas City experiences →
          </Link>
        </div>
      </div>
    </>
  )
}
