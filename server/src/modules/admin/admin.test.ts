import express from 'express'
import session from 'express-session'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { adminRouter } from './router.js'

function createAdminTestApp(prismaMock: Record<string, unknown>, currentUserId = 'admin-user-1') {
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

  app.post('/test/auth-admin', (req, res) => {
    req.session.userId = currentUserId
    req.session.csrfToken = 'valid-admin-csrf'
    res.json({ sessionId: req.sessionID, csrfToken: req.session.csrfToken })
  })

  app.use('/api/admin', adminRouter(prismaMock as unknown as PrismaClient))
  return app
}

describe('Admin Dashboard API (Phase 10)', () => {
  it('GET /api/admin/analytics returns system metrics, pass rate, and security events', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ role: 'ADMIN' }),
        count: vi.fn().mockImplementation(({ where }) => (where?.role === 'ADMIN' ? 2 : 120)),
        aggregate: vi.fn().mockResolvedValue({ _sum: { totalXp: 45000 } }),
      },
      lessonProgress: { count: vi.fn().mockResolvedValue(530) },
      enrollment: { count: vi.fn().mockResolvedValue(210) },
      quizAttempt: {
        count: vi.fn().mockImplementation((args?: { where?: { passed?: boolean } }) =>
          args?.where?.passed ? 85 : 100
        ),
      },
      forumThread: { count: vi.fn().mockResolvedValue(34) },
      communityReport: { count: vi.fn().mockResolvedValue(2) },
      course: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'c1',
            title: 'Intro to Ethical Hacking',
            slug: 'intro-ethical-hacking',
            level: 'BEGINNER',
            _count: { enrollments: 82 },
          },
        ]),
      },
      securityEvent: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'ev-1',
            type: 'ACCOUNT_CREATED',
            userAgent: 'Mozilla/5.0',
            createdAt: new Date('2026-11-20T10:00:00Z'),
            user: { id: 'u1', displayName: 'Learner One', email: 'one@example.com' },
          },
        ]),
      },
    }

    const app = createAdminTestApp(prisma)
    const agent = request.agent(app)
    await agent.post('/test/auth-admin')

    const res = await agent.get('/api/admin/analytics')
    expect(res.status).toBe(200)
    expect(res.body.analytics.totalLearners).toBe(120)
    expect(res.body.analytics.quizPassingRatePercent).toBe(85)
    expect(res.body.analytics.totalXpAwarded).toBe(45000)
    expect(res.body.analytics.topCourses[0].title).toBe('Intro to Ethical Hacking')
  })

  it('GET /api/admin/users lists registered accounts with cyber rank calculation', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ role: 'ADMIN' }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'user-123',
            displayName: 'Sarah Connor',
            email: 'sarah@example.com',
            role: 'LEARNER',
            totalXp: 1500,
            emailVerifiedAt: new Date(),
            mfaEnabledAt: null,
            createdAt: new Date('2026-10-01T08:00:00Z'),
            _count: { progress: 8, enrollments: 2 },
          },
        ]),
      },
    }

    const app = createAdminTestApp(prisma)
    const agent = request.agent(app)
    await agent.post('/test/auth-admin')

    const res = await agent.get('/api/admin/users?q=Sarah')
    expect(res.status).toBe(200)
    expect(res.body.users).toHaveLength(1)
    expect(res.body.users[0].rankTitle).toBe('Defender')
    expect(res.body.users[0].completedLessonsCount).toBe(8)
  })

  it('PATCH /api/admin/users/:userId/role updates role and enforces self-demotion protection', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ role: 'ADMIN' }),
        update: vi.fn().mockResolvedValue({
          id: 'target-user',
          role: 'ADMIN',
          displayName: 'Target User',
          email: 'target@example.com',
        }),
      },
      securityEvent: {
        create: vi.fn().mockResolvedValue({}),
      },
    }

    const app = createAdminTestApp(prisma, 'admin-user-1')
    const agent = request.agent(app)
    const authRes = await agent.post('/test/auth-admin')
    const csrfToken = authRes.body.csrfToken

    // Update target user's role to ADMIN
    const successRes = await agent
      .patch('/api/admin/users/target-user/role')
      .set('x-csrf-token', csrfToken)
      .send({ role: 'ADMIN' })

    expect(successRes.status).toBe(200)
    expect(successRes.body.user.role).toBe('ADMIN')

    // Self-demotion attempt must be blocked with 400
    const selfDemoteRes = await agent
      .patch('/api/admin/users/admin-user-1/role')
      .set('x-csrf-token', csrfToken)
      .send({ role: 'LEARNER' })

    expect(selfDemoteRes.status).toBe(400)
    expect(selfDemoteRes.body.error).toContain('Cannot demote your own')
  })

  it('POST /api/admin/courses creates new course and validates inputs', async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ role: 'ADMIN' }) },
      category: {
        findUnique: vi.fn().mockResolvedValue({ id: 'cat-web', slug: 'web-security' }),
      },
      course: {
        create: vi.fn().mockResolvedValue({
          id: 'course-new-1',
          slug: 'api-security-fundamentals',
          title: 'API Security & REST Vulnerabilities',
          description: 'Comprehensive guide to securing modern RESTful and GraphQL endpoints.',
          level: 'INTERMEDIATE',
          duration: '3 hours',
          xpReward: 350,
          category: { slug: 'web-security', name: 'Web Security' },
          _count: { modules: 0, enrollments: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
    }

    const app = createAdminTestApp(prisma)
    const agent = request.agent(app)
    const authRes = await agent.post('/test/auth-admin')
    const csrfToken = authRes.body.csrfToken

    const res = await agent
      .post('/api/admin/courses')
      .set('x-csrf-token', csrfToken)
      .send({
        title: 'API Security & REST Vulnerabilities',
        slug: 'api-security-fundamentals',
        description: 'Comprehensive guide to securing modern RESTful and GraphQL endpoints.',
        level: 'INTERMEDIATE',
        duration: '3 hours',
        xpReward: 350,
        categorySlug: 'web-security',
      })

    expect(res.status).toBe(201)
    expect(res.body.course.title).toContain('API Security')
    expect(prisma.course.create).toHaveBeenCalledOnce()
  })

  it('PATCH /api/admin/moderation/threads/:threadId executes pin and lock moderation actions', async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ role: 'ADMIN' }) },
      forumThread: {
        update: vi.fn().mockResolvedValue({
          id: 'thread-123',
          isPinned: true,
          isLocked: false,
          status: 'APPROVED',
        }),
      },
    }

    const app = createAdminTestApp(prisma)
    const agent = request.agent(app)
    const authRes = await agent.post('/test/auth-admin')
    const csrfToken = authRes.body.csrfToken

    const res = await agent
      .patch('/api/admin/moderation/threads/thread-123')
      .set('x-csrf-token', csrfToken)
      .send({ action: 'PIN' })

    expect(res.status).toBe(200)
    expect(res.body.thread.isPinned).toBe(true)
    expect(prisma.forumThread.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'thread-123' },
        data: { isPinned: true },
      })
    )
  })
})
