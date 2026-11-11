import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CommunityCorner } from '../src/components/CommunityCorner'

describe('community reflection space', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (init?.method === 'POST' && url.endsWith('/api/community/posts')) return new Response(JSON.stringify({ post: { id: 'post12345', body: JSON.parse(String(init.body)).body, status: 'PENDING', createdAt: new Date().toISOString(), author: { displayName: 'Learner' } } }), { status: 201 })
      if (url.endsWith('/api/community/moderation')) return new Response(JSON.stringify({ posts: [], reports: [] }))
      return new Response(JSON.stringify({ posts: [] }))
    }))
  })
  afterEach(() => vi.unstubAllGlobals())

  it('saves reflections privately per prompt and restores them on reload', () => {
    const { unmount } = render(<CommunityCorner />)
    const editor = screen.getByRole('textbox', { name: /write a private reflection/i })
    fireEvent.change(editor, { target: { value: 'Ask a mentor how they practice safe disclosure.' } })
    fireEvent.click(screen.getByRole('button', { name: /save reflection/i }))
    expect(screen.getByRole('status')).toHaveTextContent(/saved privately on this device/i)
    expect(window.localStorage.getItem('karma-private-reflections-v1:guest')).toContain('safe disclosure')

    fireEvent.click(screen.getByRole('button', { name: /teach one idea/i }))
    expect(editor).toHaveValue('')
    unmount()
    render(<CommunityCorner />)
    expect(screen.getByRole('textbox', { name: /write a private reflection/i })).toHaveValue('Ask a mentor how they practice safe disclosure.')
  })

  it('keeps a signed-in learner’s reflections separate from guest notes', () => {
    const { unmount } = render(<CommunityCorner />)
    fireEvent.change(screen.getByRole('textbox', { name: /write a private reflection/i }), { target: { value: 'Guest-only note' } })
    fireEvent.click(screen.getByRole('button', { name: /save reflection/i }))
    unmount()
    render(<CommunityCorner accountId="learner-1" />)
    expect(screen.getByRole('textbox', { name: /write a private reflection/i })).toHaveValue('')
  })

  it('submits community posts for review before they are publicly shown', async () => {
    render(<CommunityCorner accountId="learner-1" csrfToken="test-token" />)
    const composer = screen.getByRole('textbox', { name: /share a learning question/i })
    fireEvent.change(composer, { target: { value: 'What is one safe way to practice threat modeling?' } })
    fireEvent.click(screen.getByRole('button', { name: /submit for review/i }))
    expect(await screen.findByText(/sent for moderator review/i)).toBeInTheDocument()
    expect(screen.getByText('IN REVIEW')).toBeInTheDocument()
  })
})
