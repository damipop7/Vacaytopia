import { useState } from 'react'
import { useTripActivity, useSendTripMessage, activityLabel } from '../../hooks/useTripActivity'
import { useAuthStore } from '../../store/authStore'

const ACTIVITY_ICONS = {
  member_joined:       '🟢',
  experience_added:    '✨',
  experience_voted:    '👍',
  experience_approved: '🎉',
  budget_contributed:  '💰',
  booking_made:        '🎫',
  itinerary_generated: '🤖',
  dates_set:           '📅',
  note_added:          '📝',
  message:             '💬',
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ActivityFeed({ tripId }) {
  const user = useAuthStore(s => s.user)
  const { data: activities = [], isLoading } = useTripActivity(tripId)
  const { mutate: sendMessage, isPending } = useSendTripMessage(tripId)
  const [draft, setDraft] = useState('')

  function handleSend(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    sendMessage(text)
    setDraft('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Live Activity</span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-3 max-h-64 md:max-h-96">
        {isLoading && (
          <div className="flex flex-col gap-2">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        )}
        {!isLoading && activities.length === 0 && (
          <p className="text-white/30 text-sm text-center py-6">No activity yet — start planning!</p>
        )}
        {activities.map(item => {
          const isMsg = item.activity_type === 'message'
          const isMine = item.user_id === user?.id
          return (
            <div key={item.id} className={`flex gap-2 ${isMsg && isMine ? 'flex-row-reverse' : ''}`}>
              <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-sm">
                {ACTIVITY_ICONS[item.activity_type] ?? '•'}
              </div>
              <div className={`flex flex-col ${isMsg && isMine ? 'items-end' : ''}`}>
                {isMsg ? (
                  <div className={`px-3 py-2 rounded-2xl text-sm max-w-[200px] break-words ${
                    isMine ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'
                  }`}>
                    {item.payload?.text}
                  </div>
                ) : (
                  <span className="text-white/70 text-xs leading-relaxed">{activityLabel(item)}</span>
                )}
                <span className="text-white/25 text-[10px] mt-0.5">{timeAgo(item.created_at)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {user && (
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
          />
          <button
            type="submit"
            disabled={!draft.trim() || isPending}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl text-sm font-semibold transition"
          >
            Send
          </button>
        </form>
      )}
    </div>
  )
}
