import { useState, lazy, Suspense, useCallback, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, ValidationError } from '@formspree/react'
import { SINGLE_CITY_MODE, ACTIVE_CITIES } from '../lib/cityConfig'
import { useAuthStore } from '../store/authStore'
import { useRecommendations } from '../hooks/useRecommendations'
import { useLatestQuiz } from '../hooks/useQuiz'
import { useWeather } from '../hooks/useWeather'
import WeatherWidget from '../components/ui/WeatherWidget'
import ExperienceCard from '../components/cards/ExperienceCard'
import BrandMark from '../components/ui/BrandMark'
import OnboardingQuiz from '../components/ui/OnboardingQuiz'
import SignUpGateModal from '../components/ui/SignUpGateModal'
import { Utensils, Trees, Moon, Trophy, Palette, Heart as WellnessIcon } from 'lucide-react'

const VtopiaGlobe = lazy(() => import('../components/ui/VtopiaGlobe'))

// Camera altitude → hero immersion (lower altitude = zoomed in = more immersion)
const ALT_OUT = 2.14
const ALT_IN = 1.02

const CATS = [
  { Icon: Utensils,     name:'Food & Drink',  q:'Food & Drink'  },
  { Icon: Trees,        name:'Outdoors',       q:'Outdoors'      },
  { Icon: Moon,         name:'Nightlife',      q:'Nightlife'     },
  { Icon: Trophy,       name:'Sports',         q:'Sports'        },
  { Icon: Palette,      name:'Arts & Culture', q:'Arts & Culture'},
  { Icon: WellnessIcon, name:'Wellness',       q:'Wellness'      },
]

