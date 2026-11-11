import { Router, type Request, type Response, type NextFunction } from 'express'
import type { PrismaClient } from '@prisma/client'
import { progressUpdateSchema } from '../auth/validation.js'
import { csrfGuard } from '../auth/router.js'

function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) return res.status(401).json({ error: 'Sign in to sync learning progress.' })
  next()
}

export function progressRouter(prisma: PrismaClient) {
  const router = Router()
  router.use(requireUser)

  router.get('/', async (req, res, next) => {
    try {
      const items = await prisma.lessonProgress.findMany({ where: { userId: req.session.userId }, select: { courseId: true, lessonIndex: true, completedAt: true }, orderBy: { completedAt: 'asc' } })
      res.setHeader('Cache-Control', 'no-store')
      res.json({ progress: items })
    } catch (error) { next(error) }
  })

  router.put('/', csrfGuard, async (req, res, next) => {
    const parsed = progressUpdateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Choose a lesson that exists in a current learning path.' })
    try {
      const progress = await prisma.lessonProgress.upsert({
        where: { userId_courseId_lessonIndex: { userId: req.session.userId!, ...parsed.data } },
        create: { userId: req.session.userId!, ...parsed.data },
        update: {},
        select: { courseId: true, lessonIndex: true, completedAt: true },
      })
      res.status(200).json({ progress })
    } catch (error) { next(error) }
  })
  return router
}
