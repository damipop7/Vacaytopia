import { useState, useRef, useEffect } from 'react'

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON    = import.meta.env.VITE_SUPABASE_ANON_KEY

const STARTERS = [
  "What's included?",
  "Is this good for families?",
  "Where do we meet the guide?",
  "What should I wear or bring?",
]

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-blue-brand/40 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

export default function ExperienceConcierge({ exp }) {
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, loading])

  async function send(text) {
    const userMsg = text.trim()
    if (!userMsg || loading) return

    setInput('')
    setError(null)
    const updated = [...messages, { role: 'user', content: userMsg }]
    setMessages(updated)
    setLoading(true)

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/experience-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON,
          },
          body: JSON.stringify({
            experience_id: exp.id,
            messages: updated,
          }),
        }
      )
      if (!res.ok) throw new Error('Chat unavailable — please try again.')
      const { content } = await res.json()
      setMessages(m => [...m, { role: 'assistant', content }])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(input)
    }
  }

  const hasMessages = messages.length > 0

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close concierge' : 'Ask a question about this experience'}
        className="fixed bottom-20 right-5 z-40 md:bottom-6 w-14 h-14 rounded-full bg-blue-brand text-white shadow-xl flex items-center justify-center hover:bg-blue-mid active:scale-95 transition-all"
      >
        {open ? (
          <span className="text-xl leading-none font-bold">✕</span>
        ) : (
          <span className="text-2xl leading-none">💬</span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-[90px] right-4 z-40 md:bottom-20 w-[calc(100vw-32px)] max-w-sm bg-white rounded-card shadow-2xl border border-blue-brand/10 flex flex-col overflow-hidden"
          style={{ maxHeight: '70vh' }}
        >
          {/* Header */}
          <div className="bg-blue-brand px-4 py-3 flex-shrink-0">
            <div className="font-display font-bold text-white text-sm leading-tight line-clamp-1">
              Ask about: {exp.title}
            </div>
            <div className="text-white/60 text-[11px] mt-0.5">
              Powered by Vtopia AI · {exp.city}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
            {!hasMessages && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-400 text-center mb-1">
                  Ask anything about this experience
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {STARTERS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-blue-brand/20 text-blue-brand hover:bg-blue-tint transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-brand text-white rounded-br-sm'
                      : 'bg-gray-50 text-[#0D1B3E] border border-blue-brand/8 rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-blue-brand/8 rounded-2xl rounded-bl-sm">
                  <TypingDots />
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-red-500 text-center bg-red-50 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-blue-brand/8 px-3 py-2.5 flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask a question…"
              disabled={loading}
              className="flex-1 text-sm bg-gray-50 border border-blue-brand/10 rounded-full px-4 py-2 focus:outline-none focus:border-blue-brand/40 disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="w-9 h-9 rounded-full bg-blue-brand text-white flex items-center justify-center hover:bg-blue-mid disabled:opacity-40 transition-colors flex-shrink-0"
            >
              <span className="text-sm">→</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
