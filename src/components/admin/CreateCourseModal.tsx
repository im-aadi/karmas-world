import { useState, type FormEvent } from 'react'
import { AlertCircle, BookPlus, X } from 'lucide-react'
import {
  createAdminCourse,
  type AdminCourseSummary,
} from '../../data/adminClient'
import { CYBERSECURITY_CATEGORIES, CATEGORY_DETAILS } from '../../../packages/shared/src/index'

interface CreateCourseModalProps {
  csrfToken?: string
  onClose: () => void
  onCourseCreated: (course: AdminCourseSummary) => void
}

export function CreateCourseModal({
  csrfToken,
  onClose,
  onCourseCreated,
}: CreateCourseModalProps) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [categorySlug, setCategorySlug] = useState<string>(CYBERSECURITY_CATEGORIES[0] || 'web-security')
  const [level, setLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER')
  const [duration, setDuration] = useState('3 hours')
  const [xpReward, setXpReward] = useState(250)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 80)
      )
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters.')
      return
    }
    if (slug.trim().length < 3) {
      setError('Slug must be at least 3 characters.')
      return
    }
    if (description.trim().length < 20) {
      setError('Description must be at least 20 characters.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const course = await createAdminCourse(
        {
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim(),
          categorySlug,
          level,
          duration,
          xpReward: Number(xpReward),
        },
        csrfToken
      )
      onCourseCreated(course)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create course.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container create-course-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-tag">
              <BookPlus size={14} /> CURRICULUM AUTHORING
            </span>
            <h2 className="modal-title">Create New Cybersecurity Course</h2>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close create course modal"
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
              <label htmlFor="course-title">Course Title</label>
              <input
                id="course-title"
                type="text"
                className="text-input"
                placeholder="e.g. Active Directory Penetration Testing & Defense"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="course-slug">URL Slug</label>
                <input
                  id="course-slug"
                  type="text"
                  className="text-input"
                  placeholder="e.g. active-directory-defense"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="course-category">Domain Category</label>
                <select
                  id="course-category"
                  className="select-input"
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                >
                  {CYBERSECURITY_CATEGORIES.map((catId) => (
                    <option key={catId} value={catId}>
                      {CATEGORY_DETAILS[catId]?.name || catId}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="course-desc">Syllabus & Overview Description</label>
              <textarea
                id="course-desc"
                className="textarea-input"
                rows={4}
                placeholder="Comprehensive summary of course objectives, attack vectors, and hands-on laboratory exercises..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label htmlFor="course-level">Skill Level</label>
                <select
                  id="course-level"
                  className="select-input"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')}
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="course-duration">Estimated Duration</label>
                <input
                  id="course-duration"
                  type="text"
                  className="text-input"
                  placeholder="e.g. 5 hours"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="course-xp">XP Reward</label>
                <input
                  id="course-xp"
                  type="number"
                  className="text-input"
                  min={50}
                  max={2000}
                  step={50}
                  value={xpReward}
                  onChange={(e) => setXpReward(Number(e.target.value))}
                  required
                />
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
              {submitting ? 'Creating Course...' : 'Publish Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
