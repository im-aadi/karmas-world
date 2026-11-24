import crypto from 'node:crypto'
import { Router, type Request, type Response, type NextFunction } from 'express'
import type { PrismaClient, DifficultyLevel } from '@prisma/client'
import { labQuerySchema, labSlugSchema, verifyFlagSchema } from './validation.js'
import { csrfGuard } from '../auth/router.js'

function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) return res.status(401).json({ error: 'Authentication required for this action.' })
  next()
}

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text.trim()).digest('hex')
}

export function labsRouter(prisma: PrismaClient) {
  const router = Router()

  // GET /api/labs - List all practical labs
  router.get('/labs', async (req, res, next) => {
    const parsed = labQuerySchema.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid query parameters.' })

    const { category, difficulty, type, q, limit, offset } = parsed.data
    const userId = req.session.userId

    try {
      const where: Record<string, unknown> = {}
      if (category) where.categorySlug = category
      if (difficulty) where.difficulty = difficulty as DifficultyLevel
      if (type) where.type = type
      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ]
      }

      const [labs, total] = await Promise.all([
        prisma.lab.findMany({
          where,
          include: {
            tasks: {
              select: {
                id: true,
                title: true,
                instruction: true,
                hint: true,
                points: true,
                orderIndex: true,
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
          skip: offset,
          take: limit,
        }),
        prisma.lab.count({ where }),
      ])

      // If user is logged in, attach user attempts
      let userAttemptsMap: Record<string, { status: string; completedTasks: string[]; xpAwarded: number }> = {}
      if (userId) {
        const attempts = await prisma.labAttempt.findMany({
          where: {
            userId,
            labId: { in: labs.map((l) => l.id) },
          },
        })
        userAttemptsMap = attempts.reduce((acc, curr) => {
          acc[curr.labId] = {
            status: curr.status,
            completedTasks: Array.isArray(curr.completedTasks) ? (curr.completedTasks as string[]) : [],
            xpAwarded: curr.xpAwarded,
          }
          return acc
        }, {} as Record<string, { status: string; completedTasks: string[]; xpAwarded: number }>)
      }

      res.json({
        total,
        limit,
        offset,
        labs: labs.map((lab) => {
          const attempt = userAttemptsMap[lab.id]
          const totalPoints = lab.tasks.reduce((sum, t) => sum + t.points, 0)
          return {
            id: lab.id,
            slug: lab.slug,
            title: lab.title,
            description: lab.description,
            categorySlug: lab.categorySlug,
            difficulty: lab.difficulty,
            duration: lab.duration,
            xpReward: lab.xpReward,
            type: lab.type,
            instructions: lab.instructions,
            totalTasks: lab.tasks.length,
            totalPoints,
            tasks: lab.tasks,
            attempt: attempt ?? {
              status: 'NOT_STARTED',
              completedTasks: [],
              xpAwarded: 0,
            },
          }
        }),
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/labs/:slug - Single lab details and workspace metadata
  router.get('/labs/:slug', async (req, res, next) => {
    const parsed = labSlugSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid lab slug.' })

    const userId = req.session.userId

    try {
      const lab = await prisma.lab.findUnique({
        where: { slug: parsed.data.slug },
        include: {
          tasks: {
            select: {
              id: true,
              title: true,
              instruction: true,
              hint: true,
              points: true,
              orderIndex: true,
            },
            orderBy: { orderIndex: 'asc' },
          },
        },
      })

      if (!lab) return res.status(404).json({ error: 'Lab not found.' })

      let attempt = null
      if (userId) {
        attempt = await prisma.labAttempt.findUnique({
          where: {
            userId_labId: {
              userId,
              labId: lab.id,
            },
          },
        })
      }

      const totalPoints = lab.tasks.reduce((sum, t) => sum + t.points, 0)

      res.json({
        lab: {
          id: lab.id,
          slug: lab.slug,
          title: lab.title,
          description: lab.description,
          categorySlug: lab.categorySlug,
          difficulty: lab.difficulty,
          duration: lab.duration,
          xpReward: lab.xpReward,
          type: lab.type,
          instructions: lab.instructions,
          totalTasks: lab.tasks.length,
          totalPoints,
          tasks: lab.tasks,
          attempt: attempt
            ? {
                id: attempt.id,
                status: attempt.status,
                completedTasks: Array.isArray(attempt.completedTasks) ? (attempt.completedTasks as string[]) : [],
                xpAwarded: attempt.xpAwarded,
                startedAt: attempt.startedAt,
                completedAt: attempt.completedAt,
              }
            : {
                status: 'NOT_STARTED',
                completedTasks: [],
                xpAwarded: 0,
              },
        },
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/labs/:slug/start - Start or initialize a lab attempt
  router.post('/labs/:slug/start', requireUser, csrfGuard, async (req, res, next) => {
    const parsed = labSlugSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid lab slug.' })

    const userId = req.session.userId!

    try {
      const lab = await prisma.lab.findUnique({
        where: { slug: parsed.data.slug },
      })
      if (!lab) return res.status(404).json({ error: 'Lab not found.' })

      const attempt = await prisma.labAttempt.upsert({
        where: {
          userId_labId: {
            userId,
            labId: lab.id,
          },
        },
        update: {},
        create: {
          userId,
          labId: lab.id,
          status: 'IN_PROGRESS',
          completedTasks: [],
          xpAwarded: 0,
        },
      })

      res.json({
        message: 'Lab workspace initialized.',
        attempt: {
          id: attempt.id,
          status: attempt.status,
          completedTasks: Array.isArray(attempt.completedTasks) ? (attempt.completedTasks as string[]) : [],
          xpAwarded: attempt.xpAwarded,
          startedAt: attempt.startedAt,
        },
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/labs/:slug/verify - Verify submitted task flag / answer
  router.post('/labs/:slug/verify', requireUser, csrfGuard, async (req, res, next) => {
    const slugParsed = labSlugSchema.safeParse(req.params)
    if (!slugParsed.success) return res.status(400).json({ error: 'Invalid lab slug.' })

    const bodyParsed = verifyFlagSchema.safeParse(req.body)
    if (!bodyParsed.success) return res.status(400).json({ error: 'Invalid task verification payload.' })

    const userId = req.session.userId!
    const { taskId, flag } = bodyParsed.data

    try {
      const lab = await prisma.lab.findUnique({
        where: { slug: slugParsed.data.slug },
        include: {
          tasks: true,
        },
      })
      if (!lab) return res.status(404).json({ error: 'Lab not found.' })

      const task = lab.tasks.find((t) => t.id === taskId)
      if (!task) return res.status(404).json({ error: 'Task not found in this lab.' })

      // Check flag hash
      const submittedHash = sha256(flag)
      if (submittedHash !== task.flagHash) {
        return res.status(200).json({
          success: false,
          message: 'Incorrect flag or answer. Review the hint and inspect the simulation environment.',
          taskCompleted: false,
        })
      }

      // Valid flag! Update attempt
      let attempt = await prisma.labAttempt.findUnique({
        where: {
          userId_labId: {
            userId,
            labId: lab.id,
          },
        },
      })

      if (!attempt) {
        attempt = await prisma.labAttempt.create({
          data: {
            userId,
            labId: lab.id,
            status: 'IN_PROGRESS',
            completedTasks: [],
            xpAwarded: 0,
          },
        })
      }

      const existingCompleted = Array.isArray(attempt.completedTasks)
        ? (attempt.completedTasks as string[])
        : []

      if (existingCompleted.includes(taskId)) {
        return res.json({
          success: true,
          message: 'Task already completed previously.',
          taskCompleted: true,
          alreadyCompleted: true,
          allCompleted: attempt.status === 'COMPLETED',
          completedTasks: existingCompleted,
          pointsEarned: 0,
          totalXpAwarded: attempt.xpAwarded,
        })
      }

      const updatedCompleted = [...existingCompleted, taskId]
      const isAllCompleted = updatedCompleted.length >= lab.tasks.length
      const pointsEarned = task.points + (isAllCompleted ? lab.xpReward : 0)
      const newTotalXp = attempt.xpAwarded + pointsEarned

      const updatedAttempt = await prisma.labAttempt.update({
        where: { id: attempt.id },
        data: {
          completedTasks: updatedCompleted,
          xpAwarded: newTotalXp,
          status: isAllCompleted ? 'COMPLETED' : 'IN_PROGRESS',
          completedAt: isAllCompleted ? new Date() : undefined,
        },
      })

      // Update learning streak if exists
      await prisma.learningStreak
        .upsert({
          where: { userId },
          update: {
            currentStreak: { increment: 1 },
            lastActiveDate: new Date(),
          },
          create: {
            userId,
            currentStreak: 1,
            longestStreak: 1,
            lastActiveDate: new Date(),
          },
        })
        .catch(() => {})

      res.json({
        success: true,
        message: isAllCompleted
          ? `Outstanding! You conquered all tasks in ${lab.title} and earned a ${lab.xpReward} XP completion bonus!`
          : `Flag verified! Earned ${task.points} XP for ${task.title}.`,
        taskCompleted: true,
        alreadyCompleted: false,
        allCompleted: isAllCompleted,
        pointsEarned,
        completedTasks: updatedCompleted,
        totalXpAwarded: updatedAttempt.xpAwarded,
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/labs/:slug/reset - Reset learner's workspace progress
  router.post('/labs/:slug/reset', requireUser, csrfGuard, async (req, res, next) => {
    const parsed = labSlugSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid lab slug.' })

    const userId = req.session.userId!

    try {
      const lab = await prisma.lab.findUnique({
        where: { slug: parsed.data.slug },
      })
      if (!lab) return res.status(404).json({ error: 'Lab not found.' })

      await prisma.labAttempt.deleteMany({
        where: {
          userId,
          labId: lab.id,
        },
      })

      res.json({
        message: 'Lab workspace reset successfully.',
      })
    } catch (error) {
      next(error)
    }
  })

  return router
}
