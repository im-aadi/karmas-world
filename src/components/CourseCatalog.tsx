import { useState, useMemo } from 'react'
import { Search, Filter, BookOpen, Clock, Award, ArrowRight, Layers, X, Sparkles } from 'lucide-react'
import { catalogCourses, type CatalogCourse } from '../data/catalog'
import { CourseDetailsModal } from './CourseDetailsModal'
import { CYBERSECURITY_CATEGORIES, CATEGORY_DETAILS } from '../../packages/shared/src/index'

interface Props {
  onStartCourse?: (course: CatalogCourse) => void
}

export function CourseCatalog({ onStartCourse }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [activeCourse, setActiveCourse] = useState<CatalogCourse | null>(null)

  const filteredCourses = useMemo(() => {
    return catalogCourses.filter((course) => {
      // Search matching
      const matchesSearch =
        searchQuery.trim() === '' ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category.toLowerCase().includes(searchQuery.toLowerCase())

      // Difficulty matching
      const matchesDifficulty =
        selectedDifficulty === 'ALL' || course.difficulty === selectedDifficulty

      // Category matching
      const matchesCategory =
        selectedCategory === 'ALL' || course.category === selectedCategory

      return matchesSearch && matchesDifficulty && matchesCategory
    })
  }, [searchQuery, selectedDifficulty, selectedCategory])

  function handleStart(course: CatalogCourse) {
    setActiveCourse(null)
    if (onStartCourse) {
      onStartCourse(course)
    } else {
      const academyElem = document.getElementById('academy')
      if (academyElem) {
        academyElem.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  const categoryPills: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'computer-fundamentals', label: 'Fundamentals' },
    { id: 'computer-networking', label: 'Networking' },
    { id: 'linux-fundamentals', label: 'Linux' },
    { id: 'python-for-cybersecurity', label: 'Python' },
    { id: 'cryptography', label: 'Cryptography' },
    { id: 'ethical-hacking', label: 'Ethical Hacking' },
    { id: 'web-application-security', label: 'Web Security' },
    { id: 'owasp-top-10', label: 'OWASP' },
    { id: 'digital-forensics', label: 'Forensics' },
    { id: 'soc-operations', label: 'SOC' },
    { id: 'incident-response', label: 'IR' },
    { id: 'threat-intelligence', label: 'Threat Intel' },
  ]

  return (
    <section id="catalog" className="catalog-section">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> 20 CYBERSECURITY DOMAINS
            </div>
            <h2>
              Structured Courses.<br />
              <span>Explore Every Domain.</span>
            </h2>
          </div>
          <p>
            Choose from comprehensive courses designed for every skill level, from hardware and networking to penetration testing, forensics, and threat intelligence.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="catalog-filters-bar">
          <div className="catalog-search-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="catalog-search-input"
              placeholder="Search 20 cybersecurity courses, skills, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search courses"
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="catalog-dropdown-filters">
            <div className="filter-select-wrap">
              <Filter size={14} className="filter-icon" />
              <select
                aria-label="Filter by difficulty"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">All Levels</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>

            <div className="filter-select-wrap">
              <select
                aria-label="Filter by category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">All 20 Categories</option>
                {CYBERSECURITY_CATEGORIES.map((catKey) => (
                  <option key={catKey} value={catKey}>
                    {CATEGORY_DETAILS[catKey]?.name ?? catKey}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Quick Pills */}
        <div className="category-pills-scroll" role="tablist" aria-label="Quick category filters">
          {categoryPills.map((pill) => (
            <button
              key={pill.id}
              role="tab"
              aria-selected={selectedCategory === pill.id}
              className={`category-pill-btn ${selectedCategory === pill.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(pill.id)}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Results Count Header */}
        <div className="catalog-results-header">
          <span>Showing <strong>{filteredCourses.length}</strong> of {catalogCourses.length} courses</span>
          {(searchQuery || selectedDifficulty !== 'ALL' || selectedCategory !== 'ALL') && (
            <button
              className="reset-filters-btn"
              onClick={() => {
                setSearchQuery('')
                setSelectedDifficulty('ALL')
                setSelectedCategory('ALL')
              }}
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Course Cards Grid */}
        {filteredCourses.length === 0 ? (
          <div className="catalog-empty-state">
            <Sparkles size={32} />
            <h3>No courses found</h3>
            <p>Try adjusting your search terms, difficulty level, or category filter.</p>
            <button
              className="button-primary"
              onClick={() => {
                setSearchQuery('')
                setSelectedDifficulty('ALL')
                setSelectedCategory('ALL')
              }}
            >
              View all courses
            </button>
          </div>
        ) : (
          <div className="catalog-grid">
            {filteredCourses.map((course) => {
              const categoryMeta = CATEGORY_DETAILS[course.category]
              const difficultyClass = course.difficulty.toLowerCase()

              return (
                <article key={course.id} className="catalog-card">
                  <div className="catalog-card-top">
                    <span className="course-cat-tag">
                      {categoryMeta?.name ?? course.category}
                    </span>
                    <span className={`difficulty-badge ${difficultyClass}`}>
                      {course.difficulty}
                    </span>
                  </div>

                  <h3 className="catalog-card-title">{course.title}</h3>
                  <p className="catalog-card-desc">{course.description}</p>

                  <div className="catalog-card-meta">
                    <span>
                      <Clock size={12} /> {course.duration}
                    </span>
                    <span>
                      <Layers size={12} /> {course.modules.length} Modules
                    </span>
                    <span className="xp-tag">
                      <Award size={12} /> +{course.xpReward} XP
                    </span>
                  </div>

                  <div className="catalog-card-actions">
                    <button
                      className="card-details-btn"
                      onClick={() => setActiveCourse(course)}
                    >
                      <BookOpen size={13} /> View Details
                    </button>
                    <button
                      className="card-start-btn"
                      onClick={() => handleStart(course)}
                    >
                      Start <ArrowRight size={13} />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* Course Details Modal */}
      <CourseDetailsModal
        course={activeCourse}
        onClose={() => setActiveCourse(null)}
        onStartCourse={handleStart}
      />
    </section>
  )
}
