import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CourseCatalog } from '../src/components/CourseCatalog'

describe('CourseCatalog component', () => {
  it('renders the course catalog section with title and search bar', () => {
    render(<CourseCatalog />)

    expect(screen.getByRole('heading', { name: /structured courses/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/search 20 cybersecurity courses/i)).toBeInTheDocument()
    expect(screen.getByText(/showing/i)).toBeInTheDocument()
    expect(screen.getByText(/of 20 courses/i)).toBeInTheDocument()
  })

  it('filters courses by text search query', () => {
    render(<CourseCatalog />)

    const searchInput = screen.getByPlaceholderText(/search 20 cybersecurity courses/i)
    fireEvent.change(searchInput, { target: { value: 'Python' } })

    expect(screen.getByText(/Python for Cybersecurity & Automation/i)).toBeInTheDocument()
    expect(screen.queryByText(/Digital Forensics & Artifact Investigation/i)).not.toBeInTheDocument()
  })

  it('filters courses by difficulty level', () => {
    render(<CourseCatalog />)

    const difficultySelect = screen.getByRole('combobox', { name: /filter by difficulty/i })
    fireEvent.change(difficultySelect, { target: { value: 'ADVANCED' } })

    expect(screen.getByText(/Digital Forensics & Artifact Investigation/i)).toBeInTheDocument()
    expect(screen.getByText(/Static & Dynamic Malware Analysis/i)).toBeInTheDocument()
    expect(screen.queryByText(/Computer Architecture & Systems Fundamentals/i)).not.toBeInTheDocument()
  })

  it('filters courses by category', () => {
    render(<CourseCatalog />)

    const categorySelect = screen.getByRole('combobox', { name: /filter by category/i })
    fireEvent.change(categorySelect, { target: { value: 'cryptography' } })

    expect(screen.getByText(/Applied Cryptography & Public Key Infrastructure/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Linux Fundamentals/i })).not.toBeInTheDocument()
  })

  it('opens and closes course details modal with complete syllabus and objectives', () => {
    const handleStart = vi.fn()
    render(<CourseCatalog onStartCourse={handleStart} />)

    // Click on View Details for Computer Architecture
    const viewButtons = screen.getAllByRole('button', { name: /view details/i })
    fireEvent.click(viewButtons[0])

    // Verify modal content
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /what you will learn/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /prerequisites/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /course syllabus & modules/i })).toBeInTheDocument()

    // Click Start This Course inside modal
    const startButton = screen.getByRole('button', { name: /start this course/i })
    fireEvent.click(startButton)
    expect(handleStart).toHaveBeenCalledOnce()

    // Verify modal is closed after starting
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
