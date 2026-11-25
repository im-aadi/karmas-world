import { z } from 'zod'

export const challengeSlugSchema = z.object({
  slug: z.string().trim().min(1).max(80),
})

export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})
