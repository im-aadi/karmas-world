import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, CircleCheck, Clock3, LockKeyhole } from 'lucide-react'
import { courses, type Course } from '../data/courses'
import { readLearningProgress, saveLearningProgress, type LearningProgress } from '../data/progress'
import { syncCompletedLesson } from '../data/account'

type LessonRequest = { courseId: string; lessonIndex: number }
type Props = { accountId?: string | null; csrfToken?: string; lessonRequest?: LessonRequest | null }

export function LearningAcademy({ accountId = null, csrfToken = '', lessonRequest = null }: Props = {}) {
  const [progress, setProgress] = useState<LearningProgress>(readLearningProgress)
  const [courseId, setCourseId] = useState<string | null>(null)
  const [lessonIndex, setLessonIndex] = useState(0)
  const [choice, setChoice] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const course = useMemo(() => courses.find(item => item.id === courseId), [courseId])
  const completed = course ? progress[course.id] ?? [] : []

  useEffect(() => {
    const refresh = () => setProgress(readLearningProgress())
    window.addEventListener('karma-learning-progress-updated', refresh)
    return () => window.removeEventListener('karma-learning-progress-updated', refresh)
  }, [])

  useEffect(() => {
    if (!lessonRequest) return
    const requestedCourse = courses.find(item => item.id === lessonRequest.courseId)
    if (!requestedCourse || !requestedCourse.lessons[lessonRequest.lessonIndex]) return
    setCourseId(requestedCourse.id)
    setLessonIndex(lessonRequest.lessonIndex)
    setChoice(null)
    setChecked(false)
    document.getElementById('academy')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }, [lessonRequest])

  function openCourse(item: Course) {
    setCourseId(item.id)
    setLessonIndex(0)
    setChoice(null)
    setChecked(false)
  }

  function closeCourse() {
    setCourseId(null)
    setChoice(null)
    setChecked(false)
  }

  function selectLesson(index: number) {
    setLessonIndex(index)
    setChoice(null)
    setChecked(false)
  }

  function completeLesson() {
    if (!course || !checked || choice !== course.lessons[lessonIndex].answer) return
    const next = { ...progress, [course.id]: Array.from(new Set([...(progress[course.id] ?? []), lessonIndex])) }
    setProgress(next)
    saveLearningProgress(next)
    if (accountId && csrfToken) {
      setSyncMessage('Syncing progress…')
      void syncCompletedLesson(course.id, lessonIndex, csrfToken)
        .then(() => setSyncMessage('Progress synced to your account.'))
        .catch(() => setSyncMessage('Saved on this device; account sync failed.'))
    } else {
      setSyncMessage('Progress saved on this device.')
    }
  }

  function moveNext() {
    if (!course) return
    if (lessonIndex < course.lessons.length - 1) selectLesson(lessonIndex + 1)
  }

  return <section id="academy" className="academy-section">
    <div className="wrap">
      <div className="academy-heading">
        <div><div className="eyebrow"><span className="eyebrow-line" /> PHASE 02 / THE LEARNING ACADEMY</div><h2>Knowledge, with<br /><span>a clear next step.</span></h2></div>
        <p>Short, guided lessons give you the foundations first, then let you check what you learned. Your progress stays on this device.</p>
      </div>
      {course ? <div className="course-view">
        <button className="back-to-courses" onClick={closeCourse}><ArrowLeft size={15} /> All learning paths</button>
        <div className="course-layout">
          <aside className="lesson-sidebar" aria-label={`${course.title} lessons`}>
            <div className="lesson-course-title"><span className="path-number">LEARNING PATH</span><h3>{course.title}</h3><span className="course-progress-label">{completed.length} / {course.lessons.length} COMPLETE</span>
              <div className="progress-track"><span style={{ width: `${completed.length / course.lessons.length * 100}%` }} /></div>
            </div>
            <ol>{course.lessons.map((lesson, index) => <li key={lesson.title}><button className={lessonIndex === index ? 'lesson-nav active' : 'lesson-nav'} onClick={() => selectLesson(index)} aria-current={lessonIndex === index ? 'step' : undefined}><span className="lesson-status">{completed.includes(index) ? <CircleCheck size={17} /> : String(index + 1).padStart(2, '0')}</span><span>{lesson.title}<small><Clock3 size={12} /> {lesson.duration}</small></span>{completed.includes(index) && <Check size={14} className="lesson-done-icon" />}</button></li>)}</ol>
          </aside>
          <article className="lesson-content">
            <div className="lesson-meta"><span>{course.level}</span><span>LESSON {String(lessonIndex + 1).padStart(2, '0')} / {String(course.lessons.length).padStart(2, '0')}</span></div>
            <h3>{course.lessons[lessonIndex].title}</h3>
            {course.lessons[lessonIndex].body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            <div className="takeaway"><span>KEY TAKEAWAY</span><p>{course.lessons[lessonIndex].takeaway}</p></div>
            <div className="knowledge-check"><div className="check-heading"><BookOpen size={16} /><span>QUICK KNOWLEDGE CHECK</span></div><h4>{course.lessons[lessonIndex].question}</h4>
              <fieldset><legend className="sr-only">Choose an answer</legend>{course.lessons[lessonIndex].options.map((option, index) => <label key={option} className={`quiz-option ${choice === index ? 'selected' : ''} ${checked && index === course.lessons[lessonIndex].answer ? 'correct' : ''}`}><input type="radio" name={`quiz-${course.id}-${lessonIndex}`} checked={choice === index} onChange={() => { setChoice(index); setChecked(false) }} /><span className="radio-custom" />{option}</label>)}</fieldset>
              <div className="quiz-footer">{checked ? <p className={choice === course.lessons[lessonIndex].answer ? 'quiz-feedback success' : 'quiz-feedback retry'} role="status">{choice === course.lessons[lessonIndex].answer ? <><Check size={15} /> {course.lessons[lessonIndex].explanation}</> : <>Not quite. Review the lesson and try again.</>}</p> : <span className="quiz-hint">Choose the best answer to continue.</span>}
                <button className="check-answer" disabled={choice === null} onClick={() => setChecked(true)}>{checked && choice === course.lessons[lessonIndex].answer ? 'Answer checked' : 'Check answer'} <ArrowRight size={14} /></button>
              </div>
            </div>
            <div className="lesson-actions">{completed.includes(lessonIndex) ? <span className="completed-label"><CircleCheck size={16} /> Lesson complete</span> : <button className="button-primary" disabled={!checked || choice !== course.lessons[lessonIndex].answer} onClick={completeLesson}>Mark lesson complete <Check size={15} /></button>}
              {lessonIndex < course.lessons.length - 1 ? <button className="next-lesson" onClick={moveNext}>Next lesson <ArrowRight size={15} /></button> : <span className="course-end"><LockKeyhole size={14} /> {completed.length === course.lessons.length ? 'Path completed' : 'Finish this lesson to complete the path'}</span>}</div>
            {syncMessage && <p className="progress-sync-note" role="status">{syncMessage}</p>}
          </article>
        </div>
      </div> : <div className="academy-grid">{courses.map(item => {
        const done = progress[item.id]?.length ?? 0
        return <article className="academy-card" key={item.id}>
          <div className="academy-card-top"><span className="path-number">{item.level}</span><span className="academy-icon"><BookOpen size={18} /></span></div>
          <h3>{item.title}</h3><p>{item.description}</p>
          <div className="academy-card-progress"><div className="card-progress-copy"><span>{done ? `${done} of ${item.lessons.length} lessons complete` : `${item.lessons.length} short lessons`}</span><span>{Math.round(done / item.lessons.length * 100)}%</span></div><div className="progress-track"><span style={{ width: `${done / item.lessons.length * 100}%` }} /></div></div>
          <button className="course-open" onClick={() => openCourse(item)}>{done ? 'Continue learning' : 'Start this path'} <ArrowRight size={15} /></button>
        </article>
      })}</div>}
    </div>
  </section>
}
