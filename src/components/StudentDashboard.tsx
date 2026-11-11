import { useEffect, useState } from 'react'
import { ArrowRight, Award, BookOpen, CircleCheck, Compass, Download, Printer, Sparkles } from 'lucide-react'
import { courses } from '../data/courses'
import { learningProgressEvent, readLearningProgress, type LearningProgress } from '../data/progress'
import { LeaderboardPanel } from './LeaderboardPanel'

const roadmap = [
  { number: '01', title: 'Build your foundations', description: 'Learn security principles, safe account habits, and how to think about risk.', skills: 'SECURITY BASICS · NETWORKING · PRIVACY' },
  { number: '02', title: 'Choose a direction', description: 'Explore blue team defense, application security, security engineering, or governance.', skills: 'DEFENSE · APPSEC · ENGINEERING · GRC' },
  { number: '03', title: 'Practice and reflect', description: 'Use safe simulations, document what you learn, and build small projects you can explain.', skills: 'LAB NOTES · PROJECTS · COMMUNICATION' },
  { number: '04', title: 'Grow with the community', description: 'Contribute responsibly, keep learning, and look for mentors and entry-level opportunities.', skills: 'ETHICS · COLLABORATION · CONTINUOUS LEARNING' },
]

type Props = { displayName?: string; signedIn?: boolean; csrfToken?: string; onSignIn?: () => void; onExport?: () => Promise<void> }

export function StudentDashboard({ displayName = 'Karma’s World learner', signedIn = false, csrfToken, onSignIn, onExport }: Props) {
  const [progress, setProgress] = useState<LearningProgress>(readLearningProgress)
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState('')
  useEffect(() => {
    const refresh = () => setProgress(readLearningProgress())
    window.addEventListener(learningProgressEvent, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(learningProgressEvent, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  const totalLessons = courses.reduce((sum, course) => sum + course.lessons.length, 0)
  const completedLessons = courses.reduce((sum, course) => sum + (progress[course.id]?.length ?? 0), 0)
  const activePaths = courses.filter(course => (progress[course.id]?.length ?? 0) > 0).length
  const percentage = Math.round(completedLessons / totalLessons * 100)
  const earnedCertificates = courses.filter(course => (progress[course.id] ?? []).length >= course.lessons.length)
  function printCertificates() {
    document.body.classList.add('printing-certificate')
    window.addEventListener('afterprint', () => document.body.classList.remove('printing-certificate'), { once: true })
    window.print()
  }

  async function exportData() {
    if (!onExport) return
    setExporting(true)
    setExportMessage('')
    try { await onExport(); setExportMessage('Your data file has been downloaded.') }
    catch (error) { setExportMessage(error instanceof Error ? error.message : 'Could not export your data.') }
    finally { setExporting(false) }
  }

  return <section id="dashboard" className="dashboard-section">
    <div className="wrap">
      <div className="dashboard-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR LEARNING, AT A GLANCE</div><h2>Small steps.<br /><span>Real momentum.</span></h2></div><a className="dashboard-jump" href="#academy">Continue learning <ArrowRight size={15} /></a></div>
      <div className="dashboard-grid">
        <div className="progress-summary"><div className="summary-top"><span className="summary-icon"><BookOpen size={17} /></span><span>LOCAL LEARNING PROGRESS</span></div><div className="summary-count">{completedLessons}<span> / {totalLessons} lessons</span></div><div className="dashboard-progress-track"><span style={{ width: `${percentage}%` }} /></div><div className="summary-footer"><span>{percentage}% complete</span><span>{activePaths} {activePaths === 1 ? 'path started' : 'paths started'}</span></div></div>
        <div className="next-step-card"><span className="summary-icon green"><Sparkles size={17} /></span><div><h3>{completedLessons === 0 ? 'Start with the essentials' : completedLessons === totalLessons ? 'You finished every current lesson' : 'Keep your momentum going'}</h3><p>{completedLessons === 0 ? 'Cybersecurity foundations is a welcoming place to begin.' : completedLessons === totalLessons ? 'Your next step is to explore a safe practice simulation or career direction.' : 'Your learning is saved in this browser. Pick up with the next idea when you’re ready.'}</p></div><a href={completedLessons === 0 ? '#academy' : '#games'} aria-label="Go to next learning activity"><ArrowRight size={16} /></a></div>
      </div>
      <div className="data-export-card"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR DATA, YOUR COPY</div><p>Download a JSON file with your learning progress and private reflections{signedIn ? ', plus account data stored on the server.' : ' saved in this browser.'}</p>{exportMessage && <span className="data-export-message" role="status">{exportMessage}</span>}</div><button className="data-export-button" onClick={() => void exportData()} disabled={exporting}>{exporting ? 'Preparing…' : 'Download my data'} <Download size={14} /></button></div>
      <LeaderboardPanel signedIn={signedIn} csrfToken={csrfToken} onSignIn={onSignIn} />
      <div className="certificate-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR LEARNING MILESTONES</div><h3>Certificates of completion.</h3><p>Finish every lesson in a path to unlock a printable record of what you studied.</p></div>{earnedCertificates.length > 0 && <button className="certificate-print-button" onClick={printCertificates}><Printer size={15} /> Print earned certificates</button>}</div>
      <div className="certificate-grid">{courses.map(course => {
        const earned = earnedCertificates.some(item => item.id === course.id)
        const count = Math.min(progress[course.id]?.length ?? 0, course.lessons.length)
        return <article className={`certificate-card ${earned ? 'earned' : ''}`} key={course.id}>
          <span className="certificate-icon"><Award size={19} /></span><span className="path-number">{earned ? 'COMPLETED' : `${count} / ${course.lessons.length} LESSONS`}</span>
          <h4>{course.title}</h4><p>{earned ? 'All lessons completed. Your learning record is ready.' : 'Complete every lesson in this path to unlock your certificate.'}</p>
          {earned ? <span className="certificate-earned"><CircleCheck size={14} /> Certificate unlocked</span> : <a href="#academy" className="certificate-progress-link">Continue this path <ArrowRight size={13} /></a>}
        </article>
      })}</div>
      <div className="certificate-print-area" aria-hidden="true">{earnedCertificates.map(course => <article className="print-certificate" key={course.id}>
        <div className="print-certificate-frame"><span className="print-brand">KARMA’S WORLD · LEARN. EXPLORE. DEFEND.</span><Award size={38} /><span className="print-kicker">CERTIFICATE OF COMPLETION</span><h2>{course.title}</h2><p className="print-recipient">{displayName}</p><p>has completed all {course.lessons.length} lessons in this self-paced learning path.</p><span className="print-date">Learning record generated {new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date())}</span><span className="print-disclaimer">A personal learning record. This is not an accredited qualification or professional certification.</span></div>
      </article>)}</div>
      <div className="roadmap-heading"><div className="eyebrow"><span className="eyebrow-line" /> A CAREER IS A PATH, NOT A CHECKLIST</div><h3>Explore your next directions.</h3><p>There are many ways to contribute to security. Build shared fundamentals, then explore the work that interests you.</p></div>
      <div className="roadmap-grid">{roadmap.map((step, index) => <article className="roadmap-card" key={step.number}><div className="roadmap-top"><span>{step.number} / 04</span>{index < roadmap.length - 1 && <i />}</div><span className="roadmap-dot"><Compass size={17} /></span><h4>{step.title}</h4><p>{step.description}</p><span className="roadmap-skills">{step.skills}</span></article>)}</div>
      {percentage === 100 && <p className="path-complete-note"><CircleCheck size={16} /> All current learning-path lessons complete.</p>}
    </div>
  </section>
}
