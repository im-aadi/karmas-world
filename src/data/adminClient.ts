import type {
  AdminPlatformAnalytics,
  AdminUserSummary,
  AdminUserDetail,
  AdminCourseSummary,
  CreateCoursePayload,
  EditCoursePayload,
  AdminThreadModerationPayload,
} from '../../packages/shared/src/index'

export type {
  AdminPlatformAnalytics,
  AdminUserSummary,
  AdminUserDetail,
  AdminCourseSummary,
  CreateCoursePayload,
  EditCoursePayload,
}

const FALLBACK_ANALYTICS: AdminPlatformAnalytics = {
  totalLearners: 142,
  totalAdmins: 3,
  totalLessonsCompleted: 580,
  totalXpAwarded: 64200,
  totalEnrollments: 230,
  totalQuizAttempts: 112,
  quizPassingRatePercent: 88,
  totalForumThreads: 42,
  openReports: 1,
  topCourses: [
    {
      id: 'course-eth-1',
      title: 'Practical Ethical Hacking & Penetration Testing',
      slug: 'ethical-hacking-fundamentals',
      enrolledCount: 94,
      level: 'BEGINNER',
    },
    {
      id: 'course-net-1',
      title: 'Packet Analysis & Wireshark Deep Dive',
      slug: 'network-protocols-analysis',
      enrolledCount: 76,
      level: 'INTERMEDIATE',
    },
    {
      id: 'course-soc-1',
      title: 'SOC Analyst Incident Response & Threat Hunting',
      slug: 'soc-analyst-incident-triage',
      enrolledCount: 60,
      level: 'ADVANCED',
    },
  ],
  recentSecurityEvents: [
    {
      id: 'ev-1',
      type: 'ACCOUNT_LOGIN_SUCCESS',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: new Date().toISOString(),
      user: { id: 'u-1', displayName: 'Aditya Kashyap', email: 'aditya@karmas.world' },
    },
    {
      id: 'ev-2',
      type: 'MFA_VERIFIED',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      user: { id: 'u-2', displayName: 'Elena Rostova', email: 'elena@example.com' },
    },
  ],
  generatedAt: new Date().toISOString(),
}

const FALLBACK_USERS: AdminUserSummary[] = [
  {
    id: 'usr-1',
    displayName: 'Aditya Kashyap',
    email: 'aditya@karmas.world',
    role: 'ADMIN',
    totalXp: 12500,
    rankTitle: 'Master',
    emailVerified: true,
    mfaEnabled: true,
    completedLessonsCount: 45,
    enrollmentsCount: 6,
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'usr-2',
    displayName: 'Sarah Connor',
    email: 'sarah.connor@example.com',
    role: 'LEARNER',
    totalXp: 3800,
    rankTitle: 'Guardian',
    emailVerified: true,
    mfaEnabled: false,
    completedLessonsCount: 16,
    enrollmentsCount: 3,
    createdAt: '2026-10-15T11:20:00Z',
  },
  {
    id: 'usr-3',
    displayName: 'Marcus Brody',
    email: 'm.brody@example.com',
    role: 'LEARNER',
    totalXp: 1400,
    rankTitle: 'Defender',
    emailVerified: true,
    mfaEnabled: true,
    completedLessonsCount: 7,
    enrollmentsCount: 2,
    createdAt: '2026-11-02T14:10:00Z',
  },
]

const FALLBACK_COURSES: AdminCourseSummary[] = [
  {
    id: 'c-1',
    slug: 'network-protocols-analysis',
    title: 'Computer Networking & Protocol Defense',
    description: 'Understand OSI model packet structure, TCP/UDP sockets, and network segmentation.',
    level: 'BEGINNER',
    duration: '4 hours',
    xpReward: 200,
    categorySlug: 'computer-networking',
    categoryName: 'Computer Networking',
    modulesCount: 4,
    lessonsCount: 12,
    enrolledLearnersCount: 76,
    createdAt: '2026-10-05T12:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'c-2',
    slug: 'ethical-hacking-fundamentals',
    title: 'Web Application Security & OWASP Defense',
    description: 'Learn SQL injection, cross-site scripting, and secure authorization headers.',
    level: 'INTERMEDIATE',
    duration: '6 hours',
    xpReward: 350,
    categorySlug: 'web-security',
    categoryName: 'Web Security',
    modulesCount: 5,
    lessonsCount: 18,
    enrolledLearnersCount: 94,
    createdAt: '2026-10-08T09:00:00Z',
    updatedAt: '2026-11-10T14:00:00Z',
  },
]

export async function fetchAdminAnalytics(): Promise<AdminPlatformAnalytics> {
  try {
    const res = await fetch('/api/admin/analytics')
    if (res.ok) {
      const data = await res.json()
      if (data.analytics) return data.analytics
    }
  } catch {
    // Fallback
  }
  return FALLBACK_ANALYTICS
}

