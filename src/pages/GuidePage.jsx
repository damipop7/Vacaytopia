import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import ExperienceCard from '../components/cards/ExperienceCard'

export default function GuidePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: guide, isLoading } = useQuery({
    queryKey: ['guide', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guides')
        .select(`*, experiences(*)`)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg)'}}><div className="text-blue-brand font-display font-bold">Loading guide...</div></div>
  if (!guide) return <div className="min-h-screen flex items-center justify-center"><button onClick={() => navigate('/browse')} className="btn-primary">Back to Browse</button></div>

  const initials = `${guide.first_name?.[0]??''}${guide.last_name?.[0]??''}`.toUpperCase()

  return (
    <div style={{background:'var(--bg)'}} className="min-h-screen">
      <div className="h-40 bg-gradient-to-r from-blue-brand via-blue-mid to-blue-light relative">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle,#fff 1.5px,transparent 1.5px)',backgroundSize:'22px 22px'}} />
        <div className="absolute bottom-3 left-6 text-white/60 text-xs font-bold tracking-widest uppercase">🌊 {guide.city}</div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-card border border-blue-brand/10 -mt-12 relative z-10 p-6 mb-6">
          <div className="flex items-end justify-between flex-wrap gap-4" style={{marginTop:'-3rem'}}>
            <div className="flex items-end gap-4 flex-wrap">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-blue-brand border-4 border-white text-white font-display font-black text-3xl flex items-center justify-center shadow-xl flex-shrink-0">{initials}</div>
                {guide.is_verified && <div className="absolute bottom-1 right-1 w-7 h-7 bg-[#10b981] rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">✓</div>}
              </div>
              <div className="pb-2">
                <h1 className="font-display font-black text-2xl text-[#0D1B3E]">{guide.first_name} {guide.last_name}</h1>
                <div className="text-xs text-gray-400">Local Experience Guide · {guide.city}</div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {guide.is_superhost && <span className="text-[10px] font-bold bg-[#fff8ee] text-[#854F0B] border border-gold-brand/30 px-2 py-0.5 rounded-full">⭐ Superhost</span>}
                  {guide.is_verified  && <span className="text-[10px] font-bold bg-[#d1fae5] text-[#065f46] border border-[#10b981]/25 px-2 py-0.5 rounded-full">✓ Verified</span>}
                  <span className="text-[10px] font-bold bg-blue-tint text-blue-brand border border-blue-brand/20 px-2 py-0.5 rounded-full">🌊 {guide.city} Native</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pb-2">
              <button className="btn-primary text-sm px-4 py-2">Book an Experience</button>
              <button className="btn-outline text-sm px-4 py-2">✉ Message</button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-0 mt-5 pt-5 border-t border-blue-brand/8">
            {[['Experiences', guide.experiences?.length || 0],['Reviews', guide.review_count || 0],['Rating', `${guide.rating}★`],['Response', `${guide.response_rate}%`]].map(([l,v]) => (
              <div key={l} className="text-center border-r border-blue-brand/8 last:border-0">
                <div className="font-display font-black text-xl text-blue-brand">{v}</div>
                <div className="text-[11px] text-gray-400 font-medium">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_280px] gap-5">
          <div>
            {guide.bio && (
              <div className="bg-white rounded-card border border-blue-brand/10 p-6 mb-5">
                <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-3">About {guide.first_name}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{guide.bio}</p>
                {guide.languages?.length > 0 && (
                  <div className="mt-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Languages</div>
                    <div className="flex gap-2 flex-wrap">{guide.languages.map(l => <span key={l} className="text-xs bg-gray-50 border border-gray-100 px-3 py-1 rounded-full text-gray-500">{l}</span>)}</div>
                  </div>
                )}
              </div>
            )}

            {guide.experiences?.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-4">Experiences by {guide.first_name}</h2>
                <div className="grid grid-cols-2 gap-4">
                  {guide.experiences.map(exp => <ExperienceCard key={exp.id} experience={exp} />)}
                </div>
              </div>
            )}
          </div>

          <div className="sticky top-20">
            <div className="bg-white rounded-card border border-blue-brand/10 p-5">
              <h3 className="font-display font-bold text-base text-[#0D1B3E] mb-4">Contact {guide.first_name}</h3>
              <div className="flex flex-col gap-2 mb-4 text-xs">
                {[['Response rate', `${guide.response_rate}%`],['Typical reply', 'Within 1 hour'],['Languages', guide.languages?.join(', ')]].map(([l,v]) => v && (
                  <div key={l} className="flex justify-between py-1.5 border-b border-blue-brand/6 last:border-0">
                    <span className="text-gray-400">{l}</span>
                    <span className="font-semibold text-[#0D1B3E]">{v}</span>
                  </div>
                ))}
              </div>
              <textarea className="input-field text-sm resize-none mb-3" rows={3} placeholder={`Hi ${guide.first_name}, I'd love to book...`} />
              <button className="w-full py-2.5 bg-blue-brand text-white font-semibold text-sm rounded-pill hover:bg-blue-mid transition-colors">Send Message →</button>
              <div className="mt-3 p-2.5 bg-blue-tint rounded-[9px] text-xs text-blue-brand">🔒 Messages go through vtopia's secure platform.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
