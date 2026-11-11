import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Encode(input: Buffer) {
  let buffer = 0
  let bits = 0
  let output = ''
  for (const byte of input) {
    buffer = (buffer << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      output += base32Alphabet[(buffer >>> bits) & 31]
    }
  }
  if (bits > 0) output += base32Alphabet[(buffer << (5 - bits)) & 31]
  return output
}

function base32Decode(input: string) {
  const normalized = input.toUpperCase().replace(/=+$/g, '').replace(/\s/g, '')
  let buffer = 0
  let bits = 0
  const output: number[] = []
  for (const character of normalized) {
    const value = base32Alphabet.indexOf(character)
    if (value < 0) throw new Error('Invalid authenticator secret.')
    buffer = (buffer << 5) | value
    bits += 5
    if (bits >= 8) {
      bits -= 8
      output.push((buffer >>> bits) & 255)
    }
  }
  return Buffer.from(output)
}

export function generateMfaSecret() {
  return base32Encode(randomBytes(20))
}

export function totpAtStep(secret: string, step: number, digits = 6) {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(step))
  const digest = createHmac('sha1', base32Decode(secret)).update(counter).digest()
  const offset = (digest[digest.length - 1] ?? 0) & 0x0f
  const binaryCode = digest.readUInt32BE(offset) & 0x7fffffff
  return String(binaryCode % (10 ** digits)).padStart(digits, '0')
}

function codeMatches(candidate: string, expected: string) {
  const left = Buffer.from(candidate)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function matchingTotpStep(secret: string, code: string, now = Date.now()) {
  if (!/^\d{6}$/.test(code)) return null
  const currentStep = Math.floor(now / 30_000)
  for (const step of [currentStep, currentStep - 1]) {
    if (step >= 0 && codeMatches(code, totpAtStep(secret, step))) return step
  }
  return null
}

export function mfaProvisioningUri(email: string, secret: string) {
  const issuer = "Karma's World"
  const label = `${issuer}:${email}`
  const query = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: '6', period: '30' })
  return `otpauth://totp/${encodeURIComponent(label)}?${query.toString()}`
}

export function encryptMfaSecret(secret: string, encryptionKeyHex: string) {
  const key = Buffer.from(encryptionKeyHex, 'hex')
  if (key.length !== 32) throw new Error('MFA encryption key must be 32 bytes.')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`
}

export function decryptMfaSecret(encrypted: string, encryptionKeyHex: string) {
  const [version, ivText, tagText, ciphertextText] = encrypted.split('.')
  if (version !== 'v1' || !ivText || !tagText || !ciphertextText) throw new Error('Invalid encrypted authenticator secret.')
  const key = Buffer.from(encryptionKeyHex, 'hex')
  if (key.length !== 32) throw new Error('MFA encryption key must be 32 bytes.')
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivText, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(ciphertextText, 'base64url')), decipher.final()]).toString('utf8')
}

export function normalizeRecoveryCode(code: string) {
  return code.replace(/[-\s]/g, '').toUpperCase()
}

export function hashRecoveryCode(code: string) {
  return createHash('sha256').update(normalizeRecoveryCode(code)).digest('hex')
}

export function generateRecoveryCodes(count = 10) {
  const codes = Array.from({ length: count }, () => {
    const raw = randomBytes(8).toString('hex').toUpperCase()
    return raw.match(/.{4}/g)!.join('-')
  })
  return { codes, hashes: codes.map(codeHash => hashRecoveryCode(codeHash)) }
}
