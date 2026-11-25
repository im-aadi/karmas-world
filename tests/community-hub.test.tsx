import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CommunityHub } from '../src/components/community/CommunityHub'
import { ArticleReaderModal } from '../src/components/community/ArticleReaderModal'
import { ThreadDetailModal } from '../src/components/community/ThreadDetailModal'

describe('Phase 9: Community Forums & Security Knowledge Base', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it('CommunityHub renders navigation tabs, discussion threads, and filters by category', async () => {
    render(<CommunityHub accountId="learner-1" csrfToken="test-csrf" />)

    // Verify main section heading
    expect(screen.getByText('Cybersecurity Knowledge Base.')).toBeInTheDocument()
    expect(screen.getByText('Discussion Forums')).toBeInTheDocument()
    expect(screen.getByText('Technical Knowledge Base')).toBeInTheDocument()
    expect(screen.getByText('Private Reflections & Safety')).toBeInTheDocument()

    // Curated threads load
    await waitFor(() => {
      expect(
        screen.getByText(/How does double-submit cookie pattern prevent CSRF in modern SPAs\?/i)
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText(/Setting up Suricata on a mirrored switch port: Triage tips and rule tuning/i)
    ).toBeInTheDocument()

    // Filter by Network Defense & SOC
    const netPill = screen.getByRole('button', { name: /Network Defense/i })
    fireEvent.click(netPill)

    await waitFor(() => {
      expect(
        screen.getByText(/Setting up Suricata on a mirrored switch port/i)
      ).toBeInTheDocument()
      expect(
        screen.queryByText(/How does double-submit cookie pattern prevent CSRF/i)
      ).not.toBeInTheDocument()
    })
  })

  it('CommunityHub switches to Knowledge Base, filters guides, and displays articles', async () => {
    render(<CommunityHub />)

    // Switch to Technical Knowledge Base Tab
    const kbTabBtn = screen.getByRole('button', { name: /Technical Knowledge Base/i })
    fireEvent.click(kbTabBtn)

    // Verify Knowledge Base guides are visible
    await waitFor(() => {
      expect(
        screen.getByText(/Practical Guide to SQL Injection: Detection, Exploitation & Parameterized Defense/i)
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText(/Demystifying the TLS 1.3 Handshake: Zero-RTT and Modern Cipher Suites/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Implementing Zero Trust Architecture: Identity as the New Security Perimeter/i)
    ).toBeInTheDocument()

    // Search for "TLS"
    const searchInput = screen.getByPlaceholderText(/Search security guides/i)
    fireEvent.change(searchInput, { target: { value: 'TLS' } })

    await waitFor(() => {
      expect(
        screen.getByText(/Demystifying the TLS 1.3 Handshake/i)
      ).toBeInTheDocument()
      expect(
        screen.queryByText(/Practical Guide to SQL Injection/i)
      ).not.toBeInTheDocument()
    })
  })

  it('ThreadDetailModal renders thread details, allows upvoting, and submits reply', async () => {
    const onClose = vi.fn()
    render(
      <ThreadDetailModal
        slug="how-does-double-submit-cookie-pattern-prevent-csrf"
        csrfToken="test-csrf"
        onClose={onClose}
      />
    )

    // Verify thread loaded
    await waitFor(() => {
      expect(
        screen.getByText(/How does double-submit cookie pattern prevent CSRF in modern SPAs\?/i)
      ).toBeInTheDocument()
    })

    expect(screen.getByText('Alex Rivera')).toBeInTheDocument()
    expect(screen.getByText('Sentinel')).toBeInTheDocument()
    expect(screen.getByText('ACCEPTED COMMUNITY SOLUTION')).toBeInTheDocument()
    expect(screen.getByText('Maya Lin')).toBeInTheDocument()

    // Upvote the main thread
    const upvoteBtn = screen.getByRole('button', { name: /Helpful & Insightful/i })
    fireEvent.click(upvoteBtn)

    // Submit a new reply
    const replyInput = screen.getByPlaceholderText(/Share code, troubleshooting steps/i)
    fireEvent.change(replyInput, {
      target: { value: 'Using SameSite=Strict cookies provides strong defense-in-depth across modern browsers.' },
    })

    const postReplyBtn = screen.getByRole('button', { name: /Post Reply/i })
    fireEvent.click(postReplyBtn)

    await waitFor(() => {
      expect(screen.getByText(/Reply posted! You earned \+10 XP/i)).toBeInTheDocument()
      expect(
        screen.getByText(/Using SameSite=Strict cookies provides strong defense-in-depth/i)
      ).toBeInTheDocument()
    })

    // Close modal
    fireEvent.click(screen.getByRole('button', { name: /Back to Discussions/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('ArticleReaderModal renders full markdown article, displays code blocks, and records helpful vote', async () => {
    const onClose = vi.fn()
    render(
      <ArticleReaderModal
        slug="practical-guide-to-sql-injection"
        onClose={onClose}
      />
    )

    // Verify article title and metadata
    await waitFor(() => {
      expect(
        screen.getAllByText(/Practical Guide to SQL Injection: Detection, Exploitation & Parameterized Defense/i).length
      ).toBeGreaterThanOrEqual(1)
    })

    expect(screen.getByText('EXECUTIVE SUMMARY')).toBeInTheDocument()
    expect(screen.getByText(/A deep technical breakdown of in-band, blind, and time-based SQL injection/i)).toBeInTheDocument()
    expect(screen.getByText(/1. Anatomy of Vulnerable Queries/i)).toBeInTheDocument()
    expect(screen.getByText(/3. Defense: Parameterized Statements/i)).toBeInTheDocument()

    // Upvote helpful
    const helpfulBtn = screen.getByRole('button', { name: /Yes, this helped/i })
    fireEvent.click(helpfulBtn)

    await waitFor(() => {
      expect(screen.getByText(/Thank you!/i)).toBeInTheDocument()
    })

    // Close reader
    fireEvent.click(screen.getByRole('button', { name: /Back to Community/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
