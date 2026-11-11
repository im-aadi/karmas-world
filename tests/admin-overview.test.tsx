import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminOverview } from '../src/components/AdminOverview'

describe('admin overview', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows aggregate metrics without individual learner details', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => String(input).endsWith('/api/admin/news')
      ? new Response(JSON.stringify({ updates: [] }))
      : new Response(JSON.stringify({ overview: {
        learnerAccounts: 12, completedLessons: 34, pendingPosts: 2, openReports: 1, leaderboardParticipants: 4, generatedAt: '2026-11-03T12:00:00.000Z',
      } }))))
    render(<AdminOverview csrfToken="csrf-test" />)
    expect(await screen.findByText('12')).toBeInTheDocument()
    expect(screen.getByText('34')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open moderation queue/i })).toHaveAttribute('href', '#moderation-title')
    expect(screen.queryByText(/@/)).not.toBeInTheDocument()
  })
})
