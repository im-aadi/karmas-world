import { Router, type Request, type Response, type NextFunction } from 'express'
import { type PrismaClient } from '@prisma/client'
import { calculateUserLevel } from '../gamification/ranks.js'
import { csrfGuard } from '../auth/router.js'
import { leaderboardPreferenceSchema } from './validation.js'

function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) return res.status(401).json({ error: 'Sign in to change leaderboard participation.' })
  next()
}

export function leaderboardRouter(prisma: PrismaClient) {
  const router = Router()

  router.get('/', async (req, res, next) => {
    try {
      const [users, currentUser] = await Promise.all([
        prisma.user.findMany({
          where: { leaderboardOptIn: true },
          select: { id: true, displayName: true, totalXp: true, _count: { select: { progress: true } } },
          orderBy: [{ totalXp: 'desc' }, { progress: { _count: 'desc' } }, { displayName: 'asc' }],
          take: 50,
        }),
        req.session.userId
          ? prisma.user.findUnique({ where: { id: req.session.userId }, select: { leaderboardOptIn: true } })
          : Promise.resolve(null),
      ])
      res.setHeader('Cache-Control', 'no-store')
      res.json({
        entries: users.map((user, index) => {
          const rankInfo = calculateUserLevel(user.totalXp)
          return {
            rank: index + 1,
            displayName: user.displayName,
            lessonsCompleted: user._count.progress,
            totalXp: user.totalXp,
            level: rankInfo.level,
            rankTitle: rankInfo.rankTitle,
            isYou: user.id === req.session.userId,
          }
        }),
        optedIn: currentUser?.leaderboardOptIn ?? false,
      })
    } catch (error) { next(error) }
  })

  router.patch('/participation', requireUser, csrfGuard, async (req, res, next) => {
    const parsed = leaderboardPreferenceSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Choose whether you want to appear on the leaderboard.' })
    try {
      const user = await prisma.user.update({ where: { id: req.session.userId! }, data: { leaderboardOptIn: parsed.data.optedIn }, select: { leaderboardOptIn: true } })
      res.setHeader('Cache-Control', 'no-store')
      res.json({ optedIn: user.leaderboardOptIn })
    } catch (error) { next(error) }
  })

  return router
}
