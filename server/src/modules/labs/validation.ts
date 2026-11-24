import { z } from 'zod'

export const labQuerySchema = z.object({
  category: z.string().trim().max(60).optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  type: z.string().trim().max(40).optional(),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export const labSlugSchema = z.object({
  slug: z.string().trim().min(1).max(80),
})

export const verifyFlagSchema = z.object({
  taskId: z.string().trim().min(1).max(100),
  flag: z.string().trim().min(1).max(200),
})
