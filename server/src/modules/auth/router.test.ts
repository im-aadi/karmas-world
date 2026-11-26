import { createHash } from 'node:crypto'
import express from 'express'
import session from 'express-session'
import request from 'supertest'
import argon2 from 'argon2'
import { describe, expect, it, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { authRouter } from './router.js'
import type { AccountMailer } from './mailer.js'
import { encryptMfaSecret, generateMfaSecret, hashRecoveryCode, totpAtStep } from './mfa.js'

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

function createTestApp(prisma: Record<string, unknown>, mailer: AccountMailer) {
  if (!prisma.securityEvent) prisma.securityEvent = {
    create: vi.fn().mockResolvedValue({ id: 'security-event-1', createdAt: new Date() }),
    findMany: vi.fn().mockResolvedValue([]),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  }
  const app = express()
  app.use(express.json())
  app.use(session({ secret: 'test-only-session-secret-with-at-least-32-characters', resave: false, saveUninitialized: false }))
  app.locals.isAllowedOrigin = () => true
  app.post('/test/authenticate', (req, res) => {
    req.session.userId = 'learner-1'
    req.session.csrfToken = 'signed-in-csrf-token'
    res.json({ csrfToken: req.session.csrfToken, sessionId: req.sessionID })
  })
  app.use('/api/auth', authRouter({ prisma: prisma as unknown as PrismaClient, sessionCookieName: 'kw.sid', mailer, mfaEncryptionKey: 'a'.repeat(64) }))
  return app
}

async function csrfAgent(app: express.Express) {
  const agent = request.agent(app)
  const response = await agent.get('/api/auth/csrf').expect(200)
  return { agent, csrfToken: response.body.csrfToken as string }
}

async function signedInAgent(app: express.Express) {
  const agent = request.agent(app)
  const response = await agent.post('/test/authenticate').expect(200)
  return { agent, csrfToken: response.body.csrfToken as string, sessionId: response.body.sessionId as string }
}

const noOpMailer: AccountMailer = {
  sendVerification: vi.fn().mockResolvedValue(undefined),
  sendPasswordReset: vi.fn().mockResolvedValue(undefined),
  sendEmailChangeVerification: vi.fn().mockResolvedValue(undefined),
  sendEmailChangedNotice: vi.fn().mockResolvedValue(undefined),
}

describe('account lifecycle routes', () => {
  it('creates unverified accounts and emails a token whose stored form is hashed', async () => {
    const user = { id: 'learner-1', displayName: 'Learner One', email: 'learner@example.com' }
    const createToken = vi.fn().mockResolvedValue({})
    const transaction = {
      accountToken: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }), create: createToken },
    }
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue(user) },
      $transaction: vi.fn(async (work: (tx: typeof transaction) => unknown) => work(transaction)),
    }
    const mailer: AccountMailer = { ...noOpMailer, sendVerification: vi.fn().mockResolvedValue(undefined) }
    const { agent, csrfToken } = await csrfAgent(createTestApp(prisma, mailer))
    const response = await agent.post('/api/auth/register').set('X-CSRF-Token', csrfToken).send({ displayName: user.displayName, email: user.email, password: 'a-long-new-password-for-tests' }).expect(201)

    expect(response.body).toMatchObject({ verificationRequired: true })
    expect(response.body.user).toBeUndefined()
    expect(mailer.sendVerification).toHaveBeenCalledOnce()
    const rawToken = vi.mocked(mailer.sendVerification).mock.calls[0]![2]!
    expect(createToken).toHaveBeenCalledWith({ data: expect.objectContaining({ purpose: 'VERIFY_EMAIL', tokenHash: hashToken(rawToken) }) })
    expect(createToken.mock.calls[0]![0]!.data.tokenHash).not.toBe(rawToken)
  })

  it('uses the same password-reset response when the email does not belong to an account', async () => {
    const prisma = { user: { findUnique: vi.fn().mockResolvedValue(null) } }
    const { agent, csrfToken } = await csrfAgent(createTestApp(prisma, noOpMailer))
    const response = await agent.post('/api/auth/password/reset/request').set('X-CSRF-Token', csrfToken).send({ email: 'unknown@example.com' }).expect(202)

    expect(response.body.message).toMatch(/if an account uses that address/i)
    expect(noOpMailer.sendPasswordReset).not.toHaveBeenCalled()
  })

  it('consumes a valid verification token once and marks the account verified', async () => {
    const rawToken = 'v'.repeat(43)
    const token = { id: 'token-1', userId: 'learner-1', purpose: 'VERIFY_EMAIL', tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + 60_000) }
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 })
    const update = vi.fn().mockResolvedValue({})
    const transaction = { accountToken: { deleteMany }, user: { update } }
    const prisma = {
      accountToken: { findUnique: vi.fn().mockResolvedValue(token) },
      $transaction: vi.fn(async (work: (tx: typeof transaction) => unknown) => work(transaction)),
    }
    const { agent, csrfToken } = await csrfAgent(createTestApp(prisma, noOpMailer))
    const response = await agent.post('/api/auth/verification/confirm').set('X-CSRF-Token', csrfToken).send({ token: rawToken }).expect(200)

    expect(response.body.message).toMatch(/email verified/i)
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: token.id, purpose: 'VERIFY_EMAIL', expiresAt: { gt: expect.any(Date) } } })
    expect(update).toHaveBeenCalledWith({ where: { id: token.userId }, data: { emailVerifiedAt: expect.any(Date) } })
  })

  it('requires the current password and explicit confirmation before deleting an account', async () => {
    const password = 'current-password-for-deletion'
    const passwordHash = await argon2.hash(password)
    const transaction = { user: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) }, $executeRaw: vi.fn().mockResolvedValue(1) }
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'learner-1', role: 'LEARNER', passwordHash }) },
      $transaction: vi.fn(async (work: (tx: typeof transaction) => unknown) => work(transaction)),
    }
    const app = createTestApp(prisma, noOpMailer)
    const { agent, csrfToken } = await signedInAgent(app)

    await agent.delete('/api/auth/account').set('X-CSRF-Token', csrfToken).send({ currentPassword: 'wrong-password', confirmation: 'DELETE' }).expect(400)
    expect(prisma.$transaction).not.toHaveBeenCalled()
    await agent.delete('/api/auth/account').set('X-CSRF-Token', csrfToken).send({ currentPassword: password, confirmation: 'delete' }).expect(400)
    expect(prisma.$transaction).not.toHaveBeenCalled()
    await agent.delete('/api/auth/account').set('X-CSRF-Token', csrfToken).send({ currentPassword: password, confirmation: 'DELETE' }).expect(204)
    expect(transaction.user.deleteMany).toHaveBeenCalledWith({ where: { id: 'learner-1', passwordHash } })
    await agent.get('/api/auth/me').expect(401)
  })

  it('does not allow an administrator to delete the last administrator account', async () => {
    const passwordHash = await argon2.hash('admin-password-for-deletion')
    const transaction = { user: { deleteMany: vi.fn() }, $executeRaw: vi.fn(), $queryRaw: vi.fn().mockResolvedValue([{ id: 'learner-1' }]) }
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'learner-1', role: 'ADMIN', passwordHash }) },
      $transaction: vi.fn(async (work: (tx: typeof transaction) => unknown) => work(transaction)),
    }
    const { agent, csrfToken } = await signedInAgent(createTestApp(prisma, noOpMailer))

    const response = await agent.delete('/api/auth/account').set('X-CSRF-Token', csrfToken).send({ currentPassword: 'admin-password-for-deletion', confirmation: 'DELETE' }).expect(409)
    expect(response.body.error).toMatch(/another administrator/i)
    expect(transaction.user.deleteMany).not.toHaveBeenCalled()
  })

  it('keeps MFA-enabled password sign-in pending until a valid authenticator code is entered', async () => {
    const password = 'current-password-for-mfa-login'
    const passwordHash = await argon2.hash(password)
    const secret = generateMfaSecret()
    const user = {
      id: 'learner-1', displayName: 'Learner One', email: 'learner@example.com', role: 'LEARNER',
      passwordHash, emailVerifiedAt: new Date(), mfaEnabledAt: new Date(), mfaSecretEncrypted: encryptMfaSecret(secret, 'a'.repeat(64)),
    }
    const updateMany = vi.fn().mockResolvedValue({ count: 1 })
    const createSecurityEvent = vi.fn().mockResolvedValue({ id: 'security-event-1', createdAt: new Date() })
    const transaction = { user: { updateMany }, mfaRecoveryCode: { deleteMany: vi.fn() } }
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(user) },
      securityEvent: { create: createSecurityEvent, findMany: vi.fn().mockResolvedValue([]), deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      $transaction: vi.fn(async (work: (tx: typeof transaction) => unknown) => work(transaction)),
    }
    const { agent, csrfToken } = await csrfAgent(createTestApp(prisma, noOpMailer))
    const challenge = await agent.post('/api/auth/login').set('X-CSRF-Token', csrfToken).send({ email: user.email, password }).expect(200)
    expect(challenge.body).toMatchObject({ mfaRequired: true })
    expect(challenge.body.user).toBeUndefined()
    await agent.get('/api/auth/me').expect(401)
    expect(createSecurityEvent).not.toHaveBeenCalled()

    await agent.post('/api/auth/login/mfa').set('X-CSRF-Token', challenge.body.csrfToken).send({ code: '000000' }).expect(401)
    const code = totpAtStep(secret, Math.floor(Date.now() / 30_000))
    const verified = await agent.post('/api/auth/login/mfa').set('X-CSRF-Token', challenge.body.csrfToken).send({ code }).expect(200)
    expect(verified.body.user).toMatchObject({ id: user.id, mfaEnabled: true })
    await agent.get('/api/auth/me').expect(200)
    expect(updateMany).toHaveBeenCalledOnce()
    expect(createSecurityEvent).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: user.id, type: 'SIGN_IN' }) })
  })

  it('requires password and a live authenticator code to enroll, then returns recovery codes only once', async () => {
    const password = 'current-password-for-mfa-setup'
    const passwordHash = await argon2.hash(password)
    let pendingSecretEncrypted: string | null = null
    const user = { id: 'learner-1', email: 'learner@example.com', passwordHash, mfaEnabledAt: null }
    const savePending = vi.fn(async ({ data }: { data: { mfaPendingSecretEncrypted: string } }) => {
      pendingSecretEncrypted = data.mfaPendingSecretEncrypted
      return { count: 1 }
    })
    const enableUser = vi.fn().mockResolvedValue({ count: 1 })
    const createRecoveryCodes = vi.fn().mockResolvedValue({ count: 10 })
    const transaction = {
      user: { updateMany: enableUser },
      mfaRecoveryCode: { createMany: createRecoveryCodes },
      $executeRaw: vi.fn().mockResolvedValue(1),
    }
    const prisma = {
      user: {
        findUnique: vi.fn()
          .mockResolvedValueOnce(user)
          .mockImplementationOnce(async () => ({ ...user, mfaPendingSecretEncrypted: pendingSecretEncrypted, mfaPendingExpiresAt: new Date(Date.now() + 60_000) })),
        updateMany: savePending,
      },
      $transaction: vi.fn(async (work: (tx: typeof transaction) => unknown) => work(transaction)),
    }
    const { agent, csrfToken } = await signedInAgent(createTestApp(prisma, noOpMailer))
    const setup = await agent.post('/api/auth/mfa/setup').set('X-CSRF-Token', csrfToken).send({ currentPassword: password }).expect(200)
    expect(setup.headers['cache-control']).toMatch(/no-store/i)
    expect(setup.body.provisioningUri).toContain('otpauth://totp/')
    expect(pendingSecretEncrypted).not.toBe(setup.body.secret)

    const code = totpAtStep(setup.body.secret, Math.floor(Date.now() / 30_000))
    const enabled = await agent.post('/api/auth/mfa/enable').set('X-CSRF-Token', csrfToken).send({ currentPassword: password, code }).expect(200)
    expect(enabled.body).toMatchObject({ enabled: true })
    expect(enabled.body.recoveryCodes).toHaveLength(10)
    expect(createRecoveryCodes).toHaveBeenCalledWith({ data: expect.arrayContaining([expect.objectContaining({ userId: user.id, codeHash: expect.stringMatching(/^[a-f0-9]{64}$/) })]) })
    expect(JSON.stringify(createRecoveryCodes.mock.calls[0]![0])).not.toContain(enabled.body.recoveryCodes[0])
    expect(enableUser).toHaveBeenCalledOnce()
  })

  it('lists a learner’s active sessions and revokes only a session belonging to that account', async () => {
    const currentExpiresAt = new Date(Date.now() + 60_000)
    const otherId = 'other-session-id-1234567890'
    const executeRaw = vi.fn().mockResolvedValue(1)
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([
        { sid: 'current-session-id-placeholder', expire: currentExpiresAt, userAgent: 'Firefox on Windows', authenticatedAt: new Date().toISOString() },
        { sid: otherId, expire: currentExpiresAt, userAgent: 'Chrome on Android', authenticatedAt: null },
      ]),
      $executeRaw: executeRaw,
    }
    const { agent, csrfToken, sessionId } = await signedInAgent(createTestApp(prisma, noOpMailer))
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      { sid: sessionId, expire: currentExpiresAt, userAgent: 'Firefox on Windows', authenticatedAt: new Date().toISOString() },
      { sid: otherId, expire: currentExpiresAt, userAgent: 'Chrome on Android', authenticatedAt: null },
    ])

    const listed = await agent.get('/api/auth/sessions').expect(200)
    expect(listed.headers['cache-control']).toMatch(/no-store/i)
    expect(listed.body.sessions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: sessionId, current: true, userAgent: 'Firefox on Windows' }),
      expect.objectContaining({ id: otherId, current: false, userAgent: 'Chrome on Android' }),
    ]))
    await agent.delete(`/api/auth/sessions/${otherId}`).set('X-CSRF-Token', csrfToken).expect(200, { revoked: true })
    expect(executeRaw).toHaveBeenCalledOnce()
  })

  it('revokes all other sessions while preserving the current session', async () => {
    const executeRaw = vi.fn().mockResolvedValue(2)
    const prisma = { $executeRaw: executeRaw }
    const { agent, csrfToken } = await signedInAgent(createTestApp(prisma, noOpMailer))

    await agent.delete('/api/auth/sessions').set('X-CSRF-Token', csrfToken).expect(200, { revokedCount: 2 })
    expect(executeRaw).toHaveBeenCalledOnce()
  })

  it('returns only the signed-in learner’s recent security activity without caching it', async () => {
    const events = [{ id: 'event-1', type: 'SIGN_IN', userAgent: 'Test Browser', createdAt: new Date() }]
    const findMany = vi.fn().mockResolvedValue(events)
    const prisma = { securityEvent: { findMany } }
    const { agent } = await signedInAgent(createTestApp(prisma, noOpMailer))

    const response = await agent.get('/api/auth/security/activity').expect(200)
    expect(response.headers['cache-control']).toBe('no-store')
    expect(response.body.events).toEqual(events.map(event => ({ ...event, createdAt: event.createdAt.toISOString() })))
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: 'learner-1' },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 50,
      select: { id: true, type: true, userAgent: true, createdAt: true },
    })
  })

  it('includes the learner’s security activity in the private account export', async () => {
    const createdAt = new Date('2026-11-04T10:00:00.000Z')
    const securityActivity = [{ type: 'SIGN_IN', userAgent: 'Test Browser', createdAt }]
    const securityEvents = { findMany: vi.fn().mockResolvedValue(securityActivity) }
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ displayName: 'Learner One', email: 'learner@example.com', createdAt, leaderboardOptIn: false }) },
      lessonProgress: { findMany: vi.fn().mockResolvedValue([]) },
      communityPost: { findMany: vi.fn().mockResolvedValue([]) },
      communityReport: { findMany: vi.fn().mockResolvedValue([]) },
      securityEvent: securityEvents,
    }
    const { agent } = await signedInAgent(createTestApp(prisma, noOpMailer))

    const response = await agent.get('/api/auth/export').expect(200)
    expect(response.headers['cache-control']).toBe('no-store')
    expect(response.body.securityActivity).toEqual(securityActivity.map(event => ({ ...event, createdAt: createdAt.toISOString() })))
    expect(securityEvents.findMany).toHaveBeenCalledWith({
      where: { userId: 'learner-1' },
      select: { type: true, userAgent: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
  })

  it('replaces every recovery code after a password and existing second factor check', async () => {
    const password = 'current-password-for-code-rotation'
    const oldRecoveryCode = 'ABCD-EF01-2345-6789'
    const passwordHash = await argon2.hash(password)
    const user = { id: 'learner-1', passwordHash, mfaEnabledAt: new Date(), mfaSecretEncrypted: encryptMfaSecret(generateMfaSecret(), 'a'.repeat(64)) }
    const oldRecoveryCodeHash = hashRecoveryCode(oldRecoveryCode)
    const deleteRecoveryCode = vi.fn().mockImplementation(({ where }: { where: { codeHash?: string } }) => Promise.resolve({ count: where.codeHash ? Number(where.codeHash === oldRecoveryCodeHash) : 9 }))
    const createRecoveryCodes = vi.fn().mockResolvedValue({ count: 10 })
    const transaction = {
      user: { updateMany: vi.fn() },
      mfaRecoveryCode: { deleteMany: deleteRecoveryCode, createMany: createRecoveryCodes },
      $executeRaw: vi.fn().mockResolvedValue(2),
    }
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(user) },
      $transaction: vi.fn(async (work: (tx: typeof transaction) => unknown) => work(transaction)),
    }
    const { agent, csrfToken } = await signedInAgent(createTestApp(prisma, noOpMailer))

    const invalid = await agent.post('/api/auth/mfa/recovery-codes/rotate').set('X-CSRF-Token', csrfToken).send({ currentPassword: password, code: 'FFFF-FFFF-FFFF-FFFF' }).expect(400)
    expect(invalid.body.recoveryCodes).toBeUndefined()
    expect(createRecoveryCodes).not.toHaveBeenCalled()

    const response = await agent.post('/api/auth/mfa/recovery-codes/rotate').set('X-CSRF-Token', csrfToken).send({ currentPassword: password, code: oldRecoveryCode }).expect(200)

    expect(response.headers['cache-control']).toMatch(/no-store/i)
    expect(response.body.recoveryCodes).toHaveLength(10)
    expect(response.body.csrfToken).not.toBe(csrfToken)
    expect(deleteRecoveryCode).toHaveBeenNthCalledWith(1, { where: { userId: user.id, codeHash: hashRecoveryCode('FFFF-FFFF-FFFF-FFFF') } })
    expect(deleteRecoveryCode).toHaveBeenNthCalledWith(2, { where: { userId: user.id, codeHash: oldRecoveryCodeHash } })
    expect(deleteRecoveryCode).toHaveBeenNthCalledWith(3, { where: { userId: user.id } })
    expect(createRecoveryCodes).toHaveBeenCalledWith({ data: expect.arrayContaining([expect.objectContaining({ userId: user.id, codeHash: expect.stringMatching(/^[a-f0-9]{64}$/) })]) })
    expect(JSON.stringify(createRecoveryCodes.mock.calls[0]![0])).not.toContain(response.body.recoveryCodes[0])
  })

  it('keeps the current address until the new address confirms its one-time link', async () => {
    const password = 'current-password-for-email-change'
    const passwordHash = await argon2.hash(password)
    const newEmail = 'new-learner@example.com'
    const user = { id: 'learner-1', displayName: 'Learner One', email: 'learner@example.com', passwordHash, mfaEnabledAt: null, mfaSecretEncrypted: null }
    const tokenRecord = { id: 'email-token', userId: user.id, purpose: 'CHANGE_EMAIL', targetEmail: newEmail, tokenHash: '', expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
    const createToken = vi.fn().mockResolvedValue(tokenRecord)
    const requestTransaction = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: user.id }]),
      user: { findUnique: vi.fn().mockResolvedValueOnce({ email: user.email }).mockResolvedValueOnce(null) },
      accountToken: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }), create: createToken },
    }
    const updatedUser = vi.fn().mockResolvedValue({ ...user, email: newEmail })
    const confirmTransaction = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: user.id }]),
      accountToken: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
      user: { update: updatedUser },
      $executeRaw: vi.fn().mockResolvedValue(1),
    }
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValueOnce(user).mockResolvedValueOnce(null).mockResolvedValueOnce({ email: user.email, displayName: user.displayName }) },
      accountToken: { findUnique: vi.fn().mockResolvedValue(tokenRecord) },
      $transaction: vi.fn()
        .mockImplementationOnce((work: (tx: typeof requestTransaction) => unknown) => work(requestTransaction))
        .mockImplementationOnce((work: (tx: typeof confirmTransaction) => unknown) => work(confirmTransaction)),
    }
    const mailer: AccountMailer = {
      ...noOpMailer,
      sendEmailChangeVerification: vi.fn().mockResolvedValue(undefined),
      sendEmailChangedNotice: vi.fn().mockResolvedValue(undefined),
    }
    const { agent, csrfToken } = await signedInAgent(createTestApp(prisma, mailer))

    const requested = await agent.post('/api/auth/email/change/request').set('X-CSRF-Token', csrfToken).send({ newEmail, currentPassword: password }).expect(202)
    expect(requested.body.message).toMatch(/current email remains active/i)
    expect(updatedUser).not.toHaveBeenCalled()
    expect(mailer.sendEmailChangeVerification).toHaveBeenCalledWith(newEmail, user.displayName, expect.any(String))
    const rawToken = vi.mocked(mailer.sendEmailChangeVerification).mock.calls[0]![2]!
    expect(createToken).toHaveBeenCalledWith({ data: expect.objectContaining({ purpose: 'CHANGE_EMAIL', targetEmail: newEmail, tokenHash: hashToken(rawToken), expiresAt: expect.any(Date) }) })
    vi.mocked(prisma.accountToken.findUnique).mockResolvedValue({ ...tokenRecord, tokenHash: hashToken(rawToken) })

    const confirmed = await agent.post('/api/auth/email/change/confirm').set('X-CSRF-Token', csrfToken).send({ token: rawToken }).expect(200)
    expect(confirmed.body.message).toMatch(/sign in again with the new address/i)
    expect(updatedUser).toHaveBeenCalledWith({ where: { id: user.id }, data: { email: newEmail, emailVerifiedAt: expect.any(Date) } })
    expect(mailer.sendEmailChangedNotice).toHaveBeenCalledWith(user.email, user.displayName, newEmail)
    await agent.get('/api/auth/me').expect(401)
  })
})
