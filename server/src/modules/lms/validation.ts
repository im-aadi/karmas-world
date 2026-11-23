import { z } from 'zod'

export const courseQuerySchema = z.object({
  category: z.string().trim().max(60).optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export const courseSlugSchema = z.object({
  slug: z.string().trim().min(1).max(100),
})

export const categorySlugSchema = z.object({
  slug: z.string().trim().min(1).max(60),
})

export const idParamSchema = z.object({
  id: z.string().trim().min(1).max(100),
})
