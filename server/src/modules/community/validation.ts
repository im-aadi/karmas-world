import { z } from 'zod'

export const communityPostSchema = z.object({ body: z.string().trim().min(20).max(800) }).strict()
export const communityReportSchema = z.object({
  reason: z.enum(['SPAM', 'HARASSMENT', 'PERSONAL_INFORMATION', 'UNSAFE_ADVICE', 'OTHER']),
  details: z.string().trim().max(300).optional(),
}).strict()
export const communityPostStatusSchema = z.object({ status: z.enum(['APPROVED', 'HIDDEN']) }).strict()
export const communityReportStatusSchema = z.object({ status: z.enum(['REVIEWED', 'DISMISSED']) }).strict()

// Phase 9: Forums & Knowledge Base Schemas
export const createThreadSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200, 'Title cannot exceed 200 characters'),
  content: z.string().trim().min(20, 'Content must be at least 20 characters').max(10000, 'Content cannot exceed 10000 characters'),
  categorySlug: z.string().trim().min(2).max(60),
}).strict()

export const createReplySchema = z.object({
  content: z.string().trim().min(5, 'Reply must be at least 5 characters').max(5000, 'Reply cannot exceed 5000 characters'),
}).strict()

export const threadQuerySchema = z.object({
  category: z.string().optional(),
  sort: z.enum(['recent', 'popular', 'unanswered']).optional().default('recent'),
  q: z.string().trim().optional(),
})

export const articleQuerySchema = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
  difficulty: z.enum(['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional().default('ALL'),
  q: z.string().trim().optional(),
})
