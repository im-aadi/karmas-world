import 'express-session'

declare module 'express-session' {
  interface SessionData {
    userId?: string
    csrfToken?: string
    mfaChallengeUserId?: string
    mfaChallengeExpiresAt?: number
    authenticatedAt?: string
    userAgent?: string
  }
}
