import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StudentDashboard } from '../src/components/StudentDashboard'
import { saveLearningProgress, progressStorageKey } from '../src/data/progress'

describe('learner dashboard', () => {
  beforeEach(() => window.localStorage.clear())

  it('reflects completed lessons when learning progress changes', async () => {
    const { container } = render(<StudentDashboard />)
    expect(container.querySelector('.summary-count')).toHaveTextContent('0 / 9 lessons')

    saveLearningProgress({ foundations: [0, 1] })
    await waitFor(() => expect(container.querySelector('.summary-count')).toHaveTextContent('2 / 9 lessons'))
    expect(screen.getByText('22% complete')).toBeInTheDocument()
    expect(window.localStorage.getItem(progressStorageKey)).toContain('foundations')
  })

  it('unlocks a printable completion record only after every course lesson is done', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    render(<StudentDashboard displayName="Karma Learner" />)
    expect(screen.queryByRole('button', { name: /print earned certificates/i })).not.toBeInTheDocument()

    saveLearningProgress({ foundations: [0, 1, 2] })
    await waitFor(() => expect(screen.getByText('Certificate unlocked')).toBeInTheDocument())
    expect(screen.getByText('Karma Learner')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /print earned certificates/i }))
    expect(print).toHaveBeenCalledOnce()
    expect(document.body).toHaveClass('printing-certificate')
    window.dispatchEvent(new Event('afterprint'))
    expect(document.body).not.toHaveClass('printing-certificate')
    print.mockRestore()
  })
})
