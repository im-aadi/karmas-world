export interface RankInfo {
  level: number
  title: string
  minXp: number
  badge: string
  description: string
}

export const CYBER_RANKS: RankInfo[] = [
  { level: 1, title: 'Cadet', minXp: 0, badge: 'Shield', description: 'Starting cybersecurity fundamentals and exploration.' },
  { level: 2, title: 'Scout', minXp: 500, badge: 'Compass', description: 'Acquiring hands-on CLI, networking, and security concepts.' },
  { level: 3, title: 'Defender', minXp: 1200, badge: 'ShieldCheck', description: 'Defending systems, analyzing traffic, and identifying vulnerabilities.' },
  { level: 4, title: 'Sentinel', minXp: 2200, badge: 'Zap', description: 'Mastering authentication, encryption, and proactive threat detection.' },
  { level: 5, title: 'Guardian', minXp: 3500, badge: 'Flame', description: 'Conducting in-depth incident investigations and secure code reviews.' },
  { level: 6, title: 'Specialist', minXp: 5200, badge: 'Trophy', description: 'Advanced offensive and defensive security operations.' },
  { level: 7, title: 'Architect', minXp: 7300, badge: 'Cpu', description: 'Enterprise threat modeling and resilient system design.' },
  { level: 8, title: 'Master', minXp: 10000, badge: 'Crown', description: 'Complete cybersecurity mastery across technical domains.' },
]

export interface UserLevelProgress {
  level: number
  rankTitle: string
  badge: string
  currentXp: number
  minXpForCurrentLevel: number
  nextLevelXp: number | null
  progressPercent: number
  xpToNextLevel: number
}

export function calculateUserLevel(totalXp: number): UserLevelProgress {
  const xp = Math.max(0, totalXp)
  const defaultRank: RankInfo = {
    level: 1,
    title: 'Cadet',
    minXp: 0,
    badge: 'Shield',
    description: 'Starting cybersecurity fundamentals and exploration.',
  }
  let currentRank: RankInfo = CYBER_RANKS[0] ?? defaultRank

  for (let i = CYBER_RANKS.length - 1; i >= 0; i--) {
    const r = CYBER_RANKS[i]
    if (r && xp >= r.minXp) {
      currentRank = r
      break
    }
  }

  const nextRank = CYBER_RANKS.find((r) => r.level === currentRank.level + 1)

  if (!nextRank) {
    return {
      level: currentRank.level,
      rankTitle: currentRank.title,
      badge: currentRank.badge,
      currentXp: xp,
      minXpForCurrentLevel: currentRank.minXp,
      nextLevelXp: null,
      progressPercent: 100,
      xpToNextLevel: 0,
    }
  }

  const levelSpan = nextRank.minXp - currentRank.minXp
  const progressInLevel = xp - currentRank.minXp
  const progressPercent = Math.min(100, Math.max(0, Math.round((progressInLevel / levelSpan) * 100)))
  const xpToNextLevel = Math.max(0, nextRank.minXp - xp)

  return {
    level: currentRank.level,
    rankTitle: currentRank.title,
    badge: currentRank.badge,
    currentXp: xp,
    minXpForCurrentLevel: currentRank.minXp,
    nextLevelXp: nextRank.minXp,
    progressPercent,
    xpToNextLevel,
  }
}
