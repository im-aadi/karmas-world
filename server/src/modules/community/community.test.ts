import express from 'express'
import session from 'express-session'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { communityRouter } from './router.js'

function createCommunityTestApp(prismaMock: Record<string, unknown>) {
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

  app.use('/api/community', communityRouter(prismaMock as unknown as PrismaClient))
  return app
}

describe('Community & Knowledge Base API (Phase 9)', () => {
  it('GET /api/community/forums/categories returns forum categories with counts', async () => {
    const prisma = {
      forumCategory: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'cat-1',
            slug: 'web-security',
            name: 'Web Application Security',
            description: 'OWASP Top 10 vulnerabilities',
            iconName: 'Globe',
            orderIndex: 1,
            _count: { threads: 8 },
          },
        ]),
      },
    }

    const app = createCommunityTestApp(prisma)
    const res = await request(app).get('/api/community/forums/categories')
    expect(res.status).toBe(200)
    expect(res.body.categories).toHaveLength(1)
    expect(res.body.categories[0].name).toBe('Web Application Security')
    expect(res.body.categories[0].threadsCount).toBe(8)
  })

  it('GET /api/community/forums/threads returns thread list with author and replies count', async () => {
    const prisma = {
      forumThread: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'thread-1',
            slug: 'how-to-prevent-csrf-tokens',
            title: 'How does double-submit cookie pattern prevent CSRF?',
            content: 'I want to understand the exact mechanics of CSRF tokens when dealing with single page applications.',
            categorySlug: 'web-security',
            category: { name: 'Web Application Security' },
            author: { displayName: 'Aditya', totalXp: 1500 },
            upvotesCount: 12,
            viewsCount: 45,
            isPinned: false,
            isLocked: false,
            status: 'APPROVED',
            createdAt: new Date('2026-11-20T10:00:00Z'),
            updatedAt: new Date('2026-11-20T10:00:00Z'),
            _count: { replies: 3 },
          },
        ]),
      },
    }

    const app = createCommunityTestApp(prisma)
    const res = await request(app).get('/api/community/forums/threads?category=web-security')
    expect(res.status).toBe(200)
    expect(res.body.threads).toHaveLength(1)
    expect(res.body.threads[0].title).toContain('CSRF')
    expect(res.body.threads[0].authorRank).toBe('Defender')
    expect(res.body.threads[0].repliesCount).toBe(3)
  })

  it('POST /api/community/forums/threads creates a new thread and awards XP', async () => {
    const prisma = {
      forumCategory: {
        findUnique: vi.fn().mockResolvedValue({ id: 'cat-1', slug: 'web-security' }),
      },
      forumThread: {
        create: vi.fn().mockResolvedValue({
          id: 'th-new-1',
          slug: 'testing-wireshark-filters-abc123',
          title: 'Testing Wireshark packet capture display filters',
          content: 'Here is a comprehensive breakdown of tcp.analysis.flags and retransmission alerts.',
          categorySlug: 'network-defense',
          category: { name: 'Network Defense' },
          author: { displayName: 'Learner One', totalXp: 500 },
          status: 'APPROVED',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      user: {
        update: vi.fn().mockResolvedValue({}),
      },
      xPTransaction: {
        create: vi.fn().mockResolvedValue({}),
      },
      $transaction: vi.fn().mockImplementation(async (fns) => Promise.all(fns)),
    }

    const app = createCommunityTestApp(prisma)
    const authAgent = request.agent(app)
    const authRes = await authAgent.post('/test/auth')
    const csrfToken = authRes.body.csrfToken

    const res = await authAgent
      .post('/api/community/forums/threads')
      .set('x-csrf-token', csrfToken)
      .send({
        title: 'Testing Wireshark packet capture display filters',
        content: 'Here is a comprehensive breakdown of tcp.analysis.flags and retransmission alerts.',
        categorySlug: 'network-defense',
      })

    expect(res.status).toBe(201)
    expect(res.body.thread.title).toContain('Wireshark')
    expect(prisma.forumThread.create).toHaveBeenCalledOnce()
    expect(prisma.$transaction).toHaveBeenCalledOnce() // XP awarded!
  })

  it('GET /api/community/articles returns knowledge base articles with search filtering', async () => {
    const prisma = {
      knowledgeArticle: {
        count: vi.fn().mockResolvedValue(4),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'art-1',
            slug: 'practical-guide-to-sql-injection',
            title: 'Practical Guide to SQL Injection: Detection, Exploitation & Parameterized Defense',
            summary: 'Deep technical breakdown of SQL injection.',
            tags: 'SQLi,OWASP,Web Security',
            categorySlug: 'web-security',
            difficulty: 'BEGINNER',
            readTimeMinutes: 7,
            viewsCount: 320,
            helpfulVotesCount: 45,
            isFeatured: true,
            publishedAt: new Date('2026-11-01T12:00:00Z'),
            author: { displayName: 'Karma Research Team' },
          },
        ]),
      },
    }

    const app = createCommunityTestApp(prisma)
    const res = await request(app).get('/api/community/articles?category=web-security')
    expect(res.status).toBe(200)
    expect(res.body.articles).toHaveLength(1)
    expect(res.body.articles[0].tags).toEqual(['SQLi', 'OWASP', 'Web Security'])
    expect(res.body.articles[0].difficulty).toBe('BEGINNER')
  })

  it('GET /api/community/articles/:slug returns article content and related recommendations', async () => {
    const prisma = {
      knowledgeArticle: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'art-1',
          slug: 'practical-guide-to-sql-injection',
          title: 'Practical Guide to SQL Injection: Detection, Exploitation & Parameterized Defense',
          summary: 'Deep technical breakdown of SQL injection.',
          content: '# SQL Injection Guide\n\nContent here.',
          tags: 'SQLi,OWASP,Web Security',
          categorySlug: 'web-security',
          difficulty: 'BEGINNER',
          readTimeMinutes: 7,
          viewsCount: 320,
          helpfulVotesCount: 45,
          isFeatured: true,
          publishedAt: new Date('2026-11-01T12:00:00Z'),
          author: { displayName: 'Karma Research Team' },
        }),
        update: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'art-2',
            slug: 'csrf-defense-deep-dive',
            title: 'CSRF Defense Deep Dive',
            summary: 'Cross-site request forgery patterns.',
            tags: 'CSRF,Web Security',
            categorySlug: 'web-security',
            difficulty: 'INTERMEDIATE',
            readTimeMinutes: 6,
            viewsCount: 150,
            helpfulVotesCount: 20,
            isFeatured: false,
            publishedAt: new Date('2026-11-05T12:00:00Z'),
          },
        ]),
      },
    }

    const app = createCommunityTestApp(prisma)
    const res = await request(app).get('/api/community/articles/practical-guide-to-sql-injection')
    expect(res.status).toBe(200)
    expect(res.body.article.content).toContain('# SQL Injection Guide')
    expect(res.body.article.relatedArticles).toHaveLength(1)
  })
})
