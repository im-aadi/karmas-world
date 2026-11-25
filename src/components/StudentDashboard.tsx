import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Award,
  BookOpen,
  CircleCheck,
  Compass,
  Download,
  Flame,
  Printer,
  Sparkles,
  Trophy,
  Zap,
  History,
  Shield,
} from 'lucide-react'
import { courses } from '../data/courses'
import { learningProgressEvent, readLearningProgress, type LearningProgress } from '../data/progress'
import { LeaderboardPanel } from './LeaderboardPanel'
import {
  fetchGamificationStats,
  fetchAchievements,
  gamificationUpdatedEvent,
  type GamificationStats,
  type AchievementItem,
} from '../data/gamificationClient'
import { WeeklyChallengesCard } from './gamification/WeeklyChallengesCard'
import { AchievementsModal } from './gamification/AchievementsModal'

const roadmap = [
  { number: '01', title: 'Build your foundations', description: 'Learn security principles, safe account habits, and how to think about risk.', skills: 'SECURITY BASICS · NETWORKING · PRIVACY' },
  { number: '02', title: 'Choose a direction', description: 'Explore blue team defense, application security, security engineering, or governance.', skills: 'DEFENSE · APPSEC · ENGINEERING · GRC' },
  { number: '03', title: 'Practice and reflect', description: 'Use safe simulations, document what you learn, and build small projects you can explain.', skills: 'LAB NOTES · PROJECTS · COMMUNICATION' },
  { number: '04', title: 'Grow with the community', description: 'Contribute responsibly, keep learning, and look for mentors and entry-level opportunities.', skills: 'ETHICS · COLLABORATION · CONTINUOUS LEARNING' },
]

type Props = {
  displayName?: string
  signedIn?: boolean
  csrfToken?: string
  onSignIn?: () => void
  onExport?: () => Promise<void>
}

