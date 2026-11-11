import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { SecurityBrief } from '../src/components/SecurityBrief'

describe('security brief', () => {
  it('shows dated summaries from official sources and safely opens original links', () => {
    render(<SecurityBrief />)
    expect(screen.getByRole('heading', { name: /what’s changing in digital security/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /GoAhead Web Server/i })).toBeInTheDocument()
    expect(screen.getByText(/CURATED NOVEMBER 3, 2026/i)).toBeInTheDocument()
    const sourceLinks = screen.getAllByRole('link', { name: /read the original/i })
    expect(sourceLinks).toHaveLength(3)
    for (const link of sourceLinks) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
    expect(within(screen.getByRole('region', { name: /security brief/i })).getAllByRole('link').length).toBeGreaterThan(3)
  })
})
