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
]

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
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
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
    { key: 'verified', label: 'Verified', render: r => r.is_verified ? <span className="text-green-500 text-sm">✓</span> : <span className="text-gray-300 text-sm">—</span> },
    { key: 'home_city', label: 'Home city', render: r => r.home_city || '—' },
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
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {tab === 'overview'    && <OverviewTab />}
      {tab === 'experiences' && <ExperiencesTab />}
      {tab === 'bookings'    && <BookingsTab />}
      {tab === 'users'       && <UsersTab />}
    </div>
  )
}
