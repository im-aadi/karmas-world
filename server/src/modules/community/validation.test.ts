import { describe, expect, it } from 'vitest'
import {
  communityPostSchema,
  communityPostStatusSchema,
  communityReportSchema,
  createThreadSchema,
  createReplySchema,
  threadQuerySchema,
  articleQuerySchema,
} from './validation.js'

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

  it('validates discussion thread creation schema', () => {
    const valid = createThreadSchema.safeParse({
      title: 'How to practice SQL injection defense in PostgreSQL?',
      content: 'I want to understand how parameterization works at the network protocol layer.',
      categorySlug: 'web-security',
    })
    expect(valid.success).toBe(true)

    const shortTitle = createThreadSchema.safeParse({
      title: 'Hi',
      content: 'Valid content that has more than twenty characters.',
      categorySlug: 'web-security',
    })
    expect(shortTitle.success).toBe(false)

    const shortContent = createThreadSchema.safeParse({
      title: 'Valid Question Title Here',
      content: 'Short',
      categorySlug: 'web-security',
    })
    expect(shortContent.success).toBe(false)
  })

  it('validates discussion reply and search query schemas', () => {
    expect(createReplySchema.safeParse({ content: 'Use prepared statements or Prisma ORM.' }).success).toBe(true)
    expect(createReplySchema.safeParse({ content: 'No' }).success).toBe(false)

    expect(threadQuerySchema.safeParse({ sort: 'popular', q: 'wireshark' }).success).toBe(true)
    expect(articleQuerySchema.safeParse({ difficulty: 'ADVANCED', tag: 'TLS' }).success).toBe(true)
  })
})
