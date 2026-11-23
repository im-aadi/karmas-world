import type { DifficultyLevel } from '../../packages/shared/src/index'

export interface ApiCategory {
  id: string
  slug: string
  name: string
  description: string
  level: DifficultyLevel
  iconName: string
  coursesCount: number
}

export interface ApiCourseSummary {
  id: string
  slug: string
  title: string
  description: string
  level: DifficultyLevel
  duration: string
  xpReward: number
  category: { id: string; slug: string; name: string }
  modulesCount: number
  enrollmentsCount: number
}

export interface ApiLessonSummary {
  id: string
  slug: string
  title: string
  duration: string
  orderIndex: number
  xpReward: number
}

export interface ApiModuleDetail {
  id: string
  title: string
  orderIndex: number
  lessons: ApiLessonSummary[]
}

export interface ApiCourseDetail {
  id: string
  slug: string
  title: string
  description: string
  level: DifficultyLevel
  duration: string
  xpReward: number
  category: { id: string; slug: string; name: string; iconName: string }
  modules: ApiModuleDetail[]
  isEnrolled: boolean
  enrolledAt: string | null
  completedAt: string | null
}

export interface ApiBookmark {
  id: string
  createdAt: string
  lesson: {
    id: string
    slug: string
    title: string
    duration: string
    module: {
      title: string
      course: { slug: string; title: string }
    }
  }
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  const res = await fetch('/api/categories', { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Could not fetch categories.')
  const data = await res.json()
  return data.categories
}

export async function fetchCourses(query: { category?: string; difficulty?: string; q?: string } = {}): Promise<{ total: number; courses: ApiCourseSummary[] }> {
  const params = new URLSearchParams()
  if (query.category && query.category !== 'ALL') params.set('category', query.category)
  if (query.difficulty && query.difficulty !== 'ALL') params.set('difficulty', query.difficulty)
  if (query.q) params.set('q', query.q)

  const res = await fetch(`/api/courses?${params.toString()}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Could not fetch courses.')
  return res.json()
}

export async function fetchCourse(slug: string): Promise<ApiCourseDetail> {
  const res = await fetch(`/api/courses/${encodeURIComponent(slug)}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error('Could not fetch course details.')
  const data = await res.json()
  return data.course
}

export async function enrollInCourse(courseId: string, csrfToken: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}/enroll`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'X-CSRF-Token': csrfToken,
    },
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Enrollment failed.')
  }
  return res.json()
}

export async function toggleBookmark(lessonId: string, csrfToken: string): Promise<{ bookmarked: boolean; message: string }> {
  const res = await fetch(`/api/lessons/${encodeURIComponent(lessonId)}/bookmark`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'X-CSRF-Token': csrfToken,
    },
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Bookmark action failed.')
  }
  return res.json()
}

export async function fetchBookmarks(): Promise<ApiBookmark[]> {
  const res = await fetch('/api/bookmarks', {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error('Could not fetch bookmarks.')
  const data = await res.json()
  return data.bookmarks
}
