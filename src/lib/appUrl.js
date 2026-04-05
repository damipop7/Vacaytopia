/** Site origin for OAuth redirects and links (no trailing slash). */
export function getAppOrigin() {
  const fromEnv = import.meta.env.VITE_APP_URL
  if (fromEnv && typeof fromEnv === 'string') return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

export function getAuthCallbackUrl() {
  return `${getAppOrigin()}/auth/callback`
}

/** Session flag: skip /auth → browse redirect so /interests can load after signup */
export const ONBOARD_INTERESTS_KEY = 'vtopia_onboarding_interests'
