import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import type { PrismaClient } from '@prisma/client'
import { authRouter, sessionCookieOptions } from './modules/auth/router.js'
import { progressRouter } from './modules/progress/router.js'
import { communityRouter } from './modules/community/router.js'
import { leaderboardRouter } from './modules/leaderboard/router.js'
import { adminRouter } from './modules/admin/router.js'
import { newsRouter } from './modules/news/router.js'
import { lmsRouter } from './modules/lms/router.js'
import { createAccountMailer, type AccountMailer } from './modules/auth/mailer.js'
import type { readConfig } from './config.js'

type AppConfig = ReturnType<typeof readConfig>

export function createApp(prisma: PrismaClient, config: AppConfig, mailer: AccountMailer = createAccountMailer(config)) {
  const app = express()
  const PgSessionStore = connectPgSimple(session)
  const cookieName = config.NODE_ENV === 'production' ? '__Host-kw_session' : 'kw.sid'
  const allowedOrigins = new Set([config.WEB_ORIGIN])
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
  app.use(helmet())
  app.use(cors({ origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)), credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'X-CSRF-Token'] }))
  app.use(express.json({ limit: '32kb', strict: true }))
  app.use(session({
    name: cookieName,
    secret: config.SESSION_SECRET,
    store: new PgSessionStore({ conString: config.DATABASE_URL, createTableIfMissing: false, tableName: 'user_sessions' }),
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
  app.use('/api/auth', authRouter({ prisma, sessionCookieName: cookieName, mailer, mfaEncryptionKey: config.MFA_ENCRYPTION_KEY }))
  app.use('/api/progress', progressRouter(prisma))
  app.use('/api/community', communityRouter(prisma))
  app.use('/api/leaderboard', leaderboardRouter(prisma))
  app.use('/api/news', newsRouter(prisma))
  app.use('/api/admin', adminRouter(prisma))
  app.use('/api', lmsRouter(prisma))
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }))
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('API request failed', error instanceof Error ? error.message : 'Unknown error')
    if (res.headersSent) return
    res.status(500).json({ error: 'The request could not be completed.' })
  })
  return app
}
