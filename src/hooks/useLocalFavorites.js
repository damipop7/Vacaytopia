/**
 * localStorage favorites — no auth required.
 * Supplements the DB wishlist for unauthenticated users.
 * When the user signs in, the existing useWishlist hook takes over.
 */
import { useState, useCallback, useEffect } from 'react'
import { recordSave } from '../lib/semanticSearch'

const KEY = 'vtopia_local_favs'

function readIds() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]')) }
  catch { return new Set() }
}

function writeIds(set) {
  try { localStorage.setItem(KEY, JSON.stringify([...set])) } catch { /* quota */ }
}

export function useLocalFavorites() {
  const [favIds, setFavIds] = useState(() => readIds())

  // Sync across tabs
  useEffect(() => {
    function onStorage(e) {
      if (e.key === KEY) setFavIds(readIds())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const isFaved = useCallback(id => favIds.has(id), [favIds])

  const toggleFav = useCallback(id => {
    setFavIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        recordSave(id)
      }
      writeIds(next)
      return next
    })
  }, [])

  return { favIds: [...favIds], isFaved, toggleFav, count: favIds.size }
}
