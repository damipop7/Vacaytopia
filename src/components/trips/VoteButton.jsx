import { useState } from 'react'

/** 👍👎 voting button with optimistic count animation. */
export default function VoteButton({ direction, count, active, onVote, disabled = false }) {
  const [animating, setAnimating] = useState(false)

  function handleClick() {
    if (disabled) return
    setAnimating(true)
    setTimeout(() => setAnimating(false), 400)
    onVote(direction === 'up' ? 1 : -1)
  }

  const emoji    = direction === 'up' ? '👍' : '👎'
  const baseRing = direction === 'up'
    ? 'border-green-500/40 text-green-400'
    : 'border-red-500/40 text-red-400'
  const activeRing = direction === 'up'
    ? 'border-green-400 bg-green-500/20 text-green-300'
    : 'border-red-400 bg-red-500/20 text-red-300'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={direction === 'up' ? `Upvote (${count})` : `Downvote (${count})`}
      className={`
        flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold
        transition-all duration-200 select-none
        ${active ? activeRing : `${baseRing} hover:bg-white/5`}
        ${animating ? 'scale-125' : 'scale-100'}
        disabled:opacity-40 disabled:cursor-not-allowed
      `}
    >
      <span className={`transition-transform duration-200 ${animating ? 'scale-150' : ''}`}>{emoji}</span>
      <span className="tabular-nums">{count}</span>
    </button>
  )
}
