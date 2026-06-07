import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const CONTENT = {
  en: {
    hero_eyebrow: '🇦🇷 Argentina in Kansas City · June 16',
    hero_h1: 'Kansas City for Argentina Fans',
    hero_sub: 'Messi and Argentina are based here. 40,000+ fans from around the world are coming to KC for the June 16 match against Algeria. Here is everything you need — places to eat, celebrate, and experience the city.',
    sections: {
      match: {
        title: 'The Match',
        date: 'Tuesday, June 16 · 8:00 PM CT',
        venue: 'GEHA Field at Arrowhead Stadium',
        opponent: 'Argentina vs Algeria — Group J',
        note: 'Kickoff is at 8 PM local time. Arrive at the stadium district by 5 PM for the full atmosphere. The FIFA Fan Festival at the WWI Memorial and Museum starts at noon.',
      },
      food: {
        title: '🥩 Where to Eat in Kansas City',
        intro: 'Kansas City is one of the best food cities in the United States. Beyond BBQ, there are Argentine and Latin options worth knowing.',
        items: [
          { name: 'Café Corazón', desc: 'Argentine empanadas and alfajores. A genuine taste of home — River Market neighborhood.', type: 'Argentine' },
          { name: "Joe's Kansas City Bar-B-Que", desc: 'Order the Z-Man. It is what Kansas City tastes like. Gas station location, 45-min wait on match days.', type: 'KC BBQ' },
          { name: 'Q39', desc: 'Full sit-down BBQ. The brisket and burnt ends plate is the move. Book ahead.', type: 'KC BBQ' },
          { name: 'Muni', desc: 'Mexican-Thai fusion, River Market. Great pre-match option. Open late.', type: 'International' },
          { name: 'Le Fou Frog', desc: 'French bistro, River Market. Best candlelit dinner in the city if you want to slow down before the match.', type: 'Fine dining' },
        ],
      },
      celebrate: {
        title: '🎉 Where to Celebrate (Pre and Post-Match)',
        items: [
          { name: 'Power & Light District', desc: 'The official fan zone. KC Live! hosts "Soccer in the City" free watch parties. This is where Argentina fans will be loudest.' },
          { name: 'Crossroads Arts District', desc: 'Rooftop bars and a calmer energy. Ideal for dinner before heading to the stadium.' },
          { name: 'Westport', desc: 'The neighborhood locals go to post-match. Real dive bars, live music, no tourist premium. 20 min from stadium.' },
          { name: 'FIFA Fan Festival', desc: 'Free entry at the National WWI Museum and Memorial. Live match broadcast, performers, food vendors. 18-day celebration.' },
        ],
      },
      transport: {
        title: '🚗 Getting Around',
        items: [
          'Free ConnectKC26 shuttle: Airport (KCI) → Downtown Bus Mall, 2 blocks from FIFA Fan Festival',
          'KC Streetcar: Free along Main Street corridor — River Market to Crown Center',
          'Uber/Lyft: Order 45 min before kickoff. Walk 5 blocks from stadium post-match before requesting',
          'Stadium parking: Fills 3 hours before kickoff. Reserve ahead at parkwhiz.com',
        ],
      },
    },
  },
  es: {
    hero_eyebrow: '🇦🇷 Argentina en Kansas City · 16 de junio',
    hero_h1: 'Guía de Kansas City para Hinchas de Argentina',
    hero_sub: 'Messi y la Selección Argentina están basados aquí. Más de 40.000 hinchas de todo el mundo vienen a Kansas City para el partido del 16 de junio contra Argelia. Todo lo que necesitás saber.',
    sections: {
      match: {
        title: 'El Partido',
        date: 'Martes 16 de junio · 8:00 PM CT',
        venue: 'GEHA Field at Arrowhead Stadium',
        opponent: 'Argentina vs Argelia — Grupo J',
        note: 'El partido arranca a las 8 PM hora local. Llegá al estadio antes de las 5 PM para vivir toda la previa. El FIFA Fan Festival en el Museo de la Primera Guerra Mundial empieza al mediodía.',
      },
      food: {
        title: '🥩 Dónde Comer en Kansas City',
        intro: 'Kansas City es una de las mejores ciudades gastronómicas de los Estados Unidos. Más allá del BBQ, hay opciones argentinas y latinas que vale la pena conocer.',
        items: [
          { name: 'Café Corazón', desc: 'Empanadas y alfajores argentinos. Un pedacito de casa en el barrio River Market.', type: 'Argentino' },
          { name: "Joe's Kansas City Bar-B-Que", desc: 'Pedí el Z-Man. Así sabe Kansas City. Está en una estación de servicio — espera de 45 min en días de partido.', type: 'BBQ de KC' },
          { name: 'Q39', desc: 'BBQ con servicio de mesa. El plato de brisket y burnt ends es lo que hay que pedir. Reservar con anticipación.', type: 'BBQ de KC' },
          { name: 'Muni', desc: 'Fusión mexicana-thai en River Market. Excelente opción pre-partido. Cierra tarde.', type: 'Internacional' },
          { name: 'Le Fou Frog', desc: 'Bistró francés, River Market. La mejor cena tranquila antes del partido.', type: 'Restaurante fino' },
        ],
      },
      celebrate: {
        title: '🎉 Dónde Festejar (Antes y Después del Partido)',
        items: [
          { name: 'Power & Light District', desc: 'La zona oficial de fanáticos. KC Live! transmite todos los partidos gratis con pantallas gigantes. Acá van a estar los argentinos.' },
          { name: 'Crossroads Arts District', desc: 'Bares en azotea y ambiente más tranquilo. Ideal para cenar antes de ir al estadio.' },
          { name: 'Westport', desc: 'El barrio de los locales después del partido. Bares de barrio, música en vivo, sin precios turísticos.' },
          { name: 'FIFA Fan Festival', desc: 'Entrada gratuita en el Museo Nacional de la Primera Guerra Mundial. Pantallas gigantes, artistas en vivo, puestos de comida.' },
        ],
      },
      transport: {
        title: '🚗 Cómo Moverse',
        items: [
          'Shuttle gratuito ConnectKC26: Aeropuerto (KCI) → Centro de Kansas City, a 2 cuadras del FIFA Fan Festival',
          'Tranvía de KC: Gratis por el corredor de Main Street — River Market hasta Crown Center',
          'Uber/Lyft: Pedí 45 minutos antes del partido. Caminá 5 cuadras del estadio antes de pedir el auto',
          'Estacionamiento: Se llena 3 horas antes. Reservar en parkwhiz.com',
        ],
      },
    },
  },
}

