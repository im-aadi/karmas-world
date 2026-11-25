import { z } from 'zod'

export const quizListQuerySchema = z.object({
  category: z.string().trim().max(60).optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  q: z.string().trim().max(100).optional(),
})

export const quizSlugSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug must consist of lowercase alphanumeric characters and hyphens'),
})

export const submitQuizSchema = z.object({
  answers: z.record(z.string().trim().min(1), z.string().trim().min(1)),
  timeSpentSecs: z.number().int().min(0).max(86400),
})
