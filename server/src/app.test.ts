import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { createApp } from './app.js'
import { sessionCookieOptions } from './modules/auth/router.js'

const config = {
  NODE_ENV: 'test' as const,
  PORT: 4000,
  WEB_ORIGIN: 'http://localhost:5173',
  DATABASE_URL: 'postgresql://local:local@127.0.0.1:5432/unused',
  SESSION_SECRET: 'test-only-session-secret-with-at-least-32-characters',
  SMTP_HOST: 'localhost',
  SMTP_PORT: 1025,
  SMTP_SECURE: false,
  SMTP_FROM: 'test@example.com',
  MFA_ENCRYPTION_KEY: 'a'.repeat(64),
}

describe('API boundary defaults', () => {
  it('requires an authenticated session for account and progress reads', async () => {
    const app = createApp({} as PrismaClient, config)
    await request(app).get('/api/auth/me').expect(401)
    await request(app).get('/api/auth/sessions').expect(401)
    await request(app).get('/api/progress').expect(401)
  })

  it('rejects cross-origin state changes before reaching the database', async () => {
    const app = createApp({} as PrismaClient, config)
    const response = await request(app)
      .post('/api/auth/register')
      .set('Origin', 'https://untrusted.example')
      .send({ displayName: 'Learner', email: 'learner@example.com', password: 'long-enough-test-password' })
      .expect(403)
    expect(response.body.error).toMatch(/origin is not allowed/i)
  })

  it('requires sign-in to submit a community post or enter moderation', async () => {
    const app = createApp({} as PrismaClient, config)
    await request(app).post('/api/community/posts').send({ body: 'A useful thought for learners to discuss.' }).expect(401)
    await request(app).get('/api/community/moderation').expect(401)
  })

  it('shows only approved community posts to guests', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 'post12345', body: 'A reviewed learning idea for everyone.', status: 'APPROVED', createdAt: new Date('2026-11-03T00:00:00Z'), authorId: 'learner1', author: { displayName: 'Learner' } }])
    const app = createApp({ communityPost: { findMany } } as unknown as PrismaClient, config)
    const response = await request(app).get('/api/community/posts').expect(200)
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'APPROVED' }, take: 50 }))
    expect(response.body.posts[0]).toMatchObject({ status: 'APPROVED', isOwn: false, author: { displayName: 'Learner' } })
    expect(response.body.posts[0].authorId).toBeUndefined()
  })

  it('requires sign-in to change leaderboard participation', async () => {
    const app = createApp({} as PrismaClient, config)
    await request(app).patch('/api/leaderboard/participation').send({ optedIn: true }).expect(401)
  })

  it('blocks anonymous access to the admin overview', async () => {
    const app = createApp({} as PrismaClient, config)
    await request(app).get('/api/admin/overview').expect(401)
  })

  it('publishes only approved security brief entries', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 'brief123', source: 'NIST', title: 'A current guide', status: 'PUBLISHED' }])
    const app = createApp({ securityUpdate: { findMany } } as unknown as PrismaClient, config)
    const response = await request(app).get('/api/news').expect(200)
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'PUBLISHED' }, take: 30 }))
    expect(response.body.updates).toHaveLength(1)
  })

  it('blocks anonymous access to editorial items', async () => {
    const app = createApp({} as PrismaClient, config)
    await request(app).get('/api/admin/news').expect(401)
    await request(app).post('/api/admin/news').send({}).expect(401)
  })

  it('requires sign-in for the account data export', async () => {
    const app = createApp({} as PrismaClient, config)
    await request(app).get('/api/auth/export').expect(401)
  })

  it('returns only opted-in leaderboard names and server-counted lesson totals', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 'learner123', displayName: 'Learner One', _count: { progress: 4 } }])
    const app = createApp({ user: { findMany } } as unknown as PrismaClient, config)
    const response = await request(app).get('/api/leaderboard').expect(200)
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { leaderboardOptIn: true }, take: 50 }))
    expect(response.body.entries).toEqual([
      { rank: 1, displayName: 'Learner One', lessonsCompleted: 4, isYou: false, level: 1, rankTitle: 'Cadet' },
    ])
    expect(response.body.entries[0].email).toBeUndefined()
  })

  it('uses protected session cookie attributes', () => {
    expect(sessionCookieOptions({ NODE_ENV: 'production' })).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' })
  })
})