export function StudentDashboard({
  displayName = 'Karma’s World learner',
  signedIn = false,
  csrfToken,
  onSignIn,
  onExport,
}: Props) {
  const [progress, setProgress] = useState<LearningProgress>(readLearningProgress)
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState('')

  // Gamification state
  const [stats, setStats] = useState<GamificationStats | null>(null)
  const [achievements, setAchievements] = useState<AchievementItem[]>([])
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false)
  const [claimToast, setClaimToast] = useState<string | null>(null)

  useEffect(() => {
    const refreshProgress = () => setProgress(readLearningProgress())
    window.addEventListener(learningProgressEvent, refreshProgress)
    window.addEventListener('storage', refreshProgress)
    return () => {
      window.removeEventListener(learningProgressEvent, refreshProgress)
      window.removeEventListener('storage', refreshProgress)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    async function loadGamification() {
      const [s, a] = await Promise.all([fetchGamificationStats(), fetchAchievements()])
      if (mounted) {
        setStats(s)
        setAchievements(a)
      }
    }

    loadGamification()

    function handleUpdate() {
      loadGamification()
    }

    window.addEventListener(gamificationUpdatedEvent, handleUpdate)
    window.addEventListener(learningProgressEvent, handleUpdate)
    return () => {
      mounted = false
      window.removeEventListener(gamificationUpdatedEvent, handleUpdate)
      window.removeEventListener(learningProgressEvent, handleUpdate)
    }
  }, [])

  const totalLessons = courses.reduce((sum, course) => sum + course.lessons.length, 0)
  const completedLessons = courses.reduce((sum, course) => sum + (progress[course.id]?.length ?? 0), 0)
  const activePaths = courses.filter((course) => (progress[course.id]?.length ?? 0) > 0).length
  const percentage = Math.round((completedLessons / totalLessons) * 100)
  const earnedCertificates = courses.filter((course) => (progress[course.id] ?? []).length >= course.lessons.length)

  function printCertificates() {
    document.body.classList.add('printing-certificate')
    window.addEventListener('afterprint', () => document.body.classList.remove('printing-certificate'), { once: true })
    window.print()
  }

  async function exportData() {
    if (!onExport) return
    setExporting(true)
    setExportMessage('')
    try {
      await onExport()
      setExportMessage('Your data file has been downloaded.')
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : 'Could not export your data.')
    } finally {
      setExporting(false)
    }
  }

  const levelProgress = stats?.levelProgress
  const currentLevel = levelProgress?.level ?? Math.max(1, Math.floor(completedLessons / 2) + 1)
  const rankTitle = levelProgress?.rankTitle ?? 'Cadet'
  const totalXp = stats?.totalXp ?? completedLessons * 150
  const streakDays = stats?.streak.currentStreak ?? (completedLessons > 0 ? 1 : 0)
  const unlockedBadges = stats?.achievements.unlockedCount ?? (completedLessons > 0 ? 1 : 0)
  const totalBadges = stats?.achievements.totalCount ?? 10

  return (
    <section id="dashboard" className="dashboard-section">
      <div className="wrap">
        <div className="dashboard-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> YOUR LEARNING, AT A GLANCE
            </div>
            <h2>
              Small steps.
              <br />
              <span>Real momentum.</span>
            </h2>
          </div>
          <a className="dashboard-jump" href="#academy">
            Continue learning <ArrowRight size={15} />
          </a>
        </div>

        <div className="dashboard-grid">
          <div className="progress-summary">
            <div className="summary-top">
              <span className="summary-icon">
                <BookOpen size={17} />
              </span>
              <span>LOCAL LEARNING PROGRESS</span>
            </div>
            <div className="summary-count">
              {completedLessons}
              <span> / {totalLessons} lessons</span>
            </div>
            <div className="dashboard-progress-track">
              <span style={{ width: `${percentage}%` }} />
            </div>
            <div className="summary-footer">
              <span>{percentage}% complete</span>
              <span>
                {activePaths} {activePaths === 1 ? 'path started' : 'paths started'}
              </span>
            </div>
          </div>

          <div className="next-step-card">
            <span className="summary-icon green">
              <Sparkles size={17} />
            </span>
            <div>
              <h3>
                {completedLessons === 0
                  ? 'Start with the essentials'
                  : completedLessons === totalLessons
                  ? 'You finished every current lesson'
                  : 'Keep your momentum going'}
              </h3>
              <p>
                {completedLessons === 0
                  ? 'Cybersecurity foundations is a welcoming place to begin.'
                  : completedLessons === totalLessons
                  ? 'Your next step is to explore a safe practice simulation or career direction.'
                  : 'Your learning is saved in this browser. Pick up with the next idea when you’re ready.'}
              </p>
            </div>
            <a
              href={completedLessons === 0 ? '#academy' : '#games'}
              aria-label="Go to next learning activity"
            >
              <ArrowRight size={16} />
            </a>
          </div>
        </div>

        {/* Gamification Strip */}
        <div className="dashboard-gamification-strip">
          <div className="gamification-card">
            <span className="gamification-icon xp">
              <Zap size={16} />
            </span>
            <div>
              <span className="gamification-label">EXPERIENCE POINTS</span>
              <strong>{totalXp} XP</strong>
            </div>
          </div>

          <div className="gamification-card">
            <span className="gamification-icon level">
              <Trophy size={16} />
            </span>
            <div>
              <span className="gamification-label">CURRENT RANK</span>
              <strong>
                Level {currentLevel} {rankTitle}
              </strong>
            </div>
          </div>

          <div className="gamification-card">
            <span className="gamification-icon streak">
              <Flame size={16} />
            </span>
            <div>
              <span className="gamification-label">LEARNING STREAK</span>
              <strong>{streakDays} Day Streak</strong>
            </div>
          </div>

          <div
            className="gamification-card achievements-trigger-card"
            onClick={() => setIsAchievementsOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsAchievementsOpen(true)
            }}
          >
            <span className="gamification-icon badges">
              <Award size={16} />
            </span>
            <div>
              <span className="gamification-label">BADGES & TROPHIES</span>
              <strong className="achievements-link-text">
                {unlockedBadges} / {totalBadges} Unlocked <ArrowRight size={13} />
              </strong>
            </div>
          </div>
        </div>

        {/* Rank Progression Track */}
        {levelProgress && (
          <div className="rank-progression-card">
            <div className="rank-progression-header">
              <div className="rank-title-group">
                <span className="rank-badge-pill">
                  <Shield size={14} /> Rank {levelProgress.level}: {levelProgress.rankTitle}
                </span>
                {levelProgress.nextLevelXp ? (
                  <span className="rank-next-info">
                    {levelProgress.xpToNextLevel} XP needed for next rank
                  </span>
                ) : (
                  <span className="rank-max-info">Maximum Rank Reached</span>
                )}
              </div>
              <span className="rank-percent-text">{levelProgress.progressPercent}% of Tier</span>
            </div>
            <div className="rank-progress-bar">
              <div
                className="rank-progress-fill"
                style={{ width: `${levelProgress.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Weekly Challenges Card */}
        {stats?.weeklyChallenges && stats.weeklyChallenges.length > 0 && (
          <WeeklyChallengesCard
            challenges={stats.weeklyChallenges}
            csrfToken={csrfToken}
            onChallengeClaimed={(reward, msg) => {
              setClaimToast(`+${reward} XP: ${msg}`)
              setTimeout(() => setClaimToast(null), 4000)
            }}
          />
        )}

        {/* XP History Feed */}
        {stats?.recentTransactions && stats.recentTransactions.length > 0 && (
          <div className="recent-xp-activity-panel">
            <div className="xp-activity-header">
              <span className="activity-icon-wrap">
                <History size={14} />
              </span>
              <h4>Recent Technical XP Transactions</h4>
            </div>
            <div className="xp-transactions-list">
              {stats.recentTransactions.slice(0, 4).map((tx) => (
                <div key={tx.id} className="xp-transaction-row">
                  <span className="tx-source-tag">{tx.source.replace(/_/g, ' ')}</span>
                  <span className="tx-description">{tx.description}</span>
                  <span className="tx-amount">+{tx.amount} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {claimToast && (
          <div className="dashboard-claim-toast" role="status">
            <Sparkles size={16} />
            <span>{claimToast}</span>
          </div>
        )}

        <div className="data-export-card">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> YOUR DATA, YOUR COPY
            </div>
            <p>
              Download a JSON file with your learning progress and private reflections
              {signedIn ? ', plus account data stored on the server.' : ' saved in this browser.'}
            </p>
            {exportMessage && (
              <span className="data-export-message" role="status">
                {exportMessage}
              </span>
            )}
          </div>
          <button className="data-export-button" onClick={() => void exportData()} disabled={exporting}>
            {exporting ? 'Preparing…' : 'Download my data'} <Download size={14} />
          </button>
        </div>

        <LeaderboardPanel signedIn={signedIn} csrfToken={csrfToken} onSignIn={onSignIn} />

        <div className="certificate-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> YOUR LEARNING MILESTONES
            </div>
            <h3>Certificates of completion.</h3>
            <p>Finish every lesson in a path to unlock a printable record of what you studied.</p>
          </div>
          {earnedCertificates.length > 0 && (
            <button className="certificate-print-button" onClick={printCertificates}>
              <Printer size={15} /> Print earned certificates
            </button>
          )}
        </div>

        <div className="certificate-grid">
          {courses.map((course) => {
            const earned = earnedCertificates.some((item) => item.id === course.id)
            const count = Math.min(progress[course.id]?.length ?? 0, course.lessons.length)
            return (
              <article className={`certificate-card ${earned ? 'earned' : ''}`} key={course.id}>
                <span className="certificate-icon">
                  <Award size={19} />
                </span>
                <span className="path-number">
                  {earned ? 'COMPLETED' : `${count} / ${course.lessons.length} LESSONS`}
                </span>
                <h4>{course.title}</h4>
                <p>
                  {earned
                    ? 'All lessons completed. Your learning record is ready.'
                    : 'Complete every lesson in this path to unlock your certificate.'}
                </p>
                {earned ? (
                  <span className="certificate-earned">
                    <CircleCheck size={14} /> Certificate unlocked
                  </span>
                ) : (
                  <a href="#academy" className="certificate-progress-link">
                    Continue this path <ArrowRight size={13} />
                  </a>
                )}
              </article>
            )
          })}
        </div>

        <div className="certificate-print-area" aria-hidden="true">
          {earnedCertificates.map((course) => (
            <article className="print-certificate" key={course.id}>
              <div className="print-certificate-frame">
                <span className="print-brand">KARMA’S WORLD · LEARN. EXPLORE. DEFEND.</span>
                <Award size={38} />
                <span className="print-kicker">CERTIFICATE OF COMPLETION</span>
                <h2>{course.title}</h2>
                <p className="print-recipient">{displayName}</p>
                <p>has completed all {course.lessons.length} lessons in this self-paced learning path.</p>
                <span className="print-date">
                  Learning record generated{' '}
                  {new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date())}
                </span>
                <span className="print-disclaimer">
                  A personal learning record. This is not an accredited qualification or professional certification.
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="roadmap-heading">
          <div className="eyebrow">
            <span className="eyebrow-line" /> A CAREER IS A PATH, NOT A CHECKLIST
          </div>
          <h3>Explore your next directions.</h3>
          <p>
            There are many ways to contribute to security. Build shared fundamentals, then explore the work that
            interests you.
          </p>
        </div>

        <div className="roadmap-grid">
          {roadmap.map((step, index) => (
            <article className="roadmap-card" key={step.number}>
              <div className="roadmap-top">
                <span>{step.number} / 04</span>
                {index < roadmap.length - 1 && <i />}
              </div>
              <span className="roadmap-dot">
                <Compass size={17} />
              </span>
              <h4>{step.title}</h4>
              <p>{step.description}</p>
              <span className="roadmap-skills">{step.skills}</span>
            </article>
          ))}
        </div>

        {percentage === 100 && (
          <p className="path-complete-note">
            <CircleCheck size={16} /> All current learning-path lessons complete.
          </p>
        )}
      </div>

      {/* Achievements Modal */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        achievements={achievements}
      />
    </section>
  )
}
