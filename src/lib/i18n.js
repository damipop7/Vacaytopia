/**
 * Minimal i18n scaffold.
 *
 * How it works today:
 *   - Reads navigator.language to detect browser locale
 *   - Falls back to English for any unsupported locale
 *   - Exposes a t(key) helper that returns the translation string
 *
 * To add a language:
 *   1. Add its locale code to SUPPORTED_LOCALES
 *   2. Create src/locales/<code>.js  (see src/locales/en.js for shape)
 *   3. Import it in TRANSLATIONS below
 *
 * No build changes needed — tree-shaking handles unused locale modules.
 */

import en from '../locales/en.js'

const TRANSLATIONS = { en }

const SUPPORTED_LOCALES = ['en']

function detectLocale() {
  const lang = (navigator.language || 'en').split('-')[0].toLowerCase()
  return SUPPORTED_LOCALES.includes(lang) ? lang : 'en'
}

let _locale = detectLocale()
let _strings = TRANSLATIONS[_locale] || TRANSLATIONS.en

export function getLocale() { return _locale }

export function setLocale(code) {
  if (TRANSLATIONS[code]) {
    _locale  = code
    _strings = TRANSLATIONS[code]
  }
}

export function t(key, vars = {}) {
  const raw = _strings[key] ?? TRANSLATIONS.en[key] ?? key
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
    raw
  )
}
