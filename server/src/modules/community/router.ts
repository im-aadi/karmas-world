import { Router, type Request, type Response, type NextFunction } from 'express'
import { rateLimit } from 'express-rate-limit'
import { Prisma, type PrismaClient } from '@prisma/client'
import { csrfGuard } from '../auth/router.js'
import { communityPostSchema, communityPostStatusSchema, communityReportSchema, communityReportStatusSchema } from './validation.js'

function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) return res.status(401).json({ error: 'Sign in to join the learner community.' })
  next()
}

function isKnownPostId(value: string) {
  return /^[a-zA-Z0-9_-]{8,40}$/.test(value)
}

export function communityRouter(prisma: PrismaClient) {
  const router = Router()
  const submissionLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false })
  const reportLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false })

  router.get('/posts', async (req, res, next) => {
    try {
      const posts = await prisma.communityPost.findMany({
        where: req.session.userId ? { OR: [{ status: 'APPROVED' }, { authorId: req.session.userId }] } : { status: 'APPROVED' },
        select: { id: true, body: true, status: true, createdAt: true, authorId: true, author: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' }, take: 50,
      })
      res.setHeader('Cache-Control', 'no-store')
      res.json({ posts: posts.map(({ authorId, ...post }) => ({ ...post, isOwn: authorId === req.session.userId })) })
    } catch (error) { next(error) }
  })

  router.post('/posts', requireUser, csrfGuard, submissionLimit, async (req, res, next) => {
    const parsed = communityPostSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Posts must be 20 to 800 characters.' })
    try {
      const post = await prisma.communityPost.create({
        data: { authorId: req.session.userId!, body: parsed.data.body },
        select: { id: true, body: true, status: true, createdAt: true, author: { select: { displayName: true } } },
      })
      res.status(201).json({ post })
    } catch (error) { next(error) }
  })

  router.post('/posts/:postId/reports', requireUser, csrfGuard, reportLimit, async (req, res, next) => {
    const postId = req.params.postId
    if (typeof postId !== 'string' || !isKnownPostId(postId)) return res.status(404).json({ error: 'Post not found.' })
    const parsed = communityReportSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Choose a report reason and keep the note under 300 characters.' })
    try {
      const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true, authorId: true, status: true } })
      if (!post || post.status !== 'APPROVED') return res.status(404).json({ error: 'Post not found.' })
      if (post.authorId === req.session.userId) return res.status(400).json({ error: 'You cannot report your own post.' })
      await prisma.communityReport.create({ data: { postId: post.id, reporterId: req.session.userId!, ...parsed.data } })
      res.status(201).json({ message: 'Report sent to the moderation team.' })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return res.status(409).json({ error: 'You have already reported this post.' })
      next(error)
    }
  })

  async function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId) return res.status(401).json({ error: 'Sign in with a moderator account.' })
    try {
      const user = await prisma.user.findUnique({ where: { id: req.session.userId }, select: { role: true } })
      if (user?.role !== 'ADMIN') return res.status(403).json({ error: 'Moderator access is required.' })
      next()
    } catch (error) { next(error) }
  }

  router.get('/moderation', requireUser, requireAdmin, async (_req, res, next) => {
    try {
      const [posts, reports] = await Promise.all([
        prisma.communityPost.findMany({ where: { status: 'PENDING' }, select: { id: true, body: true, createdAt: true, author: { select: { displayName: true } } }, orderBy: { createdAt: 'asc' }, take: 100 }),
        prisma.communityReport.findMany({ where: { status: 'OPEN' }, select: { id: true, reason: true, details: true, createdAt: true, reporter: { select: { displayName: true } }, post: { select: { id: true, body: true, author: { select: { displayName: true } } } } }, orderBy: { createdAt: 'asc' }, take: 100 }),
      ])
      res.setHeader('Cache-Control', 'no-store')
      res.json({ posts, reports })
    } catch (error) { next(error) }
  })

  router.patch('/moderation/posts/:postId', requireUser, requireAdmin, csrfGuard, async (req, res, next) => {
    const postId = req.params.postId
    if (typeof postId !== 'string' || !isKnownPostId(postId)) return res.status(404).json({ error: 'Post not found.' })
    const parsed = communityPostStatusSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Choose approve or hide.' })
    try {
      const post = await prisma.communityPost.update({ where: { id: postId }, data: { status: parsed.data.status, moderatedAt: new Date(), moderatorId: req.session.userId! }, select: { id: true, status: true } })
      res.json({ post })
    } catch (error) { next(error) }
  })

  router.patch('/moderation/reports/:reportId', requireUser, requireAdmin, csrfGuard, async (req, res, next) => {
    const reportId = req.params.reportId
    if (typeof reportId !== 'string' || !isKnownPostId(reportId)) return res.status(404).json({ error: 'Report not found.' })
    const parsed = communityReportStatusSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Choose reviewed or dismissed.' })
    try {
      const report = await prisma.communityReport.update({ where: { id: reportId }, data: { status: parsed.data.status, reviewedAt: new Date(), moderatorId: req.session.userId! }, select: { id: true, status: true } })
      res.json({ report })
    } catch (error) { next(error) }
  })

  return router
}
