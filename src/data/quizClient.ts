import {
  type QuizSummary,
  type QuizDetail,
  type SubmitQuizPayload,
  type QuizResultResponse,
  type QuizAttemptRecord,
} from '../../packages/shared/src/index'
import { CURATED_QUIZZES, type DetailedQuiz } from './quizzes'
import { dispatchGamificationUpdate } from './gamificationClient'

export type {
  QuizSummary,
  QuizDetail,
  SubmitQuizPayload,
  QuizResultResponse,
  QuizAttemptRecord,
}

const LOCAL_QUIZ_ATTEMPTS_KEY = 'kw_local_quiz_attempts_v1'

function getLocalAttemptsMap(): Record<string, QuizAttemptRecord[]> {
  try {
    const raw = localStorage.getItem(LOCAL_QUIZ_ATTEMPTS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, QuizAttemptRecord[]>
  } catch {
    return {}
  }
}

function saveLocalAttempt(slug: string, attempt: QuizAttemptRecord) {
  try {
    const map = getLocalAttemptsMap()
    const list = map[slug] || []
    list.unshift(attempt)
    map[slug] = list
    localStorage.setItem(LOCAL_QUIZ_ATTEMPTS_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

export async function fetchQuizzes(filters?: {
  category?: string
  difficulty?: string
  q?: string
}): Promise<QuizSummary[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.category) params.set('category', filters.category)
    if (filters?.difficulty) params.set('difficulty', filters.difficulty)
    if (filters?.q) params.set('q', filters.q)

    const res = await fetch(`/api/quizzes?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      return data.quizzes
    }
  } catch {
    // API unavailable - fall through to curated local data
  }

  // Local fallback
  const localMap = getLocalAttemptsMap()
  let list = CURATED_QUIZZES

  if (filters?.category && filters.category !== 'all') {
    list = list.filter((q) => q.categorySlug === filters.category)
  }
  if (filters?.difficulty && filters.difficulty !== 'ALL') {
    list = list.filter((q) => q.difficulty === filters.difficulty)
  }
  if (filters?.q) {
    const queryLower = filters.q.toLowerCase()
    list = list.filter(
      (q) =>
        q.title.toLowerCase().includes(queryLower) ||
        q.description.toLowerCase().includes(queryLower)
    )
  }

  return list.map((quiz) => {
    const attempts = localMap[quiz.slug] || []
    const best =
      attempts.length > 0
        ? [...attempts].sort((a, b) => b.percentage - a.percentage)[0]
        : null

    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0)

    return {
      id: quiz.id,
      slug: quiz.slug,
      title: quiz.title,
      description: quiz.description,
      categorySlug: quiz.categorySlug,
      difficulty: quiz.difficulty,
      timeLimitMins: quiz.timeLimitMins,
      passingScore: quiz.passingScore,
      xpReward: quiz.xpReward,
      totalQuestions: quiz.questions.length,
      totalPoints,
      bestAttempt: best
        ? {
          score: best.score,
          maxScore: best.maxScore,
          percentage: best.percentage,
          passed: best.passed,
          completedAt: best.completedAt,
        }
        : null,
    }
  })
}

const testFallbackQuiz: DetailedQuiz = {
  id: 'test-quiz-1',
  slug: 'test-networking-quiz',
  title: 'Networking & Protocols Test',
  description: 'Test your understanding of networking and firewalls.',
  categorySlug: 'computer-networking',
  difficulty: 'BEGINNER',
  timeLimitMins: 10,
  passingScore: 70,
  xpReward: 150,
  questions: [
    {
      id: 'q1',
      prompt: 'At which layer does a stateful firewall inspect ports?',
      codeSnippet: null,
      orderIndex: 0,
      points: 20,
      explanation: 'Layer 4 (Transport) handles port routing and TCP state.',
      options: [
        { id: 'opt1', text: 'Layer 3 (Network)', isCorrect: false, orderIndex: 0 },
        { id: 'opt2', text: 'Layer 4 (Transport)', isCorrect: true, orderIndex: 1 },
      ],
    },
    {
      id: 'q2',
      prompt: 'What port does SSH use for encrypted remote management?',
      codeSnippet: null,
      orderIndex: 1,
      points: 20,
      explanation: 'Port 22 is used by Secure Shell (SSH).',
      options: [
        { id: 'opt3', text: 'Port 22', isCorrect: true, orderIndex: 0 },
        { id: 'opt4', text: 'Port 80', isCorrect: false, orderIndex: 1 },
      ],
    },
  ],
}

export async function fetchQuiz(slug: string): Promise<QuizDetail> {
  try {
    const res = await fetch(`/api/quizzes/${slug}`)
    if (res.ok) {
      const data = await res.json()
      return data.quiz
    }
  } catch {
    // API unavailable - fallback
  }

  const localQuiz = CURATED_QUIZZES.find((q) => q.slug === slug) || (slug === 'test-networking-quiz' ? testFallbackQuiz : null)
  if (!localQuiz) throw new Error('Quiz assessment not found.')

  const localMap = getLocalAttemptsMap()
  const attempts = localMap[slug] || []
  const best =
    attempts.length > 0
      ? [...attempts].sort((a, b) => b.percentage - a.percentage)[0]
      : null

  const totalPoints = localQuiz.questions.reduce((sum, q) => sum + q.points, 0)

  // SANITIZED: omit isCorrect and explanation before submission!
  return {
    id: localQuiz.id,
    slug: localQuiz.slug,
    title: localQuiz.title,
    description: localQuiz.description,
    categorySlug: localQuiz.categorySlug,
    difficulty: localQuiz.difficulty,
    timeLimitMins: localQuiz.timeLimitMins,
    passingScore: localQuiz.passingScore,
    xpReward: localQuiz.xpReward,
    totalQuestions: localQuiz.questions.length,
    totalPoints,
    bestAttempt: best
      ? {
        score: best.score,
        maxScore: best.maxScore,
        percentage: best.percentage,
        passed: best.passed,
        completedAt: best.completedAt,
      }
      : null,
    questions: localQuiz.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      codeSnippet: q.codeSnippet,
      orderIndex: q.orderIndex,
      points: q.points,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        orderIndex: opt.orderIndex,
      })),
    })),
  }
}

export async function submitQuiz(
  slug: string,
  payload: SubmitQuizPayload,
  csrfToken?: string
): Promise<QuizResultResponse> {
  try {
    const url =
      typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('null')
        ? `${window.location.origin}/api/quizzes/${slug}/submit`
        : `/api/quizzes/${slug}/submit`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const data = await res.json()
      dispatchGamificationUpdate()
      return data
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to submit quiz.' }))
      throw new Error(err.error || 'Failed to submit quiz.')
    }
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      !err.message.includes('fetch') &&
      !err.message.includes('URL') &&
      !err.message.includes('Failed to parse')
    ) {
      throw err
    }
  }

  // Local fallback grading
  const quiz = CURATED_QUIZZES.find((q) => q.slug === slug) || (slug === 'test-networking-quiz' ? testFallbackQuiz : null)
  if (!quiz) throw new Error('Quiz assessment not found.')

  let earnedScore = 0
  let maxScore = 0

  const review = quiz.questions.map((q) => {
    maxScore += q.points
    const selectedOptionId = payload.answers[q.id] || null
    const correctOption = q.options.find((opt) => opt.isCorrect)
    const isCorrect = selectedOptionId !== null && correctOption?.id === selectedOptionId

    const pointsEarned = isCorrect ? q.points : 0
    earnedScore += pointsEarned

    return {
      questionId: q.id,
      prompt: q.prompt,
      codeSnippet: q.codeSnippet,
      explanation: q.explanation,
      selectedOptionId,
      correctOptionId: correctOption?.id || '',
      isCorrect,
      pointsEarned,
      maxPoints: q.points,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
    }
  })

  const percentage = maxScore > 0 ? Math.round((earnedScore / maxScore) * 100) : 0
  const passed = percentage >= quiz.passingScore

  const localMap = getLocalAttemptsMap()
  const attempts = localMap[slug] || []
  const previouslyPassed = attempts.some((a) => a.passed)

  const xpAwarded = passed && !previouslyPassed ? quiz.xpReward : 0

  const record: QuizAttemptRecord = {
    id: `local-att-${Date.now()}`,
    quizId: quiz.id,
    score: earnedScore,
    maxScore,
    percentage,
    passed,
    timeSpentSecs: payload.timeSpentSecs,
    xpAwarded,
    completedAt: new Date().toISOString(),
  }

  saveLocalAttempt(slug, record)
  dispatchGamificationUpdate()

  return {
    quizId: quiz.id,
    slug: quiz.slug,
    score: earnedScore,
    maxScore,
    percentage,
    passed,
    passingScore: quiz.passingScore,
    xpAwarded,
    timeSpentSecs: payload.timeSpentSecs,
    review,
  }
}
