import { createHash, randomBytes } from 'node:crypto'
import argon2 from 'argon2'
import { Router, type Request, type Response, type NextFunction } from 'express'
import { rateLimit } from 'express-rate-limit'
import { AccountTokenPurpose, Prisma, SecurityEventType, type PrismaClient } from '@prisma/client'
import type { SessionOptions } from 'express-session'
import { accountDeletionSchema, emailChangeRequestSchema, emailRequestSchema, loginSchema, mfaDisableSchema, mfaEnableSchema, mfaLoginSchema, mfaRecoveryCodesRotateSchema, mfaSetupSchema, passwordChangeSchema, passwordResetSchema, profileUpdateSchema, registerSchema, sessionIdSchema, tokenSchema } from './validation.js'
import type { AccountMailer } from './mailer.js'
import { decryptMfaSecret, encryptMfaSecret, generateMfaSecret, generateRecoveryCodes, hashRecoveryCode, matchingTotpStep, mfaProvisioningUri } from './mfa.js'

type AuthUser = { id: string; displayName: string; email: string; role: string; mfaEnabledAt?: Date | null; mfaEnabled?: boolean }
type AuthRouterOptions = { prisma: PrismaClient; sessionCookieName: string; mailer: AccountMailer; mfaEncryptionKey: string }
const publicUser = (user: AuthUser) => ({ id: user.id, displayName: user.displayName, email: user.email, role: user.role, mfaEnabled: user.mfaEnabled ?? Boolean(user.mfaEnabledAt) })
const dummyPasswordHash = argon2.hash(randomBytes(32).toString('hex'), { type: argon2.argon2id })
const hashAccountToken = (token: string) => createHash('sha256').update(token).digest('hex')

async function issueAccountToken(prisma: PrismaClient, userId: string, purpose: AccountTokenPurpose, lifetimeMs: number) {
  const token = randomBytes(32).toString('base64url')
  await prisma.$transaction(async transaction => {
    await transaction.accountToken.deleteMany({ where: { expiresAt: { lt: new Date() } } })
    await transaction.accountToken.deleteMany({ where: { userId, purpose } })
    await transaction.accountToken.create({ data: { userId, purpose, tokenHash: hashAccountToken(token), expiresAt: new Date(Date.now() + lifetimeMs) } })
  })
  return token
}

export function csrfGuard(req: Request, res: Response, next: NextFunction) {
  const origin = req.get('origin')
  if (origin && !req.app.locals.isAllowedOrigin?.(origin)) return res.status(403).json({ error: 'Request origin is not allowed.' })
  const token = req.get('x-csrf-token')
  if (!req.session.csrfToken || token !== req.session.csrfToken) return res.status(403).json({ error: 'A valid CSRF token is required.' })
  next()
}

function regenerateSession(req: Request) {
  return new Promise<void>((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()))
}

function saveSession(req: Request) {
  return new Promise<void>((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()))
}

function markAuthenticatedSession(req: Request, userId: string) {
  req.session.userId = userId
  req.session.authenticatedAt = new Date().toISOString()
  req.session.userAgent = (req.get('user-agent') ?? '').replace(/[\r\n\t]/g, ' ').trim().slice(0, 240) || undefined
}

async function recordSecurityActivity(prisma: PrismaClient, req: Request, userId: string, type: SecurityEventType) {
  const userAgent = (req.get('user-agent') ?? '').replace(/[\r\n\t]/g, ' ').trim().slice(0, 240) || null
  try {
    await prisma.securityEvent.create({ data: { userId, type, userAgent } })
    const olderEvents = await prisma.securityEvent.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: 50,
      select: { id: true },
    })
    if (olderEvents.length) await prisma.securityEvent.deleteMany({ where: { userId, id: { in: olderEvents.map(event => event.id) } } })
  } catch {
    console.error('Security activity could not be recorded.')
  }
}

async function consumeMfaFactor(transaction: Prisma.TransactionClient, user: { id: string; mfaSecretEncrypted: string | null }, code: string, mfaEncryptionKey: string) {
  if (/^\d{6}$/.test(code) && user.mfaSecretEncrypted) {
    const secret = decryptMfaSecret(user.mfaSecretEncrypted, mfaEncryptionKey)
    const step = matchingTotpStep(secret, code)
    if (step === null) return false
    const consumed = await transaction.user.updateMany({
      where: { id: user.id, mfaEnabledAt: { not: null }, OR: [{ mfaLastAcceptedStep: null }, { mfaLastAcceptedStep: { lt: BigInt(step) } }] },
      data: { mfaLastAcceptedStep: BigInt(step) },
    })
    return consumed.count === 1
  }
  const consumed = await transaction.mfaRecoveryCode.deleteMany({ where: { userId: user.id, codeHash: hashRecoveryCode(code) } })
  return consumed.count === 1
}

