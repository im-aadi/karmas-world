import { Router, type Request, type Response, type NextFunction } from 'express'
import { Prisma, type PrismaClient } from '@prisma/client'
import { csrfGuard } from '../auth/router.js'
import { createSecurityUpdateSchema, editSecurityUpdateSchema } from './news-validation.js'
import {
  adminUserQuerySchema,
  userRoleSchema,
  createCourseSchema,
  editCourseSchema,
  threadModerationSchema,
} from './validation.js'
import { calculateUserLevel } from '../gamification/ranks.js'

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

  // ==========================================
  // OVERVIEW SNAPSHOT (Existing Contract)
  // ==========================================
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

  // ==========================================
  // PLATFORM ANALYTICS & TELEMETRY
  // ==========================================
  router.get('/analytics', adminOnly, async (_req, res, next) => {
    try {
      const [
        totalLearners,
        totalAdmins,
        totalLessonsCompleted,
        totalEnrollments,
        totalQuizAttempts,
        passedQuizCount,
        totalForumThreads,
        openReports,
        xpAggregate,
        topCoursesRaw,
        recentSecurityEventsRaw,
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'LEARNER' } }),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.lessonProgress.count(),
        prisma.enrollment.count(),
        prisma.quizAttempt.count(),
        prisma.quizAttempt.count({ where: { passed: true } }),
        prisma.forumThread.count(),
        prisma.communityReport.count({ where: { status: 'OPEN' } }),
        prisma.user.aggregate({ _sum: { totalXp: true } }),
        prisma.course.findMany({
          take: 5,
          include: { _count: { select: { enrollments: true } } },
          orderBy: { enrollments: { _count: 'desc' } },
        }),
        prisma.securityEvent.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, displayName: true, email: true } },
          },
        }),
      ])

      const quizPassingRatePercent =
        totalQuizAttempts > 0 ? Math.round((passedQuizCount / totalQuizAttempts) * 100) : 0

      const analytics = {
        totalLearners,
        totalAdmins,
        totalLessonsCompleted,
        totalXpAwarded: xpAggregate._sum.totalXp || 0,
        totalEnrollments,
        totalQuizAttempts,
        quizPassingRatePercent,
        totalForumThreads,
        openReports,
        topCourses: topCoursesRaw.map((c) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          enrolledCount: c._count.enrollments,
          level: c.level,
        })),
        recentSecurityEvents: recentSecurityEventsRaw.map((ev) => ({
          id: ev.id,
          type: ev.type,
          userAgent: ev.userAgent,
          createdAt: ev.createdAt.toISOString(),
          user: {
            id: ev.user.id,
            displayName: ev.user.displayName,
            email: ev.user.email,
          },
        })),
        generatedAt: new Date().toISOString(),
      }

      res.setHeader('Cache-Control', 'no-store')
      res.json({ analytics })
    } catch (error) {
      next(error)
    }
  })

  // ==========================================
  // USER MANAGEMENT
  // ==========================================
  router.get('/users', adminOnly, async (req, res, next) => {
    const parsed = adminUserQuerySchema.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid user query parameters.' })

    const { q, role, limit } = parsed.data

    try {
      const where: Prisma.UserWhereInput = {}
      if (role && role !== 'ALL') {
        where.role = role
      }
      if (q) {
        where.OR = [
          { displayName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ]
      }

      const users = await prisma.user.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { progress: true, enrollments: true },
          },
        },
      })

      res.setHeader('Cache-Control', 'no-store')
      res.json({
        users: users.map((u) => ({
          id: u.id,
          displayName: u.displayName,
          email: u.email,
          role: u.role,
          totalXp: u.totalXp,
          rankTitle: calculateUserLevel(u.totalXp).rankTitle,
          emailVerified: Boolean(u.emailVerifiedAt),
          mfaEnabled: Boolean(u.mfaEnabledAt),
          completedLessonsCount: u._count.progress,
          enrollmentsCount: u._count.enrollments,
          createdAt: u.createdAt.toISOString(),
        })),
      })
    } catch (error) {
      next(error)
    }
  })

  router.get('/users/:userId', adminOnly, async (req, res, next) => {
    const userId = req.params.userId
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: { select: { progress: true, enrollments: true } },
          securityEvents: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, type: true, userAgent: true, createdAt: true },
          },
          quizAttempts: {
            take: 5,
            orderBy: { completedAt: 'desc' },
            include: { quiz: { select: { title: true } } },
          },
        },
      })

      if (!user) return res.status(404).json({ error: 'User account not found.' })

      res.setHeader('Cache-Control', 'no-store')
      res.json({
        user: {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
          totalXp: user.totalXp,
          rankTitle: calculateUserLevel(user.totalXp).rankTitle,
          emailVerified: Boolean(user.emailVerifiedAt),
          mfaEnabled: Boolean(user.mfaEnabledAt),
          completedLessonsCount: user._count.progress,
          enrollmentsCount: user._count.enrollments,
          createdAt: user.createdAt.toISOString(),
          recentSecurityEvents: user.securityEvents.map((ev) => ({
            id: ev.id,
            type: ev.type,
            userAgent: ev.userAgent,
            createdAt: ev.createdAt.toISOString(),
          })),
          recentQuizAttempts: user.quizAttempts.map((qa) => ({
            quizTitle: qa.quiz.title,
            score: qa.score,
            maxScore: qa.maxScore,
            passed: qa.passed,
            completedAt: qa.completedAt.toISOString(),
          })),
        },
      })
    } catch (error) {
      next(error)
    }
  })

  router.patch('/users/:userId/role', adminOnly, csrfGuard, async (req, res, next) => {
    const userId = req.params.userId
    const parsed = userRoleSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Choose a valid account role (LEARNER or ADMIN).' })

    // Self-demotion protection
    if (req.session.userId === userId && parsed.data.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Cannot demote your own administrator account.' })
    }

    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: parsed.data.role },
        select: { id: true, role: true, displayName: true, email: true },
      })

      // Record administrative security audit event
      await prisma.securityEvent.create({
        data: {
          userId,
          type: 'ACCOUNT_UPDATED',
          userAgent: req.headers['user-agent'] || 'Karma Admin Console',
        },
      }).catch(() => {})

      res.json({ user: updated })
    } catch (error) {
      next(error)
    }
  })

  // ==========================================
  // COURSE & CONTENT MANAGEMENT
  // ==========================================
  router.get('/courses', adminOnly, async (_req, res, next) => {
    try {
      const courses = await prisma.course.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { slug: true, name: true } },
          modules: {
            include: { _count: { select: { lessons: true } } },
          },
          _count: { select: { enrollments: true, modules: true } },
        },
      })

      res.setHeader('Cache-Control', 'no-store')
      res.json({
        courses: courses.map((c) => {
          const lessonsCount = c.modules.reduce((sum, m) => sum + m._count.lessons, 0)
          return {
            id: c.id,
            slug: c.slug,
            title: c.title,
            description: c.description,
            level: c.level,
            duration: c.duration,
            xpReward: c.xpReward,
            categorySlug: c.category.slug,
            categoryName: c.category.name,
            modulesCount: c._count.modules,
            lessonsCount,
            enrolledLearnersCount: c._count.enrollments,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
          }
        }),
      })
    } catch (error) {
      next(error)
    }
  })

  router.post('/courses', adminOnly, csrfGuard, async (req, res, next) => {
    const parsed = createCourseSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid course details.' })
    }

    const { title, slug, description, level, duration, xpReward, categorySlug } = parsed.data

    try {
      let category = await prisma.category.findUnique({ where: { slug: categorySlug } })
      if (!category) {
        category = await prisma.category.create({
          data: {
            slug: categorySlug,
            name: categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            description: 'Cybersecurity topic category.',
            iconName: 'Shield',
          },
        })
      }

      const course = await prisma.course.create({
        data: {
          title,
          slug,
          description,
          level,
          duration,
          xpReward,
          categoryId: category.id,
        },
        include: {
          category: { select: { slug: true, name: true } },
          _count: { select: { modules: true, enrollments: true } },
        },
      })

      res.status(201).json({
        course: {
          id: course.id,
          slug: course.slug,
          title: course.title,
          description: course.description,
          level: course.level,
          duration: course.duration,
          xpReward: course.xpReward,
          categorySlug: course.category.slug,
          categoryName: course.category.name,
          modulesCount: 0,
          lessonsCount: 0,
          enrolledLearnersCount: 0,
          createdAt: course.createdAt.toISOString(),
          updatedAt: course.updatedAt.toISOString(),
        },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ error: 'A course with this slug already exists.' })
      }
      next(error)
    }
  })

  router.patch('/courses/:courseId', adminOnly, csrfGuard, async (req, res, next) => {
    const courseId = req.params.courseId
    const parsed = editCourseSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid course update fields.' })

    try {
      const updated = await prisma.course.update({
        where: { id: courseId },
        data: parsed.data,
        include: {
          category: { select: { slug: true, name: true } },
          _count: { select: { modules: true, enrollments: true } },
        },
      })

      res.json({
        course: {
          id: updated.id,
          slug: updated.slug,
          title: updated.title,
          description: updated.description,
          level: updated.level,
          duration: updated.duration,
          xpReward: updated.xpReward,
          categorySlug: updated.category.slug,
          categoryName: updated.category.name,
          modulesCount: updated._count.modules,
          lessonsCount: 0,
          enrolledLearnersCount: updated._count.enrollments,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      })
    } catch (error) {
      next(error)
    }
  })

  router.delete('/courses/:courseId', adminOnly, csrfGuard, async (req, res, next) => {
    const courseId = req.params.courseId
    try {
      await prisma.course.delete({ where: { id: courseId } })
      res.json({ success: true, message: 'Course removed successfully.' })
    } catch (error) {
      next(error)
    }
  })

  // ==========================================
  // THREAD MODERATION CONSOLE
  // ==========================================
  router.get('/moderation/threads', adminOnly, async (_req, res, next) => {
    try {
      const threads = await prisma.forumThread.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          author: { select: { displayName: true, email: true } },
          category: { select: { name: true } },
          _count: { select: { replies: true } },
        },
      })

      res.setHeader('Cache-Control', 'no-store')
      res.json({
        threads: threads.map((t) => ({
          id: t.id,
          slug: t.slug,
          title: t.title,
          categoryName: t.category.name,
          authorName: t.author.displayName,
          authorEmail: t.author.email,
          status: t.status,
          isPinned: t.isPinned,
          isLocked: t.isLocked,
          upvotesCount: t.upvotesCount,
          repliesCount: t._count.replies,
          createdAt: t.createdAt.toISOString(),
        })),
      })
    } catch (error) {
      next(error)
    }
  })

  router.patch('/moderation/threads/:threadId', adminOnly, csrfGuard, async (req, res, next) => {
    const threadId = req.params.threadId
    const parsed = threadModerationSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Choose a valid moderation action.' })

    const { action } = parsed.data
    const data: Prisma.ForumThreadUpdateInput = {}

    if (action === 'PIN') data.isPinned = true
    if (action === 'UNPIN') data.isPinned = false
    if (action === 'LOCK') data.isLocked = true
    if (action === 'UNLOCK') data.isLocked = false
    if (action === 'APPROVE') data.status = 'APPROVED'
    if (action === 'HIDE') data.status = 'HIDDEN'

    try {
      const thread = await prisma.forumThread.update({
        where: { id: threadId },
        data,
        select: { id: true, isPinned: true, isLocked: true, status: true },
      })
      res.json({ thread })
    } catch (error) {
      next(error)
    }
  })

  // ==========================================
  // SECURITY UPDATES / NEWS (Existing Contract)
  // ==========================================
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
