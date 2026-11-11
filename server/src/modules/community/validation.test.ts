import { describe, expect, it } from 'vitest'
import { communityPostSchema, communityPostStatusSchema, communityReportSchema } from './validation.js'

describe('community validation', () => {
  it('trims a discussion post and limits its length', () => {
    expect(communityPostSchema.safeParse({ body: '  A considered question for fellow learners.  ' }).data?.body).toBe('A considered question for fellow learners.')
    expect(communityPostSchema.safeParse({ body: 'too short' }).success).toBe(false)
    expect(communityPostSchema.safeParse({ body: 'x'.repeat(801) }).success).toBe(false)
  })

  it('accepts only defined report reasons and moderation actions', () => {
    expect(communityReportSchema.safeParse({ reason: 'PERSONAL_INFORMATION', details: 'This appears to include personal details.' }).success).toBe(true)
    expect(communityReportSchema.safeParse({ reason: 'MAYBE' }).success).toBe(false)
    expect(communityPostStatusSchema.safeParse({ status: 'APPROVED' }).success).toBe(true)
    expect(communityPostStatusSchema.safeParse({ status: 'PENDING' }).success).toBe(false)
  })
})
