import { useState, useEffect, useRef } from 'react'
import { Globe } from 'lucide-react'
import { getLocale, setLocale, SUPPORTED_LOCALES } from '../../lib/i18n'

export default function LanguageSelector({ className = '' }) {
  const [locale, setLocaleState] = useState(getLocale)
  const [open, setOpen]          = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onLocale(e) { setLocaleState(e.detail) }
    window.addEventListener('vtopia:locale', onLocale)
    return () => window.removeEventListener('vtopia:locale', onLocale)
  }, [])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const current = SUPPORTED_LOCALES.find(l => l.code === locale) || SUPPORTED_LOCALES[0]

  function choose(code) {
    setLocale(code)
    setOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Select language"
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-pill border border-blue-brand/15 text-gray-500 hover:text-blue-brand hover:border-blue-brand hover:bg-blue-tint text-xs font-semibold transition-all"
      >
        <Globe size={14} aria-hidden="true" />
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Language options"
          className="absolute right-0 top-full mt-1 bg-white border border-blue-brand/10 rounded-card shadow-lg py-1 z-50 min-w-[140px]"
        >
          {SUPPORTED_LOCALES.map(loc => (
            <li key={loc.code}>
              <button
                role="option"
                aria-selected={loc.code === locale}
                onClick={() => choose(loc.code)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                  loc.code === locale
                    ? 'bg-blue-tint text-blue-brand font-semibold'
                    : 'text-gray-600 hover:bg-blue-tint hover:text-blue-brand'
                }`}
              >
                <span>{loc.flag}</span>
                <span>{loc.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
