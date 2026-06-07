import { useState } from 'react'
import { usePledgeBudget } from '../../hooks/useTrip'
import { useAuthStore } from '../../store/authStore'

function centsToDisplay(cents) {
  return `$${Math.round(cents / 100).toLocaleString()}`
}

function ProgressBar({ filled, total, color = 'bg-blue-500' }) {
  const pct = total > 0 ? Math.min(100, (filled / total) * 100) : 0
  return (
    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function BudgetPanel({ trip }) {
  const user = useAuthStore(s => s.user)
  const { mutate: pledge, isPending } = usePledgeBudget(trip.id)
  const [pledgeOpen, setPledgeOpen] = useState(false)
  const [amount, setAmount] = useState('')

  const members   = trip.trip_members ?? []
  const totalCents = trip.total_budget_cents ?? 0
  const pooledCents = members.reduce((s, m) => s + (m.contribution_cents ?? 0), 0)
  const myMember  = members.find(m => m.user_id === user?.id)

  const perPerson = members.length > 0 ? Math.round(totalCents / members.length) : 0

  function handlePledge(e) {
    e.preventDefault()
    const cents = Math.round(parseFloat(amount) * 100)
    if (!cents || !myMember) return
    pledge({ memberId: myMember.id, amountCents: cents })
    setAmount('')
    setPledgeOpen(false)
  }

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-white">Trip Budget</h3>
        {myMember && (
          <button
            type="button"
            onClick={() => setPledgeOpen(o => !o)}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition"
          >
            + Contribute
          </button>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold text-white font-mono">{centsToDisplay(pooledCents)}</span>
        <span className="text-white/40 text-sm">of {centsToDisplay(totalCents)} pooled</span>
      </div>
      <ProgressBar filled={pooledCents} total={totalCents} color="bg-blue-500" />

      {perPerson > 0 && (
        <p className="text-white/40 text-xs mt-2">
          {centsToDisplay(perPerson)} suggested per person ({members.length} travelers)
        </p>
      )}

      {/* Member contributions */}
      {members.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {members.map(m => {
            const contrib = m.contribution_cents ?? 0
            return (
              <div key={m.id}>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                      style={{ backgroundColor: m.avatar_color ?? '#3B82F6' }}
                    >
                      {(m.display_name ?? 'T').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-white/70">{m.display_name ?? 'Member'}</span>
                    {m.role === 'owner' && <span className="text-white/30 text-[9px]">owner</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 font-mono">{centsToDisplay(contrib)}</span>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                      m.contribution_status === 'paid'      ? 'bg-green-500/20 text-green-400' :
                      m.contribution_status === 'committed' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-white/5 text-white/30'
                    }`}>
                      {m.contribution_status === 'paid' ? '✓ Paid' : m.contribution_status === 'committed' ? 'Pledged' : 'Pending'}
                    </span>
                  </div>
                </div>
                <ProgressBar filled={contrib} total={perPerson || totalCents} color="bg-blue-400/60" />
              </div>
            )
          })}
        </div>
      )}

      {/* Pledge form */}
      {pledgeOpen && myMember && (
        <form onSubmit={handlePledge} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={perPerson ? String(perPerson / 100) : '0'}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={!amount || isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl text-sm font-semibold transition"
          >
            Pledge
          </button>
        </form>
      )}
    </div>
  )
}
