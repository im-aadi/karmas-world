import { describe, expect, it } from 'vitest'
import { readConfig } from './config.js'

const base = {
  DATABASE_URL: 'postgresql://local:local@127.0.0.1:5432/unused',
  SESSION_SECRET: 'test-only-session-secret-with-at-least-32-characters',
}

describe('API configuration', () => {
  it('uses the local SMTP inbox defaults for development', () => {
    expect(readConfig(base)).toMatchObject({ SMTP_HOST: 'localhost', SMTP_PORT: 1025, SMTP_SECURE: false, SMTP_FROM: 'no-reply@karmas.world' })
  })

  it('requires an explicit SMTP host and sender in production', () => {
    expect(() => readConfig({ ...base, NODE_ENV: 'production' })).toThrow(/SMTP_HOST and SMTP_FROM/)
    expect(() => readConfig({ ...base, NODE_ENV: 'production', SMTP_HOST: 'localhost', SMTP_FROM: 'accounts@example.com' })).toThrow(/remote mail service/)
    expect(readConfig({ ...base, NODE_ENV: 'production', SMTP_HOST: 'smtp.example.com', SMTP_FROM: 'accounts@example.com', MFA_ENCRYPTION_KEY: 'a'.repeat(64) })).toMatchObject({ SMTP_HOST: 'smtp.example.com', SMTP_FROM: 'accounts@example.com' })
  })

  it('requires SMTP credentials as a pair', () => {
    expect(() => readConfig({ ...base, SMTP_USER: 'mailer' })).toThrow(/both be configured/)
  })

  it('derives a local MFA key but requires a dedicated production key', () => {
    expect(readConfig(base).MFA_ENCRYPTION_KEY).toMatch(/^[a-f0-9]{64}$/)
    expect(() => readConfig({ ...base, NODE_ENV: 'production', SMTP_HOST: 'smtp.example.com', SMTP_FROM: 'accounts@example.com' })).toThrow(/MFA_ENCRYPTION_KEY/)
    expect(readConfig({ ...base, NODE_ENV: 'production', SMTP_HOST: 'smtp.example.com', SMTP_FROM: 'accounts@example.com', MFA_ENCRYPTION_KEY: 'a'.repeat(64) }).MFA_ENCRYPTION_KEY).toBe('a'.repeat(64))
  })

  it('accepts APP_URL service binding or VERCEL_URL as WEB_ORIGIN fallback', () => {
    expect(readConfig({ ...base, APP_URL: 'https://karmas-world-app.vercel.internal' }).WEB_ORIGIN).toBe('https://karmas-world-app.vercel.internal')
    expect(readConfig({ ...base, VERCEL_URL: 'karmas-world.vercel.app' }).WEB_ORIGIN).toBe('https://karmas-world.vercel.app')
  })
})
