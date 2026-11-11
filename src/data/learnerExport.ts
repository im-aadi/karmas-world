import { courses } from './courses'
import { readLearningProgress, type LearningProgress } from './progress'
import { readPrivateReflections } from './reflections'
import type { LearnerAccount } from './account'

export type AccountDataExport = {
  exportVersion: number
  exportedAt: string
  account: { displayName: string; email: string; createdAt: string }
  learningProgress: Array<{ courseId: string; lessonIndex: number; completedAt: string }>
  communityPosts: Array<{ id: string; body: string; status: string; createdAt: string }>
  communityReports: Array<{ reason: string; details: string | null; status: string; createdAt: string; post: { id: string } }>
  leaderboardParticipation: boolean
}

export function buildLocalLearningExport(progress: LearningProgress, privateReflections: Record<string, string>, account: LearnerAccount | null, accountData: AccountDataExport | null) {
  return {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    account: accountData?.account ?? (account ? { displayName: account.displayName, email: account.email } : null),
    leaderboardParticipation: accountData?.leaderboardParticipation ?? null,
    learningPaths: courses.map(course => {
      const completed = new Set(progress[course.id] ?? [])
      return {
        courseId: course.id,
        title: course.title,
        completedLessons: course.lessons.flatMap((lesson, lessonIndex) => completed.has(lessonIndex) ? [{ lessonIndex, title: lesson.title }] : []),
        totalLessons: course.lessons.length,
        isComplete: course.lessons.every((_lesson, lessonIndex) => completed.has(lessonIndex)),
      }
    }),
    privateReflections,
    accountData,
  }
}

export async function downloadLearnerData(account: LearnerAccount | null) {
  let accountData: AccountDataExport | null = null
  if (account) {
    const response = await fetch('/api/auth/export', { credentials: 'include', headers: { Accept: 'application/json' } })
    const body = await response.json().catch(() => ({})) as { error?: string } & Partial<AccountDataExport>
    if (!response.ok || !body.account) throw new Error(body.error ?? 'Could not download your full account data. Please try again.')
    accountData = body as AccountDataExport
  }

  const data = buildLocalLearningExport(readLearningProgress(), readPrivateReflections(account?.id ?? null), account, accountData)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `karmas-world-data-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
