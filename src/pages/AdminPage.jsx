import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

// ── Tabs ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',     label: 'Overview',     icon: '📊' },
  { id: 'experiences',  label: 'Experiences',  icon: '🗺️' },
  { id: 'bookings',     label: 'Bookings',     icon: '📅' },
  { id: 'users',        label: 'Users',        icon: '👥' },
  { id: 'submissions',  label: 'Submissions',  icon: '📬' },
  { id: 'guide-apps',   label: 'Guides',       icon: '🧭' },
  { id: 'claims',       label: 'Claims',       icon: '🏷️' },
]

const SUBMISSION_STATUS_STYLES = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50   text-red-600   border-red-200',
}

const CITIES = ['All Cities', 'New York City', 'Miami', 'Orlando', 'Las Vegas', 'New Orleans']
const CATEGORIES = ['All', 'Food & Drink', 'Outdoors', 'Nightlife', 'Sports', 'Arts & Culture', 'Wellness']
const BOOKING_STATUSES = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'refunded']

const STATUS_STYLE = {
  pending:   'bg-amber-50  text-amber-700  border-amber-200',
  confirmed: 'bg-green-50  text-green-700  border-green-200',
  completed: 'bg-blue-50   text-blue-700   border-blue-200',
  cancelled: 'bg-red-50    text-red-600    border-red-200',
  refunded:  'bg-gray-100  text-gray-500   border-gray-200',
}

// ── Helpers ─────────────────────────────────────────────────────────
function fmt$(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0)
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function truncate(str, n = 40) {
  if (!str) return '—'
  return str.length > n ? str.slice(0, n) + '…' : str
}

// ── Stat Card ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-card border border-blue-brand/10 p-5 flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      <span className={`text-3xl font-display font-bold ${accent ?? 'text-[#0D1B3E]'}`}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

// ── Status Badge ─────────────────────────────────────────────────────
function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_STYLE[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  )
}

