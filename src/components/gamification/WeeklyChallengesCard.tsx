import { useState } from 'react'
import {
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Flame,
  Search,
  BookOpen,
  Activity,
  AlertCircle,
} from 'lucide-react'
import {
  type WeeklyChallengeProgress,
  claimWeeklyChallenge,
} from '../../data/gamificationClient'

interface Props {
  challenges: WeeklyChallengeProgress[]
  csrfToken?: string
  onChallengeClaimed?: (rewardXp: number, message: string) => void
}

function getChallengeIcon(badgeIcon: string) {
  switch (badgeIcon) {
    case 'Search':
      return <Search size={16} />
    case 'Activity':
      return <Activity size={16} />
    case 'Flame':
      return <Flame size={16} />
    case 'BookOpen':
      return <BookOpen size={16} />
    default:
      return <Award size={16} />
  }
}

export function WeeklyChallengesCard({ challenges, csrfToken, onChallengeClaimed }: Props) {
  const [claimingSlug, setClaimingSlug] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  async function handleClaim(slug: string) {
    setErrorMessage(null)
    setClaimingSlug(slug)
    try {
      const res = await claimWeeklyChallenge(slug, csrfToken)
      setSuccessToast(res.message)
      onChallengeClaimed?.(res.xpAwarded, res.message)
      setTimeout(() => setSuccessToast(null), 5000)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to claim challenge.')
    } finally {
      setClaimingSlug(null)
    }
  }

  if (!challenges || challenges.length === 0) {
    return null
  }

  return (
    <div className="weekly-challenges-wrapper">
      <div className="weekly-challenges-header">
        <div className="header-title-wrap">
          <span className="section-cyber-tag">
            <Sparkles size={12} /> ACTIVE WEEKLY MISSIONS
          </span>
          <h3>Cyber Operative Challenges</h3>
          <p>
            Complete real-world objectives each week to accelerate your rank advancement and earn exclusive XP rewards.
          </p>
        </div>
        <div className="challenges-timer-pill">
          <Clock size={14} /> Resets every Monday 00:00 UTC
        </div>
      </div>

      {successToast && (
        <div className="challenge-claim-toast" role="status">
          <Sparkles size={16} className="toast-sparkle" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMessage && (
        <div className="challenge-error-toast" role="alert">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="weekly-challenges-grid">
        {challenges.map((challenge) => {
          const percent = Math.min(100, Math.round((challenge.currentCount / challenge.targetCount) * 100))
          const isReadyToClaim = challenge.isCompleted && !challenge.isClaimed
          const isClaiming = claimingSlug === challenge.slug

          return (
            <article
              key={challenge.id}
              className={`weekly-challenge-card ${challenge.isClaimed ? 'claimed' : isReadyToClaim ? 'ready' : ''}`}
            >
              <div className="challenge-card-top">
                <div className="challenge-meta">
                  <span className={`challenge-badge-icon ${challenge.isCompleted ? 'completed' : ''}`}>
                    {getChallengeIcon(challenge.badgeIcon)}
                  </span>
                  <span className="challenge-category-tag">{challenge.category}</span>
                </div>
                <div className="challenge-xp-badge">
                  <Zap size={13} />
                  <span>+{challenge.xpReward} XP</span>
                </div>
              </div>

              <div className="challenge-card-body">
                <h4 className="challenge-title">{challenge.title}</h4>
                <p className="challenge-desc">{challenge.description}</p>
              </div>

              <div className="challenge-progress-section">
                <div className="challenge-progress-labels">
                  <span>
                    Objective: {challenge.currentCount} / {challenge.targetCount}
                  </span>
                  <span className="progress-percent-label">{percent}%</span>
                </div>
                <div className="challenge-progress-bar">
                  <div
                    className={`challenge-progress-fill ${challenge.isCompleted ? 'complete' : ''}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              <div className="challenge-card-action">
                {challenge.isClaimed ? (
                  <span className="challenge-claimed-label">
                    <CheckCircle2 size={15} /> Claimed (+{challenge.xpReward} XP)
                  </span>
                ) : isReadyToClaim ? (
                  <button
                    className="challenge-claim-btn"
                    onClick={() => handleClaim(challenge.slug)}
                    disabled={isClaiming}
                  >
                    <Sparkles size={14} />
                    {isClaiming ? 'Claiming Reward…' : `Claim +${challenge.xpReward} XP`}
                  </button>
                ) : (
                  <span className="challenge-in-progress-label">
                    In Progress ({challenge.currentCount}/{challenge.targetCount})
                  </span>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
