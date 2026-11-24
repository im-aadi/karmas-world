import { describe, expect, it } from 'vitest'
import { base32Encode, decryptMfaSecret, encryptMfaSecret, generateMfaSecret, generateRecoveryCodes, hashRecoveryCode, matchingTotpStep, normalizeRecoveryCode, totpAtStep } from './mfa.js'

const rfcSecret = base32Encode(Buffer.from('12345678901234567890'))

describe('authenticator helpers', () => {
  it('matches the RFC 6238 SHA-1 test vector', () => {
    expect(totpAtStep(rfcSecret, 1, 8)).toBe('94287082')
    expect(matchingTotpStep(rfcSecret, '287082', 59_000)).toBe(1)
  })

  it('accepts the previous time step to tolerate small clock drift', () => {
    expect(matchingTotpStep(rfcSecret, totpAtStep(rfcSecret, 10), 11 * 30_000)).toBe(10)
    expect(matchingTotpStep(rfcSecret, 'not-a-code', 300_000)).toBeNull()
  })

  it('encrypts secrets with authenticated encryption and rejects tampering', () => {
    const key = 'ab'.repeat(32)
    const encrypted = encryptMfaSecret(generateMfaSecret(), key)
    expect(decryptMfaSecret(encrypted, key)).toMatch(/^[A-Z2-7]+$/)
    const parts = encrypted.split('.')
    parts[2] = (parts[2].startsWith('A') ? 'B' : 'A') + parts[2].slice(1)
    const tampered = parts.join('.')
    expect(() => decryptMfaSecret(tampered, key)).toThrow()
  })

  it('generates one-time recovery codes and hashes normalized values', () => {
    const { codes, hashes } = generateRecoveryCodes(10)
    expect(codes).toHaveLength(10)
    expect(hashes).toHaveLength(10)
    expect(new Set(codes).size).toBe(10)
    expect(codes[0]).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/)
    expect(normalizeRecoveryCode(codes[0])).toHaveLength(16)
    expect(hashRecoveryCode(codes[0])).toBe(hashRecoveryCode(codes[0].replaceAll('-', '').toLowerCase()))
    expect(hashes[0]).not.toBe(codes[0])
  })
})
