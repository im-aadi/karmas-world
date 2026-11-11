export type AdminOverviewData = {
  learnerAccounts: number
  completedLessons: number
  pendingPosts: number
  openReports: number
  leaderboardParticipants: number
  generatedAt: string
}

export type AdminSecurityUpdate = {
  id: string; source: 'NIST' | 'CERT-In' | 'CISA'; type: 'LEARNING_GUIDE' | 'RESEARCH_UPDATE' | 'SECURITY_ADVISORY'
  title: string; sourceUrl: string; sourcePublishedAt: string; summary: string; takeaway: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'; verifiedAt: string | null; updatedAt: string
}

export async function getAdminOverview(): Promise<AdminOverviewData> {
  const response = await fetch('/api/admin/overview', { credentials: 'include', headers: { Accept: 'application/json' } })
  const body = await response.json().catch(() => ({})) as { overview?: AdminOverviewData; error?: string }
  if (!response.ok || !body.overview) throw new Error(body.error ?? 'The administration overview is unavailable.')
  return body.overview
}

async function parseAdminResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(body.error ?? 'The administration service is unavailable.')
  return body as T
}

export async function getAdminNews() {
  return parseAdminResponse<{ updates: AdminSecurityUpdate[] }>(await fetch('/api/admin/news', { credentials: 'include', headers: { Accept: 'application/json' } }))
}

export async function saveAdminNews(update: Omit<AdminSecurityUpdate, 'id' | 'verifiedAt' | 'updatedAt'>, csrfToken: string, id?: string) {
  const { status, ...content } = update
  const response = await fetch(id ? `/api/admin/news/${encodeURIComponent(id)}` : '/api/admin/news', {
    method: id ? 'PATCH' : 'POST', credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(id ? update : content),
  })
  return parseAdminResponse<{ update: { id: string; status: AdminSecurityUpdate['status'] } }>(response)
}
