import { useState, type FormEvent } from 'react'
import { AlertCircle, MessageSquarePlus, ShieldAlert, X } from 'lucide-react'
import {
  createForumThread,
  type ForumCategoryItem,
  type ForumThreadDetail,
} from '../../data/communityClient'

interface CreateThreadModalProps {
  categories: ForumCategoryItem[]
  csrfToken?: string
  onClose: () => void
  onThreadCreated: (thread: ForumThreadDetail) => void
}

export function CreateThreadModal({
  categories,
  csrfToken,
  onClose,
  onThreadCreated,
}: CreateThreadModalProps) {
  const [title, setTitle] = useState('')
  const [categorySlug, setCategorySlug] = useState(
    categories[0]?.slug || 'general-discussion'
  )
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long.')
      return
    }
    if (content.trim().length < 20) {
      setError('Discussion content must be at least 20 characters long.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const thread = await createForumThread(
        {
          title: title.trim(),
          categorySlug,
          content: content.trim(),
        },
        csrfToken
      )
      onThreadCreated(thread)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create discussion thread.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container create-thread-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-tag">
              <MessageSquarePlus size={14} /> NEW DISCUSSION THREAD
            </span>
            <h2 className="modal-title">Ask the Community or Share Knowledge</h2>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close new discussion modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="thread-title">Discussion Title</label>
              <input
                id="thread-title"
                type="text"
                className="text-input"
                placeholder="e.g. How does TLS 1.3 prevent replay attacks with 0-RTT data?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
              />
              <span className="input-hint">{title.length} / 200 characters</span>
            </div>

            <div className="form-group">
              <label htmlFor="thread-category">Channel / Domain</label>
              <select
                id="thread-category"
                className="select-input"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="thread-content">Detailed Question or Discussion Prompt</label>
              <textarea
                id="thread-content"
                className="textarea-input"
                rows={7}
                placeholder="Describe your question, architecture, code snippet, or learning experience in detail..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
              <span className="input-hint">{content.length} characters (minimum 20)</span>
            </div>

            <div className="safety-guideline-box">
              <ShieldAlert size={16} />
              <div>
                <strong>Safe Disclosure & Respectful Learning</strong>
                <p>
                  Never post live credentials, confidential production logs, or authorization
                  tokens. Focus on concepts, packet flows, and defensible architectures.
                </p>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="button-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button-primary"
              disabled={submitting}
            >
              {submitting ? 'Publishing...' : 'Publish Discussion (+25 XP)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
