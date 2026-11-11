import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { LearningAcademy } from '../src/components/LearningAcademy'

describe('learning academy', () => {
  beforeEach(() => window.localStorage.clear())

  it('opens a course and records a lesson after a correct knowledge check', () => {
    render(<LearningAcademy />)

    fireEvent.click(screen.getAllByRole('button', { name: /start this path/i })[0])
    expect(screen.getByRole('heading', { name: 'What cybersecurity protects' })).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText(/a practice for reducing risk to systems and people/i))
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByRole('status')).toHaveTextContent(/combines people, processes, and technology/i)
    fireEvent.click(screen.getByRole('button', { name: /mark lesson complete/i }))

    expect(screen.getByText('1 / 3 COMPLETE')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /all learning paths/i }))
    const foundations = screen.getByRole('heading', { name: 'Cybersecurity foundations' }).closest('article')!
    expect(within(foundations).getByText('1 of 3 lessons complete')).toBeInTheDocument()
  })

  it('opens a lesson requested from the glossary', () => {
    render(<LearningAcademy lessonRequest={{ courseId: 'network', lessonIndex: 1 }} />)
    expect(screen.getByRole('heading', { name: 'DNS: names to destinations' })).toBeInTheDocument()
  })
})
