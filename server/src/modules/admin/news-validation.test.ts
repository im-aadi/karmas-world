import { describe, expect, it } from 'vitest'
import { createSecurityUpdateSchema, editSecurityUpdateSchema } from './news-validation.js'

const validUpdate = {
  source: 'NIST', type: 'LEARNING_GUIDE', title: 'A useful official cybersecurity learning guide',
  sourceUrl: 'https://www.nist.gov/news-events/news/2026/11/guide', sourcePublishedAt: '2026-11-03T00:00:00.000Z',
  summary: 'An official guide that helps learners understand practical cybersecurity basics.',
  takeaway: 'Start with a clear inventory and choose safeguards based on likely harm.',
}

describe('security brief editorial validation', () => {
  it('accepts approved official sources and creates drafts only', () => {
    expect(createSecurityUpdateSchema.safeParse(validUpdate).success).toBe(true)
    expect(editSecurityUpdateSchema.safeParse({ ...validUpdate, status: 'PUBLISHED' }).success).toBe(true)
  })

  it('rejects off-domain links, non-HTTPS URLs, and a mismatched publisher label', () => {
    expect(createSecurityUpdateSchema.safeParse({ ...validUpdate, sourceUrl: 'https://example.com/story' }).success).toBe(false)
    expect(createSecurityUpdateSchema.safeParse({ ...validUpdate, sourceUrl: 'http://www.nist.gov/story' }).success).toBe(false)
    expect(createSecurityUpdateSchema.safeParse({ ...validUpdate, source: 'CISA' }).success).toBe(false)
  })

  it('rejects invalid visibility states', () => {
    expect(editSecurityUpdateSchema.safeParse({ ...validUpdate, status: 'PUBLIC' }).success).toBe(false)
    expect(createSecurityUpdateSchema.safeParse({ ...validUpdate, sourcePublishedAt: '2099-01-01T00:00:00.000Z' }).success).toBe(false)
  })
})
