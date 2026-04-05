import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useLatestQuiz } from '../hooks/useQuiz'
import { labelInterests, labelStyle, labelGroups } from '../lib/travelQuiz'
import { useWishlist } from '../hooks/useWishlist'
import { useBookings } from '../hooks/useBookings'
import ExperienceCard from '../components/cards/ExperienceCard'

const TABS = ['wishlist','history','preferences','settings']
const TAB_LABELS = { wishlist:'❤ Saved', history:'📅 Trip History', preferences:'⚙ Preferences', settings:'🔒 Account' }

export default function ProfilePage({ tab: defaultTab = 'wishlist' }) {
  const location = useLocation()
  const [tab, setTab] = useState(location.state?.tab || defaultTab)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const { user, profile, updateProfile, signOut } = useAuthStore()
  const { wishlist, savedIds, isLoading: wlLoading } = useWishlist()
  const { bookings, isLoading: bkLoading } = useBookings()
  const { data: quiz, isLoading: quizLoading } = useLatestQuiz()
  const navigate = useNavigate()

  useEffect(() => {
    if (location.state?.tab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deep-link tab from nav (My trips)
      setTab(location.state.tab)
    }
  }, [location.state])

  const initials = profile ? `${profile.first_name?.[0]??''}${profile.last_name?.[0]??''}`.toUpperCase() : '?'

  const handleSave = async () => {
    try { await updateProfile(form); setEditing(false) }
    catch (e) { alert(e.message) }
  }

  const STATUS_STYLE = {
    confirmed:'bg-[#d1fae5] text-[#065f46]', completed:'bg-blue-tint text-blue-brand',
    pending:'bg-[#fde8b4] text-[#854F0B]', cancelled:'bg-red-50 text-red-600'
  }

  return (
    <div style={{ background:'var(--bg)' }} className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Profile Header */}
        <div className="bg-white rounded-card border border-blue-brand/10 mb-6" style={{overflow:'visible'}}>
          <div className="h-32 bg-gradient-to-r from-blue-brand via-blue-mid to-blue-light relative rounded-t-card overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle,#fff 1.5px,transparent 1.5px)',backgroundSize:'22px 22px'}} />
          </div>
          <div className="px-6 pb-5">
            <div className="flex items-start justify-between flex-wrap gap-3" style={{marginTop:'-2.75rem'}}>
              <div className="flex items-end gap-4 flex-wrap">
                <div className="w-20 h-20 rounded-full bg-blue-brand border-4 border-white text-white font-display font-black text-2xl flex items-center justify-center shadow-lg flex-shrink-0 relative z-10">
                  {initials}
                </div>
                <div className="pt-10">
                  <div className="font-display font-black text-xl text-[#0D1B3E]">{profile?.first_name} {profile?.last_name}</div>
                  <div className="text-xs text-gray-400">{user?.email}</div>
                </div>
              </div>
              <div className="flex gap-2 pt-10">
                <button onClick={() => setEditing(!editing)} className="btn-outline text-xs px-4 py-2">✎ Edit Profile</button>
                <button onClick={async () => { await signOut(); navigate('/') }} className="text-xs font-semibold text-red-400 hover:text-red-600 px-3 py-2 transition-colors">Sign Out</button>
              </div>
            </div>

            {editing && (
              <div className="mt-4 p-4 bg-blue-tint rounded-[9px] border border-blue-brand/15">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">First name</label>
                    <input className="input-field text-sm" defaultValue={profile?.first_name} onChange={e => setForm(f=>({...f,first_name:e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">Last name</label>
                    <input className="input-field text-sm" defaultValue={profile?.last_name} onChange={e => setForm(f=>({...f,last_name:e.target.value}))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} className="btn-primary text-sm px-4 py-2">Save Changes</button>
                  <button onClick={() => setEditing(false)} className="btn-outline text-sm px-4 py-2">Cancel</button>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-0 mt-4 pt-4 border-t border-blue-brand/8">
              {[['Saved', savedIds.length],['Booked', bookings.filter(b=>b.status==='confirmed'||b.status==='completed').length],['Cities', new Set(bookings.map(b=>b.experiences?.city)).size],['Reviews', 0]].map(([l,v]) => (
                <div key={l} className="text-center border-r border-blue-brand/8 last:border-0 py-2">
                  <div className="font-display font-black text-xl text-blue-brand">{v}</div>
                  <div className="text-[11px] text-gray-400 font-medium">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 bg-white rounded-card border border-blue-brand/10 p-1 mb-5">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-[9px] text-xs font-semibold transition-all ${tab===t ? 'bg-blue-brand text-white' : 'text-gray-400 hover:text-blue-brand'}`}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* WISHLIST */}
        {tab === 'wishlist' && (
          <div className="bg-white rounded-card border border-blue-brand/10 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg text-[#0D1B3E]">My Saved Experiences</h2>
              <button onClick={() => navigate('/browse')} className="text-sm font-semibold text-blue-brand hover:underline">Browse more →</button>
            </div>
            {wlLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1,2,3].map(i => <div key={i} className="h-48 bg-blue-tint rounded-card animate-pulse" />)}
              </div>
            ) : wishlist.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {wishlist.map(exp => exp && <ExperienceCard key={exp.id} experience={exp} />)}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">♡</div>
                <div className="font-display font-bold text-lg text-[#0D1B3E] mb-2">Nothing saved yet</div>
                <p className="text-gray-400 text-sm mb-5">Browse experiences and tap the heart to save them here.</p>
                <button onClick={() => navigate('/browse')} className="btn-primary text-sm">Browse Experiences</button>
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <div className="bg-white rounded-card border border-blue-brand/10 p-6">
            <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-5">Trip History</h2>
            {bkLoading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-blue-tint rounded-card animate-pulse"/>)}</div>
            ) : bookings.length > 0 ? (
              <div className="flex flex-col gap-3">
                {bookings.map(b => (
                  <div key={b.id} className="p-4 bg-gray-50 rounded-[9px] border border-blue-brand/8 hover:border-blue-brand/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{b.experiences?.image_emoji || '🌍'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-[#0D1B3E] truncate">{b.experiences?.title}</div>
                        <div className="text-xs text-gray-400">{b.experiences?.city} · {new Date(b.booking_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-sm text-blue-brand">${b.total_amount?.toFixed(2)}</div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[b.status] || 'bg-gray-100 text-gray-500'}`}>{b.status}</span>
                      </div>
                    </div>
                    <div className="mt-2 pl-11 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-gray-400">
                      <span className="font-semibold text-[#10b981]">● Paid</span>
                      <span aria-hidden>—</span>
                      <span className={b.status !== 'pending' ? 'font-semibold text-[#10b981]' : ''}>● Confirmed</span>
                      <span aria-hidden>—</span>
                      <span className={b.status === 'completed' ? 'font-semibold text-[#10b981]' : ''}>● Completed</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📅</div>
                <div className="font-display font-bold text-lg text-[#0D1B3E] mb-2">No trips yet</div>
                <p className="text-gray-400 text-sm mb-5">Book your first experience and it'll show up here.</p>
                <button onClick={() => navigate('/browse')} className="btn-primary text-sm">Explore Experiences</button>
              </div>
            )}
          </div>
        )}

        {/* PREFERENCES */}
        {tab === 'preferences' && (
          <div className="bg-white rounded-card border border-blue-brand/10 p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <h2 className="font-display font-bold text-lg text-[#0D1B3E]">Travel Preferences</h2>
              <button type="button" onClick={() => navigate('/interests')} className="text-sm font-semibold text-blue-brand hover:underline">
                ✎ Update interests
              </button>
            </div>
            {quizLoading ? (
              <div className="h-24 bg-blue-tint rounded-[9px] animate-pulse" />
            ) : quiz ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-tint rounded-[9px] border border-blue-brand/10">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Interests</div>
                  <div className="text-xs text-gray-600">{labelInterests(quiz.interests)}</div>
                </div>
                <div className="p-4 bg-blue-tint rounded-[9px] border border-blue-brand/10">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Budget</div>
                  <div className="text-xs text-gray-600">Up to ${quiz.budget}/experience</div>
                </div>
                <div className="p-4 bg-blue-tint rounded-[9px] border border-blue-brand/10">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Destination focus</div>
                  <div className="text-xs text-gray-600">{quiz.destination_city || 'Flexible'}</div>
                </div>
                <div className="p-4 bg-blue-tint rounded-[9px] border border-blue-brand/10">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Travel style</div>
                  <div className="text-xs text-gray-600">{labelStyle(quiz.travel_style)}</div>
                </div>
                <div className="p-4 bg-blue-tint rounded-[9px] border border-blue-brand/10 col-span-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Who you travel with</div>
                  <div className="text-xs text-gray-600">{labelGroups(quiz.group_type)}</div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-tint rounded-[9px] border border-blue-brand/15">
                <div className="text-xs text-gray-500 mb-3">No saved interests yet — your browse feed uses ratings only until you complete the questionnaire.</div>
                <button type="button" onClick={() => navigate('/interests')} className="btn-primary text-xs px-4 py-2">
                  Personalise my feed →
                </button>
              </div>
            )}
            <div className="mt-4 p-4 bg-blue-tint rounded-[9px] border border-blue-brand/15">
              <div className="text-xs font-bold text-blue-brand mb-1">RECOMMENDATION ENGINE</div>
              <div className="text-xs text-gray-500">
                Matches category, budget, city, travel style, ratings, and your saved list — same signals as Airbnb-style taste + Expedia-style trip context.
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {tab === 'settings' && (
          <div className="space-y-4">
            {[
              {title:'Notifications', rows:[
                {name:'Experience recommendations', desc:'Weekly personalised picks'},
                {name:'Booking confirmations', desc:'Email alerts when bookings confirm'},
                {name:'Price drop alerts', desc:'Notify when saved experiences drop in price'},
              ]},
              {title:'Privacy & Data', rows:[
                {name:'Personalised recommendations', desc:'Use browsing behaviour to improve suggestions'},
                {name:'Activity tracking', desc:'Track saves and clicks to tune your feed'},
              ]},
            ].map(section => (
              <div key={section.title} className="bg-white rounded-card border border-blue-brand/10 p-6">
                <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-4">{section.title}</h2>
                <div className="flex flex-col divide-y divide-blue-brand/8">
                  {section.rows.map(row => (
                    <div key={row.name} className="flex items-center justify-between py-3.5 gap-4">
                      <div>
                        <div className="font-semibold text-sm text-[#0D1B3E]">{row.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{row.desc}</div>
                      </div>
                      <label className="relative inline-block w-10 h-5 flex-shrink-0 cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-10 h-5 bg-blue-brand/15 rounded-full peer peer-checked:bg-blue-brand transition-colors" />
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="bg-white rounded-card border border-blue-brand/10 p-6">
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-4">Account</h2>
              <div className="divide-y divide-blue-brand/8">
                <div className="flex items-center justify-between py-3.5">
                  <div><div className="font-semibold text-sm text-[#0D1B3E]">Email</div><div className="text-xs text-gray-400">{user?.email}</div></div>
                  <button className="btn-outline text-xs px-3 py-1.5">Change</button>
                </div>
                <div className="flex items-center justify-between py-3.5">
                  <div><div className="font-semibold text-sm text-[#0D1B3E]">Password</div><div className="text-xs text-gray-400">Last changed recently</div></div>
                  <button className="btn-outline text-xs px-3 py-1.5">Reset</button>
                </div>
                <div className="flex items-center justify-between py-3.5">
                  <div><div className="font-semibold text-sm text-[#0D1B3E]">Subscription</div><div className="text-xs text-gray-400">Free plan</div></div>
                  <button className="btn-primary text-xs px-3 py-1.5">Upgrade ★</button>
                </div>
              </div>
              <div className="mt-4 p-4 bg-red-50 rounded-[9px] border border-red-200">
                <div className="text-xs font-bold text-red-700 mb-2">⚠ Danger Zone</div>
                <button className="text-xs font-semibold text-red-500 border border-red-200 rounded-pill px-3 py-1.5 hover:bg-red-100 transition-colors">Download my data</button>
              </div>
            </div>

            <div className="p-4 bg-blue-tint rounded-card border border-blue-brand/10 text-center">
              <div className="text-xs font-bold text-blue-brand mb-1">🔒 DATA PROMISE</div>
              <div className="text-xs text-gray-500">Your data is yours. We never sell it. All data is encrypted. Full GDPR compliance.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
