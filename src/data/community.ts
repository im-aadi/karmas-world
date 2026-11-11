export type CommunityPost = {
  id: string
  body: string
  status: 'PENDING' | 'APPROVED' | 'HIDDEN'
  createdAt: string
  author: { displayName: string }
  isOwn?: boolean
}

export type CommunityReport = {
  id: string
  reason: string
  details: string | null
  createdAt: string
  reporter: { displayName: string }
  post: { id: string; body: string; author: { displayName: string } }
}

type ApiError = { error?: string }
async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({})) as ApiError
  if (!response.ok) throw new Error(data.error ?? 'The community service is unavailable.')
  return data as T
}

const jsonHeaders = (csrfToken?: string) => ({ Accept: 'application/json', ...(csrfToken ? { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken } : {}) })

export async function loadCommunityPosts() {
  const response = await fetch('/api/community/posts', { credentials: 'include', headers: jsonHeaders() })
  return (await readJson<{ posts: CommunityPost[] }>(response)).posts
}

export async function createCommunityPost(body: string, csrfToken: string) {
  const response = await fetch('/api/community/posts', { method: 'POST', credentials: 'include', headers: jsonHeaders(csrfToken), body: JSON.stringify({ body }) })
  return (await readJson<{ post: CommunityPost }>(response)).post
}

export async function reportCommunityPost(postId: string, reason: string, details: string, csrfToken: string) {
  const response = await fetch(`/api/community/posts/${encodeURIComponent(postId)}/reports`, { method: 'POST', credentials: 'include', headers: jsonHeaders(csrfToken), body: JSON.stringify({ reason, details: details || undefined }) })
  return readJson<{ message: string }>(response)
}

export async function loadModerationQueue() {
  const response = await fetch('/api/community/moderation', { credentials: 'include', headers: jsonHeaders() })
  return readJson<{ posts: CommunityPost[]; reports: CommunityReport[] }>(response)
}

export async function setPostStatus(postId: string, status: 'APPROVED' | 'HIDDEN', csrfToken: string) {
  const response = await fetch(`/api/community/moderation/posts/${encodeURIComponent(postId)}`, { method: 'PATCH', credentials: 'include', headers: jsonHeaders(csrfToken), body: JSON.stringify({ status }) })
  return readJson<{ post: { id: string; status: CommunityPost['status'] } }>(response)
}

export async function setReportStatus(reportId: string, status: 'REVIEWED' | 'DISMISSED', csrfToken: string) {
  const response = await fetch(`/api/community/moderation/reports/${encodeURIComponent(reportId)}`, { method: 'PATCH', credentials: 'include', headers: jsonHeaders(csrfToken), body: JSON.stringify({ status }) })
  return readJson<{ report: { id: string; status: string } }>(response)
}
