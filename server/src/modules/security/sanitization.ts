/**
 * Karma's World - Server-Side Security & Sanitization Utilities (Phase 11)
 * Defensive input validation, HTML stripping, and identifier checking.
 */

const DANGEROUS_BLOCKS_REGEX = /<\s*(script|style|iframe|embed|object|applet)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi
const DANGEROUS_TAGS_REGEX = /<\s*\/?\s*(script|style|iframe|embed|object|base|meta|link|form)[^>]*>/gi
const EVENT_HANDLER_REGEX = /\s+on[a-z]+\s*=\s*(['\"][^'\"]*['\"]|[^\s>]+)/gi

/**
 * Strips all HTML tags from string input.
 */
export function stripHtml(input: string): string {
  if (typeof input !== 'string') return ''
  return input.replace(/<[^>]*>/g, '').trim()
}

/**
 * Cleans user content by stripping executable elements, event handlers, and script protocols.
 */
export function sanitizeUserInput(input: string): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(DANGEROUS_BLOCKS_REGEX, '')
    .replace(DANGEROUS_TAGS_REGEX, '')
    .replace(EVENT_HANDLER_REGEX, '')
    .replace(/(href|src)\s*=\s*['"]\s*javascript:[^'"]*['"]/gi, '$1="#"')
    .trim()
}

/**
 * Validates that an identifier adheres to safe alphanumeric format.
 */
export function isSafeIdentifier(id: string): boolean {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id)
}
