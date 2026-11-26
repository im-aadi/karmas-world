import { readLearningProgress, saveLearningProgress, type LearningProgress } from './progress'

export type LearnerAccount = {
  id: string
  displayName: string
  email: string
  role: 'LEARNER' | 'ADMIN'
  mfaEnabled?: boolean
}

type AuthResponse = { user: LearnerAccount; csrfToken: string }
type LoginResponse = AuthResponse | { mfaRequired: true; csrfToken: string }
type MfaSetupResponse = { secret: string; provisioningUri: string; expiresAt: string }
export type ActiveSession = { id: string; current: boolean; userAgent: string | null; signedInAt: string | null; expiresAt: string }
export type SecurityEventType = 'SIGN_IN' | 'PASSWORD_CHANGED' | 'PASSWORD_RESET' | 'EMAIL_CHANGE_REQUESTED' | 'EMAIL_CHANGED' | 'MFA_ENABLED' | 'MFA_DISABLED' | 'RECOVERY_CODES_ROTATED' | 'SESSION_REVOKED' | 'OTHER_SESSIONS_REVOKED'
export type SecurityActivityEvent = { id: string; type: SecurityEventType; userAgent: string | null; createdAt: string }
type RegistrationResponse = { verificationRequired: boolean; message: string }
type ProfileResponse = { user: LearnerAccount }
type PasswordChangeResponse = { user: LearnerAccount; csrfToken: string; otherSessionsRevoked: boolean }
type ProgressResponse = { progress: Array<{ courseId: string; lessonIndex: number }> }

async function readJson<T>(response: Response): Promise<T> {
  let body: Record<string, unknown> = {}
  try {
    body = (await response.json()) as Record<string, unknown>
  } catch {
    body = {}
  }

  if (!response.ok) {
    let message = 'The account service is temporarily unavailable.'
    if (typeof body.error === 'string' && body.error.trim()) {
      message = body.error
    } else if (body.error && typeof body.error === 'object') {
      const errObj = body.error as Record<string, unknown>
      if (errObj.code === 'ECONNREFUSED' || errObj.errno === -4078) {
        message = 'The backend API server is not running on port 4000. Start the server or use Local Learner mode.'
      } else if (typeof errObj.message === 'string') {
        message = errObj.message
      } else {
        message = 'Backend connection error. Please verify the API server is active.'
      }
    } else if (typeof body.message === 'string' && body.message.trim()) {
      message = body.message
    }
    throw new Error(message)
  }
  return body as T
}

export async function getCsrfToken() {
  const response = await fetch('/api/auth/csrf', { credentials: 'include', headers: { Accept: 'application/json' } })
  const body = await readJson<{ csrfToken: string }>(response)
  return body.csrfToken
}

export async function getCurrentAccount() {
  const response = await fetch('/api/auth/me', { credentials: 'include', headers: { Accept: 'application/json' } })
  if (response.status === 401) return null
  const body = await readJson<{ user: LearnerAccount }>(response)
  return body.user
}

async function authenticate(payload: Record<string, string>): Promise<LoginResponse> {
  const csrfToken = await getCsrfToken()
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  return readJson<LoginResponse>(response)
}

export const login = (email: string, password: string) => authenticate({ email, password })

export async function register(displayName: string, email: string, password: string): Promise<RegistrationResponse> {
  const csrfToken = await getCsrfToken()
  const response = await fetch('/api/auth/register', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
    body: JSON.stringify({ displayName, email, password }),
  })
  return readJson<RegistrationResponse>(response)
}

async function postAccountAction<T>(path: string, payload: Record<string, string>): Promise<T> {
  const csrfToken = await getCsrfToken()
  const response = await fetch(`/api/auth/${path}`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  return readJson<T>(response)
}

export const resendVerification = (email: string) => postAccountAction<{ message: string }>('verification/resend', { email })
export const confirmEmailVerification = (token: string) => postAccountAction<{ message: string }>('verification/confirm', { token })
export const confirmEmailChange = (token: string) => postAccountAction<{ message: string }>('email/change/confirm', { token })
export const requestPasswordReset = (email: string) => postAccountAction<{ message: string }>('password/reset/request', { email })
export const completePasswordReset = (token: string, newPassword: string) => postAccountAction<{ message: string }>('password/reset/complete', { token, newPassword })

export async function requestEmailChange(newEmail: string, currentPassword: string, csrfToken: string, mfaCode?: string): Promise<{ message: string }> {
  const response = await fetch('/api/auth/email/change/request', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
    body: JSON.stringify({ newEmail, currentPassword, ...(mfaCode ? { mfaCode } : {}) }),
  })
  return readJson<{ message: string }>(response)
}

export async function updateProfile(displayName: string, csrfToken: string): Promise<ProfileResponse> {
  const response = await fetch('/api/auth/profile', {
    method: 'PATCH', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
    body: JSON.stringify({ displayName }),
  })
  return readJson<ProfileResponse>(response)
}