// ── Table Shell ──────────────────────────────────────────────────────
function Table({ cols, rows, empty = 'No records found.' }) {
  if (!rows?.length) {
    return <div className="text-center py-16 text-gray-400 text-sm">{empty}</div>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-blue-brand/8">
            {cols.map(c => (
              <th key={c.key} className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 pb-3 pr-4 whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-blue-brand/5 hover:bg-blue-tint/30 transition-colors">
              {cols.map(c => (
                <td key={c.key} className="py-3 pr-4 text-[#0D1B3E] align-middle">
                  {c.render ? c.render(row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Toggle Switch ────────────────────────────────────────────────────
function Toggle({ value, onChange, loading }) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
        value ? 'bg-blue-brand' : 'bg-gray-200'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
        value ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  )
}

// ── Experience Modal ─────────────────────────────────────────────────
function ExperienceModal({ exp, onClose, onSaved }) {
  const isNew = !exp?.id
  const [form, setForm] = useState(
    isNew
      ? { title: '', description: '', city: 'New York City', category: 'Food & Drink',
          price_per_person: '', duration_label: '', max_guests: 8,
          image_emoji: '', is_active: true, is_featured: false, is_sponsored: false }
      : { ...exp }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        city: form.city,
        category: form.category,
        price_per_person: parseFloat(form.price_per_person) || 0,
        duration_label: form.duration_label,
        max_guests: parseInt(form.max_guests) || 8,
        image_emoji: form.image_emoji,
        is_active: form.is_active,
        is_featured: form.is_featured,
        is_sponsored: form.is_sponsored,
        updated_at: new Date().toISOString(),
      }
      if (isNew) {
        const { error: err } = await supabase.from('experiences').insert(payload)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('experiences').update(payload).eq('id', exp.id)
        if (err) throw err
      }
      onSaved()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(3,70,148,0.18)' }}>
      <div className="bg-white rounded-card shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold text-[#0D1B3E]">
            {isNew ? 'New Experience' : 'Edit Experience'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[9px] text-sm text-red-600">{error}</div>
        )}

        <div className="flex flex-col gap-4">
          <Field label="Title">
            <input className="input-field" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Jazz Bar Crawl" />
          </Field>

          <Field label="Description">
            <textarea className="input-field resize-none" rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Short description…" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <select className="input-field" value={form.city} onChange={e => set('city', e.target.value)}>
                {CITIES.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Price / person ($)">
              <input className="input-field" type="number" min="0" value={form.price_per_person} onChange={e => set('price_per_person', e.target.value)} placeholder="75" />
            </Field>
            <Field label="Duration">
              <input className="input-field" value={form.duration_label || ''} onChange={e => set('duration_label', e.target.value)} placeholder="2 hrs" />
            </Field>
            <Field label="Max guests">
              <input className="input-field" type="number" min="1" value={form.max_guests} onChange={e => set('max_guests', e.target.value)} />
            </Field>
          </div>

          <Field label="Emoji icon">
            <input className="input-field" value={form.image_emoji || ''} onChange={e => set('image_emoji', e.target.value)} placeholder="🎷" />
          </Field>

          <div className="flex flex-col gap-3 pt-1">
            <ToggleRow label="Active (visible to users)" value={form.is_active}   onChange={() => set('is_active',   !form.is_active)} />
            <ToggleRow label="Featured on homepage"      value={form.is_featured}  onChange={() => set('is_featured',  !form.is_featured)} />
            <ToggleRow label="Sponsored listing"         value={form.is_sponsored} onChange={() => set('is_sponsored', !form.is_sponsored)} />
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-5 border-t border-blue-brand/8">
          <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button onClick={save} disabled={saving || !form.title} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
            {saving ? 'Saving…' : isNew ? 'Create Experience' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <Toggle value={value} onChange={onChange} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// ── TAB: Overview ───────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════
function OverviewTab() {
  const [stats, setStats] = useState(null)
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { count: userCount },
        { count: expCount },
        { data: bookingData },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('experiences').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('bookings')
          .select('total_amount, commission, status, created_at, contact_name, booking_reference, experiences(title)')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const all = bookingData ?? []
      const confirmed = all.filter(b => ['confirmed', 'completed'].includes(b.status))
      const revenue = confirmed.reduce((s, b) => s + Number(b.total_amount), 0)
      const commission = confirmed.reduce((s, b) => s + Number(b.commission), 0)

      setStats({ userCount, expCount, revenue, commission, bookingCount: all.length })
      setRecentBookings(all)
      setLoading(false)
    }
    load()
  }, [])

  const cols = [
    { key: 'ref',      label: 'Reference',  render: r => <span className="font-mono text-xs text-blue-brand">{r.booking_reference}</span> },
    { key: 'guest',    label: 'Guest',       render: r => r.contact_name || '—' },
    { key: 'exp',      label: 'Experience',  render: r => truncate(r.experiences?.title) },
    { key: 'amount',   label: 'Amount',      render: r => fmt$(r.total_amount) },
    { key: 'status',   label: 'Status',      render: r => <StatusBadge status={r.status} /> },
    { key: 'date',     label: 'Date',        render: r => fmtDate(r.created_at) },
  ]

  if (loading) return <LoadingSpinner />

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Revenue"   value={fmt$(stats.revenue)}    sub="confirmed bookings"    accent="text-blue-brand" />
        <StatCard label="Commission Earned" value={fmt$(stats.commission)} sub="vtopia's cut"         accent="text-gold-brand" />
        <StatCard label="Active Listings" value={stats.expCount ?? 0}    sub="experiences live"      />
        <StatCard label="Total Users"     value={stats.userCount ?? 0}   sub="registered accounts"  />
      </div>

      <div className="bg-white rounded-card border border-blue-brand/10 p-6">
        <h3 className="font-display font-bold text-[#0D1B3E] mb-4">Recent Bookings</h3>
        <Table cols={cols} rows={recentBookings} empty="No bookings yet." />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// ── TAB: Experiences ────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════
function ExperiencesTab() {
  const [rows, setRows]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [cityFilter, setCityFilter]   = useState('All Cities')
  const [catFilter, setCatFilter]     = useState('All')
  const [search, setSearch]           = useState('')
  const [modal, setModal]             = useState(null) // null | 'new' | experience object
  const [toggling, setToggling]       = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('experiences').select('*').order('created_at', { ascending: false })
    if (cityFilter !== 'All Cities') q = q.eq('city', cityFilter)
    if (catFilter  !== 'All')        q = q.eq('category', catFilter)
    const { data } = await q
    setRows(data ?? [])
    setLoading(false)
  }, [cityFilter, catFilter])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load() is a stable useCallback
  useEffect(() => { load() }, [load])

  async function toggleActive(exp) {
    setToggling(t => ({ ...t, [exp.id]: true }))
    await supabase.from('experiences').update({ is_active: !exp.is_active }).eq('id', exp.id)
    setRows(r => r.map(x => x.id === exp.id ? { ...x, is_active: !x.is_active } : x))
    setToggling(t => ({ ...t, [exp.id]: false }))
  }

  async function deleteExp(exp) {
    if (!window.confirm(`Delete "${exp.title}"? This cannot be undone.`)) return
    await supabase.from('experiences').delete().eq('id', exp.id)
    setRows(r => r.filter(x => x.id !== exp.id))
  }

  const filtered = rows.filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.city.toLowerCase().includes(search.toLowerCase())
  )

  const cols = [
    { key: 'emoji',    label: '',            render: r => <span className="text-2xl">{r.image_emoji || '🗺️'}</span> },
    { key: 'title',    label: 'Title',       render: r => (
        <div>
          <div className="font-semibold text-[#0D1B3E] text-sm">{truncate(r.title, 32)}</div>
          <div className="text-xs text-gray-400">{r.city} · {r.category}</div>
        </div>
      )
    },
    { key: 'price',    label: 'Price',       render: r => <span className="font-semibold">{fmt$(r.price_per_person)}<span className="text-gray-400 font-normal">/person</span></span> },
    { key: 'rating',   label: 'Rating',      render: r => r.rating > 0 ? <span>★ {Number(r.rating).toFixed(1)} <span className="text-gray-400 text-xs">({r.review_count})</span></span> : <span className="text-gray-300">No reviews</span> },
    { key: 'flags',    label: 'Flags',       render: r => (
        <div className="flex gap-1 flex-wrap">
          {r.is_featured  && <span className="tag-category bg-gold-tint text-gold-dark">Featured</span>}
          {r.is_sponsored && <span className="tag-category bg-blue-tint text-blue-brand">Sponsored</span>}
        </div>
      )
    },
    { key: 'active',   label: 'Active',      render: r => <Toggle value={r.is_active} onChange={() => toggleActive(r)} loading={toggling[r.id]} /> },
    { key: 'actions',  label: '',            render: r => (
        <div className="flex gap-2">
          <button onClick={() => setModal(r)} className="text-xs text-blue-brand hover:underline font-semibold">Edit</button>
          <button onClick={() => deleteExp(r)} className="text-xs text-red-400 hover:underline font-semibold">Delete</button>
        </div>
      )
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <input
            className="input-field w-44 py-2 text-sm"
            placeholder="Search experiences…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="input-field w-36 py-2 text-sm" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="input-field w-36 py-2 text-sm" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary text-sm px-4 py-2">
          + New Experience
        </button>
      </div>

      <div className="bg-white rounded-card border border-blue-brand/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">{filtered.length} experience{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {loading ? <LoadingSpinner /> : <Table cols={cols} rows={filtered} empty="No experiences match your filters." />}
      </div>

      {modal && (
        <ExperienceModal
          exp={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// ── TAB: Bookings ───────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════
function BookingsTab() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('all')
  const [search, setSearch]   = useState('')
  const [updating, setUpdating] = useState({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase
        .from('bookings')
        .select('*, experiences(title, city, category), profiles(first_name, last_name, email)')
        .order('created_at', { ascending: false })
        .limit(200)
      if (status !== 'all') q = q.eq('status', status)
      const { data } = await q
      setRows(data ?? [])
      setLoading(false)
    }
    load()
  }, [status])

  async function updateStatus(id, newStatus) {
    setUpdating(u => ({ ...u, [id]: true }))
    await supabase.from('bookings').update({ status: newStatus }).eq('id', id)
    setRows(r => r.map(x => x.id === id ? { ...x, status: newStatus } : x))
    setUpdating(u => ({ ...u, [id]: false }))
  }

  const filtered = rows.filter(r => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      r.booking_reference?.toLowerCase().includes(s) ||
      r.contact_name?.toLowerCase().includes(s) ||
      r.contact_email?.toLowerCase().includes(s) ||
      r.experiences?.title?.toLowerCase().includes(s)
    )
  })

  const cols = [
    { key: 'ref',      label: 'Reference',   render: r => <span className="font-mono text-xs text-blue-brand font-bold">{r.booking_reference}</span> },
    { key: 'guest',    label: 'Guest',        render: r => (
        <div>
          <div className="font-semibold text-sm">{r.contact_name || `${r.profiles?.first_name ?? ''} ${r.profiles?.last_name ?? ''}`.trim() || '—'}</div>
          <div className="text-xs text-gray-400">{r.contact_email || r.profiles?.email || '—'}</div>
        </div>
      )
    },
    { key: 'experience', label: 'Experience', render: r => (
        <div>
          <div className="text-sm font-medium">{truncate(r.experiences?.title, 28)}</div>
          <div className="text-xs text-gray-400">{r.experiences?.city}</div>
        </div>
      )
    },
    { key: 'booking_date', label: 'Date',    render: r => <div><div className="text-sm">{r.booking_date}</div><div className="text-xs text-gray-400">{r.booking_time}</div></div> },
    { key: 'guests',       label: 'Guests',  render: r => <span className="text-sm">{r.guest_count} guest{r.guest_count !== 1 ? 's' : ''}</span> },
    { key: 'total',        label: 'Total',   render: r => (
        <div>
          <div className="font-semibold text-sm">{fmt$(r.total_amount)}</div>
          <div className="text-xs text-gray-400">+{fmt$(r.commission)} commission</div>
        </div>
      )
    },
    { key: 'status',       label: 'Status',  render: r => <StatusBadge status={r.status} /> },
    { key: 'actions',      label: 'Action',  render: r => (
        updating[r.id]
          ? <span className="text-xs text-gray-400">Updating…</span>
          : r.status === 'pending'
            ? <button onClick={() => updateStatus(r.id, 'confirmed')} className="text-xs text-green-600 hover:underline font-semibold">Confirm</button>
            : r.status === 'confirmed'
              ? <button onClick={() => updateStatus(r.id, 'cancelled')} className="text-xs text-red-400 hover:underline font-semibold">Cancel</button>
              : null
      )
    },
  ]

  const totals = filtered.reduce((acc, b) => {
    acc.total  += Number(b.total_amount)
    acc.comm   += Number(b.commission)
    return acc
  }, { total: 0, comm: 0 })

  return (
    <div className="flex flex-col gap-4">
      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <SummaryPill label="Showing" value={filtered.length + ' bookings'} />
        <SummaryPill label="Total value" value={fmt$(totals.total)} />
        <SummaryPill label="Commission" value={fmt$(totals.comm)} accent />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="input-field w-52 py-2 text-sm"
          placeholder="Search by ref, guest, experience…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-1 flex-wrap">
          {BOOKING_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-pill text-xs font-semibold capitalize transition-colors ${
                status === s
                  ? 'bg-blue-brand text-white'
                  : 'bg-white border border-blue-brand/15 text-gray-500 hover:border-blue-brand hover:text-blue-brand'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-card border border-blue-brand/10 p-6">
        {loading ? <LoadingSpinner /> : <Table cols={cols} rows={filtered} empty="No bookings match your filters." />}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// ── TAB: Users ──────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════
function UsersTab() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [updating, setUpdating] = useState({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role, is_verified, home_city, avatar_url, created_at')
        .order('created_at', { ascending: false })
      setRows(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function updateRole(id, role) {
    setUpdating(u => ({ ...u, [id]: true }))
    await supabase.from('profiles').update({ role }).eq('id', id)
    setRows(r => r.map(x => x.id === id ? { ...x, role } : x))
    setUpdating(u => ({ ...u, [id]: false }))
  }

  const ROLE_STYLE = {
    user:    'bg-gray-100 text-gray-500',
    guide:   'bg-blue-tint text-blue-brand',
    admin:   'bg-gold-tint text-gold-dark',
    partner: 'bg-green-50 text-green-700',
  }

  const filtered = rows.filter(r => {
    const matchRole = roleFilter === 'all' || r.role === roleFilter
    const matchSearch = !search || (
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.last_name?.toLowerCase().includes(search.toLowerCase())
    )
    return matchRole && matchSearch
  })

  const cols = [
    { key: 'avatar',  label: '',       render: r => (
        <div className="w-8 h-8 rounded-full bg-blue-brand text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {`${r.first_name?.[0] ?? ''}${r.last_name?.[0] ?? ''}`.toUpperCase() || r.email?.[0]?.toUpperCase() || '?'}
        </div>
      )
    },
    { key: 'name',    label: 'Name',   render: r => (
        <div>
          <div className="font-semibold text-sm">{[r.first_name, r.last_name].filter(Boolean).join(' ') || '—'}</div>
          <div className="text-xs text-gray-400">{r.email}</div>
        </div>
      )
    },
    { key: 'role',    label: 'Role',   render: r => (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${ROLE_STYLE[r.role] ?? 'bg-gray-100 text-gray-500'}`}>
          {r.role}
        </span>
      )
    },
    { key: 'verified', label: 'Verified', render: r => r.is_verified
        ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">Verified</span>
        : <span className="text-gray-300 text-xs">—</span>
    },
    { key: 'joined',  label: 'Joined', render: r => fmtDate(r.created_at) },
    { key: 'actions', label: 'Set role', render: r => (
        updating[r.id]
          ? <span className="text-xs text-gray-400">Updating…</span>
          : (
            <select
              className="text-xs border border-blue-brand/15 rounded-[7px] px-2 py-1 bg-white text-gray-600 cursor-pointer"
              value={r.role}
              onChange={e => updateRole(r.id, e.target.value)}
            >
              <option value="user">user</option>
              <option value="guide">guide</option>
              <option value="admin">admin</option>
              <option value="partner">partner</option>
            </select>
          )
      )
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="input-field w-52 py-2 text-sm"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-1 flex-wrap">
          {['all', 'user', 'guide', 'admin', 'partner'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-pill text-xs font-semibold capitalize transition-colors ${
                roleFilter === r
                  ? 'bg-blue-brand text-white'
                  : 'bg-white border border-blue-brand/15 text-gray-500 hover:border-blue-brand hover:text-blue-brand'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-card border border-blue-brand/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {loading ? <LoadingSpinner /> : <Table cols={cols} rows={filtered} empty="No users found." />}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// ── TAB: Submissions ────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════
function SubmissionsTab({ onPendingCount }) {
  const { session } = useAuthStore()
  const [rows, setRows]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('pending')
  const [reviewing, setReviewing] = useState(null) // submission being actioned
  const [notes, setNotes]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [sendingReport, setSendingReport] = useState(null) // row.id being reported

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('operator_submissions').select('*').order('submitted_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setRows(data ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  // Surface pending count to parent for badge
  useEffect(() => {
    supabase
      .from('operator_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => onPendingCount?.(count ?? 0))
  }, [rows, onPendingCount])

  async function decide(decision) {
    if (!reviewing) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/review-submission`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            Authorization:   `Bearer ${session?.access_token}`,
            apikey:          import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ submissionId: reviewing.id, decision, adminNotes: notes }),
        }
      )
      if (!res.ok) throw new Error(await res.text())
      setRows(r => r.map(x => x.id === reviewing.id ? { ...x, status: decision, admin_notes: notes } : x))
      setReviewing(null)
      setNotes('')
      setExpanded(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function sendReport(row) {
    setSendingReport(row.id)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/operator-report`,
        {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization:  `Bearer ${session?.access_token}`,
            apikey:         import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ submissionId: row.id }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send report')
      alert(data.dryRun
        ? `Dry run (no RESEND_API_KEY): ${data.stats?.bookingCount ?? 0} bookings found.`
        : `Report sent to ${data.sentTo}`)
    } catch (e) {
      alert(`Error: ${e.message}`)
    } finally {
      setSendingReport(null)
    }
  }

  const FILTERS = ['all', 'pending', 'approved', 'rejected']

  return (
    <div className="flex flex-col gap-4">
      {/* Filter pills */}
      <div className="flex gap-1 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold capitalize transition-colors ${
              filter === f
                ? 'bg-blue-brand text-white'
                : 'bg-white border border-blue-brand/15 text-gray-500 hover:border-blue-brand hover:text-blue-brand'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-card border border-blue-brand/10 p-6">
        {loading ? <LoadingSpinner /> : rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No {filter !== 'all' ? filter : ''} submissions.</div>
        ) : (
          <div className="flex flex-col divide-y divide-blue-brand/5">
            {rows.map(row => (
              <div key={row.id} className="py-4">
                {/* Summary row */}
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#0D1B3E] text-sm">{row.business_name}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${SUBMISSION_STATUS_STYLES[row.status]}`}>
                        {row.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {row.title} · {row.category} · {row.price_per_person ? `$${row.price_per_person}/person` : 'Price TBD'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {row.operator_name} · <a href={`mailto:${row.operator_email}`} className="text-blue-brand hover:underline">{row.operator_email}</a>
                      {' · '}Submitted {fmtDate(row.submitted_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                      className="text-xs text-gray-400 hover:text-blue-brand font-semibold"
                    >
                      {expanded === row.id ? 'Hide ▲' : 'Details ▼'}
                    </button>
                    {row.status === 'pending' && (
                      <button
                        onClick={() => { setReviewing(row); setNotes('') }}
                        className="text-xs bg-blue-brand text-white px-3 py-1.5 rounded-pill font-semibold hover:bg-blue-brand/90 transition-colors"
                      >
                        Review
                      </button>
                    )}
                    {row.status === 'approved' && (
                      <button
                        onClick={() => sendReport(row)}
                        disabled={sendingReport === row.id}
                        className="text-xs bg-[#10b981] text-white px-3 py-1.5 rounded-pill font-semibold hover:bg-[#059669] disabled:opacity-50 transition-colors"
                      >
                        {sendingReport === row.id ? 'Sending…' : 'Send Report'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded detail panel */}
                {expanded === row.id && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-[10px] text-sm grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DetailField label="Description"   value={row.description} />
                    <DetailField label="Duration"      value={row.duration_label} />
                    <DetailField label="Max guests"    value={row.max_guests} />
                    <DetailField label="FAQ text"      value={row.faq_text || '—'} />
                    <DetailField label="Website"       value={row.website ? <a href={row.website} target="_blank" rel="noopener noreferrer" className="text-blue-brand hover:underline truncate block">{row.website}</a> : '—'} />
                    <DetailField label="Booking URL"   value={row.booking_url ? <a href={row.booking_url} target="_blank" rel="noopener noreferrer" className="text-blue-brand hover:underline truncate block">{row.booking_url}</a> : '—'} />
                    <DetailField label="Experience type" value={row.experience_type} />
                    {row.admin_notes && <DetailField label="Admin notes" value={row.admin_notes} />}
                    {row.reviewed_at && <DetailField label="Reviewed" value={fmtDate(row.reviewed_at)} />}
                  </div>
                )}

                {/* Inline review form */}
                {reviewing?.id === row.id && (
                  <div className="mt-3 p-4 border border-blue-brand/15 rounded-[10px] flex flex-col gap-3">
                    <p className="text-sm font-semibold text-[#0D1B3E]">Review: <span className="text-blue-brand">{row.title}</span></p>
                    <textarea
                      className="input-field resize-none text-sm"
                      rows={3}
                      placeholder="Admin notes (optional) — sent to the operator in the notification email…"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => decide('approved')}
                        disabled={submitting}
                        className="flex-1 py-2 rounded-[9px] bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {submitting ? 'Sending…' : '✓ Approve & notify'}
                      </button>
                      <button
                        onClick={() => decide('rejected')}
                        disabled={submitting}
                        className="flex-1 py-2 rounded-[9px] bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        {submitting ? 'Sending…' : '✕ Reject & notify'}
                      </button>
                      <button
                        onClick={() => { setReviewing(null); setNotes(''); setError(null) }}
                        className="px-4 py-2 rounded-[9px] border border-blue-brand/15 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DetailField({ label, value }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm text-[#0D1B3E]">{value ?? '—'}</div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// ── TAB: Guide Applications ──────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════
function GuideApplicationsTab({ onPendingCount }) {
  const [rows, setRows]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('pending')
  const [reviewing, setReviewing] = useState(null)
  const [notes, setNotes]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState(null)
  const [expanded, setExpanded]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('guide_applications').select('*').order('submitted_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setRows(data ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    supabase
      .from('guide_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => onPendingCount?.(count ?? 0))
  }, [rows, onPendingCount])

  async function decide(decision) {
    if (!reviewing) return
    setSubmitting(true)
    setError(null)
    try {
      const { error: dbErr } = await supabase
        .from('guide_applications')
        .update({
          status:       decision,
          admin_notes:  notes || null,
          reviewed_at:  new Date().toISOString(),
        })
        .eq('id', reviewing.id)
      if (dbErr) throw dbErr
      setRows(r => r.map(x => x.id === reviewing.id ? { ...x, status: decision, admin_notes: notes } : x))
      setReviewing(null)
      setNotes('')
      setExpanded(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const FILTERS = ['all', 'pending', 'approved', 'rejected']

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold capitalize transition-colors ${
              filter === f
                ? 'bg-blue-brand text-white'
                : 'bg-white border border-blue-brand/15 text-gray-500 hover:border-blue-brand hover:text-blue-brand'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-card border border-blue-brand/10 p-6">
        {loading ? <LoadingSpinner /> : rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No {filter !== 'all' ? filter : ''} guide applications.</div>
        ) : (
          <div className="flex flex-col divide-y divide-blue-brand/5">
            {rows.map(row => (
              <div key={row.id} className="py-4">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#0D1B3E] text-sm">{row.first_name} {row.last_name}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${SUBMISSION_STATUS_STYLES[row.status]}`}>
                        {row.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {row.city} · {row.languages?.join(', ') || '—'}
                    </div>
                    <div className="text-xs text-gray-400">
                      <a href={`mailto:${row.email}`} className="text-blue-brand hover:underline">{row.email}</a>
                      {' · '}Submitted {fmtDate(row.submitted_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                      className="text-xs text-gray-400 hover:text-blue-brand font-semibold"
                    >
                      {expanded === row.id ? 'Hide ▲' : 'Details ▼'}
                    </button>
                    {row.status === 'pending' && (
                      <button
                        onClick={() => { setReviewing(row); setNotes('') }}
                        className="text-xs bg-blue-brand text-white px-3 py-1.5 rounded-pill font-semibold hover:bg-blue-brand/90 transition-colors"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>

                {expanded === row.id && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-[10px] text-sm grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DetailField label="Bio"               value={row.bio} />
                    <DetailField label="Specialties"       value={row.specialties?.join(', ') || '—'} />
                    <DetailField label="Experience years"  value={row.experience_years ?? '—'} />
                    <DetailField label="Why Vtopia"        value={row.why_vtopia || '—'} />
                    <DetailField label="Instagram"         value={row.instagram ? `@${row.instagram}` : '—'} />
                    <DetailField label="Website"           value={row.website ? <a href={row.website} target="_blank" rel="noopener noreferrer" className="text-blue-brand hover:underline truncate block">{row.website}</a> : '—'} />
                    {row.admin_notes && <DetailField label="Admin notes" value={row.admin_notes} />}
                    {row.reviewed_at && <DetailField label="Reviewed"    value={fmtDate(row.reviewed_at)} />}
                  </div>
                )}

                {reviewing?.id === row.id && (
                  <div className="mt-3 p-4 border border-blue-brand/15 rounded-[10px] flex flex-col gap-3">
                    <p className="text-sm font-semibold text-[#0D1B3E]">
                      Review: <span className="text-blue-brand">{row.first_name} {row.last_name}</span>
                    </p>
                    <textarea
                      className="input-field resize-none text-sm"
                      rows={3}
                      placeholder="Admin notes (optional) — visible internally only…"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => decide('approved')}
                        disabled={submitting}
                        className="flex-1 py-2 rounded-[9px] bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {submitting ? 'Saving…' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => decide('rejected')}
                        disabled={submitting}
                        className="flex-1 py-2 rounded-[9px] bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        {submitting ? 'Saving…' : '✕ Reject'}
                      </button>
                      <button
                        onClick={() => { setReviewing(null); setNotes(''); setError(null) }}
                        className="px-4 py-2 rounded-[9px] border border-blue-brand/15 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// ── TAB: Claims ─────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════
function ClaimsTab({ onPendingCount }) {
  const [rows, setRows]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('pending')
  const [reviewing, setReviewing] = useState(null)
  const [notes, setNotes]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState(null)
  const [expanded, setExpanded]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('experience_claims')
      .select('*, experiences(title, city, image_emoji)')
      .order('submitted_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setRows(data ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    supabase
      .from('experience_claims')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => onPendingCount?.(count ?? 0))
  }, [rows, onPendingCount])

  async function decide(decision) {
    if (!reviewing) return
    setSubmitting(true)
    setError(null)
    try {
      const { error: dbErr } = await supabase
        .from('experience_claims')
        .update({
          status:      decision,
          admin_notes: notes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reviewing.id)
      if (dbErr) throw dbErr

      // On approval: mark the experience as claimed + store owner email
      if (decision === 'approved') {
        await supabase
          .from('experiences')
          .update({
            is_claimed:           true,
            verified_owner_email: reviewing.claimant_email,
          })
          .eq('id', reviewing.experience_id)
      }

      setRows(r => r.map(x => x.id === reviewing.id ? { ...x, status: decision, admin_notes: notes } : x))
      setReviewing(null)
      setNotes('')
      setExpanded(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const FILTERS = ['all', 'pending', 'approved', 'rejected']

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold capitalize transition-colors ${
              filter === f
                ? 'bg-blue-brand text-white'
                : 'bg-white border border-blue-brand/15 text-gray-500 hover:border-blue-brand hover:text-blue-brand'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-card border border-blue-brand/10 p-6">
        {loading ? <LoadingSpinner /> : rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No {filter !== 'all' ? filter : ''} claims.</div>
        ) : (
          <div className="flex flex-col divide-y divide-blue-brand/5">
            {rows.map(row => (
              <div key={row.id} className="py-4">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#0D1B3E] text-sm">
                        {row.experiences?.image_emoji} {row.experiences?.title ?? 'Unknown experience'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${SUBMISSION_STATUS_STYLES[row.status]}`}>
                        {row.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {row.claimant_name} · {row.business_role} · {row.experiences?.city}
                    </div>
                    <div className="text-xs text-gray-400">
                      <a href={`mailto:${row.claimant_email}`} className="text-blue-brand hover:underline">{row.claimant_email}</a>
                      {' · '}Submitted {fmtDate(row.submitted_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                      className="text-xs text-gray-400 hover:text-blue-brand font-semibold"
                    >
                      {expanded === row.id ? 'Hide ▲' : 'Details ▼'}
                    </button>
                    {row.status === 'pending' && (
                      <button
                        onClick={() => { setReviewing(row); setNotes('') }}
                        className="text-xs bg-blue-brand text-white px-3 py-1.5 rounded-pill font-semibold hover:bg-blue-brand/90 transition-colors"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>

                {expanded === row.id && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-[10px] text-sm grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DetailField label="Business role"  value={row.business_role} />
                    <DetailField label="Proof website"  value={row.proof_website ? <a href={row.proof_website} target="_blank" rel="noopener noreferrer" className="text-blue-brand hover:underline truncate block">{row.proof_website}</a> : '—'} />
                    <DetailField label="Proof notes"    value={row.proof_notes || '—'} />
                    {row.admin_notes && <DetailField label="Admin notes" value={row.admin_notes} />}
                    {row.reviewed_at && <DetailField label="Reviewed"    value={fmtDate(row.reviewed_at)} />}
                  </div>
                )}

                {reviewing?.id === row.id && (
                  <div className="mt-3 p-4 border border-blue-brand/15 rounded-[10px] flex flex-col gap-3">
                    <p className="text-sm font-semibold text-[#0D1B3E]">
                      Review claim: <span className="text-blue-brand">{row.experiences?.title}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Approving will mark the listing as verified and record <strong>{row.claimant_email}</strong> as owner.
                    </p>
                    <textarea
                      className="input-field resize-none text-sm"
                      rows={2}
                      placeholder="Admin notes (optional)…"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => decide('approved')}
                        disabled={submitting}
                        className="flex-1 py-2 rounded-[9px] bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {submitting ? 'Saving…' : '✓ Verify & approve'}
                      </button>
                      <button
                        onClick={() => decide('rejected')}
                        disabled={submitting}
                        className="flex-1 py-2 rounded-[9px] bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        {submitting ? 'Saving…' : '✕ Reject'}
                      </button>
                      <button
                        onClick={() => { setReviewing(null); setNotes(''); setError(null) }}
                        className="px-4 py-2 rounded-[9px] border border-blue-brand/15 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared micro-components ──────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-blue-brand/20 border-t-blue-brand rounded-full animate-spin" />
    </div>
  )
}

function SummaryPill({ label, value, accent }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-pill border text-sm ${
      accent
        ? 'bg-gold-tint border-gold-brand/20 text-gold-dark'
        : 'bg-white border-blue-brand/10 text-[#0D1B3E]'
    }`}>
      <span className="text-gray-400 text-xs">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// ── Main AdminPage ───────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════
export default function AdminPage() {
  const { profile, loading } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [pendingCount, setPendingCount]           = useState(0)
  const [pendingGuideCount, setPendingGuideCount] = useState(0)
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0)

  // Role guard — redirect non-admins
  useEffect(() => {
    if (!loading && profile && profile.role !== 'admin') {
      navigate('/', { replace: true })
    }
  }, [loading, profile, navigate])

  if (loading || !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-brand/20 border-t-blue-brand rounded-full animate-spin" />
      </div>
    )
  }

  if (profile.role !== 'admin') return null

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0D1B3E]">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Signed in as <span className="font-semibold text-blue-brand">{profile.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-gold-tint text-gold-dark text-xs font-bold border border-gold-brand/20">
            Admin
          </span>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="btn-outline text-sm px-4 py-2"
          >
            Supabase ↗
          </a>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-1 mb-6 border-b border-blue-brand/8">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-blue-brand text-blue-brand'
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
            {t.id === 'submissions' && pendingCount > 0 && (
              <span className="ml-1 bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {pendingCount}
              </span>
            )}
            {t.id === 'guide-apps' && pendingGuideCount > 0 && (
              <span className="ml-1 bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {pendingGuideCount}
              </span>
            )}
            {t.id === 'claims' && pendingClaimsCount > 0 && (
              <span className="ml-1 bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {pendingClaimsCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {tab === 'overview'    && <OverviewTab />}
      {tab === 'experiences' && <ExperiencesTab />}
      {tab === 'bookings'    && <BookingsTab />}
      {tab === 'users'       && <UsersTab />}
      {tab === 'submissions' && <SubmissionsTab onPendingCount={setPendingCount} />}
      {tab === 'guide-apps'  && <GuideApplicationsTab onPendingCount={setPendingGuideCount} />}
      {tab === 'claims'      && <ClaimsTab onPendingCount={setPendingClaimsCount} />}
    </div>
  )
}
