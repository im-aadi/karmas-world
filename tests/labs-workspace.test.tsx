import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LabWorkspace } from '../src/components/labs/LabWorkspace'

describe('Lab Workspace & Flag Verification Engine (Phase 5)', () => {
  it('renders lab header, duration, objectives, and tasks', () => {
    const handleClose = vi.fn()
    render(<LabWorkspace labSlug="linux-cli-mastery" onClose={handleClose} />)

    expect(screen.getByRole('heading', { name: /Linux Privileges & Log Hunting/i })).toBeInTheDocument()
    expect(screen.getByText(/25 min/i)).toBeInTheDocument()
    expect(screen.getByText(/Task 1: Uncover Hidden Vault Flag/i)).toBeInTheDocument()
    expect(screen.getByText(/Task 2: Audit Failed SSH Logins/i)).toBeInTheDocument()
  })

  it('toggles hint disclosure for a task', () => {
    render(<LabWorkspace labSlug="linux-cli-mastery" onClose={vi.fn()} />)

    const hintButtons = screen.getAllByRole('button', { name: /need a hint\?/i })
    expect(hintButtons.length).toBeGreaterThan(0)

    // Click hint button
    fireEvent.click(hintButtons[0])
    expect(screen.getByText(/Use `ls -la` in the home directory/i)).toBeInTheDocument()

    // Hide hint
    fireEvent.click(screen.getByRole('button', { name: /hide hint/i }))
    expect(screen.queryByText(/Use `ls -la` in the home directory/i)).not.toBeInTheDocument()
  })

  it('validates incorrect flag and displays informative error feedback', async () => {
    render(<LabWorkspace labSlug="linux-cli-mastery" onClose={vi.fn()} />)

    const inputs = screen.getAllByPlaceholderText('KW{...}')
    const submitButtons = screen.getAllByRole('button', { name: /submit flag/i })

    // Enter wrong flag
    fireEvent.change(inputs[0], { target: { value: 'KW{invalid_test_flag}' } })
    fireEvent.click(submitButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/incorrect flag or answer/i)).toBeInTheDocument()
    })
  })

  it('validates correct flag, awards points, and marks task solved', async () => {
    const handleCompleted = vi.fn()
    render(<LabWorkspace labSlug="linux-cli-mastery" onClose={vi.fn()} onCompleted={handleCompleted} />)

    const inputs = screen.getAllByPlaceholderText('KW{...}')
    const submitButtons = screen.getAllByRole('button', { name: /submit flag/i })

    // Enter correct flag for Task 1
    fireEvent.change(inputs[0], { target: { value: 'KW{l1nux_b4sh_m4st3r}' } })
    fireEvent.click(submitButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/flag verified!/i)).toBeInTheDocument()
      expect(screen.getByText(/1\/3 Tasks/i)).toBeInTheDocument()
    })

    expect(handleCompleted).toHaveBeenCalledWith('linux-cli-mastery', expect.any(Number))
  })

  it('switches to Scenario & Objectives tab', () => {
    render(<LabWorkspace labSlug="linux-cli-mastery" onClose={vi.fn()} />)

    const scenarioTab = screen.getByRole('button', { name: /scenario & objectives/i })
    fireEvent.click(scenarioTab)

    expect(screen.getByText(/Scenario Briefing/i)).toBeInTheDocument()
    expect(screen.getByText(/Target Environment/i)).toBeInTheDocument()
    expect(screen.getByText(/Simulated Ubuntu 24.04 LTS/i)).toBeInTheDocument()
  })
})
