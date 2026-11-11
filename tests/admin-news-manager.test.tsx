import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AdminNewsManager } from '../src/components/AdminNewsManager'

describe('security brief editor', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('creates a draft through the admin API without publishing it', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') return new Response(JSON.stringify({ update: { id: 'draft123', status: 'DRAFT' } }), { status: 201 })
      return new Response(JSON.stringify({ updates: [] }))
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<AdminNewsManager csrfToken="csrf-token" />)

    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'A useful official cybersecurity learning guide' } })
    fireEvent.change(screen.getByLabelText('Official source link'), { target: { value: 'https://www.nist.gov/news-events/news/2026/11/guide' } })
    fireEvent.change(screen.getByLabelText('Learner-friendly summary'), { target: { value: 'An official guide that helps learners understand practical cybersecurity basics.' } })
    fireEvent.change(screen.getByLabelText('Why it matters'), { target: { value: 'Start with a clear inventory and choose safeguards based on likely harm.' } })
    fireEvent.click(screen.getByRole('button', { name: /save draft/i }))

    expect(await screen.findByText(/draft created/i)).toBeInTheDocument()
    const createCall = fetchMock.mock.calls.find(([url, init]) => String(url) === '/api/admin/news' && init?.method === 'POST')
    expect(createCall).toBeDefined()
    expect(JSON.parse(String(createCall?.[1]?.body))).not.toHaveProperty('status')
  })
})
