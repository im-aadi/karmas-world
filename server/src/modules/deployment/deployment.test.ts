import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import type { PrismaClient } from '@prisma/client'
import { createApp } from '../../app.js'
import { readConfig } from '../../config.js'

describe('Phase 12: Production Deployment & System Lifecycle Suite', () => {
  describe('Production Configuration Enforcement', () => {
    const validProductionEnv = {
      NODE_ENV: 'production' as const,
      PORT: 4000,
      WEB_ORIGIN: 'https://karmas.world',
      DATABASE_URL: 'postgresql://karma:secret@prod-db.internal:5432/karmas_world',
      SESSION_SECRET: 'production-session-secret-with-at-least-32-chars-long',
      MFA_ENCRYPTION_KEY: 'a'.repeat(64),
      SMTP_HOST: 'smtp.sendgrid.net',
      SMTP_PORT: 587,
      SMTP_SECURE: 'false' as const,
      SMTP_USER: 'apikey',
      SMTP_PASSWORD: 'some-api-key',
      SMTP_FROM: 'no-reply@karmas.world',
    }

    it('successfully validates complete production environment configuration', () => {
      const config = readConfig(validProductionEnv as unknown as NodeJS.ProcessEnv)
      expect(config.NODE_ENV).toBe('production')
      expect(config.PORT).toBe(4000)
      expect(config.WEB_ORIGIN).toBe('https://karmas.world')
      expect(config.DATABASE_URL).toBe(validProductionEnv.DATABASE_URL)
    })

    it('rejects production configuration if SMTP_HOST is pointing to localhost', () => {
      expect(() => {
        readConfig({
          ...validProductionEnv,
          SMTP_HOST: 'localhost',
        } as unknown as NodeJS.ProcessEnv)
      }).toThrow(/Production SMTP_HOST must point to a remote mail service/i)
    })

    it('rejects production configuration if MFA_ENCRYPTION_KEY is missing', () => {
      const invalidEnv = { ...validProductionEnv }
      delete (invalidEnv as Record<string, unknown>).MFA_ENCRYPTION_KEY
      expect(() => {
        readConfig(invalidEnv as unknown as NodeJS.ProcessEnv)
      }).toThrow(/MFA_ENCRYPTION_KEY must be configured in production/i)
    })

    it('rejects production configuration if SESSION_SECRET is shorter than 32 characters', () => {
      expect(() => {
        readConfig({
          ...validProductionEnv,
          SESSION_SECRET: 'too-short-secret',
        } as unknown as NodeJS.ProcessEnv)
      }).toThrow()
    })
  })

  describe('Container Healthcheck Endpoint (/api/health)', () => {
    const baseConfig = {
      NODE_ENV: 'production' as const,
      PORT: 4000,
      WEB_ORIGIN: 'https://karmas.world',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      SESSION_SECRET: 'test-session-secret-at-least-32-chars-long-12345',
      MFA_ENCRYPTION_KEY: 'b'.repeat(64),
      SMTP_HOST: 'smtp.mailgun.org',
      SMTP_PORT: 587,
      SMTP_SECURE: 'false' as const,
      SMTP_FROM: 'alert@karmas.world',
    }

    it('returns status ok (200) when database connectivity is healthy', async () => {
      const prisma = {
        $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
      } as unknown as PrismaClient

      const app = createApp(prisma, readConfig(baseConfig as unknown as NodeJS.ProcessEnv))
      const res = await request(app).get('/api/health')

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ status: 'ok' })
      expect(prisma.$queryRaw).toHaveBeenCalled()
    })

    it('returns 500 when database connectivity is interrupted', async () => {
      const prisma = {
        $queryRaw: vi.fn().mockRejectedValue(new Error('Connection terminated unexpectedly')),
      } as unknown as PrismaClient

      const app = createApp(prisma, readConfig(baseConfig as unknown as NodeJS.ProcessEnv))
      const res = await request(app).get('/api/health')

      expect(res.status).toBe(500)
      expect(res.body.error).toBe('The request could not be completed.')
    })
  })
})
