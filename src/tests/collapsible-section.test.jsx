/**
 * Unit tests for CollapsibleSection — the accordion used on Browse for
 * "Personalized for you", "Sponsored", etc. so users can collapse sections
 * instead of scrolling past them.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CollapsibleSection from '../components/ui/CollapsibleSection'

describe('CollapsibleSection', () => {
  it('renders children expanded by default', () => {
    render(
      <CollapsibleSection title="Personalized for you">
        <div>card content</div>
      </CollapsibleSection>
    )
    expect(screen.getByText('card content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /personalized for you/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('hides children after clicking the header toggle', () => {
    render(
      <CollapsibleSection title="Sponsored">
        <div>promo card</div>
      </CollapsibleSection>
    )
    fireEvent.click(screen.getByRole('button', { name: /sponsored/i }))
    expect(screen.queryByText('promo card')).not.toBeInTheDocument()
  })

  it('respects defaultOpen={false}', () => {
    render(
      <CollapsibleSection title="Sponsored" defaultOpen={false}>
        <div>promo card</div>
      </CollapsibleSection>
    )
    expect(screen.queryByText('promo card')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sponsored/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('toggles back open on a second click', () => {
    render(
      <CollapsibleSection title="Sponsored">
        <div>promo card</div>
      </CollapsibleSection>
    )
    const toggle = screen.getByRole('button', { name: /sponsored/i })
    fireEvent.click(toggle)
    fireEvent.click(toggle)
    expect(screen.getByText('promo card')).toBeInTheDocument()
  })

  it('renders headerAction and badge alongside the title', () => {
    render(
      <CollapsibleSection title="Sponsored" badge={<span>SPONSORED</span>} headerAction={<a href="/x">Update →</a>}>
        <div>promo card</div>
      </CollapsibleSection>
    )
    expect(screen.getByText('SPONSORED')).toBeInTheDocument()
    expect(screen.getByText('Update →')).toBeInTheDocument()
  })

  it('hides subtitle when collapsed', () => {
    render(
      <CollapsibleSection title="Personalized for you" subtitle={<div>interest chips</div>} defaultOpen={false}>
        <div>card content</div>
      </CollapsibleSection>
    )
    expect(screen.queryByText('interest chips')).not.toBeInTheDocument()
  })
})
