import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LabCatalog } from '../src/components/labs/LabCatalog'

describe('Cybersecurity Lab Catalog (Phase 5)', () => {
  it('renders lab catalog heading, disclaimer, and search bar', async () => {
    render(<LabCatalog />)

    expect(screen.getByRole('heading', { name: /hands-on labs in contained workspaces/i })).toBeInTheDocument()
    expect(screen.getByText(/AUTHORIZED SIMULATED SANDBOX/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/search practical labs/i)).toBeInTheDocument()
  })

  it('renders all curated practical labs with tasks and launch buttons', async () => {
    render(<LabCatalog />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Linux Privileges & Log Hunting/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /Wireshark Packet & Credential Hunt/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /SQL Injection & Authentication Bypass/i })).toBeInTheDocument()
    })

    const launchButtons = screen.getAllByRole('button', { name: /launch lab|review lab|continue/i })
    expect(launchButtons.length).toBeGreaterThanOrEqual(6)
  })

  it('filters labs by difficulty level and search query', async () => {
    render(<LabCatalog />)

    // Filter by BEGINNER
    const beginnerBtn = screen.getByRole('button', { name: 'BEGINNER' })
    fireEvent.click(beginnerBtn)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Linux Privileges & Log Hunting/i })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /SOC Incident Investigation/i })).not.toBeInTheDocument()
    })

    // Search query
    const searchInput = screen.getByPlaceholderText(/search practical labs/i)
    fireEvent.change(searchInput, { target: { value: 'Wireshark' } })

    // Reset difficulty to ALL
    const allBtn = screen.getByRole('button', { name: 'ALL' })
    fireEvent.click(allBtn)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Wireshark Packet & Credential Hunt/i })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /Linux Privileges & Log Hunting/i })).not.toBeInTheDocument()
    })
  })

  it('opens and closes the full-screen lab workspace modal', async () => {
    render(<LabCatalog />)

    const launchButtons = await screen.findAllByRole('button', { name: /launch lab|review lab|continue/i })
    fireEvent.click(launchButtons[0])

    // Workspace should now be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    const closeBtn = screen.getByRole('button', { name: /close lab workspace/i })
    expect(closeBtn).toBeInTheDocument()

    // Click exit
    fireEvent.click(closeBtn)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
