import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LeaderboardPanel } from '../src/components/LeaderboardPanel'

describe('opt-in leaderboard', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('explains public visibility and lets a signed-in learner opt in', async () => {
    let optedIn = false
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        optedIn = JSON.parse(String(init.body)).optedIn
        return new Response(JSON.stringify({ optedIn }))
      }
      return new Response(JSON.stringify({ optedIn, entries: optedIn ? [{ rank: 1, displayName: 'Karma Learner', lessonsCompleted: 3, isYou: true }] : [] }))
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<LeaderboardPanel signedIn csrfToken="csrf-test" />)
    expect(await screen.findByText(/Joining shares your account display name/i)).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: /join leaderboard/i }))
    expect(await screen.findByText(/you’re on the board/i)).toBeInTheDocument()
    expect(screen.getByText('Karma Learner')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/leaderboard/participation', expect.objectContaining({ method: 'PATCH', body: '{"optedIn":true}' }))
  })
})
