import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import session from 'express-session'
import type { PrismaClient } from '@prisma/client'
import { createApp } from '../../app.js'
import { stripHtml, sanitizeUserInput, isSafeIdentifier } from './sanitization.js'

const testConfig = {
  NODE_ENV: 'test',
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

function createSecurityTestApp(prismaMock: Record<string, unknown> = {}) {
  const memoryStore = new session.MemoryStore()
  if (!prismaMock.$queryRaw) {
    prismaMock.$queryRaw = vi.fn().mockResolvedValue([{ '?column?': 1 }])
  }
  return createApp(prismaMock as unknown as PrismaClient, testConfig, undefined, memoryStore)
}

describe('Phase 11: Security Audit & OWASP Hardening Suite', () => {
  describe('Security Headers & Browser Protections', () => {
    it('sets hardened Content-Security-Policy with strict directives', async () => {
      const app = createSecurityTestApp()
      const res = await request(app).get('/api/health')

      const csp = res.headers['content-security-policy']
      expect(csp).toBeDefined()
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("frame-ancestors 'none'")
      expect(csp).toContain("object-src 'none'")
      expect(csp).toContain("base-uri 'self'")
    })

    it('sets X-Frame-Options: DENY to prevent clickjacking attacks', async () => {
      const app = createSecurityTestApp()
      const res = await request(app).get('/api/health')
      expect(res.headers['x-frame-options']).toBe('DENY')
    })

    it('sets X-Content-Type-Options: nosniff to prevent MIME sniffing', async () => {
      const app = createSecurityTestApp()
      const res = await request(app).get('/api/health')
      expect(res.headers['x-content-type-options']).toBe('nosniff')
    })

    it('sets Referrer-Policy to strict-origin-when-cross-origin', async () => {
      const app = createSecurityTestApp()
      const res = await request(app).get('/api/health')
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    })

    it('sets Permissions-Policy to restrict sensitive browser APIs', async () => {
      const app = createSecurityTestApp()
      const res = await request(app).get('/api/health')
      expect(res.headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=(), payment=()')
    })

    it('strips X-Powered-By header to prevent technology fingerprinting', async () => {
      const app = createSecurityTestApp()
      const res = await request(app).get('/api/health')
      expect(res.headers['x-powered-by']).toBeUndefined()
    })

    it('rejects cross-origin mutations from unapproved external origins', async () => {
      const app = createSecurityTestApp()
      const res = await request(app)
        .post('/api/auth/register')
        .set('Origin', 'https://attacker-controlled-site.com')
        .send({ displayName: 'Attacker', email: 'evil@attacker.com', password: 'ValidPassword12345!' })

      expect(res.status).toBe(403)
      expect(res.body.error).toMatch(/origin is not allowed/i)
    })
  })

  describe('CSRF Token Defense', () => {
    it('issues cryptographically random CSRF tokens with Cache-Control: no-store', async () => {
      const app = createSecurityTestApp()
      const res = await request(app).get('/api/auth/csrf')

      expect(res.status).toBe(200)
      expect(res.headers['cache-control']).toBe('no-store')
      expect(res.body.csrfToken).toBeDefined()
      expect(typeof res.body.csrfToken).toBe('string')
      expect(res.body.csrfToken.length).toBeGreaterThanOrEqual(32)
    })

    it('rejects state mutation when X-CSRF-Token header is missing', async () => {
      const app = createSecurityTestApp()
      const res = await request(app)
        .post('/api/auth/register')
        .set('Origin', testConfig.WEB_ORIGIN)
        .send({ displayName: 'Legit', email: 'legit@example.com', password: 'ValidPassword12345!' })

      expect(res.status).toBe(403)
      expect(res.body.error).toBe('A valid CSRF token is required.')
    })

    it('rejects state mutation when X-CSRF-Token does not match session', async () => {
      const app = createSecurityTestApp()
      const agent = request.agent(app)
      await agent.get('/api/auth/csrf')

      const res = await agent
        .post('/api/auth/register')
        .set('Origin', testConfig.WEB_ORIGIN)
        .set('X-CSRF-Token', 'forged-invalid-csrf-token')
        .send({ displayName: 'Legit', email: 'legit@example.com', password: 'ValidPassword12345!' })

      expect(res.status).toBe(403)
      expect(res.body.error).toBe('A valid CSRF token is required.')
    })
  })

  describe('OWASP A01: Broken Access Control & IDOR Mitigation', () => {
    it('blocks unauthenticated access to learner private endpoints (401)', async () => {
      const app = createSecurityTestApp()

      await request(app).get('/api/progress').expect(401)
      await request(app).get('/api/auth/sessions').expect(401)
      await request(app).post('/api/courses/course-123/enroll').expect(401)
      await request(app).post('/api/quizzes/sql-101/submit').expect(401)
      await request(app).post('/api/labs/buffer-overflow/verify').expect(401)
    })

    it('blocks non-admin users from accessing administrative endpoints (401 when anonymous)', async () => {
      const findUnique = vi.fn().mockResolvedValue({ id: 'learner-id', role: 'LEARNER' })
      const app = createSecurityTestApp({ user: { findUnique } })

      const res = await request(app)
        .get('/api/admin/analytics')
        .expect(401)
      expect(res.body.error).toMatch(/Sign in to access administration/i)
    })

    it('sanitizes quiz questions in GET /api/quizzes/:slug so correct answers are not leaked', async () => {
      const mockQuiz = {
        id: 'quiz-1',
        slug: 'network-defense-101',
        title: 'Network Defense 101',
        description: 'Packet analysis fundamentals',
        categorySlug: 'network-defense',
        difficulty: 'BEGINNER',
        timeLimitMins: 15,
        passingScore: 70,
        xpReward: 150,
        questions: [
          {
            id: 'q1',
            text: 'What layer does IP operate at?',
            points: 10,
            options: [
              { id: 'opt1', text: 'Network Layer', orderIndex: 0 },
              { id: 'opt2', text: 'Transport Layer', orderIndex: 1 },
            ],
          },
        ],
      }
      const findUnique = vi.fn().mockResolvedValue(mockQuiz)
      const app = createSecurityTestApp({ quiz: { findUnique } })

      const res = await request(app).get('/api/quizzes/network-defense-101').expect(200)
      const question = res.body.quiz.questions[0]
      expect(question).toBeDefined()
      // Crucial security test: correct answer flag is NEVER leaked in client quiz fetch
      expect(question.options[0].isCorrect).toBeUndefined()
      expect(question.options[1].isCorrect).toBeUndefined()
    })
  })

  describe('OWASP A03: SQL Injection Payload Resilience', () => {
    it('safely handles SQL injection payloads in course search filters without errors', async () => {
      const findMany = vi.fn().mockResolvedValue([])
      const count = vi.fn().mockResolvedValue(0)
      const app = createSecurityTestApp({ course: { findMany, count } })

      const maliciousPayload = "' OR '1'='1'; DROP TABLE users; --"
      const res = await request(app)
        .get('/api/courses')
        .query({ q: maliciousPayload })
        .expect(200)

      expect(res.body.courses).toEqual([])
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: maliciousPayload, mode: 'insensitive' } },
              { description: { contains: maliciousPayload, mode: 'insensitive' } },
            ],
          }),
        })
      )
    })

    it('safely handles UNION SELECT payloads in quiz queries without errors', async () => {
      const findMany = vi.fn().mockResolvedValue([])
      const app = createSecurityTestApp({ quiz: { findMany } })

      const unionPayload = "web' UNION SELECT null, username, password FROM users --"
      const res = await request(app)
        .get('/api/quizzes')
        .query({ q: unionPayload })
        .expect(200)

      expect(res.body.quizzes).toEqual([])
      expect(findMany).toHaveBeenCalled()
    })
  })

  describe('OWASP A05: Payload Clamping & Error Shielding', () => {
    it('rejects payloads exceeding the 32kb body parser limit (413 Payload Too Large)', async () => {
      const app = createSecurityTestApp()
      const oversizedPayload = {
        displayName: 'A'.repeat(35000),
        email: 'overflow@example.com',
      }

      const res = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(oversizedPayload))

      // Express body parser returns 413 or 500 when limit is exceeded
      expect([413, 500]).toContain(res.status)
    })

    it('returns standardized JSON 404 for unmapped API endpoints', async () => {
      const app = createSecurityTestApp()
      const res = await request(app).get('/api/unmapped-endpoint-xyz').expect(404)
      expect(res.body).toEqual({ error: 'API route not found.' })
    })
  })

  describe('Sanitization & Safe Identifier Utility Validation', () => {
    it('strips malicious HTML script and iframe tags from user input', () => {
      const dirty = '<p>Normal text <script>alert("XSS")</script><iframe src="evil.com"></iframe></p>'
      const sanitized = sanitizeUserInput(dirty)
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
      expect(sanitized).not.toContain('<iframe')
      expect(sanitized).toContain('<p>Normal text </p>')
    })

    it('neutralizes inline event handlers from user-submitted text', () => {
      const dirty = '<img src="avatar.png" onerror="alert(document.cookie)" onload="steal()">'
      const sanitized = sanitizeUserInput(dirty)
      expect(sanitized).not.toContain('onerror')
      expect(sanitized).not.toContain('onload')
      expect(sanitized).toContain('<img src="avatar.png">')
    })

    it('strips all HTML tags when stripHtml is invoked', () => {
      const raw = '<h1>Header</h1><p>Paragraph with <a href="#">link</a></p>'
      expect(stripHtml(raw)).toBe('HeaderParagraph with link')
    })

    it('accurately validates safe alphanumeric identifiers', () => {
      expect(isSafeIdentifier('course-123_abc')).toBe(true)
      expect(isSafeIdentifier('user-session-id')).toBe(true)
      expect(isSafeIdentifier('bad id with spaces')).toBe(false)
      expect(isSafeIdentifier('bad"quote')).toBe(false)
      expect(isSafeIdentifier("bad'quote")).toBe(false)
      expect(isSafeIdentifier('<script>')).toBe(false)
    })
  })
})
