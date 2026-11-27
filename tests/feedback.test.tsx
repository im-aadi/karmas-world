import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FeedbackSection } from '../src/components/FeedbackSection'

describe('Feedback & Community Roadmap Module', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders direct developer email and contact links for Aditya Kumar', () => {
    render(<FeedbackSection account={null} />)

    expect(screen.getByText(/Shape the Future of/i)).toBeInTheDocument()
    expect(screen.getByText('adityakumar748847@gmail.com')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Send Email/i })).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:adityakumar748847@gmail.com')
    )
  })

  it('allows filling out feedback, selecting category, and generating a ticket', async () => {
    render(
      <FeedbackSection
        account={{
          id: 'usr-1',
          email: 'test@karmasworld.org',
          displayName: 'Test Hacker',
          role: 'LEARNER',
          mfaEnabled: false
        }}
      />
    )

    // Select 'Bug / Issue' category
    const bugBtn = screen.getByRole('radio', { name: /Bug \/ Issue/i })
    fireEvent.click(bugBtn)
    expect(bugBtn).toHaveAttribute('aria-checked', 'true')

    // Fill in subject & message
    fireEvent.change(screen.getByLabelText(/Subject or Title/i), {
      target: { value: 'Wireshark simulator packet filter typo' }
    })
    fireEvent.change(screen.getByLabelText(/Detailed Feedback/i), {
      target: { value: 'In lesson 3, the display filter syntax tcp.port eq 80 is described.' }
    })

    // Submit feedback
    const submitBtn = screen.getByRole('button', { name: /Send Feedback to Dev Team/i })
    fireEvent.click(submitBtn)

    // Verify confirmation banner with ticket ID
    await waitFor(() => {
      expect(screen.getByText(/Thank you! Your feedback has been recorded/i)).toBeInTheDocument()
    })

    expect(screen.getAllByText(/KW-FB-/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Wireshark simulator packet filter typo')).toBeInTheDocument()
  })

  it('allows voting on community roadmap items', () => {
    render(<FeedbackSection account={null} />)

    const voteButtons = screen.getAllByTitle(/Vote for this feature/i)
    expect(voteButtons.length).toBeGreaterThan(0)

    const initialText = voteButtons[0].textContent || '0'
    const initialVotes = parseInt(initialText, 10)

    fireEvent.click(voteButtons[0])

    const updatedVotes = parseInt(voteButtons[0].textContent || '0', 10)
    expect(updatedVotes).toBe(initialVotes + 1)
  })
})
