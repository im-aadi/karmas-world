/**
 * Karma's World - Security & Sanitization Utilities (Phase 11)
 * Defenses against Cross-Site Scripting (XSS), URL injection, and unsafe HTML rendering.
 */

const DANGEROUS_BLOCKS = /<\s*(script|style|iframe|embed|object|applet)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi
const DANGEROUS_TAGS = /<\s*\/?\s*(script|style|iframe|embed|object|base|meta|link|form|svg|math|applet)[^>]*>/gi
const EVENT_HANDLER_ATTRS = /\s+on[a-z]+\s*=\s*(['\"][^'\"]*['\"]|[^\s>]+)/gi
const DANGEROUS_PROTOCOLS = /^(javascript|vbscript|data):/i
const SAFE_DATA_IMAGE = /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i

/**
 * Escapes special HTML characters to prevent XSS in raw text interpolation.
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Sanitizes an HTML string by removing dangerous tags, inline event handlers,
 * and dangerous URI schemes while preserving safe structural tags.
 */
export function sanitizeHtml(dirtyHtml: string): string {
  if (typeof dirtyHtml !== 'string') return ''

  // 1. Strip blacklisted executable tags AND their inner contents
  let clean = dirtyHtml.replace(DANGEROUS_BLOCKS, '')

  // 2. Strip any remaining dangerous opening/closing or self-closing tags
  clean = clean.replace(DANGEROUS_TAGS, '')

  // 3. Strip inline event handlers (onclick, onerror, onload, onmouseover, etc.)
  clean = clean.replace(EVENT_HANDLER_ATTRS, '')

  // 4. Neutralize javascript: or vbscript: in href or src attributes
  clean = clean.replace(/(href|src)\s*=\s*['"]\s*(javascript|vbscript):[^'"]*['"]/gi, '$1="#"')

  return clean
}

/**
 * Validates whether a URL is safe to open or navigate to.
 * Rejects javascript:, vbscript:, and non-image data: protocols.
 */
export function isSafeUrl(url: string): boolean {
  if (typeof url !== 'string' || !url.trim()) return false
  const trimmed = url.trim()

  // Relative URLs are safe
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true
  if (trimmed.startsWith('#') || trimmed.startsWith('?')) return true

  // Check dangerous protocols
  if (DANGEROUS_PROTOCOLS.test(trimmed)) {
    return SAFE_DATA_IMAGE.test(trimmed)
  }

  try {
    const parsed = new URL(trimmed)
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Strips all HTML tags from user-provided text.
 */
export function stripHtml(text: string): string {
  if (typeof text !== 'string') return ''
  return text.replace(/<[^>]*>/g, '').trim()
}
