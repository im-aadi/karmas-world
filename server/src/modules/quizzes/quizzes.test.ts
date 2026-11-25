import express from 'express'
import session from 'express-session'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { quizzesRouter } from './router.js'

function createQuizTestApp(prismaMock: Record<string, unknown>) {
  const app = express()
  app.use(express.json())
  app.use(
    session({
      secret: 'test-secret-at-least-32-chars-long-12345',
      resave: false,
      saveUninitialized: false,
    })
  )
  app.locals.isAllowedOrigin = () => true

  app.post('/test/auth', (req, res) => {
    req.session.userId = 'learner-test-1'
    req.session.csrfToken = 'valid-csrf-token'
    res.json({ sessionId: req.sessionID, csrfToken: req.session.csrfToken })
  })

  app.use('/api/quizzes', quizzesRouter(prismaMock as unknown as PrismaClient))
  return app
}

describe('Quiz & Assessment Engine API (Phase 8)', () => {
  it('GET /api/quizzes lists available quizzes with summary counts', async () => {
    const prisma = {
      quiz: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'quiz-1',
            slug: 'networking-fundamentals-assessment',
            title: 'Computer Networking Assessment',
            description: 'OSI layers and TCP/IP',
            categorySlug: 'computer-networking',
            difficulty: 'BEGINNER',
            timeLimitMins: 15,
            passingScore: 70,
            xpReward: 150,
            questions: [{ id: 'q1', points: 20 }, { id: 'q2', points: 20 }],
            attempts: [],
          },
        ]),
      },
    }

    const app = createQuizTestApp(prisma)
    const res = await request(app).get('/api/quizzes').expect(200)

    expect(res.body.quizzes).toHaveLength(1)
    expect(res.body.quizzes[0].slug).toBe('networking-fundamentals-assessment')
    expect(res.body.quizzes[0].totalQuestions).toBe(2)
    expect(res.body.quizzes[0].totalPoints).toBe(40)
  })

  it('GET /api/quizzes/:slug sanitizes questions and options against answer leakage', async () => {
    const prisma = {
      quiz: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'quiz-1',
          slug: 'networking-fundamentals-assessment',
          title: 'Computer Networking Assessment',
          description: 'OSI layers and TCP/IP',
          categorySlug: 'computer-networking',
          difficulty: 'BEGINNER',
          timeLimitMins: 15,
          passingScore: 70,
          xpReward: 150,
          questions: [
            {
              id: 'q1',
              prompt: 'At which layer does a stateful firewall inspect ports?',
              codeSnippet: null,
              orderIndex: 0,
              points: 20,
              options: [
                { id: 'opt1', text: 'Layer 3', orderIndex: 0 },
                { id: 'opt2', text: 'Layer 4', orderIndex: 1 },
              ],
            },
          ],
          attempts: [],
        }),
      },
    }

    const app = createQuizTestApp(prisma)
    const res = await request(app).get('/api/quizzes/networking-fundamentals-assessment').expect(200)

    expect(res.body.quiz.title).toBe('Computer Networking Assessment')
    const question = res.body.quiz.questions[0]
    expect(question.prompt).toContain('stateful firewall')

    // Crucial security assertions: isCorrect and explanation must not leak before submission
    expect(question.explanation).toBeUndefined()
    expect(question.options[0].isCorrect).toBeUndefined()
    expect(question.options[1].isCorrect).toBeUndefined()
  })

  it('POST /api/quizzes/:slug/submit grades answers server-side, records attempt, and returns review', async () => {
    const prisma = {
      quiz: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'quiz-1',
          slug: 'networking-fundamentals-assessment',
          title: 'Computer Networking Assessment',
          passingScore: 70,
          xpReward: 150,
          questions: [
            {
              id: 'q1',
              prompt: 'Layer 4 handles what?',
              points: 50,
              explanation: 'Transport layer handles end-to-end communication.',
              options: [
                { id: 'opt-a', text: 'Transport', isCorrect: true },
                { id: 'opt-b', text: 'Physical', isCorrect: false },
              ],
            },
            {
              id: 'q2',
              prompt: 'What port does SSH use?',
              points: 50,
              explanation: 'Port 22 is used for SSH.',
              options: [
                { id: 'opt-c', text: 'Port 22', isCorrect: true },
                { id: 'opt-d', text: 'Port 80', isCorrect: false },
              ],
            },
          ],
        }),
      },
      quizAttempt: {
        findFirst: vi.fn().mockResolvedValue(null), // First time passing
        create: vi.fn().mockResolvedValue({ id: 'attempt-1' }),
      },
      user: {
        update: vi.fn().mockResolvedValue({ id: 'learner-test-1', totalXp: 350 }),
      },
      xPTransaction: {
        create: vi.fn().mockResolvedValue({ id: 'tx-1' }),
      },
      $transaction: vi.fn().mockImplementation((promises) => Promise.all(promises)),
      achievement: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    }

    const app = createQuizTestApp(prisma)
    const agent = request.agent(app)
    const authRes = await agent.post('/test/auth').expect(200)

    // Submit 2/2 correct answers (100%)
    const res = await agent
      .post('/api/quizzes/networking-fundamentals-assessment/submit')
      .set('x-csrf-token', authRes.body.csrfToken)
      .send({
        answers: {
          q1: 'opt-a',
          q2: 'opt-c',
        },
        timeSpentSecs: 120,
      })
      .expect(200)

    expect(res.body.score).toBe(100)
    expect(res.body.maxScore).toBe(100)
    expect(res.body.percentage).toBe(100)
    expect(res.body.passed).toBe(true)
    expect(res.body.xpAwarded).toBe(150)

    // Review includes explanations and answer comparison
    expect(res.body.review).toHaveLength(2)
    expect(res.body.review[0].isCorrect).toBe(true)
    expect(res.body.review[0].explanation).toBe('Transport layer handles end-to-end communication.')
    expect(res.body.review[0].correctOptionId).toBe('opt-a')

    expect(prisma.quizAttempt.create).toHaveBeenCalled()
  })

  it('POST /api/quizzes/:slug/submit correctly marks failed attempts below passing score', async () => {
    const prisma = {
      quiz: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'quiz-1',
          slug: 'networking-fundamentals-assessment',
          title: 'Computer Networking Assessment',
          passingScore: 70,
          xpReward: 150,
          questions: [
            {
              id: 'q1',
              prompt: 'Question 1',
              points: 50,
              explanation: 'Exp 1',
              options: [
                { id: 'opt-1', text: 'Correct', isCorrect: true },
                { id: 'opt-2', text: 'Wrong', isCorrect: false },
              ],
            },
            {
              id: 'q2',
              prompt: 'Question 2',
              points: 50,
              explanation: 'Exp 2',
              options: [
                { id: 'opt-3', text: 'Correct', isCorrect: true },
                { id: 'opt-4', text: 'Wrong', isCorrect: false },
              ],
            },
          ],
        }),
      },
      quizAttempt: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'attempt-failed' }),
      },
    }

    const app = createQuizTestApp(prisma)
    const agent = request.agent(app)
    const authRes = await agent.post('/test/auth').expect(200)

    // Submit 0/2 correct answers (0%)
    const res = await agent
      .post('/api/quizzes/networking-fundamentals-assessment/submit')
      .set('x-csrf-token', authRes.body.csrfToken)
      .send({
        answers: {
          q1: 'opt-2',
          q2: 'opt-4',
        },
        timeSpentSecs: 45,
      })
      .expect(200)

    expect(res.body.score).toBe(0)
    expect(res.body.percentage).toBe(0)
    expect(res.body.passed).toBe(false)
    expect(res.body.xpAwarded).toBe(0)
    expect(res.body.review[0].isCorrect).toBe(false)
  })
})
