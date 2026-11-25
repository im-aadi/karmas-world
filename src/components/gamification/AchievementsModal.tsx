import { useEffect, useState } from 'react'
import {
  Award,
  BookOpen,
  Bug,
  CheckCircle2,
  Crosshair,
  Crown,
  Flag,
  Flame,
  KeyRound,
  Lock,
  ShieldAlert,
  Terminal,
  X,
  Zap,
} from 'lucide-react'
import type { AchievementItem } from '../../data/gamificationClient'

interface Props {
  isOpen: boolean
  onClose: () => void
  achievements: AchievementItem[]
}

function getAchievementIcon(icon: string) {
  switch (icon) {
    case 'BookOpen':
      return <BookOpen size={22} />
    case 'Flag':
      return <Flag size={22} />
    case 'Flame':
      return <Flame size={22} />
    case 'Terminal':
      return <Terminal size={22} />
    case 'Crosshair':
      return <Crosshair size={22} />
    case 'KeyRound':
      return <KeyRound size={22} />
    case 'Zap':
      return <Zap size={22} />
    case 'Bug':
      return <Bug size={22} />
    case 'ShieldAlert':
      return <ShieldAlert size={22} />
    case 'Crown':
      return <Crown size={22} />
    default:
      return <Award size={22} />
  }
}

export function AchievementsModal({ isOpen, onClose, achievements }: Props) {
  const [filter, setFilter] = useState<'ALL' | 'UNLOCKED' | 'LOCKED'>('ALL')

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalCount = achievements.length
  const unlockPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

  const filtered = achievements.filter((ach) => {
    if (filter === 'UNLOCKED') return ach.unlocked
    if (filter === 'LOCKED') return !ach.unlocked
    return true
  })

  return (
    <div className="achievements-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="achievements-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievements-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="achievements-modal-header">
          <div className="modal-title-wrap">
            <span className="section-cyber-tag">
              <Award size={12} /> REPUTATION & HONORS
            </span>
            <h3 id="achievements-modal-title">Cybersecurity Badges & Achievements</h3>
            <p className="modal-subtitle">
              Verify your technical competencies and milestone accomplishments across offensive and defensive domains.
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close achievements dialog">
            <X size={18} />
          </button>
        </div>

        <div className="achievements-stats-banner">
          <div className="stats-metric">
            <span className="metric-label">TOTAL UNLOCKED</span>
            <strong className="metric-val">
              {unlockedCount} / {totalCount}
            </strong>
          </div>
          <div className="stats-progress-wrap">
            <div className="stats-progress-bar">
              <div className="stats-progress-fill" style={{ width: `${unlockPercent}%` }} />
            </div>
            <span className="stats-percent-text">{unlockPercent}% Mastery</span>
          </div>
          <div className="stats-filter-pills">
            <button
              className={`filter-pill ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              All ({totalCount})
            </button>
            <button
              className={`filter-pill ${filter === 'UNLOCKED' ? 'active' : ''}`}
              onClick={() => setFilter('UNLOCKED')}
            >
              Unlocked ({unlockedCount})
            </button>
            <button
              className={`filter-pill ${filter === 'LOCKED' ? 'active' : ''}`}
              onClick={() => setFilter('LOCKED')}
            >
              Locked ({totalCount - unlockedCount})
            </button>
          </div>
        </div>

        <div className="achievements-grid-content">
          {filtered.map((ach) => (
            <div
              key={ach.id}
              className={`achievement-card-item ${ach.unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="badge-icon-container">
                {ach.unlocked ? (
                  <div className="badge-glow">{getAchievementIcon(ach.icon)}</div>
                ) : (
                  <div className="badge-locked-wrap">
                    <Lock size={18} className="lock-sub-icon" />
                    {getAchievementIcon(ach.icon)}
                  </div>
                )}
              </div>

              <div className="badge-card-info">
                <div className="badge-title-row">
                  <h4 className="badge-name">{ach.title}</h4>
                  <span className="badge-xp-pill">+{ach.xpValue} XP</span>
                </div>
                <p className="badge-desc">{ach.description}</p>
                <div className="badge-footer-status">
                  {ach.unlocked ? (
                    <span className="badge-unlocked-status">
                      <CheckCircle2 size={13} /> Unlocked
                      {ach.unlockedAt ? ` on ${new Date(ach.unlockedAt).toLocaleDateString()}` : ''}
                    </span>
                  ) : (
                    <span className="badge-locked-status">
                      <Lock size={12} /> Locked Objective
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="achievements-modal-footer">
          <p className="modal-footer-hint">
            Earn more badges by completing laboratory flags, progressing through curriculum lessons, and maintaining your daily defense streak.
          </p>
          <button className="modal-dismiss-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
