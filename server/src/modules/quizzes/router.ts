import { Router, type Request, type Response, type NextFunction } from 'express'
import type { PrismaClient } from '@prisma/client'
import { quizListQuerySchema, quizSlugSchema, submitQuizSchema } from './validation.js'
import { csrfGuard } from '../auth/router.js'
import { awardXp, unlockAchievement } from '../gamification/router.js'

function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required for quiz assessment operations.' })
  }
  next()
}

export function quizzesRouter(prisma: PrismaClient) {
  const router = Router()

  // GET /api/quizzes - List all available quizzes with user best attempt status
  router.get('/', async (req, res, next) => {
    const parsed = quizListQuerySchema.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid quiz filter query.' })

    const { category, difficulty, q } = parsed.data
    const userId = req.session?.userId

    try {
      const whereClause: Record<string, unknown> = {}
      if (category && category !== 'all') whereClause.categorySlug = category
      if (difficulty) whereClause.difficulty = difficulty
      if (q) {
        whereClause.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ]
      }

      const quizzes = await prisma.quiz.findMany({
        where: whereClause,
        include: {
          questions: {
            select: { id: true, points: true },
          },
          attempts: userId
            ? {
                where: { userId },
                orderBy: { percentage: 'desc' },
                take: 1,
              }
            : false,
        },
        orderBy: [{ difficulty: 'asc' }, { title: 'asc' }],
      })

      const summaries = quizzes.map((quiz) => {
        const totalQuestions = quiz.questions.length
        const totalPoints = quiz.questions.reduce((sum, qItem) => sum + qItem.points, 0)
        const bestAttempt = quiz.attempts && quiz.attempts.length > 0 ? quiz.attempts[0] : null

        return {
          id: quiz.id,
          slug: quiz.slug,
          title: quiz.title,
          description: quiz.description,
          categorySlug: quiz.categorySlug,
          difficulty: quiz.difficulty,
          timeLimitMins: quiz.timeLimitMins,
          passingScore: quiz.passingScore,
          xpReward: quiz.xpReward,
          totalQuestions,
          totalPoints,
          bestAttempt: bestAttempt
            ? {
                score: bestAttempt.score,
                maxScore: bestAttempt.maxScore,
                percentage: bestAttempt.percentage,
                passed: bestAttempt.passed,
                completedAt: bestAttempt.completedAt.toISOString(),
              }
            : null,
        }
      })

      res.json({ quizzes: summaries })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/quizzes/:slug - Retrieve questions & options (SANITIZED: no correct answer leakage)
  router.get('/:slug', async (req, res, next) => {
    const parsed = quizSlugSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid quiz identifier.' })

    const { slug } = parsed.data
    const userId = req.session?.userId

    try {
      const quiz = await prisma.quiz.findUnique({
        where: { slug },
        include: {
          questions: {
            orderBy: { orderIndex: 'asc' },
            select: {
              id: true,
              prompt: true,
              codeSnippet: true,
              orderIndex: true,
              points: true,
              // OMIT explanation and isCorrect to prevent client-side answer inspection
              options: {
                orderBy: { orderIndex: 'asc' },
                select: {
                  id: true,
                  text: true,
                  orderIndex: true,
                  // OMIT isCorrect
                },
              },
            },
          },
          attempts: userId
            ? {
                where: { userId },
                orderBy: { percentage: 'desc' },
                take: 1,
              }
            : false,
        },
      })

      if (!quiz) return res.status(404).json({ error: 'Quiz assessment not found.' })

      const totalQuestions = quiz.questions.length
      const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0)
      const bestAttempt = quiz.attempts && quiz.attempts.length > 0 ? quiz.attempts[0] : null

      res.json({
        quiz: {
          id: quiz.id,
          slug: quiz.slug,
          title: quiz.title,
          description: quiz.description,
          categorySlug: quiz.categorySlug,
          difficulty: quiz.difficulty,
          timeLimitMins: quiz.timeLimitMins,
          passingScore: quiz.passingScore,
          xpReward: quiz.xpReward,
          totalQuestions,
          totalPoints,
          questions: quiz.questions,
          bestAttempt: bestAttempt
            ? {
                score: bestAttempt.score,
                maxScore: bestAttempt.maxScore,
                percentage: bestAttempt.percentage,
                passed: bestAttempt.passed,
                completedAt: bestAttempt.completedAt.toISOString(),
              }
            : null,
        },
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/quizzes/:slug/submit - Grade answers server-side, record attempt, award XP
  router.post('/:slug/submit', requireUser, csrfGuard, async (req, res, next) => {
    const slugParsed = quizSlugSchema.safeParse(req.params)
    if (!slugParsed.success) return res.status(400).json({ error: 'Invalid quiz identifier.' })

    const bodyParsed = submitQuizSchema.safeParse(req.body)
    if (!bodyParsed.success) return res.status(400).json({ error: 'Invalid quiz submission data.' })

    const userId = req.session.userId!
    const { slug } = slugParsed.data
    const { answers, timeSpentSecs } = bodyParsed.data

    try {
      const quiz = await prisma.quiz.findUnique({
        where: { slug },
        include: {
          questions: {
            orderBy: { orderIndex: 'asc' },
            include: {
              options: true,
            },
          },
        },
      })

      if (!quiz) return res.status(404).json({ error: 'Quiz assessment not found.' })

      // Check if user has previously passed this quiz
      const priorPassedAttempt = await prisma.quizAttempt.findFirst({
        where: {
          userId,
          quizId: quiz.id,
          passed: true,
        },
      })

      let earnedScore = 0
      let maxScore = 0

      // Grade each question and build review
      const review = quiz.questions.map((question) => {
        maxScore += question.points
        const selectedOptionId = answers[question.id] || null
        const correctOption = question.options.find((opt) => opt.isCorrect)
        const isCorrect = selectedOptionId !== null && correctOption?.id === selectedOptionId

        const pointsEarned = isCorrect ? question.points : 0
        earnedScore += pointsEarned

        return {
          questionId: question.id,
          prompt: question.prompt,
          codeSnippet: question.codeSnippet,
          explanation: question.explanation,
          selectedOptionId,
          correctOptionId: correctOption?.id || '',
          isCorrect,
          pointsEarned,
          maxPoints: question.points,
          options: question.options.map((opt) => ({
            id: opt.id,
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
        }
      })

      const percentage = maxScore > 0 ? Math.round((earnedScore / maxScore) * 100) : 0
      const passed = percentage >= quiz.passingScore

      // Award XP only if passed and not previously passed
      let xpToAward = 0
      if (passed && !priorPassedAttempt) {
        xpToAward = quiz.xpReward
      }

      // Persist attempt
      await prisma.quizAttempt.create({
        data: {
          userId,
          quizId: quiz.id,
          score: earnedScore,
          maxScore,
          percentage,
          passed,
          timeSpentSecs,
          answers,
          xpAwarded: xpToAward,
        },
      })

      // Award XP and achievements
      if (xpToAward > 0) {
        await awardXp(
          prisma,
          userId,
          xpToAward,
          'QUIZ_PASSED',
          `Passed ${quiz.title} assessment (${percentage}%)`
        )
      }

      if (percentage === 100) {
        await unlockAchievement(prisma, userId, 'quiz-perfectionist')
      }

      res.json({
        quizId: quiz.id,
        slug: quiz.slug,
        score: earnedScore,
        maxScore,
        percentage,
        passed,
        passingScore: quiz.passingScore,
        xpAwarded: xpToAward,
        timeSpentSecs,
        review,
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/quizzes/:slug/attempts - Learner attempt history
  router.get('/:slug/attempts', requireUser, async (req, res, next) => {
    const parsed = quizSlugSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid quiz identifier.' })

    const userId = req.session.userId!
    const { slug } = parsed.data

    try {
      const quiz = await prisma.quiz.findUnique({ where: { slug }, select: { id: true } })
      if (!quiz) return res.status(404).json({ error: 'Quiz not found.' })

      const attempts = await prisma.quizAttempt.findMany({
        where: { userId, quizId: quiz.id },
        orderBy: { completedAt: 'desc' },
      })

      res.json({
        attempts: attempts.map((a) => ({
          id: a.id,
          quizId: a.quizId,
          score: a.score,
          maxScore: a.maxScore,
          percentage: a.percentage,
          passed: a.passed,
          timeSpentSecs: a.timeSpentSecs,
          xpAwarded: a.xpAwarded,
          completedAt: a.completedAt.toISOString(),
        })),
      })
    } catch (error) {
      next(error)
    }
  })

  return router
}
