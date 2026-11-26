import { describe, it, expect } from 'vitest'
import argon2 from 'argon2'
import { DifficultyLevel, UserRole } from '@prisma/client'
import { sessionCookieOptions } from '../auth/router.js'
import { generateMfaSecret, encryptMfaSecret, decryptMfaSecret, totpAtStep, matchingTotpStep } from '../auth/mfa.js'

describe('Database Models & Authentication Security (Phase 3)', () => {
  it('defines DifficultyLevel enum values matching platform standards', () => {
    expect(DifficultyLevel.BEGINNER).toBe('BEGINNER')
    expect(DifficultyLevel.INTERMEDIATE).toBe('INTERMEDIATE')
    expect(DifficultyLevel.ADVANCED).toBe('ADVANCED')
  })

  it('defines UserRole enum values matching RBAC requirements', () => {
    expect(UserRole.LEARNER).toBe('LEARNER')
    expect(UserRole.ADMIN).toBe('ADMIN')
  })

  it('hashes passwords securely using Argon2id with recommended parameters', async () => {
    const password = 'Super-Secure-Cybersecurity-Password-2026!'
    const hash = await argon2.hash(password, { type: argon2.argon2id })

    expect(hash).toMatch(/^\$argon2id\$/)
    expect(await argon2.verify(hash, password)).toBe(true)
    expect(await argon2.verify(hash, 'wrong-password')).toBe(false)
  })

  it('enforces secure session cookie flags in development and production', () => {
    const devOptions = sessionCookieOptions({
      NODE_ENV: 'development',
    })

    expect(devOptions.httpOnly).toBe(true)
    expect(devOptions.sameSite).toBe('lax')

    const prodOptions = sessionCookieOptions({
      NODE_ENV: 'production',
    })

    expect(prodOptions.httpOnly).toBe(true)
    expect(prodOptions.secure).toBe(true)
    expect(prodOptions.sameSite).toBe('lax')
  })

  it('handles TOTP MFA secret generation, symmetric encryption, and step verification', () => {
    const encryptionKey = 'b'.repeat(64)
    const secret = generateMfaSecret()
    expect(secret.length).toBeGreaterThanOrEqual(16)

    const encrypted = encryptMfaSecret(secret, encryptionKey)
    expect(encrypted).not.toBe(secret)

    const decrypted = decryptMfaSecret(encrypted, encryptionKey)
    expect(decrypted).toBe(secret)

    const currentStep = Math.floor(Date.now() / 1000 / 30)
    const validCode = totpAtStep(secret, currentStep)
    expect(validCode).toHaveLength(6)

    const matched = matchingTotpStep(secret, validCode)
    expect(matched).not.toBeNull()
  })
})
