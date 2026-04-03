import { useParams, useNavigate } from 'react-router-dom'
import { useExperience } from '../hooks/useRecommendations'
import { useWishlist } from '../hooks/useWishlist'

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
  const navigate = useNavigate()
  const { data: exp, isLoading, error } = useExperience(id)
  const { isSaved, toggleSave } = useWishlist()

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
      <button onClick={() => navigate('/browse')} className="btn-primary mt-4 text-sm">Browse All</button>
    </div>
  )

  const grad = GRADIENTS[exp.image_gradient] || GRADIENTS['ci-mia']
  const catStyle = CAT_STYLES[exp.category] || 'bg-gray-100 text-gray-600'
  const saved = isSaved(exp.id)

  return (
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
                    <div className="text-xs text-gray-400">{exp.city} local · ★ {exp.guides.rating} · {exp.guides.review_count?.toLocaleString()} reviews</div>
                  </div>
                  <button onClick={() => navigate(`/guide/${exp.guides.id}`)} className="btn-outline text-xs px-3 py-1.5">View Profile</button>
                </div>
              </div>
            )}

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
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="font-display font-black text-3xl text-blue-brand">${exp.price_per_person}</span>
                <span className="text-sm text-gray-400">/ person</span>
              </div>
              {exp.rating > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-400 mb-4">
                  <span className="text-gold-brand">★</span>
                  <span className="font-semibold">{exp.rating}</span>
                  <span>· {exp.review_count?.toLocaleString()} reviews</span>
                </div>
              )}
              <div className="text-xs text-gray-400 mb-5">Free cancellation · No booking fee</div>

              <button
                onClick={() => navigate(`/book/${exp.id}`)}
                className="btn-primary w-full mb-3"
              >
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
  )
}
