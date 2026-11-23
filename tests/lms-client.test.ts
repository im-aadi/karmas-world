import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchCategories, fetchCourses, enrollInCourse, toggleBookmark, fetchBookmarks } from '../src/data/lms'

describe('LMS Client Module (Phase 4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetchCategories queries /api/categories', async () => {
    const mockCategories = [{ id: 'cat-1', slug: 'cryptography', name: 'Cryptography' }]
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ categories: mockCategories }),
    })
    globalThis.fetch = fetchMock

    const result = await fetchCategories()
    expect(result).toEqual(mockCategories)
    expect(fetchMock).toHaveBeenCalledWith('/api/categories', expect.objectContaining({ headers: { Accept: 'application/json' } }))
  })

  it('fetchCourses passes category and difficulty query parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ total: 1, courses: [] }),
    })
    globalThis.fetch = fetchMock

    await fetchCourses({ category: 'web-application-security', difficulty: 'INTERMEDIATE', q: 'owasp' })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/courses?category=web-application-security&difficulty=INTERMEDIATE&q=owasp',
      expect.anything()
    )
  })

  it('enrollInCourse sends POST with X-CSRF-Token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, message: 'Enrolled' }),
    })
    globalThis.fetch = fetchMock

    const res = await enrollInCourse('course-1', 'csrf-token-123')
    expect(res.success).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/courses/course-1/enroll',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-CSRF-Token': 'csrf-token-123' }),
      })
    )
  })

  it('toggleBookmark sends POST with X-CSRF-Token and returns new state', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bookmarked: true, message: 'Bookmarked' }),
    })
    globalThis.fetch = fetchMock

    const res = await toggleBookmark('lesson-1', 'csrf-token-123')
    expect(res.bookmarked).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/lessons/lesson-1/bookmark',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-CSRF-Token': 'csrf-token-123' }),
      })
    )
  })

  it('fetchBookmarks queries /api/bookmarks', async () => {
    const mockBookmarks = [{ id: 'bm-1', lesson: { id: 'l-1', title: 'Lesson 1' } }]
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bookmarks: mockBookmarks }),
    })
    globalThis.fetch = fetchMock

    const res = await fetchBookmarks()
    expect(res).toEqual(mockBookmarks)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bookmarks',
      expect.objectContaining({
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
    )
  })
})
