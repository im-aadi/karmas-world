import { Router, type Request, type Response, type NextFunction } from 'express'
import type { PrismaClient, DifficultyLevel } from '@prisma/client'
import { courseQuerySchema, courseSlugSchema, categorySlugSchema, idParamSchema } from './validation.js'
import { csrfGuard } from '../auth/router.js'
import { awardXp, unlockAchievement } from '../gamification/router.js'

function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) return res.status(401).json({ error: 'Authentication required for this action.' })
  next()
}

export function lmsRouter(prisma: PrismaClient) {
  const router = Router()

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  // GET /api/categories - List all categories with course count
  router.get('/categories', async (_req, res, next) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { courses: true },
          },
        },
      })

      res.json({
        categories: categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          description: c.description,
          level: c.level,
          iconName: c.iconName,
          coursesCount: c._count.courses,
        })),
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/categories/:slug - Single category with courses
  router.get('/categories/:slug', async (req, res, next) => {
    const parsed = categorySlugSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid category identifier.' })

    try {
      const category = await prisma.category.findUnique({
        where: { slug: parsed.data.slug },
        include: {
          courses: {
            orderBy: { title: 'asc' },
            include: {
              _count: {
                select: { modules: true },
              },
            },
          },
        },
      })

      if (!category) return res.status(404).json({ error: 'Category not found.' })

      res.json({
        category: {
          id: category.id,
          slug: category.slug,
          name: category.name,
          description: category.description,
          level: category.level,
          iconName: category.iconName,
          courses: category.courses.map((course) => ({
            id: course.id,
            slug: course.slug,
            title: course.title,
            description: course.description,
            level: course.level,
            duration: course.duration,
            xpReward: course.xpReward,
            modulesCount: course._count.modules,
          })),
        },
      })
    } catch (error) {
      next(error)
    }
  })

  // ============================================================================
  // COURSES
  // ============================================================================

  // GET /api/courses - List courses with filters
  router.get('/courses', async (req, res, next) => {
    const parsed = courseQuerySchema.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid query parameters.' })

    const { category, difficulty, q, limit, offset } = parsed.data

    const where: Record<string, unknown> = {}

    if (category) {
      where.category = { slug: category }
    }

    if (difficulty) {
      where.level = difficulty as DifficultyLevel
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    try {
      const [total, courses] = await Promise.all([
        prisma.course.count({ where }),
        prisma.course.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { title: 'asc' },
          include: {
            category: { select: { id: true, slug: true, name: true } },
            _count: { select: { modules: true, enrollments: true } },
          },
        }),
      ])

      res.json({
        total,
        limit,
        offset,
        courses: courses.map((c) => ({
          id: c.id,
          slug: c.slug,
          title: c.title,
          description: c.description,
          level: c.level,
          duration: c.duration,
          xpReward: c.xpReward,
          category: c.category,
          modulesCount: c._count.modules,
          enrollmentsCount: c._count.enrollments,
        })),
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/courses/:slug - Course detail with syllabus
  router.get('/courses/:slug', async (req, res, next) => {
    const parsed = courseSlugSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid course slug.' })

    const userId = req.session.userId

    try {
      const course = await prisma.course.findUnique({
        where: { slug: parsed.data.slug },
        include: {
          category: { select: { id: true, slug: true, name: true, iconName: true } },
          modules: {
            orderBy: { orderIndex: 'asc' },
            include: {
              lessons: {
                orderBy: { orderIndex: 'asc' },
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  duration: true,
                  orderIndex: true,
                  xpReward: true,
                },
              },
            },
          },
        },
      })

      if (!course) return res.status(404).json({ error: 'Course not found.' })

      let enrollment = null
      if (userId) {
        enrollment = await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId, courseId: course.id } },
          select: { enrolledAt: true, completedAt: true },
        })
      }

      res.json({
        course: {
          id: course.id,
          slug: course.slug,
          title: course.title,
          description: course.description,
          level: course.level,
          duration: course.duration,
          xpReward: course.xpReward,
          category: course.category,
          modules: course.modules,
          isEnrolled: Boolean(enrollment),
          enrolledAt: enrollment?.enrolledAt ?? null,
          completedAt: enrollment?.completedAt ?? null,
        },
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/courses/:id/enroll - Enroll user in course
  router.post('/courses/:id/enroll', requireUser, csrfGuard, async (req, res, next) => {
    const parsed = idParamSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid course ID.' })

    const userId = req.session.userId!
    const courseId = parsed.data.id

    try {
      const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true } })
      if (!course) return res.status(404).json({ error: 'Course not found.' })

      const enrollment = await prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: { userId, courseId },
        update: {},
        select: { id: true, enrolledAt: true, completedAt: true },
      })

      res.status(200).json({
        success: true,
        message: `Successfully enrolled in ${course.title}.`,
        enrollment,
      })
    } catch (error) {
      next(error)
    }
  })

  // ============================================================================
  // LESSONS & BOOKMARKS
  // ============================================================================

  // GET /api/lessons/:id - Lesson viewer
  router.get('/lessons/:id', async (req, res, next) => {
    const parsed = idParamSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid lesson ID.' })

    const userId = req.session.userId

    try {
      const lesson = await prisma.lesson.findUnique({
        where: { id: parsed.data.id },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              course: {
                select: { id: true, slug: true, title: true },
              },
            },
          },
        },
      })

      if (!lesson) return res.status(404).json({ error: 'Lesson not found.' })

      let isBookmarked = false
      if (userId) {
        const bookmark = await prisma.bookmark.findUnique({
          where: { userId_lessonId: { userId, lessonId: lesson.id } },
        })
        isBookmarked = Boolean(bookmark)
      }

      res.json({
        lesson: {
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          duration: lesson.duration,
          content: lesson.content,
          xpReward: lesson.xpReward,
          module: lesson.module,
          isBookmarked,
        },
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/lessons/:id/complete - Complete a lesson
  router.post('/lessons/:id/complete', requireUser, csrfGuard, async (req, res, next) => {
    const parsed = idParamSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid lesson ID.' })

    const userId = req.session.userId!
    const lessonId = parsed.data.id

    try {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: {
            select: {
              courseId: true,
              course: {
                include: {
                  modules: {
                    include: {
                      lessons: { select: { id: true } },
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!lesson) return res.status(404).json({ error: 'Lesson not found.' })

      const courseId = lesson.module.courseId

      // Record lesson completion & ensure enrollment
      const result = await prisma.$transaction(async (tx) => {
        // Ensure user is enrolled
        await tx.enrollment.upsert({
          where: { userId_courseId: { userId, courseId } },
          create: { userId, courseId },
          update: {},
        })

        // Check if all lessons in the course are completed
        const allLessonIds = lesson.module.course.modules.flatMap((m) => m.lessons.map((l) => l.id))

        // Record progress entry
        const progress = await tx.lessonProgress.upsert({
          where: { userId_courseId_lessonIndex: { userId, courseId, lessonIndex: lesson.orderIndex } },
          create: { userId, courseId, lessonIndex: lesson.orderIndex },
          update: {},
        })

        // Check total completed
        const completedCount = await tx.lessonProgress.count({
          where: { userId, courseId },
        })

        let courseCompleted = false
        if (completedCount >= allLessonIds.length && allLessonIds.length > 0) {
          courseCompleted = true
          await tx.enrollment.update({
            where: { userId_courseId: { userId, courseId } },
            data: { completedAt: new Date() },
          })
        }

        // Update learning streak
        await tx.learningStreak.upsert({
          where: { userId },
          create: { userId, currentStreak: 1, longestStreak: 1, lastActiveDate: new Date() },
          update: {
            currentStreak: { increment: 1 },
            lastActiveDate: new Date(),
          },
        })

        return { progress, courseCompleted, xpEarned: lesson.xpReward }
      })

      // Award XP transaction & increment user's totalXp
      await awardXp(
        prisma,
        userId,
        lesson.xpReward,
        'LESSON_COMPLETED',
        `Completed lesson: ${lesson.title}`
      ).catch(() => {})

      // Unlock first-step achievement
      await unlockAchievement(prisma, userId, 'first-step').catch(() => {})

      res.status(200).json({
        success: true,
        message: 'Lesson completed successfully.',
        ...result,
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/lessons/:id/bookmark - Toggle bookmark
  router.post('/lessons/:id/bookmark', requireUser, csrfGuard, async (req, res, next) => {
    const parsed = idParamSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid lesson ID.' })

    const userId = req.session.userId!
    const lessonId = parsed.data.id

    try {
      const existing = await prisma.bookmark.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      })

      if (existing) {
        await prisma.bookmark.delete({
          where: { userId_lessonId: { userId, lessonId } },
        })
        return res.status(200).json({ bookmarked: false, message: 'Bookmark removed.' })
      } else {
        await prisma.bookmark.create({
          data: { userId, lessonId },
        })
        return res.status(200).json({ bookmarked: true, message: 'Lesson bookmarked.' })
      }
    } catch (error) {
      next(error)
    }
  })

  // GET /api/bookmarks - List all bookmarked lessons
  router.get('/bookmarks', requireUser, async (req, res, next) => {
    const userId = req.session.userId!

    try {
      const bookmarks = await prisma.bookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          lesson: {
            select: {
              id: true,
              slug: true,
              title: true,
              duration: true,
              module: {
                select: {
                  title: true,
                  course: {
                    select: { slug: true, title: true },
                  },
                },
              },
            },
          },
        },
      })

      res.setHeader('Cache-Control', 'no-store')
      res.json({
        bookmarks: bookmarks.map((b) => ({
          id: b.id,
          createdAt: b.createdAt,
          lesson: b.lesson,
        })),
      })
    } catch (error) {
      next(error)
    }
  })

  return router
}
