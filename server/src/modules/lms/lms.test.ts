import express from 'express'
import session from 'express-session'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { lmsRouter } from './router.js'

function createLmsTestApp(prismaMock: Record<string, unknown>) {
  const app = express()
  app.use(express.json())
  app.use(session({ secret: 'test-secret-at-least-32-chars-long-12345', resave: false, saveUninitialized: false }))
  app.locals.isAllowedOrigin = () => true

  app.post('/test/auth', (req, res) => {
    req.session.userId = 'learner-test-1'
    req.session.csrfToken = 'valid-csrf-token'
    res.json({ sessionId: req.sessionID, csrfToken: req.session.csrfToken })
  })

  app.use('/api', lmsRouter(prismaMock as unknown as PrismaClient))
  return app
}

describe('LMS API Module (Phase 4)', () => {
  it('GET /api/categories returns a list of categories with course counts', async () => {
    const prisma = {
      category: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'cat-1',
            slug: 'cryptography',
            name: 'Cryptography',
            description: 'Ciphers and PKI',
            level: 'INTERMEDIATE',
            iconName: 'KeyRound',
            _count: { courses: 2 },
          },
        ]),
      },
    }

    const app = createLmsTestApp(prisma)
    const res = await request(app).get('/api/categories').expect(200)

    expect(res.body.categories).toHaveLength(1)
    expect(res.body.categories[0].slug).toBe('cryptography')
    expect(res.body.categories[0].coursesCount).toBe(2)
  })

  it('GET /api/courses returns filtered course lists', async () => {
    const prisma = {
      course: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'course-1',
            slug: 'network-defense',
            title: 'Network Defense',
            description: 'Protocols and firewalls',
            level: 'BEGINNER',
            duration: '5 hours',
            xpReward: 300,
            category: { id: 'cat-net', slug: 'computer-networking', name: 'Networking' },
            _count: { modules: 2, enrollments: 12 },
          },
        ]),
      },
    }

    const app = createLmsTestApp(prisma)
    const res = await request(app).get('/api/courses?difficulty=BEGINNER').expect(200)

    expect(res.body.total).toBe(1)
    expect(res.body.courses[0].title).toBe('Network Defense')
    expect(res.body.courses[0].enrollmentsCount).toBe(12)
  })

  it('GET /api/courses/:slug returns 404 for nonexistent course', async () => {
    const prisma = {
      course: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    }

    const app = createLmsTestApp(prisma)
    await request(app).get('/api/courses/nonexistent-course').expect(404)
  })

  it('POST /api/courses/:id/enroll requires authentication', async () => {
    const prisma = {
      course: { findUnique: vi.fn() },
    }

    const app = createLmsTestApp(prisma)
    const res = await request(app).post('/api/courses/course-1/enroll').expect(401)
    expect(res.body.error).toMatch(/authentication required/i)
  })

  it('POST /api/courses/:id/enroll enrolls the user when authenticated with CSRF', async () => {
    const prisma = {
      course: {
        findUnique: vi.fn().mockResolvedValue({ id: 'course-1', title: 'Network Defense' }),
      },
      enrollment: {
        upsert: vi.fn().mockResolvedValue({ id: 'enr-1', enrolledAt: new Date(), completedAt: null }),
      },
    }

    const app = createLmsTestApp(prisma)
    const agent = request.agent(app)
    const auth = await agent.post('/test/auth').expect(200)

    const res = await agent
      .post('/api/courses/course-1/enroll')
      .set('X-CSRF-Token', auth.body.csrfToken as string)
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.enrollment.id).toBe('enr-1')
  })

  it('POST /api/lessons/:id/bookmark toggles bookmark on and off', async () => {
    let bookmarked = false
    const prisma = {
      bookmark: {
        findUnique: vi.fn().mockImplementation(() => {
          return Promise.resolve(bookmarked ? { id: 'bm-1', userId: 'learner-test-1', lessonId: 'lesson-1' } : null)
        }),
        create: vi.fn().mockImplementation(() => {
          bookmarked = true
          return Promise.resolve({ id: 'bm-1' })
        }),
        delete: vi.fn().mockImplementation(() => {
          bookmarked = false
          return Promise.resolve({ id: 'bm-1' })
        }),
      },
    }

    const app = createLmsTestApp(prisma)
    const agent = request.agent(app)
    const auth = await agent.post('/test/auth').expect(200)

    // First toggle: bookmarks lesson
    const res1 = await agent
      .post('/api/lessons/lesson-1/bookmark')
      .set('X-CSRF-Token', auth.body.csrfToken as string)
      .expect(200)
    expect(res1.body.bookmarked).toBe(true)

    // Second toggle: unbookmarks lesson
    const res2 = await agent
      .post('/api/lessons/lesson-1/bookmark')
      .set('X-CSRF-Token', auth.body.csrfToken as string)
      .expect(200)
    expect(res2.body.bookmarked).toBe(false)
  })
})
