import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import { rateLimit } from 'express-rate-limit'
import { PrismaClient } from '@prisma/client'
import { authRouter, sessionCookieOptions } from './modules/auth/router.js'
import { progressRouter } from './modules/progress/router.js'
import { communityRouter } from './modules/community/router.js'
import { leaderboardRouter } from './modules/leaderboard/router.js'
import { adminRouter } from './modules/admin/router.js'
import { newsRouter } from './modules/news/router.js'
import { lmsRouter } from './modules/lms/router.js'
import { labsRouter } from './modules/labs/router.js'
import { gamificationRouter } from './modules/gamification/router.js'
import { quizzesRouter } from './modules/quizzes/router.js'
import { createAccountMailer, type AccountMailer } from './modules/auth/mailer.js'
import { readConfig } from './config.js'

export type AppConfig = {
  NODE_ENV: string
  PORT: number
  WEB_ORIGIN: string
  DATABASE_URL: string
  SESSION_SECRET: string
  SMTP_HOST?: string
  SMTP_PORT?: number
  SMTP_SECURE?: boolean
  SMTP_USER?: string
  SMTP_PASSWORD?: string
  SMTP_FROM?: string
  MFA_ENCRYPTION_KEY?: string
} | ReturnType<typeof readConfig>

export function createApp(prisma: PrismaClient, config: AppConfig, mailer: AccountMailer = createAccountMailer(config as ReturnType<typeof readConfig>), sessionStore?: session.Store) {
  const app = express()
  const PgSessionStore = connectPgSimple(session)
  const cookieName = config.NODE_ENV === 'production' ? '__Host-kw_session' : 'kw.sid'
  const allowedOrigins = new Set([
    config.WEB_ORIGIN,
    ...(process.env.APP_URL ? [process.env.APP_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
  ])
  const isAllowedOrigin = (origin: string) => {
    if (allowedOrigins.has(origin)) return true
    if (config.NODE_ENV !== 'development') return false
    try {
      const parsed = new URL(origin)
      return ['localhost', '127.0.0.1'].includes(parsed.hostname) && Number(parsed.port) >= 5173 && Number(parsed.port) <= 5199 && parsed.protocol === 'http:'
    } catch { return false }
  }

  app.disable('x-powered-by')
  if (config.NODE_ENV === 'production') app.set('trust proxy', 1)
  app.locals.isAllowedOrigin = isAllowedOrigin
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'data:'],
          connectSrc: [
            "'self'",
            config.WEB_ORIGIN,
            ...(process.env.APP_URL ? [process.env.APP_URL] : []),
            ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
            ...(config.NODE_ENV === 'development' ? ['http://localhost:*', 'ws://localhost:*'] : []),
          ],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      xContentTypeOptions: true,
      dnsPrefetchControl: { allow: false },
    })
  )
  app.use((_req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
    next()
  })
  app.use(cors({ origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)), credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'X-CSRF-Token'] }))
  app.use(express.json({ limit: '32kb', strict: true }))

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.NODE_ENV === 'test' ? 10000 : 600,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests from this client. Please slow down.' },
  })
  app.use('/api', apiLimiter)
  let resolvedStore = sessionStore
  if (!resolvedStore) {
    if (process.env.VERCEL && (!config.DATABASE_URL || config.DATABASE_URL.includes('localhost') || config.DATABASE_URL.includes('127.0.0.1') || config.DATABASE_URL.includes('fallback'))) {
      resolvedStore = new session.MemoryStore()
    } else {
      try {
        const pgStore = new PgSessionStore({ conString: config.DATABASE_URL, createTableIfMissing: false, tableName: 'user_sessions' })
        pgStore.on('error', (err: { message?: string }) => {
          console.warn('[Session] Session store warning:', err?.message || err)
        })
        resolvedStore = pgStore
      } catch {
        resolvedStore = new session.MemoryStore()
      }
    }
  }

  app.use(session({
    name: cookieName,
    secret: config.SESSION_SECRET,
    store: resolvedStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: sessionCookieOptions(config),
  }))

  app.get('/api/health', async (_req, res, next) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      res.json({ status: 'ok' })
    } catch (error) { next(error) }
  })
  app.use('/api/auth', authRouter({ prisma, sessionCookieName: cookieName, mailer, mfaEncryptionKey: config.MFA_ENCRYPTION_KEY || '0'.repeat(64) }))
  app.use('/api/progress', progressRouter(prisma))
  app.use('/api/community', communityRouter(prisma))
  app.use('/api/leaderboard', leaderboardRouter(prisma))
  app.use('/api/news', newsRouter(prisma))
  app.use('/api/admin', adminRouter(prisma))
  app.use('/api', lmsRouter(prisma))
  app.use('/api', labsRouter(prisma))
  app.use('/api/gamification', gamificationRouter(prisma))
  app.use('/api/quizzes', quizzesRouter(prisma))
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }))
  app.use((error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('API request failed', errorMsg)
    if (res.headersSent) return
    if (req.path !== '/api/health' && error instanceof Error && (
      errorMsg.includes("Can't reach database server") ||
      errorMsg.includes('ECONNREFUSED') ||
      errorMsg.includes('ETIMEDOUT') ||
      errorMsg.includes('ENOTFOUND') ||
      errorMsg.includes('timed out') ||
      errorMsg.includes('P1001') ||
      errorMsg.includes('PrismaClientInitializationError') ||
      errorMsg.includes('Environment variable not found: DATABASE_URL') ||
      errorMsg.includes('database connectivity') ||
      errorMsg.includes('Connection terminated unexpectedly')
    )) {
      res.status(503).json({ error: 'The database server is currently offline or unreachable. Please try Local Learner mode or connect a cloud database.' })
      return
    }
    res.status(500).json({ error: 'The request could not be completed.' })
  })
  return app
}

let defaultAppInstance: express.Express | null = null
export function getDefaultApp(): express.Express {
  if (!defaultAppInstance) {
    const config = readConfig()
    const prisma = new PrismaClient()
    defaultAppInstance = createApp(prisma, config)
  }
  return defaultAppInstance
}

export default function handler(req: express.Request, res: express.Response) {
  return getDefaultApp()(req, res)
}
