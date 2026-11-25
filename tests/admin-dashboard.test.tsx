import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AdminDashboard } from '../src/components/admin/AdminDashboard'

describe('Phase 10: Admin Dashboard & Control Console', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it('AdminDashboard renders telemetry KPIs, top courses, and switches tabs', async () => {
    render(<AdminDashboard csrfToken="admin-csrf-123" />)

    // Verify main section and telemetry KPI cards
    expect(screen.getByText('Platform overview.')).toBeInTheDocument()
    expect(screen.getByText('Platform Telemetry & KPIs')).toBeInTheDocument()
    expect(screen.getByText(/Learner Directory/i)).toBeInTheDocument()
    expect(screen.getByText(/Course Management/i)).toBeInTheDocument()
    expect(screen.getByText(/Moderation & Threat Intel/i)).toBeInTheDocument()

    // Wait for telemetry values to load
    await waitFor(() => {
      expect(screen.getByText('TOTAL XP DISTRIBUTED')).toBeInTheDocument()
      expect(screen.getByText('EXAMINATION PASS RATE')).toBeInTheDocument()
      expect(screen.getByText('Most Popular Curriculum Pathways')).toBeInTheDocument()
    })

    expect(screen.getByText('Practical Ethical Hacking & Penetration Testing')).toBeInTheDocument()
  })

  it('AdminDashboard navigates to Learner Directory and handles user search and role changes', async () => {
    render(<AdminDashboard csrfToken="admin-csrf-123" />)

    // Switch to Learner Directory Tab
    const userTabBtn = screen.getByRole('button', { name: /Learner Directory/i })
    fireEvent.click(userTabBtn)

    // Verify users list loaded
    await waitFor(() => {
      expect(screen.getByText('Aditya Kashyap')).toBeInTheDocument()
      expect(screen.getByText('Sarah Connor')).toBeInTheDocument()
      expect(screen.getByText('Marcus Brody')).toBeInTheDocument()
    })

    // Search for "Sarah"
    const searchInput = screen.getByPlaceholderText(/Search by name or email/i)
    fireEvent.change(searchInput, { target: { value: 'Sarah' } })

    await waitFor(() => {
      expect(screen.getByText('Sarah Connor')).toBeInTheDocument()
      expect(screen.queryByText('Marcus Brody')).not.toBeInTheDocument()
    })

    // Open Role Change Modal for Sarah Connor
    const changeRoleButtons = screen.getAllByRole('button', { name: /Change Role/i })
    fireEvent.click(changeRoleButtons[0])

    expect(screen.getByText('Modify Account Role')).toBeInTheDocument()
    expect(screen.getByText(/Elevating to Platform Administrator/i)).toBeInTheDocument()

    // Confirm role change
    const confirmBtn = screen.getByRole('button', { name: /Confirm Role Change to ADMIN/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.queryByText('Modify Account Role')).not.toBeInTheDocument()
    })
  })

  it('AdminDashboard navigates to Course Management and opens course creator', async () => {
    render(<AdminDashboard csrfToken="admin-csrf-123" />)

    // Switch to Course Management Tab
    const courseTabBtn = screen.getByRole('button', { name: /Course Management/i })
    fireEvent.click(courseTabBtn)

    await waitFor(() => {
      expect(screen.getByText('Published Curriculum Inventory')).toBeInTheDocument()
      expect(screen.getByText('Computer Networking & Protocol Defense')).toBeInTheDocument()
    })

    // Open Create Course Modal
    const createBtn = screen.getByRole('button', { name: /Create New Course/i })
    fireEvent.click(createBtn)

    expect(screen.getByText('Create New Cybersecurity Course')).toBeInTheDocument()
    expect(screen.getByLabelText('Course Title')).toBeInTheDocument()

    // Fill form and create course
    fireEvent.change(screen.getByLabelText('Course Title'), {
      target: { value: 'Advanced Cloud Incident Response' },
    })
    fireEvent.change(screen.getByLabelText('Syllabus & Overview Description'), {
      target: { value: 'Deep dive into AWS CloudTrail log forensics and Kubernetes container escape detection.' },
    })

    const publishBtn = screen.getByRole('button', { name: /Publish Course/i })
    fireEvent.click(publishBtn)

    await waitFor(() => {
      expect(screen.queryByText('Create New Cybersecurity Course')).not.toBeInTheDocument()
    })

    expect(
      screen.getAllByText('Advanced Cloud Incident Response').length
    ).toBeGreaterThanOrEqual(1)
  })

  it('AdminDashboard navigates to Moderation Console and allows thread moderation actions', async () => {
    render(<AdminDashboard csrfToken="admin-csrf-123" />)

    // Switch to Moderation Tab
    const modTabBtn = screen.getByRole('button', { name: /Moderation & Threat Intel/i })
    fireEvent.click(modTabBtn)

    await waitFor(() => {
      expect(screen.getByText('Forum Thread Moderation Queue')).toBeInTheDocument()
      expect(screen.getByText(/How does double-submit cookie pattern prevent CSRF/i)).toBeInTheDocument()
    })

    // Pin thread
    const pinBtn = screen.getAllByRole('button', { name: /Unpin/i })[0]
    fireEvent.click(pinBtn)

    // Verify button toggled to Pin
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Pin/i })[0]).toBeInTheDocument()
    })
  })
})
