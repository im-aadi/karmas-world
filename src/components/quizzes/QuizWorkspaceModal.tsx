import { useEffect, useState, useRef, useCallback } from 'react'
import {
  X,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  ArrowRight,
  ArrowLeft,
  BookOpen,
} from 'lucide-react'
import {
  type QuizDetail,
  type QuizResultResponse,
  submitQuiz,
} from '../../data/quizClient'

interface Props {
  quiz: QuizDetail | null
  csrfToken?: string
  onClose: () => void
  onQuizCompleted?: (result: QuizResultResponse) => void
}

export function QuizWorkspaceModal({ quiz, csrfToken, onClose, onQuizCompleted }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeRemainingSecs, setTimeRemainingSecs] = useState<number>(
    (quiz?.timeLimitMins ?? 15) * 60
  )
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [result, setResult] = useState<QuizResultResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!quiz || isSubmitting) return
    setIsSubmitting(true)
    setErrorMessage(null)

    if (timerRef.current) clearInterval(timerRef.current)

    const totalTimeSecs = (quiz.timeLimitMins ?? 15) * 60
    const timeSpent = Math.max(1, totalTimeSecs - timeRemainingSecs)

    try {
      const res = await submitQuiz(quiz.slug, { answers, timeSpentSecs: timeSpent }, csrfToken)
      setResult(res)
      onQuizCompleted?.(res)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit quiz.')
      setIsSubmitting(false)
    }
  }, [quiz, isSubmitting, timeRemainingSecs, answers, csrfToken, onQuizCompleted])

  // Countdown timer logic
  useEffect(() => {
    if (!quiz || result) return

    const initialTotalSecs = (quiz.timeLimitMins ?? 15) * 60
    setTimeRemainingSecs(initialTotalSecs)

    timerRef.current = setInterval(() => {
      setTimeRemainingSecs((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          void handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [quiz, result, handleSubmit])

  // Keyboard navigation & Esc handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!quiz) return null

  const questions = quiz.questions
  const currentQ = questions[currentQuestionIndex]
  const totalQuestions = questions.length
  const answeredCount = Object.keys(answers).length
  const totalAllocatedSecs = (quiz.timeLimitMins ?? 15) * 60
  const timerPercent = Math.max(0, Math.min(100, (timeRemainingSecs / totalAllocatedSecs) * 100))

  function formatTimer(secs: number): string {
    const mins = Math.floor(secs / 60)
    const remSecs = secs % 60
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`
  }

  function handleSelectOption(questionId: string, optionId: string) {
    if (result) return
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  function handleRetake() {
    setResult(null)
    setAnswers({})
    setCurrentQuestionIndex(0)
    setIsSubmitting(false)
    setErrorMessage(null)
    setTimeRemainingSecs(totalAllocatedSecs)
  }

  return (
    <div className="quiz-workspace-backdrop" role="presentation" onClick={onClose}>
      <div
        className="quiz-workspace-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Workspace Top Bar */}
        <div className="quiz-dialog-header">
          <div className="quiz-title-group">
            <span className="exam-tag">
              <Award size={12} /> CYBERSECURITY ASSESSMENT
            </span>
            <h3 id="quiz-modal-title">{quiz.title}</h3>
          </div>

          <div className="quiz-header-right">
            {!result && (
              <div className={`quiz-timer-pill ${timeRemainingSecs < 120 ? 'urgent' : ''}`}>
                <Clock size={14} />
                <span>{formatTimer(timeRemainingSecs)}</span>
              </div>
            )}
            <button
              className="quiz-close-btn"
              onClick={onClose}
              aria-label="Close assessment workspace"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Timer progress bar during active quiz */}
        {!result && (
          <div className="quiz-timer-track">
            <div
              className={`quiz-timer-fill ${timeRemainingSecs < 120 ? 'urgent' : ''}`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        )}

        {/* ACTIVE EXAM INTERFACE */}
        {!result ? (
          <div className="quiz-exam-body">
            {/* Question Navigator Bar */}
            <div className="question-nav-strip">
              <div className="nav-strip-label">
                <span>
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <span className="answered-meta">
                  {answeredCount} of {totalQuestions} Answered
                </span>
              </div>

              <div className="question-pills-row">
                {questions.map((q, idx) => {
                  const isAnswered = Boolean(answers[q.id])
                  const isCurrent = idx === currentQuestionIndex
                  return (
                    <button
                      key={q.id}
                      className={`q-nav-pill ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : ''}`}
                      onClick={() => setCurrentQuestionIndex(idx)}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
            </div>

            {errorMessage && (
              <div className="quiz-error-banner" role="alert">
                <AlertTriangle size={15} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Current Question View */}
            {currentQ && (
              <div className="question-card">
                <div className="question-meta-row">
                  <span className="question-points-pill">{currentQ.points} Points</span>
                  <span className="question-order-pill">Item #{currentQuestionIndex + 1}</span>
                </div>

                <h4 className="question-prompt">{currentQ.prompt}</h4>

                {currentQ.codeSnippet && (
                  <pre className="question-code-block">
                    <code>{currentQ.codeSnippet}</code>
                  </pre>
                )}

                <div className="options-list">
                  {currentQ.options.map((option) => {
                    const isSelected = answers[currentQ.id] === option.id
                    return (
                      <div
                        key={option.id}
                        className={`quiz-option-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectOption(currentQ.id, option.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleSelectOption(currentQ.id, option.id)
                          }
                        }}
                      >
                        <div className={`option-radio ${isSelected ? 'checked' : ''}`} />
                        <span className="option-text">{option.text}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="quiz-exam-footer">
              <button
                className="quiz-nav-btn"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              >
                <ArrowLeft size={14} /> Previous
              </button>

              <div className="footer-right-actions">
                {currentQuestionIndex < totalQuestions - 1 ? (
                  <button
                    className="quiz-nav-btn next"
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  >
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    className="quiz-submit-btn"
                    onClick={() => void handleSubmit()}
                    disabled={isSubmitting}
                  >
                    <Sparkles size={14} />
                    {isSubmitting ? 'Grading Answers…' : 'Submit Examination'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* RESULT & REVIEW SCREEN */
          <div className="quiz-result-body">
            <div className={`quiz-result-banner ${result.passed ? 'passed' : 'failed'}`}>
              <div className="result-score-circle">
                <span className="score-percentage">{result.percentage}%</span>
                <span className="score-ratio">
                  {result.score} / {result.maxScore} PTS
                </span>
              </div>

              <div className="result-text-content">
                <div className="verdict-row">
                  {result.passed ? (
                    <>
                      <CheckCircle2 size={22} className="verdict-icon pass" />
                      <h4>Assessment Passed — Well Done!</h4>
                    </>
                  ) : (
                    <>
                      <XCircle size={22} className="verdict-icon fail" />
                      <h4>Passing Score Not Met</h4>
                    </>
                  )}
                </div>

                <p className="verdict-explanation">
                  {result.passed
                    ? `You exceeded the ${result.passingScore}% passing threshold. Your technical proficiency in this domain is verified.`
                    : `You scored ${result.percentage}%. Review the in-depth question explanations below and retake the exam when ready.`}
                </p>

                {result.xpAwarded > 0 && (
                  <div className="result-xp-awarded">
                    <Zap size={14} />
                    <span>+{result.xpAwarded} Experience Points (XP) Earned!</span>
                  </div>
                )}
              </div>

              <div className="result-banner-actions">
                <button className="retake-exam-btn" onClick={handleRetake}>
                  <RotateCcw size={14} /> Retake Exam
                </button>
              </div>
            </div>

            {/* Detailed Question Review List */}
            <div className="quiz-review-section">
              <div className="review-heading">
                <BookOpen size={16} />
                <h5>Comprehensive Question-by-Question Review</h5>
              </div>

              <div className="review-items-list">
                {result.review.map((item, idx) => (
                  <div
                    key={item.questionId}
                    className={`review-card-item ${item.isCorrect ? 'correct' : 'incorrect'}`}
                  >
                    <div className="review-card-header">
                      <span className="q-index-tag">Item #{idx + 1}</span>
                      <span className={`q-status-tag ${item.isCorrect ? 'correct' : 'incorrect'}`}>
                        {item.isCorrect ? (
                          <>
                            <CheckCircle2 size={13} /> +{item.pointsEarned} Points
                          </>
                        ) : (
                          <>
                            <XCircle size={13} /> 0 / {item.maxPoints} Points
                          </>
                        )}
                      </span>
                    </div>

                    <p className="review-prompt">{item.prompt}</p>

                    {item.codeSnippet && (
                      <pre className="question-code-block">
                        <code>{item.codeSnippet}</code>
                      </pre>
                    )}

                    <div className="review-options-list">
                      {item.options.map((opt) => {
                        const isUserChoice = opt.id === item.selectedOptionId
                        const isCorrectOption = opt.isCorrect

                        let optionClass = ''
                        if (isCorrectOption) optionClass = 'correct-opt'
                        else if (isUserChoice && !isCorrectOption) optionClass = 'wrong-opt'

                        return (
                          <div key={opt.id} className={`review-option-row ${optionClass}`}>
                            <div className="opt-indicator">
                              {isCorrectOption ? (
                                <CheckCircle2 size={15} />
                              ) : isUserChoice ? (
                                <XCircle size={15} />
                              ) : (
                                <div className="neutral-circle" />
                              )}
                            </div>
                            <span className="opt-text">{opt.text}</span>
                            {isUserChoice && (
                              <span className="user-choice-pill">Your Answer</span>
                            )}
                            {isCorrectOption && (
                              <span className="correct-choice-pill">Correct Answer</span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Educational Explanation Box */}
                    <div className="review-explanation-box">
                      <span className="explanation-label">Technical Explanation:</span>
                      <p>{item.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="review-modal-footer">
              <button className="close-review-btn" onClick={onClose}>
                Finish & Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
