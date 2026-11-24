import crypto from 'node:crypto'
import express from 'express'
import session from 'express-session'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { labsRouter } from './router.js'

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text.trim()).digest('hex')
}

function createLabsTestApp(prismaMock: Record<string, unknown>) {
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

  app.use('/api', labsRouter(prismaMock as unknown as PrismaClient))
  return app
}

describe('Cybersecurity Labs API Module (Phase 5)', () => {
  const mockLab = {
    id: 'lab-1',
    slug: 'linux-cli-mastery',
    title: 'Linux Privileges & Log Hunting',
    description: 'Learn Linux CLI forensics',
    categorySlug: 'linux-fundamentals',
    difficulty: 'BEGINNER',
    duration: '25 min',
    xpReward: 150,
    type: 'linux-cli',
    instructions: 'Access the simulated workstation terminal.',
    tasks: [
      {
        id: 'task-1',
        labId: 'lab-1',
        title: 'Task 1: Uncover Hidden Vault Flag',
        instruction: 'Find hidden vault file',
        hint: 'Use ls -la',
        flagHash: sha256('KW{l1nux_b4sh_m4st3r}'),
        points: 50,
        orderIndex: 0,
      },
      {
        id: 'task-2',
        labId: 'lab-1',
        title: 'Task 2: Audit Failed Logins',
        instruction: 'Inspect /var/log/auth.log',
        hint: 'Grep failed attempts',
        flagHash: sha256('KW{auth_f41l_c0unt_42}'),
        points: 50,
        orderIndex: 1,
      },
    ],
  }

  it('GET /api/labs returns a list of practical labs without leaking flag hashes', async () => {
    const prisma = {
      lab: {
        findMany: vi.fn().mockResolvedValue([
          {
            ...mockLab,
            tasks: mockLab.tasks.map((t) => ({
              id: t.id,
              title: t.title,
              instruction: t.instruction,
              hint: t.hint,
              points: t.points,
              orderIndex: t.orderIndex,
            })),
          },
        ]),
        count: vi.fn().mockResolvedValue(1),
      },
    }

    const app = createLabsTestApp(prisma)
    const res = await request(app).get('/api/labs').expect(200)

    expect(res.body.total).toBe(1)
    expect(res.body.labs).toHaveLength(1)
    expect(res.body.labs[0].slug).toBe('linux-cli-mastery')
    expect(res.body.labs[0].totalTasks).toBe(2)
    expect(res.body.labs[0].totalPoints).toBe(100)
    // Verify flagHash is never exposed in API output
    expect(res.body.labs[0].tasks[0].flagHash).toBeUndefined()
  })

  it('GET /api/labs/:slug returns 404 for nonexistent lab', async () => {
    const prisma = {
      lab: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    }

    const app = createLabsTestApp(prisma)
    await request(app).get('/api/labs/unknown-lab').expect(404)
  })

  it('GET /api/labs/:slug returns lab details and task instructions', async () => {
    const prisma = {
      lab: {
        findUnique: vi.fn().mockResolvedValue({
          ...mockLab,
          tasks: mockLab.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            instruction: t.instruction,
            hint: t.hint,
            points: t.points,
            orderIndex: t.orderIndex,
          })),
        }),
      },
    }

    const app = createLabsTestApp(prisma)
    const res = await request(app).get('/api/labs/linux-cli-mastery').expect(200)

    expect(res.body.lab.title).toBe('Linux Privileges & Log Hunting')
    expect(res.body.lab.tasks).toHaveLength(2)
    expect(res.body.lab.tasks[0].flagHash).toBeUndefined()
  })

  it('POST /api/labs/:slug/start requires authentication', async () => {
    const prisma = {
      lab: { findUnique: vi.fn() },
    }

    const app = createLabsTestApp(prisma)
    const res = await request(app).post('/api/labs/linux-cli-mastery/start').expect(401)
    expect(res.body.error).toMatch(/authentication required/i)
  })

  it('POST /api/labs/:slug/verify checks submitted flag with SHA-256 and awards points', async () => {
    const prisma = {
      lab: {
        findUnique: vi.fn().mockResolvedValue(mockLab),
      },
      labAttempt: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          userId: 'learner-test-1',
          labId: 'lab-1',
          completedTasks: [],
          xpAwarded: 0,
          status: 'IN_PROGRESS',
        }),
        update: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          completedTasks: ['task-1'],
          xpAwarded: 50,
          status: 'IN_PROGRESS',
        }),
      },
      learningStreak: {
        upsert: vi.fn().mockResolvedValue({ currentStreak: 1 }),
      },
    }

    const app = createLabsTestApp(prisma)
    const agent = request.agent(app)

    const authRes = await agent.post('/test/auth').expect(200)
    const csrfToken = authRes.body.csrfToken

    // 1. Submit incorrect flag
    const wrongRes = await agent
      .post('/api/labs/linux-cli-mastery/verify')
      .set('X-CSRF-Token', csrfToken)
      .send({ taskId: 'task-1', flag: 'KW{wrong_guess}' })
      .expect(200)

    expect(wrongRes.body.success).toBe(false)
    expect(wrongRes.body.taskCompleted).toBe(false)

    // 2. Submit correct flag
    const correctRes = await agent
      .post('/api/labs/linux-cli-mastery/verify')
      .set('X-CSRF-Token', csrfToken)
      .send({ taskId: 'task-1', flag: 'KW{l1nux_b4sh_m4st3r}' })
      .expect(200)

    expect(correctRes.body.success).toBe(true)
    expect(correctRes.body.taskCompleted).toBe(true)
    expect(correctRes.body.pointsEarned).toBe(50)
  })

  it('POST /api/labs/:slug/reset resets user attempt progress', async () => {
    const prisma = {
      lab: {
        findUnique: vi.fn().mockResolvedValue(mockLab),
      },
      labAttempt: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    }

    const app = createLabsTestApp(prisma)
    const agent = request.agent(app)

    const authRes = await agent.post('/test/auth').expect(200)
    const csrfToken = authRes.body.csrfToken

    const res = await agent
      .post('/api/labs/linux-cli-mastery/reset')
      .set('X-CSRF-Token', csrfToken)
      .expect(200)

    expect(res.body.message).toMatch(/reset successfully/i)
  })
})
