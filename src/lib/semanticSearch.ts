/**
 * TF-IDF cosine similarity semantic search.
 *
 * No API calls — runs entirely in the browser.
 * When a user types "something chill and artsy", this returns the top-k
 * experiences whose descriptions best match the query semantically.
 *
 * Upgrade path: swap the `vectorize` function for Anthropic embeddings
 * when the budget allows (store vectors in pgvector, search server-side).
 */

type Doc = { id: string; text: string }
type Vector = Map<string, number>

const STOP_WORDS = new Set([
  'a','an','and','are','as','at','be','been','by','for','from','has','have',
  'he','her','his','i','in','is','it','its','me','my','of','on','or','our',
  'she','that','the','their','them','they','this','to','us','was','we',
  'were','will','with','you','your',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t))
}

function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1)
  const total = tokens.length || 1
  tf.forEach((v, k) => tf.set(k, v / total))
  return tf
}

function buildIDF(docs: string[][]): Map<string, number> {
  const df = new Map<string, number>()
  for (const tokens of docs) {
    for (const t of new Set(tokens)) df.set(t, (df.get(t) ?? 0) + 1)
  }
  const N = docs.length
  const idf = new Map<string, number>()
  df.forEach((n, t) => idf.set(t, Math.log((N + 1) / (n + 1)) + 1))
  return idf
}

function tfidfVector(tf: Map<string, number>, idf: Map<string, number>): Vector {
  const vec = new Map<string, number>()
  tf.forEach((freq, term) => {
    const weight = freq * (idf.get(term) ?? 1)
    if (weight > 0) vec.set(term, weight)
  })
  return vec
}

function cosineSimilarity(a: Vector, b: Vector): number {
  let dot = 0, normA = 0, normB = 0
  a.forEach((v, k) => {
    dot += v * (b.get(k) ?? 0)
    normA += v * v
  })
  b.forEach(v => { normB += v * v })
  return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export interface SemanticResult {
  id: string
  score: number
}

/**
 * Build a search index from a list of documents.
 * Call once when the experience list loads, then call `search()` for each query.
 */
export function buildIndex(docs: Doc[]): {
  search: (query: string, topK?: number) => SemanticResult[]
} {
  const tokenized = docs.map(d => tokenize(d.text))
  const idf = buildIDF(tokenized)
  const vectors = tokenized.map(tokens => tfidfVector(termFrequency(tokens), idf))

  function search(query: string, topK = 10): SemanticResult[] {
    const qTokens = tokenize(query)
    const qVec    = tfidfVector(termFrequency(qTokens), idf)
    const scores  = docs.map((doc, i) => ({
      id:    doc.id,
      score: cosineSimilarity(qVec, vectors[i]),
    }))
    return scores
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  return { search }
}

/**
 * Track which experiences are saved together for "Users also liked" rail.
 * Call `recordSave(experienceId)` each time a user saves an experience.
 * Call `getCoSaved(experienceId)` to get frequently co-saved IDs.
 */
const CO_SAVE_KEY = 'vtopia_cosave'

export function recordSave(id: string): void {
  try {
    const sessions: string[][] = JSON.parse(localStorage.getItem(CO_SAVE_KEY) ?? '[]')
    // Find current session (last entry if younger than 30 min)
    const now = Date.now()
    const sessionKey = `vtopia_cosave_session`
    const session: string[] = JSON.parse(sessionStorage.getItem(sessionKey) ?? '[]')
    if (!session.includes(id)) {
      session.push(id)
      sessionStorage.setItem(sessionKey, JSON.stringify(session))
    }
    // Flush to localStorage on >1 item
    if (session.length > 1) {
      sessions.push([...session])
      // Keep last 200 sessions
      const trimmed = sessions.slice(-200)
      localStorage.setItem(CO_SAVE_KEY, JSON.stringify(trimmed))
    }
  } catch { /* localStorage unavailable */ }
}

export function getCoSaved(id: string, topK = 5): string[] {
  try {
    const sessions: string[][] = JSON.parse(localStorage.getItem(CO_SAVE_KEY) ?? '[]')
    const counts = new Map<string, number>()
    for (const session of sessions) {
      if (session.includes(id)) {
        for (const other of session) {
          if (other !== id) counts.set(other, (counts.get(other) ?? 0) + 1)
        }
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([otherId]) => otherId)
  } catch { return [] }
}
