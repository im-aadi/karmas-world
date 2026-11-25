import { Router, type Request, type Response, type NextFunction } from 'express'
import type { PrismaClient } from '@prisma/client'
import { calculateUserLevel } from './ranks.js'
import { challengeSlugSchema, historyQuerySchema } from './validation.js'
import { csrfGuard } from '../auth/router.js'

function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required for gamification features.' })
  }
  next()
}

export async function awardXp(
  prisma: PrismaClient,
  userId: string,
  amount: number,
  source: string,
  description: string
) {
  if (amount <= 0) return

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { totalXp: { increment: amount } },
    }),
    prisma.xPTransaction.create({
      data: {
        userId,
        amount,
        source,
        description,
      },
    }),
  ])
}

export async function unlockAchievement(prisma: PrismaClient, userId: string, slug: string) {
  try {
    const achievement = await prisma.achievement.findUnique({
      where: { slug },
    })
    if (!achievement) return null

    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    })
    if (existing) return null

    const created = await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
      },
      include: {
        achievement: true,
      },
    })

    if (achievement.xpValue > 0) {
      await awardXp(
        prisma,
        userId,
        achievement.xpValue,
        'ACHIEVEMENT_UNLOCKED',
        `Unlocked achievement: ${achievement.title}`
      )
    }

    return created
  } catch {
    return null
  }
}

