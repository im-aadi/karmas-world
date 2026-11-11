import { z } from 'zod'

export const registerSchema = z.object({
  displayName: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(15).max(128),
}).strict()

export const profileUpdateSchema = z.object({ displayName: z.string().trim().min(2).max(60) }).strict()

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(15).max(128),
  mfaCode: z.string().min(6).max(32).regex(/^[a-zA-Z0-9-]+$/).optional(),
}).strict()

export const accountDeletionSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  confirmation: z.literal('DELETE'),
  mfaCode: z.string().min(6).max(32).regex(/^[a-zA-Z0-9-]+$/).optional(),
}).strict()

export const mfaSetupSchema = z.object({ currentPassword: z.string().min(1).max(128) }).strict()
export const mfaEnableSchema = z.object({ currentPassword: z.string().min(1).max(128), code: z.string().regex(/^\d{6}$/) }).strict()
export const mfaDisableSchema = z.object({ currentPassword: z.string().min(1).max(128), code: z.string().min(6).max(32).regex(/^[a-zA-Z0-9-]+$/) }).strict()
export const mfaRecoveryCodesRotateSchema = z.object({ currentPassword: z.string().min(1).max(128), code: z.string().min(6).max(32).regex(/^[a-zA-Z0-9-]+$/) }).strict()
export const mfaLoginSchema = z.object({ code: z.string().min(6).max(32).regex(/^[a-zA-Z0-9-]+$/) }).strict()
export const sessionIdSchema = z.string().min(20).max(255).regex(/^[A-Za-z0-9_-]+$/)

export const emailChangeRequestSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newEmail: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  mfaCode: z.string().min(6).max(32).regex(/^[a-zA-Z0-9-]+$/).optional(),
}).strict()

export const emailRequestSchema = z.object({
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
}).strict()

export const tokenSchema = z.object({ token: z.string().min(32).max(100) }).strict()

export const passwordResetSchema = z.object({
  token: z.string().min(32).max(100),
  newPassword: z.string().min(15).max(128),
}).strict()

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(1).max(128),
}).strict()

export const progressUpdateSchema = z.object({
  courseId: z.enum(['foundations', 'network', 'web']),
  lessonIndex: z.number().int().min(0).max(2),
}).strict()
