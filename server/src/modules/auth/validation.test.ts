import { describe, expect, it } from 'vitest'
import { accountDeletionSchema, emailChangeRequestSchema, emailRequestSchema, loginSchema, passwordChangeSchema, passwordResetSchema, profileUpdateSchema, progressUpdateSchema, registerSchema, tokenSchema } from './validation.js'

describe('API input contracts', () => {
  it('normalizes account email and rejects weak password lengths', () => {
    const valid = registerSchema.safeParse({ displayName: 'A learner', email: 'LEARNER@example.com', password: 'a-very-long-test-password' })
    expect(valid.success && valid.data.email).toBe('learner@example.com')
    expect(registerSchema.safeParse({ displayName: 'A learner', email: 'learner@example.com', password: 'short' }).success).toBe(false)
  })

  it('rejects progress for unknown paths or lesson indexes', () => {
    expect(progressUpdateSchema.safeParse({ courseId: 'foundations', lessonIndex: 2 }).success).toBe(true)
    expect(progressUpdateSchema.safeParse({ courseId: 'foundations', lessonIndex: 3 }).success).toBe(false)
    expect(progressUpdateSchema.safeParse({ courseId: 'other', lessonIndex: 0 }).success).toBe(false)
  })

  it('requires a valid email before checking credentials', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'x' }).success).toBe(false)
  })

  it('validates profile edits and requires a long new password with the current password present', () => {
    expect(profileUpdateSchema.safeParse({ displayName: '  Learner One  ' })).toMatchObject({ success: true, data: { displayName: 'Learner One' } })
    expect(profileUpdateSchema.safeParse({ displayName: 'A'.repeat(61) }).success).toBe(false)
    expect(passwordChangeSchema.safeParse({ currentPassword: 'current-password', newPassword: 'a-new-password-long-enough' }).success).toBe(true)
    expect(passwordChangeSchema.safeParse({ currentPassword: 'current-password', newPassword: 'too-short' }).success).toBe(false)
    expect(passwordChangeSchema.safeParse({ newPassword: 'a-new-password-long-enough' }).success).toBe(false)
  })

  it('normalizes email recovery requests and requires strong passwords on reset', () => {
    expect(emailRequestSchema.safeParse({ email: ' LEARNER@example.com ' })).toMatchObject({ success: true, data: { email: 'learner@example.com' } })
    expect(tokenSchema.safeParse({ token: 'x'.repeat(43) }).success).toBe(true)
    expect(tokenSchema.safeParse({ token: 'short' }).success).toBe(false)
    expect(passwordResetSchema.safeParse({ token: 'x'.repeat(43), newPassword: 'long-enough-new-password' }).success).toBe(true)
    expect(passwordResetSchema.safeParse({ token: 'x'.repeat(43), newPassword: 'short' }).success).toBe(false)
  })

  it('validates a reauthenticated email change and normalizes its target address', () => {
    expect(emailChangeRequestSchema.safeParse({ currentPassword: 'current-password', newEmail: ' NEW@example.com ', mfaCode: '123456' })).toMatchObject({ success: true, data: { newEmail: 'new@example.com' } })
    expect(emailChangeRequestSchema.safeParse({ currentPassword: 'current-password', newEmail: 'not-an-email' }).success).toBe(false)
    expect(emailChangeRequestSchema.safeParse({ newEmail: 'new@example.com' }).success).toBe(false)
  })

  it('requires the exact deletion phrase and a current password', () => {
    expect(accountDeletionSchema.safeParse({ currentPassword: 'current-password', confirmation: 'DELETE' }).success).toBe(true)
    expect(accountDeletionSchema.safeParse({ currentPassword: 'current-password', confirmation: 'delete' }).success).toBe(false)
    expect(accountDeletionSchema.safeParse({ confirmation: 'DELETE' }).success).toBe(false)
  })
})