export function authRouter({ prisma, sessionCookieName, mailer, mfaEncryptionKey }: AuthRouterOptions) {
  const router = Router()
  router.use(['/login', '/mfa/setup', '/mfa/enable', '/mfa/disable', '/mfa/recovery-codes/rotate', '/sessions', '/email/change', '/security/activity'], (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store')
    next()
  })
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false })
  const passwordChangeLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false })
  const accountDeletionLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 3, standardHeaders: true, legacyHeaders: false })
  const verificationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false })
  const recoveryLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false })
  const emailChangeLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 3, standardHeaders: true, legacyHeaders: false })
  const mfaLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false })

  router.get('/csrf', (req, res) => {
    req.session.csrfToken ??= randomBytes(32).toString('hex')
    res.setHeader('Cache-Control', 'no-store')
    res.json({ csrfToken: req.session.csrfToken })
  })

  router.post('/register', authLimiter, csrfGuard, async (req, res, next) => {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Enter a name, valid email, and password of at least 15 characters.' })
    try {
      const existing = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } })
      if (existing) return res.status(202).json({ verificationRequired: true, message: 'If the address can be used for an account, check your email for next steps.' })
      const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id })
      const user = await prisma.user.create({ data: { displayName: parsed.data.displayName, email: parsed.data.email, passwordHash }, select: { id: true, displayName: true, email: true } })
      const token = await issueAccountToken(prisma, user.id, AccountTokenPurpose.VERIFY_EMAIL, 24 * 60 * 60 * 1000)
      try { await mailer.sendVerification(user.email, user.displayName, token) }
      catch { console.error('Verification email delivery failed.') }
      res.status(201).json({ verificationRequired: true, message: 'If the address can be used for an account, check your email for next steps.' })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return res.status(202).json({ verificationRequired: true, message: 'If the address can be used for an account, check your email for next steps.' })
      next(error)
    }
  })

  router.post('/verification/resend', verificationLimiter, csrfGuard, async (req, res, next) => {
    const parsed = emailRequestSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email address.' })
    try {
      const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, displayName: true, email: true, emailVerifiedAt: true } })
      if (user && !user.emailVerifiedAt) {
        const token = await issueAccountToken(prisma, user.id, AccountTokenPurpose.VERIFY_EMAIL, 24 * 60 * 60 * 1000)
        try { await mailer.sendVerification(user.email, user.displayName, token) }
        catch { console.error('Verification email delivery failed.') }
      }
      res.setHeader('Cache-Control', 'no-store')
      res.status(202).json({ message: 'If the account exists and needs verification, a new email has been sent.' })
    } catch (error) { next(error) }
  })

  router.post('/verification/confirm', verificationLimiter, csrfGuard, async (req, res, next) => {
    const parsed = tokenSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'This verification link is invalid or has expired.' })
    try {
      const token = await prisma.accountToken.findUnique({ where: { tokenHash: hashAccountToken(parsed.data.token) } })
      const now = new Date()
      if (!token || token.purpose !== AccountTokenPurpose.VERIFY_EMAIL || token.expiresAt <= now) return res.status(400).json({ error: 'This verification link is invalid or has expired.' })
      const verified = await prisma.$transaction(async transaction => {
        const consumed = await transaction.accountToken.deleteMany({ where: { id: token.id, purpose: AccountTokenPurpose.VERIFY_EMAIL, expiresAt: { gt: now } } })
        if (consumed.count !== 1) return false
        await transaction.user.update({ where: { id: token.userId }, data: { emailVerifiedAt: now } })
        await transaction.accountToken.deleteMany({ where: { userId: token.userId, purpose: AccountTokenPurpose.VERIFY_EMAIL } })
        return true
      })
      if (!verified) return res.status(400).json({ error: 'This verification link is invalid or has expired.' })
      res.setHeader('Cache-Control', 'no-store')
      res.json({ message: 'Email verified. You can now sign in.' })
    } catch (error) { next(error) }
  })

  router.post('/email/change/request', emailChangeLimiter, csrfGuard, async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Sign in to change your email address.' })
    const parsed = emailChangeRequestSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid new email address and your current password.' })
    try {
      const user = await prisma.user.findUnique({ where: { id: req.session.userId }, select: { id: true, displayName: true, email: true, passwordHash: true, mfaEnabledAt: true, mfaSecretEncrypted: true } })
      if (!user) return res.status(401).json({ error: 'Sign in to change your email address.' })
      if (!await argon2.verify(user.passwordHash, parsed.data.currentPassword)) return res.status(400).json({ error: 'The current password is incorrect.' })
      if (parsed.data.newEmail === user.email) return res.status(400).json({ error: 'Enter a different email address.' })
      if (user.mfaEnabledAt && !parsed.data.mfaCode) return res.status(400).json({ error: 'Enter an authenticator or recovery code to change your email.' })
      const taken = await prisma.user.findUnique({ where: { email: parsed.data.newEmail }, select: { id: true } })
      if (taken && taken.id !== user.id) return res.status(409).json({ error: 'That email address is already in use.' })

      const now = new Date()
      const token = randomBytes(32).toString('base64url')
      const queued = await prisma.$transaction(async transaction => {
        await transaction.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`
        if (user.mfaEnabledAt && !await consumeMfaFactor(transaction, user, parsed.data.mfaCode!, mfaEncryptionKey)) return 'invalid-factor'
        const current = await transaction.user.findUnique({ where: { id: user.id }, select: { email: true } })
        if (!current) return 'missing'
        if (current.email === parsed.data.newEmail) return 'same'
        const emailOwner = await transaction.user.findUnique({ where: { email: parsed.data.newEmail }, select: { id: true } })
        if (emailOwner && emailOwner.id !== user.id) return 'taken'
        await transaction.accountToken.deleteMany({ where: { expiresAt: { lt: now } } })
        await transaction.accountToken.deleteMany({ where: { userId: user.id, purpose: AccountTokenPurpose.CHANGE_EMAIL } })
        await transaction.accountToken.create({ data: { userId: user.id, purpose: AccountTokenPurpose.CHANGE_EMAIL, targetEmail: parsed.data.newEmail, tokenHash: hashAccountToken(token), expiresAt: new Date(now.getTime() + 60 * 60 * 1000) } })
        return 'queued'
      })
      if (queued === 'invalid-factor') return res.status(400).json({ error: 'The authenticator or recovery code is invalid or has already been used.' })
      if (queued === 'same') return res.status(400).json({ error: 'Enter a different email address.' })
      if (queued === 'missing') return res.status(401).json({ error: 'Sign in to change your email address.' })
      if (queued === 'taken') return res.status(409).json({ error: 'That email address is already in use.' })
      await recordSecurityActivity(prisma, req, user.id, SecurityEventType.EMAIL_CHANGE_REQUESTED)
      try { await mailer.sendEmailChangeVerification(parsed.data.newEmail, user.displayName, token) }
      catch { console.error('Email-change confirmation delivery failed.') }
      res.status(202).json({ message: 'A confirmation link has been sent. Your current email remains active until you confirm the new address.' })
    } catch (error) { next(error) }
  })

  router.post('/email/change/confirm', verificationLimiter, csrfGuard, async (req, res, next) => {
    const parsed = tokenSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'This email-change link is invalid or has expired.' })
    try {
      const token = await prisma.accountToken.findUnique({ where: { tokenHash: hashAccountToken(parsed.data.token) } })
      const now = new Date()
      if (!token || token.purpose !== AccountTokenPurpose.CHANGE_EMAIL || !token.targetEmail || token.expiresAt <= now) return res.status(400).json({ error: 'This email-change link is invalid or has expired.' })
      const owner = await prisma.user.findUnique({ where: { id: token.userId }, select: { email: true, displayName: true } })
      if (!owner) return res.status(400).json({ error: 'This email-change link is invalid or has expired.' })
      const changed = await prisma.$transaction(async transaction => {
        await transaction.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${token.userId} FOR UPDATE`
        const consumed = await transaction.accountToken.deleteMany({ where: { id: token.id, purpose: AccountTokenPurpose.CHANGE_EMAIL, targetEmail: token.targetEmail, expiresAt: { gt: now } } })
        if (consumed.count !== 1) return false
        await transaction.user.update({ where: { id: token.userId }, data: { email: token.targetEmail!, emailVerifiedAt: now } })
        await transaction.accountToken.deleteMany({ where: { userId: token.userId } })
        await transaction.$executeRaw`DELETE FROM "user_sessions" WHERE sess ->> 'userId' = ${token.userId}`
        return true
      })
      if (!changed) return res.status(400).json({ error: 'This email-change link is invalid or has expired.' })
      await recordSecurityActivity(prisma, req, token.userId, SecurityEventType.EMAIL_CHANGED)
      try { await mailer.sendEmailChangedNotice(owner.email, owner.displayName, token.targetEmail) }
      catch { console.error('Email-change notice delivery failed.') }
      await new Promise<void>((resolve, reject) => req.session.destroy(error => error ? reject(error) : resolve()))
      res.clearCookie(sessionCookieName, { path: '/' })
      res.json({ message: 'Your email has been updated. Sign in again with the new address.' })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return res.status(409).json({ error: 'That email address became unavailable. Request a new change with a different address.' })
      next(error)
    }
  })

  router.post('/password/reset/request', recoveryLimiter, csrfGuard, async (req, res, next) => {
    const parsed = emailRequestSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email address.' })
    try {
      const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, displayName: true, email: true } })
      if (user) {
        const token = await issueAccountToken(prisma, user.id, AccountTokenPurpose.RESET_PASSWORD, 60 * 60 * 1000)
        try { await mailer.sendPasswordReset(user.email, user.displayName, token) }
        catch { console.error('Password reset email delivery failed.') }
      }
      res.setHeader('Cache-Control', 'no-store')
      res.status(202).json({ message: 'If an account uses that address, a password reset email has been sent.' })
    } catch (error) { next(error) }
  })

  router.post('/password/reset/complete', recoveryLimiter, csrfGuard, async (req, res, next) => {
    const parsed = passwordResetSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Use a valid reset link and a password between 15 and 128 characters.' })
    try {
      const token = await prisma.accountToken.findUnique({ where: { tokenHash: hashAccountToken(parsed.data.token) } })
      const now = new Date()
      if (!token || token.purpose !== AccountTokenPurpose.RESET_PASSWORD || token.expiresAt <= now) return res.status(400).json({ error: 'This reset link is invalid or has expired.' })
      const passwordHash = await argon2.hash(parsed.data.newPassword, { type: argon2.argon2id })
      const reset = await prisma.$transaction(async transaction => {
        const consumed = await transaction.accountToken.deleteMany({ where: { id: token.id, purpose: AccountTokenPurpose.RESET_PASSWORD, expiresAt: { gt: now } } })
        if (consumed.count !== 1) return false
        await transaction.user.update({ where: { id: token.userId }, data: { passwordHash } })
        await transaction.accountToken.deleteMany({ where: { userId: token.userId, purpose: AccountTokenPurpose.RESET_PASSWORD } })
        await transaction.$executeRaw`DELETE FROM "user_sessions" WHERE sess ->> 'userId' = ${token.userId}`
        return true
      })
      if (!reset) return res.status(400).json({ error: 'This reset link is invalid or has expired.' })
      await recordSecurityActivity(prisma, req, token.userId, SecurityEventType.PASSWORD_RESET)
      await regenerateSession(req)
      req.session.csrfToken = randomBytes(32).toString('hex')
      await saveSession(req)
      res.setHeader('Cache-Control', 'no-store')
      res.json({ message: 'Password updated. You can now sign in.' })
    } catch (error) { next(error) }
  })

  router.patch('/profile', csrfGuard, async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Sign in to update your profile.' })
    const parsed = profileUpdateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Your display name must be 2 to 60 characters.' })
    try {
      const user = await prisma.user.update({ where: { id: req.session.userId }, data: { displayName: parsed.data.displayName }, select: { id: true, displayName: true, email: true, role: true, mfaEnabledAt: true } })
      res.setHeader('Cache-Control', 'no-store')
      res.json({ user: publicUser(user) })
    } catch (error) { next(error) }
  })

  router.patch('/password', passwordChangeLimiter, csrfGuard, async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Sign in to change your password.' })
    const parsed = passwordChangeSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Use a new password between 15 and 128 characters.' })
    try {
      const user = await prisma.user.findUnique({ where: { id: req.session.userId }, select: { id: true, displayName: true, email: true, role: true, passwordHash: true, mfaEnabledAt: true, mfaSecretEncrypted: true } })
      if (!user) return res.status(401).json({ error: 'Sign in to change your password.' })
      if (!await argon2.verify(user.passwordHash, parsed.data.currentPassword)) return res.status(400).json({ error: 'The current password is incorrect.' })
      if (user.mfaEnabledAt && !parsed.data.mfaCode) return res.status(400).json({ error: 'Enter an authenticator or recovery code to change your password.' })
      if (await argon2.verify(user.passwordHash, parsed.data.newPassword)) return res.status(400).json({ error: 'Choose a new password that differs from your current one.' })
      const passwordHash = await argon2.hash(parsed.data.newPassword, { type: argon2.argon2id })
      const updated = await prisma.$transaction(async transaction => {
        if (user.mfaEnabledAt && !await consumeMfaFactor(transaction, user, parsed.data.mfaCode!, mfaEncryptionKey)) return null
        const nextUser = await transaction.user.update({ where: { id: user.id }, data: { passwordHash }, select: { id: true, displayName: true, email: true, role: true, mfaEnabledAt: true } })
        await transaction.accountToken.deleteMany({ where: { userId: user.id, purpose: AccountTokenPurpose.RESET_PASSWORD } })
        await transaction.$executeRaw`DELETE FROM "user_sessions" WHERE sess ->> 'userId' = ${user.id} AND sid <> ${req.sessionID}`
        return nextUser
      })
      if (!updated) return res.status(400).json({ error: 'The authenticator or recovery code is invalid or has already been used.' })
      await recordSecurityActivity(prisma, req, user.id, SecurityEventType.PASSWORD_CHANGED)
      await regenerateSession(req)
      markAuthenticatedSession(req, updated.id)
      req.session.csrfToken = randomBytes(32).toString('hex')
      await saveSession(req)
      res.setHeader('Cache-Control', 'no-store')
      res.json({ user: publicUser(updated), csrfToken: req.session.csrfToken, otherSessionsRevoked: true })
    } catch (error) { next(error) }
  })

  router.delete('/account', accountDeletionLimiter, csrfGuard, async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Sign in to delete your account.' })
    const parsed = accountDeletionSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Confirm account deletion and enter your current password.' })
    try {
      const user = await prisma.user.findUnique({ where: { id: req.session.userId }, select: { id: true, role: true, passwordHash: true, mfaEnabledAt: true, mfaSecretEncrypted: true } })
      if (!user) return res.status(401).json({ error: 'Sign in to delete your account.' })
      if (!await argon2.verify(user.passwordHash, parsed.data.currentPassword)) return res.status(400).json({ error: 'The current password is incorrect.' })
      if (user.mfaEnabledAt && !parsed.data.mfaCode) return res.status(400).json({ error: 'Enter an authenticator or recovery code to delete your account.' })
      const result = await prisma.$transaction(async transaction => {
        if (user.role === 'ADMIN') {
          const admins = await transaction.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "User" WHERE "role" = 'ADMIN'::"UserRole" ORDER BY "id" FOR UPDATE`
          if (admins.length <= 1) return 'last-admin'
        }
        if (user.mfaEnabledAt && !await consumeMfaFactor(transaction, user, parsed.data.mfaCode!, mfaEncryptionKey)) return 'invalid-mfa'
        const deleted = await transaction.user.deleteMany({ where: { id: user.id, passwordHash: user.passwordHash } })
        if (deleted.count !== 1) return 'changed'
        await transaction.$executeRaw`DELETE FROM "user_sessions" WHERE sess ->> 'userId' = ${user.id}`
        return 'deleted'
      })
      if (result === 'invalid-mfa') return res.status(400).json({ error: 'The authenticator or recovery code is invalid or has already been used.' })
      if (result === 'last-admin') return res.status(409).json({ error: 'Assign another administrator before deleting this account.' })
      if (result !== 'deleted') return res.status(409).json({ error: 'Your account changed before deletion. Sign in and try again.' })
      req.session.destroy(error => {
        if (error) return next(error)
        res.clearCookie(sessionCookieName, { path: '/' })
        res.status(204).end()
      })
    } catch (error) { next(error) }
  })

  router.post('/mfa/setup', mfaLimiter, csrfGuard, async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Sign in to set up two-step verification.' })
    const parsed = mfaSetupSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Enter your current password to continue.' })
    try {
      const user = await prisma.user.findUnique({ where: { id: req.session.userId }, select: { id: true, email: true, passwordHash: true, mfaEnabledAt: true } })
      if (!user) return res.status(401).json({ error: 'Sign in to set up two-step verification.' })
      if (!await argon2.verify(user.passwordHash, parsed.data.currentPassword)) return res.status(400).json({ error: 'The current password is incorrect.' })
      if (user.mfaEnabledAt) return res.status(409).json({ error: 'Two-step verification is already enabled.' })
      const secret = generateMfaSecret()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      const pending = await prisma.user.updateMany({ where: { id: user.id, mfaEnabledAt: null }, data: { mfaPendingSecretEncrypted: encryptMfaSecret(secret, mfaEncryptionKey), mfaPendingExpiresAt: expiresAt } })
      if (pending.count !== 1) return res.status(409).json({ error: 'Two-step verification is already enabled.' })
      res.setHeader('Cache-Control', 'no-store')
      res.json({ secret, provisioningUri: mfaProvisioningUri(user.email, secret), expiresAt: expiresAt.toISOString() })
    } catch (error) { next(error) }
  })

  router.post('/mfa/enable', mfaLimiter, csrfGuard, async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Sign in to enable two-step verification.' })
    const parsed = mfaEnableSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Enter your current password and the six-digit authenticator code.' })
    try {
      const user = await prisma.user.findUnique({ where: { id: req.session.userId }, select: { id: true, passwordHash: true, mfaEnabledAt: true, mfaPendingSecretEncrypted: true, mfaPendingExpiresAt: true } })
      if (!user) return res.status(401).json({ error: 'Sign in to enable two-step verification.' })
      if (!await argon2.verify(user.passwordHash, parsed.data.currentPassword)) return res.status(400).json({ error: 'The current password is incorrect.' })
      const now = new Date()
      if (user.mfaEnabledAt || !user.mfaPendingSecretEncrypted || !user.mfaPendingExpiresAt || user.mfaPendingExpiresAt <= now) return res.status(400).json({ error: 'Start setup again; the authenticator setup has expired.' })
      const secret = decryptMfaSecret(user.mfaPendingSecretEncrypted, mfaEncryptionKey)
      const step = matchingTotpStep(secret, parsed.data.code)
      if (step === null) return res.status(400).json({ error: 'That authenticator code is invalid. Check your device time and try again.' })
      const recovery = generateRecoveryCodes()
      const enabled = await prisma.$transaction(async transaction => {
        const result = await transaction.user.updateMany({
          where: { id: user.id, mfaEnabledAt: null, mfaPendingSecretEncrypted: user.mfaPendingSecretEncrypted, mfaPendingExpiresAt: { gt: now } },
          data: { mfaEnabledAt: now, mfaSecretEncrypted: user.mfaPendingSecretEncrypted, mfaPendingSecretEncrypted: null, mfaPendingExpiresAt: null, mfaLastAcceptedStep: BigInt(step) },
        })
        if (result.count !== 1) return false
        await transaction.mfaRecoveryCode.createMany({ data: recovery.hashes.map(codeHash => ({ userId: user.id, codeHash })) })
        await transaction.$executeRaw`DELETE FROM "user_sessions" WHERE sess ->> 'userId' = ${user.id} AND sid <> ${req.sessionID}`
        return true
      })
      if (!enabled) return res.status(409).json({ error: 'Authenticator setup changed. Start again from account settings.' })
      await recordSecurityActivity(prisma, req, user.id, SecurityEventType.MFA_ENABLED)
      await regenerateSession(req)
      markAuthenticatedSession(req, user.id)
      req.session.csrfToken = randomBytes(32).toString('hex')
      await saveSession(req)
      res.setHeader('Cache-Control', 'no-store')
      res.json({ enabled: true, recoveryCodes: recovery.codes, csrfToken: req.session.csrfToken })
    } catch (error) { next(error) }
  })

  router.post('/mfa/disable', mfaLimiter, csrfGuard, async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Sign in to change two-step verification.' })
    const parsed = mfaDisableSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Enter your current password and an authenticator or recovery code.' })
    try {
      const user = await prisma.user.findUnique({ where: { id: req.session.userId }, select: { id: true, passwordHash: true, mfaEnabledAt: true, mfaSecretEncrypted: true } })
      if (!user) return res.status(401).json({ error: 'Sign in to change two-step verification.' })
      if (!await argon2.verify(user.passwordHash, parsed.data.currentPassword)) return res.status(400).json({ error: 'The current password is incorrect.' })
      if (!user.mfaEnabledAt || !user.mfaSecretEncrypted) return res.status(409).json({ error: 'Two-step verification is not enabled.' })
      const disabled = await prisma.$transaction(async transaction => {
        if (!await consumeMfaFactor(transaction, user, parsed.data.code, mfaEncryptionKey)) return false
        const result = await transaction.user.updateMany({ where: { id: user.id, mfaEnabledAt: { not: null } }, data: { mfaEnabledAt: null, mfaSecretEncrypted: null, mfaPendingSecretEncrypted: null, mfaPendingExpiresAt: null, mfaLastAcceptedStep: null } })
        if (result.count !== 1) return false
        await transaction.mfaRecoveryCode.deleteMany({ where: { userId: user.id } })
        await transaction.$executeRaw`DELETE FROM "user_sessions" WHERE sess ->> 'userId' = ${user.id} AND sid <> ${req.sessionID}`
        return true
      })
      if (!disabled) return res.status(400).json({ error: 'The authenticator or recovery code is invalid or has already been used.' })
      await recordSecurityActivity(prisma, req, user.id, SecurityEventType.MFA_DISABLED)
      await regenerateSession(req)
      markAuthenticatedSession(req, user.id)
      req.session.csrfToken = randomBytes(32).toString('hex')
      await saveSession(req)
      res.setHeader('Cache-Control', 'no-store')
      res.json({ enabled: false, csrfToken: req.session.csrfToken })
    } catch (error) { next(error) }
  })

  router.post('/mfa/recovery-codes/rotate', mfaLimiter, csrfGuard, async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Sign in to replace your recovery codes.' })
    const parsed = mfaRecoveryCodesRotateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Enter your current password and an authenticator or unused recovery code.' })
    try {
      const user = await prisma.user.findUnique({ where: { id: req.session.userId }, select: { id: true, passwordHash: true, mfaEnabledAt: true, mfaSecretEncrypted: true } })
      if (!user) return res.status(401).json({ error: 'Sign in to replace your recovery codes.' })
      if (!await argon2.verify(user.passwordHash, parsed.data.currentPassword)) return res.status(400).json({ error: 'The current password is incorrect.' })
      if (!user.mfaEnabledAt || !user.mfaSecretEncrypted) return res.status(409).json({ error: 'Enable two-step verification before replacing recovery codes.' })
      const recovery = generateRecoveryCodes()
      const rotated = await prisma.$transaction(async transaction => {
        if (!await consumeMfaFactor(transaction, user, parsed.data.code, mfaEncryptionKey)) return false
        await transaction.mfaRecoveryCode.deleteMany({ where: { userId: user.id } })
        await transaction.mfaRecoveryCode.createMany({ data: recovery.hashes.map(codeHash => ({ userId: user.id, codeHash })) })
        await transaction.$executeRaw`DELETE FROM "user_sessions" WHERE sess ->> 'userId' = ${user.id} AND sid <> ${req.sessionID}`
        return true
      })
      if (!rotated) return res.status(400).json({ error: 'The authenticator or recovery code is invalid or has already been used.' })
      await recordSecurityActivity(prisma, req, user.id, SecurityEventType.RECOVERY_CODES_ROTATED)
      await regenerateSession(req)
      markAuthenticatedSession(req, user.id)
      req.session.csrfToken = randomBytes(32).toString('hex')
      await saveSession(req)
      res.json({ recoveryCodes: recovery.codes, csrfToken: req.session.csrfToken })
    } catch (error) { next(error) }
  })

  router.post('/login', authLimiter, csrfGuard, async (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email and password.' })
    try {
      const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
      const hash = user?.passwordHash ?? await dummyPasswordHash
      const valid = await argon2.verify(hash, parsed.data.password)
      if (!user || !valid) return res.status(401).json({ error: 'Email or password is incorrect.' })
      if (!user.emailVerifiedAt) return res.status(403).json({ error: 'Verify your email before signing in. You can request a new verification email.' })
      await regenerateSession(req)
      if (user.mfaEnabledAt) {
        if (!user.mfaSecretEncrypted) return res.status(503).json({ error: 'Two-step verification needs account recovery. Contact support.' })
        req.session.mfaChallengeUserId = user.id
        req.session.mfaChallengeExpiresAt = Date.now() + 5 * 60 * 1000
        req.session.csrfToken = randomBytes(32).toString('hex')
        await saveSession(req)
        res.setHeader('Cache-Control', 'no-store')
        return res.json({ mfaRequired: true, csrfToken: req.session.csrfToken })
      }
      markAuthenticatedSession(req, user.id)
      await recordSecurityActivity(prisma, req, user.id, SecurityEventType.SIGN_IN)
      req.session.csrfToken = randomBytes(32).toString('hex')
      await saveSession(req)
      res.setHeader('Cache-Control', 'no-store')
      res.json({ user: publicUser({ ...user, mfaEnabled: false }), csrfToken: req.session.csrfToken })
    } catch (error) { next(error) }
  })

  router.post('/login/mfa', mfaLimiter, csrfGuard, async (req, res, next) => {
    const parsed = mfaLoginSchema.safeParse(req.body)
    if (!parsed.success || !req.session.mfaChallengeUserId || !req.session.mfaChallengeExpiresAt || req.session.mfaChallengeExpiresAt <= Date.now()) return res.status(401).json({ error: 'Your sign-in verification expired. Sign in again.' })
    try {
      const user = await prisma.user.findUnique({ where: { id: req.session.mfaChallengeUserId }, select: { id: true, displayName: true, email: true, role: true, mfaEnabledAt: true, mfaSecretEncrypted: true } })
      if (!user?.mfaEnabledAt || !user.mfaSecretEncrypted) return res.status(401).json({ error: 'Your sign-in verification is no longer valid. Sign in again.' })
      const verified = await prisma.$transaction(transaction => consumeMfaFactor(transaction, user, parsed.data.code, mfaEncryptionKey))
      if (!verified) return res.status(401).json({ error: 'The authenticator or recovery code is invalid or has already been used.' })
      await regenerateSession(req)
      markAuthenticatedSession(req, user.id)
      await recordSecurityActivity(prisma, req, user.id, SecurityEventType.SIGN_IN)
      req.session.csrfToken = randomBytes(32).toString('hex')
      await saveSession(req)
      res.setHeader('Cache-Control', 'no-store')
      res.json({ user: publicUser(user), csrfToken: req.session.csrfToken })
    } catch (error) { next(error) }
  })

  router.get('/sessions', async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Sign in to view active sessions.' })
    try {
      const sessions = await prisma.$queryRaw<Array<{ sid: string; expire: Date; userAgent: string | null; authenticatedAt: string | null }>>`
        SELECT "sid", "expire", "sess" ->> 'userAgent' AS "userAgent", "sess" ->> 'authenticatedAt' AS "authenticatedAt"
        FROM "user_sessions"
        WHERE "sess" ->> 'userId' = ${req.session.userId} AND "expire" > NOW()
        ORDER BY "expire" DESC
      `
      res.json({ sessions: sessions.map(item => ({ id: item.sid, current: item.sid === req.sessionID, userAgent: item.userAgent, signedInAt: item.authenticatedAt, expiresAt: item.expire.toISOString() })) })
    } catch (error) { next(error) }
  })

  router.get('/security/activity', async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Sign in to review security activity.' })
    try {
      const events = await prisma.securityEvent.findMany({
        where: { userId: req.session.userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 50,
        select: { id: true, type: true, userAgent: true, createdAt: true },
      })
      res.setHeader('Cache-Control', 'no-store')
      res.json({ events })
    } catch (error) { next(error) }
  })

  router.delete('/sessions/:sessionId', csrfGuard, async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Sign in to revoke a session.' })
    const parsed = sessionIdSchema.safeParse(req.params.sessionId)
    if (!parsed.success) return res.status(404).json({ error: 'That session was not found.' })
    if (parsed.data === req.sessionID) return res.status(400).json({ error: 'Use sign out to end this session.' })
    try {
      const revoked = await prisma.$executeRaw`DELETE FROM "user_sessions" WHERE "sid" = ${parsed.data} AND "sess" ->> 'userId' = ${req.session.userId}`
      if (revoked !== 1) return res.status(404).json({ error: 'That session was not found.' })
      await recordSecurityActivity(prisma, req, req.session.userId, SecurityEventType.SESSION_REVOKED)
      res.json({ revoked: true })
    } catch (error) { next(error) }
  })

  router.delete('/sessions', csrfGuard, async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Sign in to revoke other sessions.' })
    try {
      const revokedCount = await prisma.$executeRaw`DELETE FROM "user_sessions" WHERE "sess" ->> 'userId' = ${req.session.userId} AND "sid" <> ${req.sessionID}`
      if (revokedCount > 0) await recordSecurityActivity(prisma, req, req.session.userId, SecurityEventType.OTHER_SESSIONS_REVOKED)
      res.json({ revokedCount })
    } catch (error) { next(error) }
  })

  router.post('/logout', csrfGuard, (req, res, next) => {
    req.session.destroy(error => {
      if (error) return next(error)
      res.clearCookie(sessionCookieName, { path: '/' })
      res.status(204).end()
    })
  })

  router.get('/me', async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Sign in to continue.' })
    try {
      const user = await prisma.user.findUnique({ where: { id: req.session.userId }, select: { id: true, displayName: true, email: true, role: true, mfaEnabledAt: true } })
      if (!user) return res.status(401).json({ error: 'Sign in to continue.' })
      res.setHeader('Cache-Control', 'no-store')
      res.json({ user: publicUser(user) })
    } catch (error) { next(error) }
  })

  router.get('/export', async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Sign in to export account data.' })
    try {
      const [user, progress, posts, reports, securityActivity] = await Promise.all([
        prisma.user.findUnique({ where: { id: req.session.userId }, select: { displayName: true, email: true, createdAt: true, leaderboardOptIn: true } }),
        prisma.lessonProgress.findMany({ where: { userId: req.session.userId }, select: { courseId: true, lessonIndex: true, completedAt: true }, orderBy: { completedAt: 'asc' } }),
        prisma.communityPost.findMany({ where: { authorId: req.session.userId }, select: { id: true, body: true, status: true, createdAt: true }, orderBy: { createdAt: 'asc' } }),
        prisma.communityReport.findMany({ where: { reporterId: req.session.userId }, select: { reason: true, details: true, status: true, createdAt: true, post: { select: { id: true } } }, orderBy: { createdAt: 'asc' } }),
        prisma.securityEvent.findMany({ where: { userId: req.session.userId }, select: { type: true, userAgent: true, createdAt: true }, orderBy: { createdAt: 'asc' } }),
      ])
      if (!user) return res.status(401).json({ error: 'Sign in to export account data.' })
      res.setHeader('Cache-Control', 'no-store')
      res.json({
        exportVersion: 1,
        exportedAt: new Date().toISOString(),
        account: { displayName: user.displayName, email: user.email, createdAt: user.createdAt },
        learningProgress: progress,
        communityPosts: posts,
        communityReports: reports,
        securityActivity,
        leaderboardParticipation: user.leaderboardOptIn,
      })
    } catch (error) { next(error) }
  })

  return router
}

export const sessionCookieOptions = (config: { NODE_ENV: string; [key: string]: unknown }) => ({
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 8 * 60 * 60 * 1000,
})
