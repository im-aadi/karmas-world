import { describe, it, expect } from 'vitest'
import { CYBERSECURITY_CATEGORIES, CATEGORY_DETAILS } from '../packages/shared/src/index'

describe('Shared Cybersecurity Categories', () => {
  it('defines all 20 core cybersecurity learning categories', () => {
    expect(CYBERSECURITY_CATEGORIES).toHaveLength(20)
    expect(CYBERSECURITY_CATEGORIES).toContain('computer-fundamentals')
    expect(CYBERSECURITY_CATEGORIES).toContain('ethical-hacking')
    expect(CYBERSECURITY_CATEGORIES).toContain('digital-forensics')
    expect(CYBERSECURITY_CATEGORIES).toContain('threat-intelligence')
  })

  it('contains valid metadata for each of the 20 categories', () => {
    CYBERSECURITY_CATEGORIES.forEach((categoryId) => {
      const details = CATEGORY_DETAILS[categoryId]
      expect(details).toBeDefined()
      expect(details.id).toBe(categoryId)
      expect(details.name.length).toBeGreaterThan(0)
      expect(details.description.length).toBeGreaterThan(0)
      expect(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).toContain(details.level)
    })
  })
})

