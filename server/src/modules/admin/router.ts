import { Router, type Request, type Response, type NextFunction } from 'express'
import type { PrismaClient } from '@prisma/client'
import { csrfGuard } from '../auth/router.js'
import { createSecurityUpdateSchema, editSecurityUpdateSchema } from './news-validation.js'

export function requireAdministrator(prisma: PrismaClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Sign in to access administration.' })
    try {
      const user = await prisma.user.findUnique({ where: { id: req.session.userId }, select: { role: true } })
      if (user?.role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access is required.' })
      next()
    } catch (error) { next(error) }
  }
}

export function adminRouter(prisma: PrismaClient) {
  const router = Router()
  const adminOnly = requireAdministrator(prisma)
  router.get('/overview', adminOnly, async (_req, res, next) => {
    try {
      const [learnerAccounts, completedLessons, pendingPosts, openReports, leaderboardParticipants] = await Promise.all([
        prisma.user.count({ where: { role: 'LEARNER' } }),
        prisma.lessonProgress.count(),
        prisma.communityPost.count({ where: { status: 'PENDING' } }),
        prisma.communityReport.count({ where: { status: 'OPEN' } }),
        prisma.user.count({ where: { leaderboardOptIn: true } }),
      ])
      res.setHeader('Cache-Control', 'no-store')
      res.json({ overview: { learnerAccounts, completedLessons, pendingPosts, openReports, leaderboardParticipants, generatedAt: new Date().toISOString() } })
    } catch (error) { next(error) }
  })

  router.get('/news', adminOnly, async (_req, res, next) => {
    try {
      const updates = await prisma.securityUpdate.findMany({ orderBy: [{ status: 'asc' }, { sourcePublishedAt: 'desc' }], take: 100, select: { id: true, source: true, type: true, title: true, sourceUrl: true, sourcePublishedAt: true, summary: true, takeaway: true, status: true, verifiedAt: true, updatedAt: true } })
      res.setHeader('Cache-Control', 'no-store')
      res.json({ updates })
    } catch (error) { next(error) }
  })

  router.post('/news', adminOnly, csrfGuard, async (req, res, next) => {
    const parsed = createSecurityUpdateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Check the title, source, publication date, summary, takeaway, and approved source link.' })
    try {
      const update = await prisma.securityUpdate.create({ data: { ...parsed.data, sourcePublishedAt: new Date(parsed.data.sourcePublishedAt), status: 'DRAFT', authorId: req.session.userId!, editorId: req.session.userId! }, select: { id: true, status: true } })
      res.status(201).json({ update })
    } catch (error) { next(error) }
  })

  router.patch('/news/:updateId', adminOnly, csrfGuard, async (req, res, next) => {
    const updateId = req.params.updateId
    if (typeof updateId !== 'string' || !/^[a-zA-Z0-9_-]{8,60}$/.test(updateId)) return res.status(404).json({ error: 'Security update not found.' })
    const parsed = editSecurityUpdateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Check all fields and use a link from an approved official source.' })
    try {
      const update = await prisma.securityUpdate.update({ where: { id: updateId }, data: { ...parsed.data, sourcePublishedAt: new Date(parsed.data.sourcePublishedAt), verifiedAt: parsed.data.status === 'PUBLISHED' ? new Date() : null, editorId: req.session.userId! }, select: { id: true, status: true, verifiedAt: true } })
      res.json({ update })
    } catch (error) { next(error) }
  })
  return router
}