export async function verifyMfaLogin(code: string, csrfToken: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login/mfa', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
    body: JSON.stringify({ code }),
  })
  return readJson<AuthResponse>(response)
}

export async function startMfaSetup(currentPassword: string, csrfToken: string): Promise<MfaSetupResponse> {
  const response = await fetch('/api/auth/mfa/setup', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
    body: JSON.stringify({ currentPassword }),
  })
  return readJson<MfaSetupResponse>(response)
}

export async function enableMfa(currentPassword: string, code: string, csrfToken: string): Promise<{ enabled: true; recoveryCodes: string[]; csrfToken: string }> {
  const response = await fetch('/api/auth/mfa/enable', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
    body: JSON.stringify({ currentPassword, code }),
  })
  return readJson<{ enabled: true; recoveryCodes: string[]; csrfToken: string }>(response)
}

export async function disableMfa(currentPassword: string, code: string, csrfToken: string): Promise<{ enabled: false; csrfToken: string }> {
  const response = await fetch('/api/auth/mfa/disable', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
    body: JSON.stringify({ currentPassword, code }),
  })
  return readJson<{ enabled: false; csrfToken: string }>(response)
}

export async function rotateMfaRecoveryCodes(currentPassword: string, code: string, csrfToken: string): Promise<{ recoveryCodes: string[]; csrfToken: string }> {
  const response = await fetch('/api/auth/mfa/recovery-codes/rotate', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
    body: JSON.stringify({ currentPassword, code }),
  })
  return readJson<{ recoveryCodes: string[]; csrfToken: string }>(response)
}

export async function getActiveSessions(): Promise<ActiveSession[]> {
  const response = await fetch('/api/auth/sessions', { credentials: 'include', headers: { Accept: 'application/json' } })
  const body = await readJson<{ sessions: ActiveSession[] }>(response)
  return body.sessions
}

export async function getSecurityActivity(): Promise<SecurityActivityEvent[]> {
  const response = await fetch('/api/auth/security/activity', { credentials: 'include', headers: { Accept: 'application/json' } })
  const body = await readJson<{ events: SecurityActivityEvent[] }>(response)
  return body.events
}

export async function revokeActiveSession(sessionId: string, csrfToken: string) {
  const response = await fetch(`/api/auth/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE', credentials: 'include',
    headers: { 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
  })
  return readJson<{ revoked: true }>(response)
}

export async function revokeOtherSessions(csrfToken: string) {
  const response = await fetch('/api/auth/sessions', {
    method: 'DELETE', credentials: 'include',
    headers: { 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
  })
  return readJson<{ revokedCount: number }>(response)
}

export async function changePassword(currentPassword: string, newPassword: string, csrfToken: string, mfaCode?: string): Promise<PasswordChangeResponse> {
  const response = await fetch('/api/auth/password', {
    method: 'PATCH', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword, ...(mfaCode ? { mfaCode } : {}) }),
  })
  return readJson<PasswordChangeResponse>(response)
}

export async function deleteOwnAccount(currentPassword: string, csrfToken: string, mfaCode?: string) {
  const response = await fetch('/api/auth/account', {
    method: 'DELETE', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
    body: JSON.stringify({ currentPassword, confirmation: 'DELETE', ...(mfaCode ? { mfaCode } : {}) }),
  })
  if (!response.ok) await readJson(response)
}

export async function logout(csrfToken: string) {
  const response = await fetch('/api/auth/logout', {
    method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
  })
  if (!response.ok && response.status !== 204) await readJson(response)
}

export async function syncLearningProgress(csrfToken: string): Promise<LearningProgress> {
  const response = await fetch('/api/progress', { credentials: 'include', headers: { Accept: 'application/json' } })
  const remote = await readJson<ProgressResponse>(response)
  const merged: LearningProgress = { ...readLearningProgress() }
  const remoteKeys = new Set<string>()
  for (const item of remote.progress) {
    if (!merged[item.courseId]) merged[item.courseId] = []
    if (!merged[item.courseId].includes(item.lessonIndex)) merged[item.courseId].push(item.lessonIndex)
    remoteKeys.add(`${item.courseId}:${item.lessonIndex}`)
  }
  saveLearningProgress(merged)

  for (const [courseId, lessons] of Object.entries(merged)) {
    for (const lessonIndex of lessons) {
      if (remoteKeys.has(`${courseId}:${lessonIndex}`)) continue
      const upload = await fetch('/api/progress', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
        body: JSON.stringify({ courseId, lessonIndex }),
      })
      await readJson(upload)
    }
  }
  return merged
}

export async function syncCompletedLesson(courseId: string, lessonIndex: number, csrfToken: string) {
  const response = await fetch('/api/progress', {
    method: 'PUT', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
    body: JSON.stringify({ courseId, lessonIndex }),
  })
  await readJson(response)
}