export default function WCArgentinaPage() {
  const [lang, setLang] = useState('en')
  const c = CONTENT[lang]

  return (
    <>
      <Helmet>
        <title>Argentina Fans Guide to Kansas City — World Cup 2026 | Vtopia</title>
        <meta name="description" content="Everything Argentina fans need for Kansas City — where to eat (including Argentine food), celebrate, and explore KC before and after the June 16 match against Algeria. En inglés y español." />
        <meta property="og:title" content="Kansas City for Argentina Fans — World Cup 2026 | Vtopia" />
        <meta property="og:description" content="Argentina plays Algeria in Kansas City on June 16. Here's your complete guide — food, fan zones, transport, and a free KC itinerary builder." />
        <link rel="canonical" href="https://www.vtopia.world/world-cup/argentina" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: 'Argentina vs Algeria — FIFA World Cup 2026',
          description: 'Argentina faces Algeria at GEHA Field at Arrowhead Stadium in Kansas City on June 16, 2026.',
          startDate: '2026-06-16T20:00:00-05:00',
          location: { '@type': 'Place', name: 'GEHA Field at Arrowhead Stadium', address: { '@type': 'PostalAddress', addressLocality: 'Kansas City', addressRegion: 'MO', addressCountry: 'US' } },
          organizer: { '@type': 'Organization', name: 'FIFA' },
          performer: [
            { '@type': 'SportsTeam', name: 'Argentina' },
            { '@type': 'SportsTeam', name: 'Algeria' },
          ],
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-[#070E1F] text-white">

        {/* Hero */}
        <div className="bg-gradient-to-br from-[#00338A] via-[#034694] to-[#00338A] px-6 py-16 md:py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="relative max-w-3xl mx-auto">
            <Link to="/world-cup" className="text-amber-400/70 text-xs hover:text-amber-400 mb-4 inline-block">← Back to KC World Cup Hub</Link>

            {/* Language toggle */}
            <div className="flex justify-center gap-2 mb-5">
              {[{ code: 'en', flag: '🇺🇸', label: 'English' }, { code: 'es', flag: '🇦🇷', label: 'Español' }].map(l => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${lang === l.code ? 'bg-amber-500 text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                >
                  {l.flag} {l.label}
                </button>
              ))}
            </div>

            <div className="text-amber-400 text-sm font-bold mb-3">{c.hero_eyebrow}</div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">{c.hero_h1}</h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">{c.hero_sub}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/itinerary" className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition">
                ✨ {lang === 'es' ? 'Crear Mi Plan de Partido' : 'Build My Match Day Plan'}
              </Link>
              <Link to="/browse/kansas-city" className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-full transition">
                {lang === 'es' ? 'Ver Experiencias en KC →' : 'Browse KC Experiences →'}
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">

          {/* Match info */}
          <section className="bg-white/5 border border-amber-500/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">⚽ {c.sections.match.title}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3"><span className="text-amber-400 font-bold w-20 flex-shrink-0">Match</span><span className="text-white">{c.sections.match.opponent}</span></div>
              <div className="flex gap-3"><span className="text-amber-400 font-bold w-20 flex-shrink-0">When</span><span className="text-white">{c.sections.match.date}</span></div>
              <div className="flex gap-3"><span className="text-amber-400 font-bold w-20 flex-shrink-0">Venue</span><span className="text-white">{c.sections.match.venue}</span></div>
            </div>
            <p className="text-white/50 text-xs mt-4 leading-relaxed">{c.sections.match.note}</p>
          </section>

          {/* Food */}
          <section>
            <h2 className="text-xl font-bold mb-2">{c.sections.food.title}</h2>
            <p className="text-white/50 text-sm mb-5">{c.sections.food.intro}</p>
            <div className="space-y-3">
              {c.sections.food.items.map(item => (
                <div key={item.name} className="flex gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex-1">
                    <div className="font-bold text-sm">{item.name}</div>
                    <div className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider mt-0.5">{item.type}</div>
                    <div className="text-white/50 text-xs mt-1.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Celebrate */}
          <section>
            <h2 className="text-xl font-bold mb-5">{c.sections.celebrate.title}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {c.sections.celebrate.items.map(item => (
                <div key={item.name} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="font-bold text-sm mb-1">{item.name}</div>
                  <div className="text-white/50 text-xs leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Transport */}
          <section>
            <h2 className="text-xl font-bold mb-4">{c.sections.transport.title}</h2>
            <div className="space-y-2">
              {c.sections.transport.items.map((item, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="text-amber-400 font-bold flex-shrink-0">→</span>
                  <span className="text-white/60">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Itinerary CTA */}
          <section className="bg-gradient-to-r from-[#034694]/60 to-[#0D1B3E] border border-blue-500/20 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">🏆</div>
            <h2 className="text-xl font-bold mb-2">
              {lang === 'es' ? 'Armá tu día completo en Kansas City' : 'Build Your Complete KC Match Day'}
            </h2>
            <p className="text-white/50 text-sm mb-5 max-w-md mx-auto">
              {lang === 'es'
                ? 'Vtopia arma tu plan personalizado — desayuno, previa, zona de fans, estadio, festejo. Gratis y en segundos.'
                : 'Vtopia builds your personalized plan — from BBQ breakfast to post-match celebrations. Free, in 10 seconds.'}
            </p>
            <Link to="/itinerary" className="inline-block px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition">
              {lang === 'es' ? 'Crear Mi Plan Ahora →' : 'Build My Plan Now →'}
            </Link>
          </section>

          {/* More guides */}
          <div className="grid sm:grid-cols-2 gap-3">
            <Link to="/world-cup/kansas-city-guide" className="block p-4 bg-white/5 border border-white/10 hover:border-amber-500/30 rounded-xl transition">
              <div className="font-semibold text-sm">Complete KC Visitor Guide →</div>
              <div className="text-white/40 text-xs mt-0.5">All neighborhoods, BBQ, and transport</div>
            </Link>
            <Link to="/world-cup/match-day-plan" className="block p-4 bg-white/5 border border-white/10 hover:border-amber-500/30 rounded-xl transition">
              <div className="font-semibold text-sm">Perfect Match Day Plan →</div>
              <div className="text-white/40 text-xs mt-0.5">Hour-by-hour schedule for match day</div>
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
