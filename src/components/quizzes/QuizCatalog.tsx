import { useEffect, useState, useId } from 'react'
import {
  Award,
  Search,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  HelpCircle,
} from 'lucide-react'
import {
  fetchQuizzes,
  fetchQuiz,
  type QuizSummary,
  type QuizDetail,
  type QuizResultResponse,
} from '../../data/quizClient'
import { QuizWorkspaceModal } from './QuizWorkspaceModal'

interface Props {
  csrfToken?: string
  onQuizCompleted?: (result: QuizResultResponse) => void
}

export function QuizCatalog({ csrfToken, onQuizCompleted }: Props) {
  const quizSearchId = useId()
  const quizCatId = useId()
  const quizDiffId = useId()
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeQuiz, setActiveQuiz] = useState<QuizDetail | null>(null)
  const [loadingQuizSlug, setLoadingQuizSlug] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      const data = await fetchQuizzes({
        category: selectedCategory,
        difficulty: selectedDifficulty,
        q: searchQuery,
      })
      if (active) setQuizzes(data)
    }
    void load()
    return () => {
      active = false
    }
  }, [selectedCategory, selectedDifficulty, searchQuery])

  async function handleOpenQuiz(slug: string) {
    setLoadingQuizSlug(slug)
    try {
      const detail = await fetchQuiz(slug)
      setActiveQuiz(detail)
    } catch {
      // fallback
    } finally {
      setLoadingQuizSlug(null)
    }
  }

  return (
    <section id="quizzes" className="quiz-catalog-section">
      <div className="wrap">
        <div className="quiz-section-header">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> ASSESSMENTS & KNOWLEDGE CHECKS
            </div>
            <h2>
              Test your knowledge.<br />
              <span>Verify your cybersecurity skills.</span>
            </h2>
          </div>
          <p className="quiz-lead-text">
            Timed examinations and domain-specific quizzes designed to test your technical comprehension. Get immediate scoring, question breakdowns, and in-depth explanations.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="quiz-filter-bar">
          <div className="quiz-search-wrap">
            <Search size={15} className="search-icon" />
            <label htmlFor={quizSearchId} className="sr-only">Search assessments and quizzes</label>
            <input
              id={quizSearchId}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assessments, topics, protocols..."
              className="quiz-search-input"
            />
          </div>

          <div className="quiz-dropdowns">
            <div className="filter-select-wrap">
              <label htmlFor={quizCatId} className="sr-only">Filter by category</label>
              <select
                id={quizCatId}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="quiz-select"
              >
                <option value="all">All Domains</option>
                <option value="computer-networking">Computer Networking</option>
                <option value="web-application-security">Web Application Security</option>
                <option value="cryptography">Cryptography & PKI</option>
                <option value="soc-operations">SOC & Incident Response</option>
              </select>
            </div>

            <div className="filter-select-wrap">
              <label htmlFor={quizDiffId} className="sr-only">Filter by difficulty</label>
              <select
                id={quizDiffId}
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="quiz-select"
              >
                <option value="ALL">All Levels</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quizzes Grid */}
        <div className="quizzes-grid">
          {quizzes.map((quiz) => {
            const hasBest = Boolean(quiz.bestAttempt)
            const passed = quiz.bestAttempt?.passed ?? false
            const isOpening = loadingQuizSlug === quiz.slug

            return (
              <article key={quiz.id} className="quiz-card">
                <div className="quiz-card-top">
                  <div className="quiz-badges-row">
                    <span className="quiz-category-pill">{quiz.categorySlug.replace(/-/g, ' ')}</span>
                    <span className={`quiz-diff-pill ${quiz.difficulty.toLowerCase()}`}>
                      {quiz.difficulty}
                    </span>
                  </div>

                  <div className="quiz-xp-pill">
                    <Zap size={13} />
                    <span>+{quiz.xpReward} XP</span>
                  </div>
                </div>

                <div className="quiz-card-body">
                  <h3 className="quiz-title">{quiz.title}</h3>
                  <p className="quiz-description">{quiz.description}</p>
                </div>

                <div className="quiz-metrics-strip">
                  <div className="metric-item">
                    <HelpCircle size={14} />
                    <span>{quiz.totalQuestions} Questions</span>
                  </div>
                  <div className="metric-item">
                    <Clock size={14} />
                    <span>{quiz.timeLimitMins} Mins Limit</span>
                  </div>
                  <div className="metric-item">
                    <Award size={14} />
                    <span>Passing: {quiz.passingScore}%</span>
                  </div>
                </div>

                <div className="quiz-card-footer">
                  <div className="user-score-status">
                    {hasBest ? (
                      passed ? (
                        <span className="status-badge passed">
                          <CheckCircle2 size={14} /> Passed ({quiz.bestAttempt?.percentage}%)
                        </span>
                      ) : (
                        <span className="status-badge failed">
                          <XCircle size={14} /> Best: {quiz.bestAttempt?.percentage}%
                        </span>
                      )
                    ) : (
                      <span className="status-badge unattempted">Not Attempted</span>
                    )}
                  </div>

                  <button
                    className="start-quiz-btn"
                    onClick={() => handleOpenQuiz(quiz.slug)}
                    disabled={isOpening}
                  >
                    <span>{isOpening ? 'Loading…' : hasBest ? 'Retake Exam' : 'Start Exam'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        {quizzes.length === 0 && (
          <div className="no-quizzes-found">
            <Award size={32} />
            <h4>No assessments match your current filter</h4>
            <p>Try selecting a different domain category or clearing your search term.</p>
          </div>
        )}
      </div>

      {/* Workspace Modal */}
      {activeQuiz && (
        <QuizWorkspaceModal
          quiz={activeQuiz}
          csrfToken={csrfToken}
          onClose={() => setActiveQuiz(null)}
          onQuizCompleted={(res) => {
            onQuizCompleted?.(res)
            // Refresh quiz list with updated attempt stats
            void fetchQuizzes({
              category: selectedCategory,
              difficulty: selectedDifficulty,
              q: searchQuery,
            }).then(setQuizzes)
          }}
        />
      )}
    </section>
  )
}
