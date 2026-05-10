/**
 * Vtopia i18n — minimal locale system.
 * Supports: en, es, pt, fr, de
 *
 * To add a language:
 *   1. Add its locale code to SUPPORTED_LOCALES
 *   2. Create src/locales/<code>.js (mirror every key from en.js)
 *   3. Import it in TRANSLATIONS below
 * No build changes needed — tree-shaking handles unused locale modules.
 */

import en from '../locales/en.js'
import es from '../locales/es.js'
import pt from '../locales/pt.js'
import fr from '../locales/fr.js'
import de from '../locales/de.js'

const TRANSLATIONS = { en, es, pt, fr, de }

export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
]

const LOCALE_CODES = SUPPORTED_LOCALES.map(l => l.code)

function detectLocale() {
  // Check localStorage override first
  try {
    const saved = localStorage.getItem('vtopia_locale')
    if (saved && LOCALE_CODES.includes(saved)) return saved
  } catch { /* localStorage not available */ }
  const lang = (navigator.language || 'en').split('-')[0].toLowerCase()
  return LOCALE_CODES.includes(lang) ? lang : 'en'
}

let _locale  = detectLocale()
let _strings = TRANSLATIONS[_locale] || TRANSLATIONS.en

export function getLocale() { return _locale }

export function setLocale(code) {
  if (TRANSLATIONS[code]) {
    _locale  = code
    _strings = TRANSLATIONS[code]
    try { localStorage.setItem('vtopia_locale', code) } catch { /* quota */ }
    // Dispatch event so components can re-render
    window.dispatchEvent(new CustomEvent('vtopia:locale', { detail: code }))
  }
}

export function t(key, vars = {}) {
  const raw = _strings[key] ?? TRANSLATIONS.en[key] ?? key
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
    raw
  )
}
