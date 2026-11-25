import express from 'express'
import session from 'express-session'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { gamificationRouter } from './router.js'
import { calculateUserLevel, CYBER_RANKS } from './ranks.js'

function createGamificationTestApp(prismaMock: Record<string, unknown>) {
  const app = express()
  app.use(express.json())
  app.use(
    session({
      secret: 'test-secret-at-least-32-chars-long-12345',
      resave: false,
      saveUninitialized: false,
    })
  )
  app.locals.isAllowedOrigin = () => true

  app.post('/test/auth', (req, res) => {
    req.session.userId = 'learner-test-1'
    req.session.csrfToken = 'valid-csrf-token'
    res.json({ sessionId: req.sessionID, csrfToken: req.session.csrfToken })
  })

  app.use('/api/gamification', gamificationRouter(prismaMock as unknown as PrismaClient))
  return app
}

describe('Gamification Ranks & Level Progression', () => {
  it('correctly calculates ranks across all XP tiers', () => {
    // 0 XP -> Cadet
    const lvl0 = calculateUserLevel(0)
    expect(lvl0.level).toBe(1)
    expect(lvl0.rankTitle).toBe('Cadet')
    expect(lvl0.currentXp).toBe(0)
    expect(lvl0.progressPercent).toBe(0)

    // 250 XP -> Level 1 (50% to Level 2)
    const lvl250 = calculateUserLevel(250)
    expect(lvl250.level).toBe(1)
    expect(lvl250.progressPercent).toBe(50)

    // 500 XP -> Level 2 Scout
    const lvl500 = calculateUserLevel(500)
    expect(lvl500.level).toBe(2)
    expect(lvl500.rankTitle).toBe('Scout')

    // 2200 XP -> Level 4 Sentinel
    const lvl2200 = calculateUserLevel(2200)
    expect(lvl2200.level).toBe(4)
    expect(lvl2200.rankTitle).toBe('Sentinel')

    // 16000 XP -> Level 8 Master (Max tier)
    const lvlMax = calculateUserLevel(16000)
    expect(lvlMax.level).toBe(8)
    expect(lvlMax.rankTitle).toBe('Master')
    expect(lvlMax.nextLevelXp).toBeNull()
  })

  it('contains 8 properly ranked progression tiers', () => {
    expect(CYBER_RANKS).toHaveLength(8)
    for (let i = 1; i < CYBER_RANKS.length; i++) {
      expect(CYBER_RANKS[i]!.minXp).toBeGreaterThan(CYBER_RANKS[i - 1]!.minXp)
      expect(CYBER_RANKS[i]!.level).toBe(CYBER_RANKS[i - 1]!.level + 1)
    }
  })
})

