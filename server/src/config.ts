import 'dotenv/config'
import { createHash } from 'node:crypto'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform(value => value === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  MFA_ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/).optional(),
})

export function readConfig(source: NodeJS.ProcessEnv = process.env) {
  const isVercel = Boolean(source.VERCEL || source.VERCEL_ENV)
  const defaultSecret = 'karmas-world-production-secure-session-secret-key-32chars'
  const defaultDbUrl = 'postgresql://postgres:postgres@localhost:5432/karmas_world?schema=public'
  const effectiveSource = {
    ...source,
    DATABASE_URL: source.DATABASE_URL || (isVercel ? defaultDbUrl : source.DATABASE_URL),
    SESSION_SECRET: source.SESSION_SECRET || (isVercel ? defaultSecret : source.SESSION_SECRET),
    SMTP_HOST: source.SMTP_HOST || (isVercel ? 'smtp.resend.com' : source.SMTP_HOST),
    SMTP_FROM: source.SMTP_FROM || (isVercel ? 'auth@karmas.world' : source.SMTP_FROM),
    WEB_ORIGIN: source.WEB_ORIGIN || source.APP_URL || (source.VERCEL_URL ? `https://${source.VERCEL_URL}` : undefined),
  }
  const parsed = schema.parse(effectiveSource)
  if (parsed.NODE_ENV === 'production' && !isVercel && (!parsed.SMTP_HOST || !parsed.SMTP_FROM)) throw new Error('SMTP_HOST and SMTP_FROM must be configured in production.')
  if (parsed.NODE_ENV === 'production' && !isVercel && ['localhost', '127.0.0.1', '::1'].includes(parsed.SMTP_HOST?.toLowerCase() ?? '')) throw new Error('Production SMTP_HOST must point to a remote mail service.')
  if (parsed.NODE_ENV === 'production' && !isVercel && !parsed.MFA_ENCRYPTION_KEY) throw new Error('MFA_ENCRYPTION_KEY must be configured in production.')
  if (Boolean(parsed.SMTP_USER) !== Boolean(parsed.SMTP_PASSWORD)) throw new Error('SMTP_USER and SMTP_PASSWORD must either both be configured or both be empty.')
  return {
    ...parsed,
    SMTP_HOST: parsed.SMTP_HOST ?? (isVercel ? 'smtp.resend.com' : 'localhost'),
    SMTP_FROM: parsed.SMTP_FROM ?? 'no-reply@karmas.world',
    MFA_ENCRYPTION_KEY: parsed.MFA_ENCRYPTION_KEY ?? createHash('sha256').update('karmas-world-mfa:').update(parsed.SESSION_SECRET).digest('hex'),
  }
}
