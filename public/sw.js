/* Vtopia Service Worker — offline-friendly for stadium / hotel WiFi */
const CACHE   = 'vtopia-v1'
const OFFLINE_FALLBACK = '/offline.html'

const PRECACHE = [
  '/',
  '/offline.html',
  '/favicon.svg',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // Skip non-GET, cross-origin API calls, Supabase, Stripe
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  // Network-first for HTML navigation (keeps content fresh)
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .catch(() => caches.match(OFFLINE_FALLBACK))
    )
    return
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
        }
        return response
      })
    })
  )
})
