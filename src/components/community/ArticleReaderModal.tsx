import { useEffect, useState } from 'react'
import {
  BookOpen,
  Check,
  Clock,
  Eye,
  Share2,
  Sparkles,
  Tag,
  ThumbsUp,
  X,
} from 'lucide-react'
import {
  fetchKnowledgeArticle,
  voteArticleHelpful,
  type KnowledgeArticleDetail,
} from '../../data/communityClient'

interface ArticleReaderModalProps {
  slug: string
  onClose: () => void
  onSelectRelatedArticle?: (slug: string) => void
}

export function ArticleReaderModal({
  slug,
  onClose,
  onSelectRelatedArticle,
}: ArticleReaderModalProps) {
  const [article, setArticle] = useState<KnowledgeArticleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [helpfulCount, setHelpfulCount] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    fetchKnowledgeArticle(slug)
      .then((data) => {
        if (!mounted) return
        setArticle(data)
        setHelpfulCount(data.helpfulVotesCount)
        setHasVoted(Boolean(data.hasVotedHelpful))
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Failed to load article.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [slug])

  async function handleVoteHelpful() {
    if (hasVoted || !article) return
    try {
      const res = await voteArticleHelpful(article.slug)
      setHelpfulCount(res.helpfulVotesCount)
      setHasVoted(true)
    } catch {
      // Ignore
    }
  }

  function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container article-reader-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-tag">
              <BookOpen size={14} /> SECURITY KNOWLEDGE BASE
            </span>
            <h2 className="modal-title">{article?.title || 'Loading Article...'}</h2>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close article reader"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body article-reader-body">
          {loading && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading cybersecurity technical guide...</p>
            </div>
          )}

          {error && (
            <div className="error-banner">
              <p>{error}</p>
              <button className="button-secondary" onClick={onClose}>
                Return to Knowledge Base
              </button>
            </div>
          )}

          {article && !loading && !error && (
            <div className="article-full-content">
              {/* Meta bar */}
              <div className="article-meta-banner">
                <div className="meta-left">
                  <span className={`difficulty-badge badge-${article.difficulty.toLowerCase()}`}>
                    {article.difficulty}
                  </span>
                  <span className="meta-item">
                    <Clock size={13} /> {article.readTimeMinutes} min read
                  </span>
                  <span className="meta-item">
                    <Eye size={13} /> {article.viewsCount} views
                  </span>
                </div>
                <div className="meta-right">
                  <span className="article-author">By {article.authorName}</span>
                  <button
                    className="share-btn"
                    onClick={handleShare}
                    title="Copy guide link"
                  >
                    {copied ? <Check size={14} /> : <Share2 size={14} />}
                    {copied ? 'Copied' : 'Share'}
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="article-tags-strip">
                {article.tags.map((tag) => (
                  <span key={tag} className="article-tag-chip">
                    <Tag size={11} /> {tag}
                  </span>
                ))}
              </div>

              {/* Executive Summary */}
              <div className="article-summary-box">
                <div className="summary-title">
                  <Sparkles size={14} /> EXECUTIVE SUMMARY
                </div>
                <p>{article.summary}</p>
              </div>

              {/* Markdown Content Renderer */}
              <div className="markdown-prose">
                {article.content.split('\n\n').map((paragraph, index) => {
                  if (paragraph.startsWith('# ')) {
                    return <h1 key={index}>{paragraph.replace('# ', '')}</h1>
                  }
                  if (paragraph.startsWith('## ')) {
                    return <h2 key={index}>{paragraph.replace('## ', '')}</h2>
                  }
                  if (paragraph.startsWith('### ')) {
                    return <h3 key={index}>{paragraph.replace('### ', '')}</h3>
                  }
                  if (paragraph.startsWith('```')) {
                    const lines = paragraph.split('\n')
                    const code = lines.slice(1, -1).join('\n')
                    const lang = lines[0]?.replace('```', '') || 'text'
                    return (
                      <div key={index} className="code-block-wrapper">
                        <div className="code-block-header">
                          <span>{lang.toUpperCase()}</span>
                        </div>
                        <pre className="code-block-pre">
                          <code>{code}</code>
                        </pre>
                      </div>
                    )
                  }
                  if (paragraph.startsWith('- ')) {
                    const items = paragraph.split('\n- ')
                    return (
                      <ul key={index}>
                        {items.map((item, i) => (
                          <li key={i}>{item.replace(/^- /, '')}</li>
                        ))}
                      </ul>
                    )
                  }
                  return <p key={index}>{paragraph}</p>
                })}
              </div>

              {/* Feedback Section */}
              <div className="article-feedback-bar">
                <div className="feedback-question">
                  <span>Was this technical guide helpful for your learning?</span>
                </div>
                <button
                  className={`helpful-btn ${hasVoted ? 'helpful-voted' : ''}`}
                  onClick={handleVoteHelpful}
                  disabled={hasVoted}
                >
                  <ThumbsUp size={15} />
                  {hasVoted ? 'Thank you!' : 'Yes, this helped'} ({helpfulCount})
                </button>
              </div>

              {/* Related Articles */}
              {article.relatedArticles && article.relatedArticles.length > 0 && (
                <div className="related-articles-section">
                  <h3>Related Technical Guides</h3>
                  <div className="related-articles-grid">
                    {article.relatedArticles.map((rel) => (
                      <div
                        key={rel.slug}
                        className="related-article-card"
                        onClick={() => onSelectRelatedArticle?.(rel.slug)}
                      >
                        <span className="related-cat">{rel.categorySlug}</span>
                        <h4>{rel.title}</h4>
                        <div className="related-footer">
                          <span>{rel.readTimeMinutes} min read</span>
                          <span>↗</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="button-primary" onClick={onClose}>
            Back to Community
          </button>
        </div>
      </div>
    </div>
  )
}
