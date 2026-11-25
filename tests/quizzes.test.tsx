import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QuizCatalog } from '../src/components/quizzes/QuizCatalog'
import { QuizWorkspaceModal } from '../src/components/quizzes/QuizWorkspaceModal'
import type { QuizDetail } from '../src/data/quizClient'

const mockQuizDetail: QuizDetail = {
  id: 'test-quiz-1',
  slug: 'test-networking-quiz',
  title: 'Networking & Protocols Test',
  description: 'Test your understanding of networking and firewalls.',
  categorySlug: 'computer-networking',
  difficulty: 'BEGINNER',
  timeLimitMins: 10,
  passingScore: 70,
  xpReward: 150,
  totalQuestions: 2,
  totalPoints: 40,
  questions: [
    {
      id: 'q1',
      prompt: 'At which layer does a stateful firewall inspect ports?',
      codeSnippet: null,
      orderIndex: 0,
      points: 20,
      options: [
        { id: 'opt1', text: 'Layer 3 (Network)', orderIndex: 0 },
        { id: 'opt2', text: 'Layer 4 (Transport)', orderIndex: 1 },
      ],
    },
    {
      id: 'q2',
      prompt: 'What port does SSH use for encrypted remote management?',
      codeSnippet: null,
      orderIndex: 1,
      points: 20,
      options: [
        { id: 'opt3', text: 'Port 22', orderIndex: 0 },
        { id: 'opt4', text: 'Port 80', orderIndex: 1 },
      ],
    },
  ],
}

describe('Phase 8: Quiz and Assessment Engine Components', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it('QuizCatalog renders available assessments, filters, and loads details', async () => {
    render(<QuizCatalog />)

    expect(screen.getByText('Test your knowledge.')).toBeInTheDocument()
    expect(screen.getByText('Verify your cybersecurity skills.')).toBeInTheDocument()

    // Quizzes load from curated list
    await waitFor(() => {
      expect(
        screen.getByText('Computer Networking & Packet Protocols Assessment')
      ).toBeInTheDocument()
    })

    expect(screen.getByText('OWASP Top 10 Web Application Security Exam')).toBeInTheDocument()

    // Filter by difficulty: ADVANCED
    const diffSelect = screen.getByDisplayValue('All Levels')
    fireEvent.change(diffSelect, { target: { value: 'ADVANCED' } })

    await waitFor(() => {
      expect(
        screen.getByText('SOC Analyst & Incident Response Triage Exam')
      ).toBeInTheDocument()
      expect(
        screen.queryByText('Computer Networking & Packet Protocols Assessment')
      ).not.toBeInTheDocument()
    })
  })

  it('QuizWorkspaceModal renders question prompt, allows answering, navigation, and submission review', async () => {
    const onClose = vi.fn()
    const onCompleted = vi.fn()

    render(
      <QuizWorkspaceModal
        quiz={mockQuizDetail}
        csrfToken="test-csrf"
        onClose={onClose}
        onQuizCompleted={onCompleted}
      />
    )

    // Verify modal header & question 1
    expect(screen.getByText('Networking & Protocols Test')).toBeInTheDocument()
    expect(screen.getByText(/At which layer does a stateful firewall inspect ports\?/i)).toBeInTheDocument()
    expect(screen.getByText('20 Points')).toBeInTheDocument()

    // Select Option 2 for Question 1
    const option2 = screen.getByText('Layer 4 (Transport)')
    fireEvent.click(option2)

    // Click Next button to navigate to Question 2
    const nextBtn = screen.getByRole('button', { name: /Next/i })
    fireEvent.click(nextBtn)

    // Verify question 2 prompt
    expect(screen.getByText(/What port does SSH use for encrypted remote management\?/i)).toBeInTheDocument()

    // Select Option 1 (Port 22) for Question 2
    const port22Option = screen.getByText('Port 22')
    fireEvent.click(port22Option)

    // Submit Examination
    const submitBtn = screen.getByRole('button', { name: /Submit Examination/i })
    fireEvent.click(submitBtn)

    // Await grading results screen
    await waitFor(() => {
      expect(screen.getByText(/Assessment Passed — Well Done!/i)).toBeInTheDocument()
    })

    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText(/Comprehensive Question-by-Question Review/i)).toBeInTheDocument()
    expect(onCompleted).toHaveBeenCalledWith(
      expect.objectContaining({
        percentage: 100,
        passed: true,
      })
    )

    // Close review
    fireEvent.click(screen.getByRole('button', { name: /Finish & Close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('QuizWorkspaceModal handles retaking exam to reset submission state', async () => {
    render(<QuizWorkspaceModal quiz={mockQuizDetail} onClose={vi.fn()} />)

    // Select an answer and submit directly
    fireEvent.click(screen.getByText('Layer 4 (Transport)'))
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    fireEvent.click(screen.getByRole('button', { name: /Submit Examination/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Retake Exam/i })).toBeInTheDocument()
    })

    // Click Retake Exam
    fireEvent.click(screen.getByRole('button', { name: /Retake Exam/i }))

    // Exam view is restored
    expect(screen.getByText(/At which layer does a stateful firewall inspect ports\?/i)).toBeInTheDocument()
    expect(screen.queryByText(/Assessment Passed/i)).not.toBeInTheDocument()
  })
})
