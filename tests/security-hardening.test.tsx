import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { escapeHtml, sanitizeHtml, isSafeUrl, stripHtml } from '../src/utils/sanitize'
import { PhishingEmailInspector } from '../src/components/visualizers/PhishingEmailInspector'
import { ArticleReaderModal } from '../src/components/community/ArticleReaderModal'
import * as communityClient from '../src/data/communityClient'

describe('Phase 11: Frontend Security Hardening & XSS Mitigation Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('HTML Sanitization (sanitizeHtml)', () => {
    it('strips script tags and executable contents from dirty strings', () => {
      const malicious = '<p>Normal text</p><script>alert("XSS")</script><script src="https://evil.com/payload.js"></script>'
      const clean = sanitizeHtml(malicious)
      expect(clean).not.toContain('<script>')
      expect(clean).not.toContain('alert')
      expect(clean).not.toContain('payload.js')
      expect(clean).toContain('<p>Normal text</p>')
    })

    it('strips iframes, embeds, and objects', () => {
      const dirty = '<div>Safe</div><iframe src="https://evil.com"></iframe><embed src="flash.swf"><object data="malware.bin"></object>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('<iframe')
      expect(clean).not.toContain('<embed')
      expect(clean).not.toContain('<object')
      expect(clean).toContain('<div>Safe</div>')
    })

    it('strips inline event handler attributes like onerror, onload, onclick', () => {
      const dirty = '<img src="avatar.jpg" onerror="alert(document.cookie)" onload="runPayload()" onclick="stealData()">'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('onerror')
      expect(clean).not.toContain('onload')
      expect(clean).not.toContain('onclick')
      expect(clean).not.toContain('stealData')
      expect(clean).toContain('<img src="avatar.jpg">')
    })

    it('neutralizes javascript: and vbscript: URLs in href and src attributes', () => {
      const dirty = '<a href="javascript:alert(1)">Click Me</a><a href="vbscript:msgbox(1)">VisualBasic</a>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('javascript:')
      expect(clean).not.toContain('vbscript:')
      expect(clean).toContain('<a href="#">Click Me</a>')
      expect(clean).toContain('<a href="#">VisualBasic</a>')
    })

    it('preserves benign formatting markup like bold, italics, paragraphs, and breaks', () => {
      const safeMarkup = '<p><strong>Attention:</strong> Please verify your <em>identity</em>.<br/><br/>Security Team</p>'
      const result = sanitizeHtml(safeMarkup)
      expect(result).toBe(safeMarkup)
    })
  })

  describe('HTML Escaping (escapeHtml) & Plaintext Stripping (stripHtml)', () => {
    it('escapes characters with HTML entities', () => {
      const input = '<script>alert("test" & \'hello\')</script>'
      const escaped = escapeHtml(input)
      expect(escaped).toBe('&lt;script&gt;alert(&quot;test&quot; &amp; &#39;hello&#39;)&lt;/script&gt;')
      expect(escaped).not.toContain('<')
      expect(escaped).not.toContain('>')
    })

    it('removes all HTML tags with stripHtml', () => {
      const input = '<h2>Security Notice</h2><p>Never share your <b>password</b> or <code>OTP</code>.</p>'
      expect(stripHtml(input)).toBe('Security NoticeNever share your password or OTP.')
    })
  })

  describe('URL Safety Validation (isSafeUrl)', () => {
    it('allows safe relative URLs, anchors, and query strings', () => {
      expect(isSafeUrl('/catalog')).toBe(true)
      expect(isSafeUrl('/courses/web-security-101')).toBe(true)
      expect(isSafeUrl('#curriculum')).toBe(true)
      expect(isSafeUrl('?tab=quizzes')).toBe(true)
    })

    it('allows valid HTTPS and HTTP protocols', () => {
      expect(isSafeUrl('https://karmas.world')).toBe(true)
      expect(isSafeUrl('http://localhost:5173/auth')).toBe(true)
      expect(isSafeUrl('mailto:security@karmas.world')).toBe(true)
    })

    it('rejects dangerous javascript: and vbscript: URIs', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false)
      expect(isSafeUrl('JAVASCRIPT:document.location="https://attacker.com"')).toBe(false)
      expect(isSafeUrl('vbscript:msgbox("hacked")')).toBe(false)
    })

    it('rejects data: text/html URIs but allows valid base64 image data URIs', () => {
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
      expect(isSafeUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')).toBe(true)
    })
  })

  describe('Visualizer & Component XSS Hardening', () => {
    it('PhishingEmailInspector sanitizes email body HTML before rendering', () => {
      const { container } = render(<PhishingEmailInspector />)
      expect(screen.getByText(/Interactive Phishing & Email Header Inspector/i)).toBeInTheDocument()

      // Verify that no script tags exist in the rendered DOM
      const scriptElements = container.querySelectorAll('script')
      expect(scriptElements.length).toBe(0)

      // Verify that inspectable hyperlinks and envelope headers render safely
      expect(screen.getByText(/Inspect Hyperlink Destination/i)).toBeInTheDocument()
    })

    it('ArticleReaderModal renders markdown safely without evaluating script injections', async () => {
      const mockArticle = {
        id: 'art-xss',
        slug: 'sanitization-test-article',
        title: 'Sanitization Test Article',
        summary: 'Testing markdown rendering defense against XSS <script>alert(1)</script>',
        content: '# Heading 1\n\nMalicious markdown test: <script>alert("markdown-xss")</script>\n\n```javascript\nconsole.log("safe code");\n```\n\n- Safe bullet point',
        categorySlug: 'web-security',
        tags: ['Security', 'XSS'],
        difficulty: 'BEGINNER' as const,
        readTimeMinutes: 5,
        helpfulVotesCount: 12,
        viewsCount: 42,
        isFeatured: true,
        hasVotedHelpful: false,
        authorName: 'Security Research Team',
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }

      vi.spyOn(communityClient, 'fetchKnowledgeArticle').mockResolvedValue(mockArticle)

      const { container } = render(<ArticleReaderModal slug="sanitization-test-article" onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Sanitization Test Article')).toBeInTheDocument()
      })

      // Ensure no executable script tags are present in DOM
      const scriptElements = container.querySelectorAll('script')
      expect(scriptElements.length).toBe(0)

      // The markdown code block should render safely as a pre/code element
      expect(screen.getByText(/console\.log\("safe code"\);/)).toBeInTheDocument()
      expect(screen.getByText(/Safe bullet point/)).toBeInTheDocument()
    })
  })
})
