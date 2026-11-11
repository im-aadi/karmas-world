import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import App from '../src/App'

describe('Karma’s World homepage', () => {
  it('introduces the academy and offers a learning path action', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /curiosity is your superpower/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /explore learning paths/i })).toHaveAttribute('href', '#paths')
  })

  it('shows the three beginner-friendly learning paths', () => {
    render(<App />)
    const section = document.querySelector<HTMLElement>('#paths')!
    expect(within(section).getByRole('heading', { name: /cybersecurity foundations/i })).toBeInTheDocument()
    expect(within(section).getByRole('heading', { name: /network defense/i })).toBeInTheDocument()
    expect(within(section).getByRole('heading', { name: /web security/i })).toBeInTheDocument()
  })
})