export async function fetchAdminUsers(filters?: {
  q?: string
  role?: string
}): Promise<AdminUserSummary[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.q) params.set('q', filters.q)
    if (filters?.role && filters.role !== 'ALL') params.set('role', filters.role)

    const url = `/api/admin/users${params.toString() ? `?${params.toString()}` : ''}`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.users)) return data.users
    }
  } catch {
    // Fallback
  }

  let list = FALLBACK_USERS
  if (filters?.role && filters.role !== 'ALL') {
    list = list.filter((u) => u.role === filters.role)
  }
  if (filters?.q) {
    const query = filters.q.toLowerCase()
    list = list.filter(
      (u) =>
        u.displayName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
    )
  }
  return list
}

export async function updateUserRole(
  userId: string,
  role: 'LEARNER' | 'ADMIN',
  csrfToken?: string
): Promise<{ id: string; role: string }> {
  try {
    const url =
      typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('null')
        ? `${window.location.origin}/api/admin/users/${userId}/role`
        : `/api/admin/users/${userId}/role`

    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      const data = await res.json()
      return data.user
    } else {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to update user role.')
    }
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      !err.message.includes('fetch') &&
      !err.message.includes('Network') &&
      !err.message.includes('URL') &&
      !err.message.includes('Failed to parse')
    ) {
      throw err
    }
  }

  // Fallback
  const found = FALLBACK_USERS.find((u) => u.id === userId)
  if (found) found.role = role
  return { id: userId, role }
}

export async function fetchAdminCourses(): Promise<AdminCourseSummary[]> {
  try {
    const res = await fetch('/api/admin/courses')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.courses)) return data.courses
    }
  } catch {
    // Fallback
  }
  return FALLBACK_COURSES
}

export async function createAdminCourse(
  payload: CreateCoursePayload,
  csrfToken?: string
): Promise<AdminCourseSummary> {
  try {
    const url =
      typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('null')
        ? `${window.location.origin}/api/admin/courses`
        : `/api/admin/courses`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const data = await res.json()
      return data.course
    } else {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to create course.')
    }
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      !err.message.includes('fetch') &&
      !err.message.includes('Network') &&
      !err.message.includes('URL') &&
      !err.message.includes('Failed to parse')
    ) {
      throw err
    }
  }

  // Fallback
  const newCourse: AdminCourseSummary = {
    id: `course-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    slug: payload.slug,
    title: payload.title,
    description: payload.description,
    level: payload.level,
    duration: payload.duration,
    xpReward: payload.xpReward,
    categorySlug: payload.categorySlug,
    categoryName: payload.categorySlug.replace(/-/g, ' ').toUpperCase(),
    modulesCount: 0,
    lessonsCount: 0,
    enrolledLearnersCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  if (!FALLBACK_COURSES.some((c) => c.slug === newCourse.slug)) {
    FALLBACK_COURSES.unshift(newCourse)
  }
  return newCourse
}

export async function deleteAdminCourse(
  courseId: string,
  csrfToken?: string
): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`/api/admin/courses/${courseId}`, {
      method: 'DELETE',
      headers: {
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // Fallback
  }
  const idx = FALLBACK_COURSES.findIndex((c) => c.id === courseId)
  if (idx >= 0) FALLBACK_COURSES.splice(idx, 1)
  return { success: true }
}

export async function fetchAdminThreads(): Promise<
  Array<{
    id: string
    slug: string
    title: string
    categoryName: string
    authorName: string
    authorEmail: string
    status: string
    isPinned: boolean
    isLocked: boolean
    upvotesCount: number
    repliesCount: number
    createdAt: string
  }>
> {
  try {
    const res = await fetch('/api/admin/moderation/threads')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.threads)) return data.threads
    }
  } catch {
    // Fallback
  }
  return [
    {
      id: 'th-1',
      slug: 'how-does-double-submit-cookie-pattern-prevent-csrf',
      title: 'How does double-submit cookie pattern prevent CSRF in modern SPAs?',
      categoryName: 'Web Security',
      authorName: 'Alex Rivera',
      authorEmail: 'alex@example.com',
      status: 'APPROVED',
      isPinned: true,
      isLocked: false,
      upvotesCount: 24,
      repliesCount: 2,
      createdAt: '2026-11-20T14:30:00Z',
    },
    {
      id: 'th-2',
      slug: 'setting-up-suricata-on-a-mirrored-port',
      title: 'Setting up Suricata on a mirrored switch port',
      categoryName: 'Network Defense',
      authorName: 'Devon Hayes',
      authorEmail: 'devon@example.com',
      status: 'APPROVED',
      isPinned: false,
      isLocked: false,
      upvotesCount: 19,
      repliesCount: 1,
      createdAt: '2026-11-21T09:15:00Z',
    },
  ]
}

export async function moderateAdminThread(
  threadId: string,
  action: AdminThreadModerationPayload['action'],
  csrfToken?: string
): Promise<{ id: string; isPinned: boolean; isLocked: boolean; status: string }> {
  try {
    const res = await fetch(`/api/admin/moderation/threads/${threadId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      const data = await res.json()
      return data.thread
    }
  } catch {
    // Fallback
  }
  return {
    id: threadId,
    isPinned: action === 'PIN',
    isLocked: action === 'LOCK',
    status: action === 'HIDE' ? 'HIDDEN' : 'APPROVED',
  }
}
