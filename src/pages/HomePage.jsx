import { useNavigate } from 'react-router-dom'
import { useRecommendations } from '../hooks/useRecommendations'
import ExperienceCard from '../components/cards/ExperienceCard'

const CITIES = [
  { name:'New York City', slug:'new-york-city', emoji:'🗽', gradient:'from-[#c7d9f5] to-[#a8c4ef]', tag:'Most Popular' },
  { name:'Miami',         slug:'miami',         emoji:'🌊', gradient:'from-[#b2e8f8] to-[#7dd8f5]', tag:'Trending' },
  { name:'Orlando',       slug:'orlando',       emoji:'🎢', gradient:'from-[#fde8b4] to-[#fbd580]', tag:'Family Fave' },
  { name:'Las Vegas',     slug:'las-vegas',     emoji:'🎰', gradient:'from-[#ddd2f8] to-[#c4b0f3]', tag:'Top Rated' },
  { name:'New Orleans',   slug:'new-orleans',   emoji:'🎷', gradient:'from-[#b5e8d4] to-[#82d9b8]', tag:'Hidden Gem' },
]

const CATS = [
  { icon:'🍽️', name:'Food & Drink' }, { icon:'🌿', name:'Outdoors' },
  { icon:'🌙', name:'Nightlife' },    { icon:'🏟️', name:'Sports' },
  { icon:'🎨', name:'Arts & Culture' },{ icon:'🧘', name:'Wellness' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { data: featured = [], isLoading } = useRecommendations({ limit: 6 })

  return (
    <div style={{ background:'var(--bg)' }}>
      {/* Hero */}
      <section className="min-h-[85vh] flex items-center justify-center px-6 py-20 text-center bg-gradient-to-br from-blue-tint via-white to-[#fff8ee]">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-brand text-white px-4 py-1.5 rounded-pill text-xs font-bold mb-6">
            <span className="w-2 h-2 bg-gold-brand rounded-full animate-pulse" />
            Now live in 5 US cities
          </div>
          <h1 className="font-display font-black text-5xl md:text-6xl text-[#0D1B3E] leading-tight mb-5">
            Travel like a <span className="text-blue-brand">local.</span><br/>
            Discover like an <span className="text-gold-brand">explorer.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
            Vacaytopia matches your passions and budget to the best experiences in any city — food, events, sports, and so much more.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <input
              className="input-field max-w-xs text-center"
              placeholder="Where are you headed?"
              onFocus={() => navigate('/browse')}
            />
            <button className="btn-primary" onClick={() => navigate('/browse')}>Find Experiences</button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {CITIES.map(c => (
              <button key={c.slug} onClick={() => navigate(`/browse/${c.slug}`)}
                className="px-4 py-1.5 border border-blue-brand/20 rounded-pill text-sm font-medium text-gray-600 hover:bg-blue-brand hover:text-white hover:border-blue-brand transition-all">
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="bg-blue-brand py-5 px-6 flex justify-center gap-12 flex-wrap">
        {[['5','Pilot Cities'],['2,400+','Experiences'],['18,000+','Travelers'],['98%','Satisfaction']].map(([n,l]) => (
          <div key={l} className="text-center text-white">
            <div className="font-display font-black text-2xl text-gold-brand">{n}</div>
            <div className="text-xs text-white/75 font-medium mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <section className="py-16 px-6 bg-blue-tint">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <div className="text-xs font-bold tracking-widest uppercase text-gold-brand mb-2">Browse by Interest</div>
          <h2 className="font-display font-bold text-3xl text-[#0D1B3E]">What lights you up?</h2>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-3 md:grid-cols-6 gap-3">
          {CATS.map(c => (
            <button key={c.name} onClick={() => navigate(`/browse?category=${encodeURIComponent(c.name)}`)}
              className="bg-white rounded-card py-5 px-3 text-center hover:border-blue-brand hover:shadow-md hover:-translate-y-1 transition-all border border-blue-brand/10 group">
              <div className="text-3xl mb-2">{c.icon}</div>
              <div className="text-xs font-semibold text-gray-600 group-hover:text-blue-brand">{c.name}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Cities */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <div className="text-xs font-bold tracking-widest uppercase text-gold-brand mb-2">Pilot Cities</div>
          <h2 className="font-display font-bold text-3xl text-[#0D1B3E]">Pick your destination</h2>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CITIES.map(c => (
            <div key={c.slug} onClick={() => navigate(`/browse/${c.slug}`)}
              className="relative rounded-card overflow-hidden cursor-pointer hover:-translate-y-2 hover:shadow-xl transition-all min-h-[200px] flex items-end">
              <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} flex items-center justify-center text-6xl`}>{c.emoji}</div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b3e]/75 to-transparent" />
              <div className="relative z-10 p-4 text-white w-full">
                <div className="font-display font-bold text-lg leading-tight">{c.name}</div>
                <div className="inline-block bg-gold-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">{c.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured experiences */}
      <section className="py-16 px-6 bg-blue-tint">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs font-bold tracking-widest uppercase text-gold-brand mb-1">Trending Now</div>
              <h2 className="font-display font-bold text-3xl text-[#0D1B3E]">Top experiences this week</h2>
            </div>
            <button className="btn-outline text-sm" onClick={() => navigate('/browse')}>Browse all →</button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({length:6}).map((_,i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="h-44 bg-white/60" /><div className="p-4 space-y-2">
                    <div className="h-3 bg-white/60 rounded w-1/3"/><div className="h-4 bg-white/60 rounded w-4/5"/>
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

      {/* How it works */}
      <section className="py-16 px-6 bg-white text-center">
        <div className="max-w-3xl mx-auto mb-10">
          <div className="text-xs font-bold tracking-widest uppercase text-gold-brand mb-2">The Process</div>
          <h2 className="font-display font-bold text-3xl text-[#0D1B3E]">Effortlessly simple.</h2>
        </div>
        <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { n:'1', icon:'✨', t:'Tell us your vibe', d:'Take a 5-question quiz. Tell us your interests, budget, and travel style. Under 60 seconds.' },
            { n:'2', icon:'🧠', t:'We find your experiences', d:'Our recommendation engine curates experiences personalised to you — events, food spots, hidden gems.' },
            { n:'3', icon:'🎉', t:'Book & go', d:'Book directly, save to your wishlist, or share with your crew. Enjoy your city like a local.' },
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
    </div>
  )
}
