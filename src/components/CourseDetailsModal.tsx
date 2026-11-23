import { BookOpen, Check, Clock, Award, Shield, X, ArrowRight, Layers } from 'lucide-react'
import type { CatalogCourse } from '../data/catalog'
import { CATEGORY_DETAILS } from '../../packages/shared/src/index'

interface Props {
  course: CatalogCourse | null
  onClose: () => void
  onStartCourse: (course: CatalogCourse) => void
}

export function CourseDetailsModal({ course, onClose, onStartCourse }: Props) {
  if (!course) return null

  const categoryMeta = CATEGORY_DETAILS[course.category]
  const difficultyClass = course.difficulty.toLowerCase()

  return (
    <div className="course-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-course-title">
      <div className="course-modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="course-modal-close" onClick={onClose} aria-label="Close course details">
          <X size={18} />
        </button>

        <div className="course-modal-header">
          <div className="course-modal-tags">
            <span className="course-category-pill">{categoryMeta?.name ?? course.category}</span>
            <span className={`difficulty-badge ${difficultyClass}`}>{course.difficulty}</span>
            <span className="xp-badge"><Award size={12} /> +{course.xpReward} XP</span>
          </div>
          <h2 id="modal-course-title">{course.title}</h2>
          <p className="course-modal-desc">{course.description}</p>
        </div>

        <div className="course-modal-stats">
          <div>
            <Clock size={16} />
            <span>Estimated Duration</span>
            <strong>{course.duration}</strong>
          </div>
          <div>
            <Layers size={16} />
            <span>Curriculum</span>
            <strong>{course.modules.length} Modules · {course.modules.reduce((sum, m) => sum + m.lessons.length, 0)} Lessons</strong>
          </div>
          <div>
            <Shield size={16} />
            <span>Access Model</span>
            <strong>100% Free · Open</strong>
          </div>
        </div>

        <div className="course-modal-body">
          <div className="modal-section">
            <h3><BookOpen size={16} /> What You Will Learn</h3>
            <ul className="learning-objectives-list">
              {course.learningObjectives.map((obj, i) => (
                <li key={i}>
                  <Check size={14} className="obj-check" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="modal-section">
            <h3><Shield size={16} /> Prerequisites</h3>
            <ul className="prereqs-list">
              {course.prerequisites.map((pre, i) => (
                <li key={i}>• {pre}</li>
              ))}
            </ul>
          </div>

          <div className="modal-section">
            <h3><Layers size={16} /> Course Syllabus & Modules</h3>
            <div className="syllabus-modules">
              {course.modules.map((mod, i) => (
                <div key={i} className="syllabus-module-card">
                  <div className="module-title-bar">
                    <span className="module-num">MODULE {String(i + 1).padStart(2, '0')}</span>
                    <h4>{mod.title}</h4>
                  </div>
                  <ul className="module-lessons">
                    {mod.lessons.map((lesson, lIdx) => (
                      <li key={lIdx}>
                        <span className="lesson-num">{String(lIdx + 1).padStart(2, '0')}</span>
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="course-modal-footer">
          <button className="text-link" onClick={onClose}>
            Back to Catalog
          </button>
          <button className="button-primary" onClick={() => onStartCourse(course)}>
            Start This Course <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
