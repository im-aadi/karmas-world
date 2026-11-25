import { useEffect, useState, type FormEvent } from 'react'
import {
  AlertCircle,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Lock,
  MessageCircle,
  Pin,
  Send,
  ThumbsUp,
  User,
  X,
} from 'lucide-react'
import {
  createForumReply,
  fetchForumThread,
  voteForumReply,
  voteForumThread,
  type ForumThreadDetail,
} from '../../data/communityClient'

interface ThreadDetailModalProps {
  slug: string
  csrfToken?: string
  onClose: () => void
}

export function ThreadDetailModal({
  slug,
  csrfToken,
  onClose,
}: ThreadDetailModalProps) {
  const [thread, setThread] = useState<ForumThreadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)
  const [replySuccess, setReplySuccess] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    fetchForumThread(slug)
      .then((data) => {
        if (!mounted) return
        setThread(data)
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Could not load discussion thread.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [slug])

  async function handleVoteThread() {
    if (!thread) return
    try {
      const res = await voteForumThread(thread.slug, csrfToken)
      setThread((prev) =>
        prev
          ? {
              ...prev,
              upvotesCount: res.upvotesCount,
              hasVoted: res.hasVoted,
            }
          : null
      )
    } catch {
      // Ignore
    }
  }

  async function handleVoteReply(replyId: string) {
    if (!thread) return
    try {
      const res = await voteForumReply(replyId, csrfToken)
      setThread((prev) =>
        prev
          ? {
              ...prev,
              replies: prev.replies.map((r) =>
                r.id === replyId
                  ? { ...r, upvotesCount: res.upvotesCount, hasVoted: res.hasVoted }
                  : r
              ),
            }
          : null
      )
    } catch {
      // Ignore
    }
  }

  async function handleAddReply(e: FormEvent) {
    e.preventDefault()
    if (!thread || replyDraft.trim().length < 5) {
      setReplyError('Reply must be at least 5 characters.')
      return
    }

    setSubmittingReply(true)
    setReplyError(null)

    try {
      const newReply = await createForumReply(
        thread.slug,
        { content: replyDraft.trim() },
        csrfToken
      )
      setThread((prev) =>
        prev
          ? {
              ...prev,
              repliesCount: prev.repliesCount + 1,
              replies: [...prev.replies, newReply],
            }
          : null
      )
      setReplyDraft('')
      setReplySuccess(true)
      setTimeout(() => setReplySuccess(false), 3000)
    } catch (err: unknown) {
      setReplyError(err instanceof Error ? err.message : 'Could not post reply.')
    } finally {
      setSubmittingReply(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container thread-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="thread-badges-line">
              <span className="modal-tag">{thread?.categoryName || 'Discussion'}</span>
              {thread?.isPinned && (
                <span className="pinned-badge">
                  <Pin size={11} /> PINNED
                </span>
              )}
              {thread?.isLocked && (
                <span className="locked-badge">
                  <Lock size={11} /> LOCKED
                </span>
              )}
            </div>
            <h2 className="modal-title">{thread?.title || 'Loading Discussion...'}</h2>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close discussion thread"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body thread-detail-body">
          {loading && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading community discussion...</p>
            </div>
          )}

          {error && (
            <div className="error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {thread && !loading && !error && (
            <div className="thread-content-wrap">
              {/* Thread OP Card */}
              <div className="thread-op-card">
                <div className="post-author-bar">
                  <div className="author-info">
                    <span className="author-avatar">
                      <User size={16} />
                    </span>
                    <div>
                      <span className="author-name">{thread.authorName}</span>
                      {thread.authorRank && (
                        <span className="cyber-rank-chip">
                          <Award size={11} /> {thread.authorRank}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="thread-time-meta">
                    <Clock size={12} />
                    <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                    <span className="views-count">
                      <Eye size={12} /> {thread.viewsCount}
                    </span>
                  </div>
                </div>

                <div className="post-body-text">
                  {thread.content.split('\n\n').map((paragraph, index) => {
                    if (paragraph.startsWith('```')) {
                      const lines = paragraph.split('\n')
                      const code = lines.slice(1, -1).join('\n')
                      return (
                        <pre key={index} className="thread-code-block">
                          <code>{code}</code>
                        </pre>
                      )
                    }
                    if (paragraph.startsWith('1. ') || paragraph.startsWith('- ')) {
                      const items = paragraph.split('\n')
                      return (
                        <ul key={index}>
                          {items.map((item, i) => (
                            <li key={i}>{item.replace(/^(\d+\.\s+|- )/, '')}</li>
                          ))}
                        </ul>
                      )
                    }
                    return <p key={index}>{paragraph}</p>
                  })}
                </div>

                <div className="post-action-bar">
                  <button
                    className={`upvote-btn ${thread.hasVoted ? 'voted' : ''}`}
                    onClick={handleVoteThread}
                  >
                    <ThumbsUp size={14} />
                    <span>Helpful & Insightful</span>
                    <span className="vote-counter">{thread.upvotesCount}</span>
                  </button>
                  <span className="replies-counter">
                    <MessageCircle size={14} /> {thread.replies.length} replies
                  </span>
                </div>
              </div>

              {/* Replies Header */}
              <div className="replies-header-strip">
                <h3>Community Answers & Discussion ({thread.replies.length})</h3>
              </div>

              {/* Replies List */}
              <div className="replies-list">
                {thread.replies.length === 0 ? (
                  <div className="no-replies-prompt">
                    <MessageCircle size={28} />
                    <p>No community replies yet. Be the first to share your knowledge!</p>
                  </div>
                ) : (
                  thread.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`reply-card ${reply.isAcceptedAnswer ? 'accepted-answer' : ''}`}
                    >
                      {reply.isAcceptedAnswer && (
                        <div className="accepted-badge">
                          <CheckCircle2 size={13} /> ACCEPTED COMMUNITY SOLUTION
                        </div>
                      )}
                      <div className="post-author-bar">
                        <div className="author-info">
                          <span className="author-avatar small">
                            <User size={13} />
                          </span>
                          <div>
                            <span className="author-name">{reply.authorName}</span>
                            {reply.authorRank && (
                              <span className="cyber-rank-chip small">
                                {reply.authorRank}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="reply-time">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="reply-body-text">
                        {reply.content.split('\n\n').map((paragraph, index) => {
                          if (paragraph.startsWith('```')) {
                            const lines = paragraph.split('\n')
                            const code = lines.slice(1, -1).join('\n')
                            return (
                              <pre key={index} className="thread-code-block small">
                                <code>{code}</code>
                              </pre>
                            )
                          }
                          return <p key={index}>{paragraph}</p>
                        })}
                      </div>

                      <div className="reply-foot-bar">
                        <button
                          className={`upvote-btn small ${reply.hasVoted ? 'voted' : ''}`}
                          onClick={() => handleVoteReply(reply.id)}
                        >
                          <ThumbsUp size={12} />
                          <span>Helpful</span>
                          <span className="vote-counter">{reply.upvotesCount}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Composer Form */}
              {!thread.isLocked ? (
                <div className="reply-composer-section">
                  <h4>Contribute an Answer or Perspective</h4>
                  {replySuccess && (
                    <div className="success-banner">
                      <Check size={16} />
                      <span>Reply posted! You earned +10 XP for community participation.</span>
                    </div>
                  )}
                  {replyError && (
                    <div className="error-banner">
                      <AlertCircle size={16} />
                      <span>{replyError}</span>
                    </div>
                  )}
                  <form onSubmit={handleAddReply}>
                    <textarea
                      className="textarea-input"
                      rows={4}
                      placeholder="Share code, troubleshooting steps, or explanations..."
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      required
                    />
                    <div className="composer-actions">
                      <span className="input-hint">
                        {replyDraft.length} chars (min 5)
                      </span>
                      <button
                        type="submit"
                        className="button-primary"
                        disabled={submittingReply || replyDraft.trim().length < 5}
                      >
                        <Send size={14} />
                        {submittingReply ? 'Posting...' : 'Post Reply (+10 XP)'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="locked-thread-notice">
                  <Lock size={16} />
                  <span>This thread has been locked by a moderator and cannot receive further replies.</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="button-secondary" onClick={onClose}>
            Back to Discussions
          </button>
        </div>
      </div>
    </div>
  )
}
