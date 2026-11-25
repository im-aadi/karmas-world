import { z } from 'zod'

export const userRoleSchema = z.object({
  role: z.enum(['LEARNER', 'ADMIN']),
}).strict()

export const adminUserQuerySchema = z.object({
  q: z.string().trim().optional(),
  role: z.enum(['ALL', 'LEARNER', 'ADMIN']).optional().default('ALL'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
})

export const createCourseSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(180),
  slug: z.string().trim().min(3, 'Slug must be at least 3 characters').max(80),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(1000),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  duration: z.string().trim().min(2).max(40),
  xpReward: z.number().int().min(10).max(5000),
  categorySlug: z.string().trim().min(2).max(60),
}).strict()

export const editCourseSchema = z.object({
  title: z.string().trim().min(5).max(180).optional(),
  description: z.string().trim().min(20).max(1000).optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  duration: z.string().trim().min(2).max(40).optional(),
  xpReward: z.number().int().min(10).max(5000).optional(),
}).strict()

export const threadModerationSchema = z.object({
  action: z.enum(['PIN', 'UNPIN', 'LOCK', 'UNLOCK', 'APPROVE', 'HIDE']),
}).strict()
