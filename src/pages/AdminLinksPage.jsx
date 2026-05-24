import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || ''

const STATUS_STYLES = {
  verified:   'bg-green-100 text-green-700',
  unverified: 'bg-amber-100 text-amber-700',
  broken:     'bg-red-100 text-red-700',
}

async function setLinkStatus(id, status, setExperiences) {
  await supabase.from('experiences').update({ link_status: status }).eq('id', id)
  setExperiences(prev => prev.map(e => e.id === id ? { ...e, link_status: status } : e))
}

export default function AdminLinksPage() {
  const [authed,       setAuthed]       = useState(!ADMIN_PASSWORD)
  const [password,     setPassword]     = useState('')
  const [passwordErr,  setPasswordErr]  = useState('')
  const [experiences,  setExperiences]  = useState([])
  const [loading,      setLoading]      = useState(false)
  const [filter,       setFilter]       = useState('all')

  useEffect(() => {
    if (authed) load()
  }, [authed])

  async function load() {
    setLoading(true)
    const query = supabase
      .from('experiences')
      .select('id, title, city, category, experience_type, external_url, ticket_url, delivery_url, website, link_status, is_active')
      .order('link_status', { ascending: true })
      .order('title', { ascending: true })
      .limit(500)

    const { data } = await query
    setExperiences(data || [])
    setLoading(false)
  }

  function handleLogin(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) { setAuthed(true); setPasswordErr('') }
    else setPasswordErr('Incorrect password')
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <form onSubmit={handleLogin} className="bg-white rounded-card border border-blue-brand/10 p-8 w-full max-w-sm space-y-4">
          <h1 className="font-display font-bold text-xl text-[#0D1B3E]">Admin — Link Status</h1>
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field w-full"
            autoFocus
          />
          {passwordErr && <p className="text-red-600 text-sm">{passwordErr}</p>}
          <button type="submit" className="btn-primary w-full">Enter</button>
        </form>
      </div>
    )
  }

  const displayed = filter === 'all'
    ? experiences
    : experiences.filter(e => e.link_status === filter)

  const counts = {
    verified:   experiences.filter(e => e.link_status === 'verified').length,
    unverified: experiences.filter(e => e.link_status === 'unverified').length,
    broken:     experiences.filter(e => e.link_status === 'broken').length,
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#0D1B3E]">Link Status Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Run <code className="bg-gray-100 px-1 rounded text-xs">npx tsx --env-file=.env scripts/validateLinks.ts</code> to refresh</p>
        </div>
        <button onClick={load} className="btn-outline text-sm">Refresh</button>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {(['all', 'verified', 'unverified', 'broken']).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold border transition-all ${
              filter === s ? 'bg-blue-brand text-white border-blue-brand' : 'border-blue-brand/15 text-gray-500 hover:border-blue-brand'
            }`}
          >
            {s === 'all' ? `All (${experiences.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${counts[s]})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : (
        <div className="bg-white rounded-card border border-blue-brand/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-blue-tint border-b border-blue-brand/10">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Experience</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-brand/6">
              {displayed.map(exp => {
                const url = exp.external_url || exp.ticket_url || exp.delivery_url || exp.website
                return (
                  <tr key={exp.id} className="hover:bg-blue-tint/50 transition-colors">
                    <td className="px-4 py-3">
                      <a href={`/experience/${exp.id}`} target="_blank" rel="noopener noreferrer"
                        className="font-medium text-[#0D1B3E] hover:text-blue-brand transition-colors">
                        {exp.title}
                      </a>
                      <div className="text-xs text-gray-400">{exp.city}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-500">{exp.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[exp.link_status] || STATUS_STYLES.unverified}`}>
                          {exp.link_status || 'unverified'}
                        </span>
                        {exp.link_status !== 'verified' && (
                          <button
                            onClick={() => setLinkStatus(exp.id, 'verified', setExperiences)}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-green-300 text-green-700 hover:bg-green-50 transition"
                            title="Mark as verified"
                          >✓</button>
                        )}
                        {exp.link_status !== 'broken' && (
                          <button
                            onClick={() => setLinkStatus(exp.id, 'broken', setExperiences)}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-red-300 text-red-700 hover:bg-red-50 transition"
                            title="Mark as broken"
                          >✗</button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell max-w-xs">
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-brand hover:underline truncate block max-w-xs">
                          {url}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">No URL</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {displayed.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No experiences match this filter.</div>
          )}
        </div>
      )}
    </div>
  )
}
