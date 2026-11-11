import { z } from 'zod'

export const communityPostSchema = z.object({ body: z.string().trim().min(20).max(800) }).strict()
export const communityReportSchema = z.object({
  reason: z.enum(['SPAM', 'HARASSMENT', 'PERSONAL_INFORMATION', 'UNSAFE_ADVICE', 'OTHER']),
  details: z.string().trim().max(300).optional(),
}).strict()
export const communityPostStatusSchema = z.object({ status: z.enum(['APPROVED', 'HIDDEN']) }).strict()
export const communityReportStatusSchema = z.object({ status: z.enum(['REVIEWED', 'DISMISSED']) }).strict()
