import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

// Accordion-style section header used on Browse (Personalized for you, Sponsored, ...)
// so users can collapse sections they don't care about instead of scrolling past them.
export default function CollapsibleSection({ title, badge, subtitle, headerAction, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="flex items-center gap-2 group text-left min-h-[28px]"
        >
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={`text-gray-400 transition-transform duration-200 flex-shrink-0 group-hover:text-blue-brand ${open ? '' : '-rotate-90'}`}
          />
          <span className="font-display font-bold text-lg text-[#0D1B3E]">{title}</span>
          {badge}
        </button>
        {headerAction}
      </div>
      {open && subtitle}
      {open && children}
      <div className="border-t border-blue-brand/8 mt-8" />
    </section>
  )
}
