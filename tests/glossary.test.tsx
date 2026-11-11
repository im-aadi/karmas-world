import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Glossary } from '../src/components/Glossary'

describe('cybersecurity glossary', () => {
  it('filters terms by topic and search, then opens the linked lesson', () => {
    const onOpenLesson = vi.fn()
    render(<Glossary onOpenLesson={onOpenLesson} />)

    fireEvent.click(screen.getByRole('button', { name: 'Networks' }))
    expect(screen.getByText('Showing 6 of 23 terms')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: /search glossary terms/i }), { target: { value: 'DNS' } })

    expect(screen.getByRole('heading', { name: 'Domain Name System (DNS)' })).toBeInTheDocument()
    expect(screen.getByText('Showing 1 of 23 terms')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /open lesson: DNS: names to destinations/i }))
    expect(onOpenLesson).toHaveBeenCalledWith('network', 1)
  })

  it('explains when a search has no matches', () => {
    render(<Glossary onOpenLesson={() => {}} />)
    fireEvent.change(screen.getByRole('searchbox', { name: /search glossary terms/i }), { target: { value: 'not-a-real-term' } })

    expect(screen.getByText('Showing 0 of 23 terms')).toBeInTheDocument()
    expect(screen.getByText(/no terms match that search/i)).toBeInTheDocument()
  })
})