function useMatchLg() {
  const [lg, setLg] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const fn = () => setLg(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return lg
}

/** Smoothly lerps 0–1 “immersion” from globe camera altitude for layout / motion */
function useGlobeImmersion() {
  const targetRef = useRef(0)
  const valueRef = useRef(0)
  const chasingRef = useRef(false)
  const frameRef = useRef(null)
  const loopRef = useRef(null)
  const [immersion, setImmersion] = useState(0)

  useEffect(() => {
    const step = () => {
      const tgt = targetRef.current
      const cur = valueRef.current
      if (Math.abs(tgt - cur) < 0.0025) {
        if (valueRef.current !== tgt) {
          valueRef.current = tgt
          setImmersion(tgt)
        }
        chasingRef.current = false
        frameRef.current = null
        return
      }
      const next = cur + (tgt - cur) * 0.14
      valueRef.current = next
      setImmersion(next)
      frameRef.current = requestAnimationFrame(step)
    }
    loopRef.current = step
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  const kick = useCallback(() => {
    if (chasingRef.current) return
    chasingRef.current = true
    frameRef.current = requestAnimationFrame(() => loopRef.current?.())
  }, [])

  const onGlobeAltitude = useCallback(
    alt => {
      if (typeof alt !== 'number' || Number.isNaN(alt)) return
      const raw = (ALT_OUT - alt) / (ALT_OUT - ALT_IN)
      targetRef.current = Math.max(0, Math.min(1, raw))
      kick()
    },
    [kick]
  )

  return { immersion, onGlobeAltitude }
}

function EmailCapture() {
  const [state, handleSubmit] = useForm('mwvjnlgl')

  return (
    <section className="bg-gradient-to-br from-blue-brand to-[#0D1B3E] py-16 px-6 text-center">
      <div className="max-w-xl mx-auto">
        <div className="text-xs font-bold tracking-widest uppercase text-gold-brand mb-3">Stay in the loop</div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
          KC insider tips, World Cup guides & new experiences — free
        </h2>
        <p className="text-white/50 text-sm mb-8">
          Join visitors already planning their Kansas City World Cup weekend with Vtopia.
        </p>

        {state.succeeded ? (
          <div className="flex items-center justify-center gap-2 text-green-400 font-semibold text-lg">
            <span>✅</span> You&apos;re on the list!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="flex-1 flex flex-col gap-1">
              <input
                id="email"
                type="email"
                name="email"
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-pill bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-gold-brand text-sm"
              />
              <ValidationError field="email" errors={state.errors} className="text-red-400 text-xs text-left px-2" />
            </div>
            <button
              type="submit"
              disabled={state.submitting}
              className="px-6 py-3 rounded-pill bg-gold-brand text-white font-bold text-sm hover:bg-gold-brand/90 transition disabled:opacity-60 whitespace-nowrap"
            >
              {state.submitting ? 'Joining…' : 'Get insider tips →'}
            </button>
          </form>
        )}
        <p className="text-white/30 text-xs mt-4">No spam. Unsubscribe any time.</p>
      </div>
    </section>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { data: existingQuiz } = useLatestQuiz()
  const isLg = useMatchLg()
  const { immersion, onGlobeAltitude } = useGlobeImmersion()
  const [selectedCity, setSelectedCity] = useState(null)
  const { data: featured = [], isLoading } = useRecommendations({
    city: selectedCity?.id?.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) || undefined,
    limit: 6,
  })
  const { weather: kcWeather } = useWeather('kansas-city')
  const todayKC = kcWeather?.[0]
  const weatherSubtitle = todayKC
    ? todayKC.isRainy
      ? `It's rainy in KC today — perfect for indoor food, art, and culture.`
      : todayKC.isHot
      ? `It's ${todayKC.tempHigh}° and sunny in KC — great day for outdoor adventures.`
      : `It's ${todayKC.tempHigh}° in Kansas City today — a great day to explore.`
    : null

  return (
    <div style={{ background:'var(--bg)' }}>
      {/* Sign-up gate — shown to unauthenticated visitors only, once per session */}
      {!user && <SignUpGateModal />}
      {/* Persona quiz — shown to logged-in users who haven't completed the interest quiz */}
      {user && !existingQuiz && <OnboardingQuiz />}

      {/* ── HERO — Globe Section (globe zoom “immerses” layout — headline eases away) ── */}
      <section
        className={`relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0D1B3E] via-[#034694] to-[#0D1B3E] flex flex-col lg:flex-row items-center transition-[justify-content] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          immersion > 0.22 ? 'lg:justify-center' : ''
        }`}
      >

        {/* Left — headline */}
        <div
          className="relative z-10 flex-1 px-8 lg:px-16 py-20 lg:py-0 text-white max-w-xl min-w-0 will-change-transform"
          style={{
            flex: `${Math.max(0.02, 1 - immersion * 1.08)} 1 22rem`,
            transform: isLg
              ? `translate3d(${-immersion * 115}%, 0, 0) scale(${1 - immersion * 0.055})`
              : `translate3d(0, ${-immersion * 42}vh, 0) scale(${1 - immersion * 0.04})`,
            opacity: Math.max(0, 1 - immersion * 1.08),
            filter: `blur(${immersion * 5}px)`,
            pointerEvents: immersion > 0.9 ? 'none' : 'auto',
          }}
        >

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-4 py-1.5 rounded-full text-xs font-bold mb-7 backdrop-blur">
            <span className="w-2 h-2 bg-gold-brand rounded-full animate-pulse" />
            {SINGLE_CITY_MODE
              ? `🏆 Your World Cup 2026 guide to ${ACTIVE_CITIES[0]}`
              : 'Now live in 5 US cities'}
          </div>

          {/* Headline */}
          <h1 className="font-display font-black leading-[1.05] mb-6" style={{ fontSize:'clamp(2.6rem,5vw,4rem)' }}>
            Travel like a{' '}
            <span className="text-gold-brand">local.</span>
            <br />
            Discover like an{' '}
            <span style={{
              WebkitTextStroke: '2px #F5A623',
              color: 'transparent',
            }}>
              explorer.
            </span>
          </h1>

          <p className="text-white/70 text-lg leading-relaxed mb-4 max-w-md">
            Vtopia matches your passions and budget to the best experiences in any city — food, events, outdoors, nightlife, and so much more.
          </p>
          {weatherSubtitle && (
            <div className="flex items-center gap-2 mb-6">
              <WeatherWidget citySlug="kansas-city" variant="inline" theme="dark" className="text-sm" />
              <span className="text-white/50 text-sm hidden sm:inline">· {weatherSubtitle}</span>
            </div>
          )}



          {/* CTA row */}
          <div className="flex flex-wrap gap-3 mb-10">
          <button
            onClick={() => navigate('/browse')}
            className="btn-primary text-base px-7 py-3.5"
          >
            Find Experiences
          </button>
                  
          <Link
            to="/itinerary"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-blue-400 transition"
          >
            ✨ Build My Itinerary →
          </Link>
                  
          {!user && (
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-3.5 rounded-pill border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all"
            >
              Create free account
            </button>
          )}
          {user && (
            <button
              type="button"
              onClick={() => navigate('/interests')}
              className="px-6 py-3.5 rounded-pill border-2 border-gold-brand/60 text-white font-semibold hover:bg-gold-brand/10 transition-all"
            >
              Personalise feed
            </button>
          )}
          </div>
  
          {/* Trust micro-stats */}
          <div className="flex gap-6 flex-wrap">
            {[['2,400+','Experiences'],['18K+','Travelers'],['5','Cities'],['98%','Satisfaction']].map(([n,l]) => (
              <div key={l}>
                <div className="font-display font-black text-xl text-gold-brand">{n}</div>
                <div className="text-white/50 text-xs">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — globe */}
        <div
          className={`flex-1 w-full lg:w-auto flex items-center justify-center min-h-[500px] lg:min-h-screen relative z-[6] min-w-0 ${
            immersion > 0.35 ? 'lg:z-[12]' : ''
          }`}
          style={{
            flex: `${0.55 + immersion * 0.95} 1 280px`,
          }}
        >
          <Suspense fallback={
            <div className="w-96 h-96 rounded-full bg-blue-brand/20 animate-pulse flex items-center justify-center">
              <span className="text-white/40 font-display font-bold text-lg">Loading globe...</span>
            </div>
          }>
            <VtopiaGlobe
              immersion={immersion}
              onCameraAltitudeChange={onGlobeAltitude}
              onCitySelect={city => {
                setSelectedCity(city)
                // Scroll exactly when the fly-to animation lands (1200ms)
                setTimeout(() => {
                  document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })
                }, 1200)
              }}
            />
          </Suspense>
        </div>

        {immersion > 0.42 && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center max-w-[90vw]">
            <span className="text-[11px] font-semibold text-white/55 bg-black/20 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-full">
              Scroll out on the globe to bring the headline back
            </span>
          </div>
        )}

        {/* Scroll hint */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 animate-bounce pointer-events-none transition-opacity duration-500"
          style={{ opacity: Math.max(0, 1 - immersion * 2.2) }}
        >
          <span className="text-xs font-medium">Scroll to explore</span>
          <span>↓</span>
        </div>
      </section>

      {/* ── SELECTED CITY BANNER (appears after globe click) ── */}
      {selectedCity && (
        <div className="bg-blue-brand text-white px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedCity.emoji}</span>
            <div>
              <div className="font-bold">Showing experiences in {selectedCity.name}</div>
              <div className="text-white/70 text-sm">{selectedCity.experiences}+ experiences curated just for you</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(`/browse/${selectedCity.id}`)} className="btn-primary text-sm px-5 py-2">
              Browse All →
            </button>
            <button onClick={() => setSelectedCity(null)} className="text-white/60 hover:text-white text-sm px-3">
              ✕ Clear
            </button>
          </div>
        </div>
      )}

      {/* ── CATEGORIES ── */}
      <section className="py-16 px-6 bg-blue-tint">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <div className="text-xs font-bold tracking-widest uppercase text-gold-brand mb-2">Browse by Interest</div>
          <h2 className="font-display font-bold text-3xl text-[#0D1B3E]">What lights you up?</h2>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-3 md:grid-cols-6 gap-3">
          {CATS.map(cat => {
            const CatIcon = cat.Icon
            return (
              <button
                key={cat.name}
                onClick={() => navigate(`/browse?category=${encodeURIComponent(cat.q)}`)}
                aria-label={`Browse ${cat.name}`}
                className="bg-white rounded-card py-5 px-3 text-center hover:border-blue-brand hover:shadow-md hover:-translate-y-1 transition-all border border-blue-brand/10 group"
              >
                <div className="flex justify-center mb-2 text-blue-light group-hover:text-blue-brand transition-colors">
                  <CatIcon size={28} strokeWidth={1.6} aria-hidden="true" />
                </div>
                <div className="text-xs font-semibold text-gray-600 group-hover:text-blue-brand">{cat.name}</div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── FEATURED EXPERIENCES ── */}
      <section id="featured" className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <div className="text-xs font-bold tracking-widest uppercase text-gold-brand mb-1">
                {selectedCity ? `Top picks in ${selectedCity.name}` : 'Trending Now'}
              </div>
              <h2 className="font-display font-bold text-3xl text-[#0D1B3E]">
                {selectedCity ? `Experiences in ${selectedCity.name}` : 'Top experiences this week'}
              </h2>
            </div>
            <button className="btn-outline text-sm" onClick={() => navigate(selectedCity ? `/browse/${selectedCity.id}` : '/browse')}>
              Browse all →
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({length:6}).map((_,i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="h-44 bg-blue-tint" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-blue-tint rounded w-1/3" />
                    <div className="h-4 bg-blue-tint rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {featured.map(exp => <ExperienceCard key={exp.id} experience={exp} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 px-6 bg-blue-tint text-center">
        <div className="max-w-3xl mx-auto mb-10">
          <div className="text-xs font-bold tracking-widest uppercase text-gold-brand mb-2">The Process</div>
          <h2 className="font-display font-bold text-3xl text-[#0D1B3E]">Effortlessly simple.</h2>
        </div>
        <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { n:'1', icon:'✨', t:'Tell us your vibe', d:'Take a 5-question quiz. Interests, budget, travel style. Under 60 seconds.' },
            { n:'2', icon:'🧠', t:'We match your world', d:'The globe shows your cities. Our engine ranks every experience by how well it fits you.' },
            { n:'3', icon:'🎉', t:'Book & explore', d:'Book directly, save to your wishlist, share with your crew. Enjoy your city like a local.' },
          ].map(s => (
            <div key={s.n} className="card p-8 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-blue-brand text-white font-display font-black text-xl flex items-center justify-center mx-auto mb-4">{s.n}</div>
              <div className="text-3xl mb-3">{s.icon}</div>
              <h3 className="font-display font-bold text-lg text-[#0D1B3E] mb-2">{s.t}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── EMAIL CAPTURE ── */}
      <EmailCapture />

      {/* ── TRUST FOOTER STRIP ── */}
      <section className="bg-[#0D1B3E] py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-baseline gap-2 flex-wrap mb-1">
              <BrandMark variant="light" className="text-2xl" />
              <span className="text-white/30 text-base font-normal">· www.vtopia.world</span>
            </div>
            <div className="text-white/50 text-sm">Your data is yours. We never sell it. Ever.</div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {['SSL Secured','GDPR Safe','Verified Reviews','Stripe Payments'].map(t => (
              <span key={t} className="text-xs font-semibold text-white/50 bg-white/6 border border-white/10 px-3 py-1.5 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