export function gamificationRouter(prisma: PrismaClient) {
  const router = Router()

  // GET /api/gamification/stats - Comprehensive gamification profile for current learner
  router.get('/stats', requireUser, async (req, res, next) => {
    const userId = req.session.userId!

    try {
      const [user, streak, achievementsCount, totalAchievements, activeChallenges, recentTransactions] =
        await Promise.all([
          prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, displayName: true, totalXp: true, createdAt: true },
          }),
          prisma.learningStreak.findUnique({
            where: { userId },
          }),
          prisma.userAchievement.count({
            where: { userId },
          }),
          prisma.achievement.count(),
          prisma.weeklyChallenge.findMany({
            where: { expiresAt: { gt: new Date() } },
            include: {
              userClaims: {
                where: { userId },
              },
            },
            orderBy: { expiresAt: 'asc' },
          }),
          prisma.xPTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
          }),
        ])

      if (!user) return res.status(404).json({ error: 'User not found.' })

      // Determine streak activity
      const now = new Date()
      let isActiveToday = false
      let currentStreak = streak?.currentStreak ?? 0
      const longestStreak = streak?.longestStreak ?? 0

      if (streak?.lastActiveDate) {
        const lastDate = new Date(streak.lastActiveDate)
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        isActiveToday = diffDays === 0
      }

      // Check weekly challenges progress
      const challengesProgress = await Promise.all(
        activeChallenges.map(async (wc) => {
          let currentCount = 0
          if (wc.type === 'COMPLETE_LESSONS') {
            currentCount = await prisma.lessonProgress.count({
              where: {
                userId,
                completedAt: { gte: wc.startsAt },
              },
            })
          } else if (wc.type === 'COMPLETE_LABS') {
            currentCount = await prisma.labAttempt.count({
              where: {
                userId,
                status: 'COMPLETED',
                completedAt: { gte: wc.startsAt },
              },
            })
          } else if (wc.type === 'SOLVE_FLAGS') {
            const attempts = await prisma.labAttempt.findMany({
              where: { userId },
              select: { completedTasks: true },
            })
            currentCount = attempts.reduce((sum, a) => {
              const arr = Array.isArray(a.completedTasks) ? (a.completedTasks as string[]) : []
              return sum + arr.length
            }, 0)
          } else if (wc.type === 'STREAK_DAYS') {
            currentCount = currentStreak
          }

          const isClaimed = wc.userClaims.length > 0
          const isCompleted = currentCount >= wc.targetCount

          return {
            challenge: {
              id: wc.id,
              slug: wc.slug,
              title: wc.title,
              description: wc.description,
              category: wc.category,
              targetCount: wc.targetCount,
              type: wc.type,
              xpReward: wc.xpReward,
              badgeIcon: wc.badgeIcon,
              startsAt: wc.startsAt.toISOString(),
              expiresAt: wc.expiresAt.toISOString(),
            },
            currentCount: Math.min(currentCount, wc.targetCount),
            isCompleted,
            isClaimed,
          }
        })
      )

      const levelProgress = calculateUserLevel(user.totalXp)

      res.json({
        totalXp: user.totalXp,
        levelProgress,
        streak: {
          currentStreak,
          longestStreak,
          lastActiveDate: streak?.lastActiveDate ? streak.lastActiveDate.toISOString() : null,
          isActiveToday,
        },
        achievements: {
          unlockedCount: achievementsCount,
          totalCount: totalAchievements,
        },
        weeklyChallenges: challengesProgress,
        recentTransactions: recentTransactions.map((t) => ({
          id: t.id,
          amount: t.amount,
          source: t.source,
          description: t.description,
          createdAt: t.createdAt.toISOString(),
        })),
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/gamification/achievements - All achievements with learner unlock status
  router.get('/achievements', requireUser, async (req, res, next) => {
    const userId = req.session.userId!

    try {
      const [allAchievements, userUnlocked] = await Promise.all([
        prisma.achievement.findMany({
          orderBy: { xpValue: 'asc' },
        }),
        prisma.userAchievement.findMany({
          where: { userId },
        }),
      ])

      const unlockedMap = new Map(userUnlocked.map((u) => [u.achievementId, u.unlockedAt]))

      res.json({
        achievements: allAchievements.map((ach) => ({
          id: ach.id,
          slug: ach.slug,
          title: ach.title,
          description: ach.description,
          icon: ach.icon,
          xpValue: ach.xpValue,
          unlocked: unlockedMap.has(ach.id),
          unlockedAt: unlockedMap.get(ach.id)?.toISOString() ?? null,
        })),
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/gamification/weekly-challenges - Active challenges list
  router.get('/weekly-challenges', requireUser, async (req, res, next) => {
    const userId = req.session.userId!

    try {
      const challenges = await prisma.weeklyChallenge.findMany({
        where: { expiresAt: { gt: new Date() } },
        include: {
          userClaims: {
            where: { userId },
          },
        },
        orderBy: { expiresAt: 'asc' },
      })

      const streak = await prisma.learningStreak.findUnique({
        where: { userId },
      })

      const results = await Promise.all(
        challenges.map(async (wc) => {
          let currentCount = 0
          if (wc.type === 'COMPLETE_LESSONS') {
            currentCount = await prisma.lessonProgress.count({
              where: {
                userId,
                completedAt: { gte: wc.startsAt },
              },
            })
          } else if (wc.type === 'COMPLETE_LABS') {
            currentCount = await prisma.labAttempt.count({
              where: {
                userId,
                status: 'COMPLETED',
                completedAt: { gte: wc.startsAt },
              },
            })
          } else if (wc.type === 'SOLVE_FLAGS') {
            const attempts = await prisma.labAttempt.findMany({
              where: { userId },
              select: { completedTasks: true },
            })
            currentCount = attempts.reduce((sum, a) => {
              const arr = Array.isArray(a.completedTasks) ? (a.completedTasks as string[]) : []
              return sum + arr.length
            }, 0)
          } else if (wc.type === 'STREAK_DAYS') {
            currentCount = streak?.currentStreak ?? 0
          }

          const isClaimed = wc.userClaims.length > 0
          const isCompleted = currentCount >= wc.targetCount

          return {
            id: wc.id,
            slug: wc.slug,
            title: wc.title,
            description: wc.description,
            category: wc.category,
            targetCount: wc.targetCount,
            type: wc.type,
            xpReward: wc.xpReward,
            badgeIcon: wc.badgeIcon,
            startsAt: wc.startsAt.toISOString(),
            expiresAt: wc.expiresAt.toISOString(),
            currentCount: Math.min(currentCount, wc.targetCount),
            isCompleted,
            isClaimed,
          }
        })
      )

      res.json({ challenges: results })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/gamification/claim-challenge/:slug - Claim reward for a completed challenge
  router.post('/claim-challenge/:slug', requireUser, csrfGuard, async (req, res, next) => {
    const parsed = challengeSlugSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid challenge identifier.' })

    const userId = req.session.userId!
    const { slug } = parsed.data

    try {
      const challenge = await prisma.weeklyChallenge.findUnique({
        where: { slug },
        include: {
          userClaims: {
            where: { userId },
          },
        },
      })

      if (!challenge) return res.status(404).json({ error: 'Weekly challenge not found.' })
      if (challenge.expiresAt <= new Date()) {
        return res.status(400).json({ error: 'This weekly challenge has expired.' })
      }
      if (challenge.userClaims.length > 0) {
        return res.status(400).json({ error: 'Reward for this challenge has already been claimed.' })
      }

      // Verify completion criteria on server
      let currentCount = 0
      if (challenge.type === 'COMPLETE_LESSONS') {
        currentCount = await prisma.lessonProgress.count({
          where: {
            userId,
            completedAt: { gte: challenge.startsAt },
          },
        })
      } else if (challenge.type === 'COMPLETE_LABS') {
        currentCount = await prisma.labAttempt.count({
          where: {
            userId,
            status: 'COMPLETED',
            completedAt: { gte: challenge.startsAt },
          },
        })
      } else if (challenge.type === 'SOLVE_FLAGS') {
        const attempts = await prisma.labAttempt.findMany({
          where: { userId },
          select: { completedTasks: true },
        })
        currentCount = attempts.reduce((sum, a) => {
          const arr = Array.isArray(a.completedTasks) ? (a.completedTasks as string[]) : []
          return sum + arr.length
        }, 0)
      } else if (challenge.type === 'STREAK_DAYS') {
        const streak = await prisma.learningStreak.findUnique({ where: { userId } })
        currentCount = streak?.currentStreak ?? 0
      }

      if (currentCount < challenge.targetCount) {
        return res.status(400).json({
          error: `Challenge criteria not yet fulfilled (${currentCount}/${challenge.targetCount}). Complete the required activities to claim your reward.`,
        })
      }

      // Record claim & award XP
      await prisma.userWeeklyChallengeClaim.create({
        data: {
          userId,
          challengeId: challenge.id,
        },
      })

      await awardXp(
        prisma,
        userId,
        challenge.xpReward,
        'WEEKLY_CHALLENGE',
        `Completed weekly challenge: ${challenge.title}`
      )

      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { totalXp: true },
      })

      const levelProgress = calculateUserLevel(updatedUser?.totalXp ?? 0)

      // Check if Sentinel rank achieved (level >= 4)
      if (levelProgress.level >= 4) {
        await unlockAchievement(prisma, userId, 'sentinel-rank')
      }

      res.json({
        success: true,
        message: `Claimed +${challenge.xpReward} XP for completing "${challenge.title}"!`,
        xpAwarded: challenge.xpReward,
        newTotalXp: updatedUser?.totalXp ?? 0,
        levelProgress,
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/gamification/history - Full XP transaction history with pagination
  router.get('/history', requireUser, async (req, res, next) => {
    const parsed = historyQuerySchema.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid pagination query.' })

    const userId = req.session.userId!
    const { limit, offset } = parsed.data

    try {
      const [items, total] = await Promise.all([
        prisma.xPTransaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.xPTransaction.count({ where: { userId } }),
      ])

      res.json({
        total,
        limit,
        offset,
        items: items.map((t) => ({
          id: t.id,
          amount: t.amount,
          source: t.source,
          description: t.description,
          createdAt: t.createdAt.toISOString(),
        })),
      })
    } catch (error) {
      next(error)
    }
  })

  return router
}