describe('Gamification API Module (Phase 6)', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const app = createGamificationTestApp({})
    await request(app).get('/api/gamification/stats').expect(401)
    await request(app).get('/api/gamification/achievements').expect(401)
    await request(app).get('/api/gamification/weekly-challenges').expect(401)
  })

  it('GET /api/gamification/stats returns learner gamification profile', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'learner-test-1',
          displayName: 'Aditya Kashyap',
          totalXp: 1250,
          createdAt: new Date('2026-01-01'),
        }),
      },
      learningStreak: {
        findUnique: vi.fn().mockResolvedValue({
          userId: 'learner-test-1',
          currentStreak: 5,
          longestStreak: 12,
          lastActiveDate: new Date(),
        }),
      },
      userAchievement: {
        count: vi.fn().mockResolvedValue(4),
      },
      achievement: {
        count: vi.fn().mockResolvedValue(10),
      },
      weeklyChallenge: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'wc-1',
            slug: 'weekly-recon-master',
            title: 'Reconnaissance Master',
            description: 'Solve 2 flags',
            category: 'OSINT',
            targetCount: 2,
            type: 'SOLVE_FLAGS',
            xpReward: 250,
            badgeIcon: 'Search',
            startsAt: new Date(Date.now() - 86400000),
            expiresAt: new Date(Date.now() + 86400000 * 5),
            userClaims: [],
          },
        ]),
      },
      labAttempt: {
        findMany: vi.fn().mockResolvedValue([
          { completedTasks: ['task-1', 'task-2'] },
        ]),
      },
      xPTransaction: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'tx-1',
            amount: 150,
            source: 'LAB_COMPLETED',
            description: 'Completed SQL Injection lab',
            createdAt: new Date(),
          },
        ]),
      },
    }

    const app = createGamificationTestApp(prisma)
    const agent = request.agent(app)
    await agent.post('/test/auth').expect(200)

    const res = await agent.get('/api/gamification/stats').expect(200)
    expect(res.body.totalXp).toBe(1250)
    expect(res.body.levelProgress.level).toBe(3)
    expect(res.body.levelProgress.rankTitle).toBe('Defender')
    expect(res.body.streak.currentStreak).toBe(5)
    expect(res.body.streak.isActiveToday).toBe(true)
    expect(res.body.achievements.unlockedCount).toBe(4)
    expect(res.body.weeklyChallenges[0].isCompleted).toBe(true)
    expect(res.body.weeklyChallenges[0].isClaimed).toBe(false)
    expect(res.body.recentTransactions).toHaveLength(1)
  })

  it('GET /api/gamification/achievements returns full badge list with unlock indicators', async () => {
    const prisma = {
      achievement: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'ach-1',
            slug: 'first-flag',
            title: 'First Blood',
            description: 'Capture your first flag',
            icon: 'Flag',
            xpValue: 100,
          },
          {
            id: 'ach-2',
            slug: 'terminal-ninja',
            title: 'Terminal Ninja',
            description: 'Execute 50 commands',
            icon: 'Terminal',
            xpValue: 150,
          },
        ]),
      },
      userAchievement: {
        findMany: vi.fn().mockResolvedValue([
          {
            achievementId: 'ach-1',
            unlockedAt: new Date('2026-11-20'),
          },
        ]),
      },
    }

    const app = createGamificationTestApp(prisma)
    const agent = request.agent(app)
    await agent.post('/test/auth').expect(200)

    const res = await agent.get('/api/gamification/achievements').expect(200)
    expect(res.body.achievements).toHaveLength(2)
    expect(res.body.achievements[0].unlocked).toBe(true)
    expect(res.body.achievements[1].unlocked).toBe(false)
  })

  it('POST /api/gamification/claim-challenge/:slug verifies criteria and awards XP', async () => {
    const challengeDate = new Date(Date.now() - 86400000)
    const expiresDate = new Date(Date.now() + 86400000 * 4)

    const prisma = {
      weeklyChallenge: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'wc-lessons',
          slug: 'weekly-knowledge-voyager',
          title: 'Knowledge Voyager',
          description: 'Complete 3 lessons',
          type: 'COMPLETE_LESSONS',
          targetCount: 3,
          xpReward: 300,
          startsAt: challengeDate,
          expiresAt: expiresDate,
          userClaims: [],
        }),
      },
      lessonProgress: {
        count: vi.fn().mockResolvedValue(3),
      },
      userWeeklyChallengeClaim: {
        create: vi.fn().mockResolvedValue({ id: 'claim-1' }),
      },
      user: {
        update: vi.fn().mockResolvedValue({ id: 'learner-test-1', totalXp: 800 }),
        findUnique: vi.fn().mockResolvedValue({ id: 'learner-test-1', totalXp: 800 }),
      },
      xPTransaction: {
        create: vi.fn().mockResolvedValue({ id: 'tx-new' }),
      },
      $transaction: vi.fn().mockImplementation((promises) => Promise.all(promises)),
      achievement: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    }

    const app = createGamificationTestApp(prisma)
    const agent = request.agent(app)
    const authRes = await agent.post('/test/auth').expect(200)

    const res = await agent
      .post('/api/gamification/claim-challenge/weekly-knowledge-voyager')
      .set('x-csrf-token', authRes.body.csrfToken)
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.xpAwarded).toBe(300)
    expect(res.body.newTotalXp).toBe(800)
    expect(prisma.userWeeklyChallengeClaim.create).toHaveBeenCalled()
  })

  it('POST /api/gamification/claim-challenge/:slug rejects claim if criteria not met', async () => {
    const prisma = {
      weeklyChallenge: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'wc-streak',
          slug: 'weekly-consistent-defender',
          title: 'Consistent Defender',
          type: 'STREAK_DAYS',
          targetCount: 7,
          xpReward: 400,
          startsAt: new Date(Date.now() - 86400000),
          expiresAt: new Date(Date.now() + 86400000 * 4),
          userClaims: [],
        }),
      },
      learningStreak: {
        findUnique: vi.fn().mockResolvedValue({ currentStreak: 3 }),
      },
    }

    const app = createGamificationTestApp(prisma)
    const agent = request.agent(app)
    const authRes = await agent.post('/test/auth').expect(200)

    const res = await agent
      .post('/api/gamification/claim-challenge/weekly-consistent-defender')
      .set('x-csrf-token', authRes.body.csrfToken)
      .expect(400)

    expect(res.body.error).toContain('Challenge criteria not yet fulfilled')
  })

  it('GET /api/gamification/history returns paginated XP log', async () => {
    const prisma = {
      xPTransaction: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'tx-1',
            amount: 100,
            source: 'LESSON_COMPLETED',
            description: 'Lesson 1 Completed',
            createdAt: new Date(),
          },
        ]),
        count: vi.fn().mockResolvedValue(1),
      },
    }

    const app = createGamificationTestApp(prisma)
    const agent = request.agent(app)
    await agent.post('/test/auth').expect(200)

    const res = await agent.get('/api/gamification/history?limit=10&offset=0').expect(200)
    expect(res.body.total).toBe(1)
    expect(res.body.items).toHaveLength(1)
    expect(res.body.items[0].source).toBe('LESSON_COMPLETED')
  })
})
