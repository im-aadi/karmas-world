import {
  type UserLevelProgress,
  type WeeklyChallenge,
  type XPTransactionItem,
  calculateUserLevel,
} from '../../packages/shared/src/index'
import { readLearningProgress } from './progress'
import { courses } from './courses'

export interface AchievementItem {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  xpValue: number
  unlocked: boolean
  unlockedAt: string | null
}

export interface WeeklyChallengeProgress {
  id: string
  slug: string
  title: string
  description: string
  category: string
  targetCount: number
  type: string
  xpReward: number
  badgeIcon: string
  startsAt: string
  expiresAt: string
  currentCount: number
  isCompleted: boolean
  isClaimed: boolean
}

export interface GamificationStats {
  totalXp: number
  levelProgress: UserLevelProgress
  streak: {
    currentStreak: number
    longestStreak: number
    lastActiveDate: string | null
    isActiveToday: boolean
  }
  achievements: {
    unlockedCount: number
    totalCount: number
  }
  weeklyChallenges: WeeklyChallengeProgress[]
  recentTransactions: XPTransactionItem[]
}

export interface ClaimChallengeResult {
  success: boolean
  message: string
  xpAwarded: number
  newTotalXp: number
  levelProgress: UserLevelProgress
}

export const gamificationUpdatedEvent = 'kw_gamification_updated'

export function dispatchGamificationUpdate() {
  window.dispatchEvent(new Event(gamificationUpdatedEvent))
}

const LOCAL_CLAIMS_KEY = 'kw_local_weekly_claims_v1'
const LOCAL_EXTRA_XP_KEY = 'kw_local_extra_xp_v1'

const DEFAULT_ACHIEVEMENTS: Omit<AchievementItem, 'unlocked' | 'unlockedAt'>[] = [
  { id: 'ach-first-step', slug: 'first-step', title: 'First Contact', description: 'Complete your first cybersecurity lesson', icon: 'BookOpen', xpValue: 50 },
  { id: 'ach-first-flag', slug: 'first-flag', title: 'First Blood', description: 'Capture your first lab security flag', icon: 'Flag', xpValue: 100 },
  { id: 'ach-streak-3', slug: 'streak-3', title: 'Daily Defender', description: 'Maintain a 3-day cybersecurity learning streak', icon: 'Flame', xpValue: 150 },
  { id: 'ach-terminal-ninja', slug: 'terminal-ninja', title: 'Terminal Ninja', description: 'Execute commands across multiple terminal labs', icon: 'Terminal', xpValue: 150 },
  { id: 'ach-flag-hunter', slug: 'flag-hunter', title: 'Flag Hunter', description: 'Capture 5 or more laboratory challenge flags', icon: 'Crosshair', xpValue: 200 },
  { id: 'ach-crypto-master', slug: 'crypto-master', title: 'Cipher Breaker', description: 'Decipher protected hashes and cryptographic challenges', icon: 'KeyRound', xpValue: 200 },
  { id: 'ach-sentinel-rank', slug: 'sentinel-rank', title: 'Cyber Sentinel', description: 'Attain Level 4 Sentinel rank in the global cybersecurity hierarchy', icon: 'Zap', xpValue: 300 },
  { id: 'ach-bug-bounty-hunter', slug: 'bug-bounty-hunter', title: 'Vulnerability Hunter', description: 'Complete web application vulnerability and SQL injection sandboxes', icon: 'Bug', xpValue: 250 },
  { id: 'ach-soc-analyst', slug: 'soc-analyst', title: 'SOC Guardian', description: 'Investigate incident forensic logs and detect attack artifacts', icon: 'ShieldAlert', xpValue: 250 },
  { id: 'ach-curriculum-complete', slug: 'curriculum-complete', title: 'Cyber Mastermind', description: 'Complete 10 or more cybersecurity learning paths', icon: 'Crown', xpValue: 500 },
]

const DEFAULT_WEEKLY_CHALLENGES: Omit<WeeklyChallengeProgress, 'currentCount' | 'isCompleted' | 'isClaimed'>[] = [
  {
    id: 'wc-weekly-recon-master',
    slug: 'weekly-recon-master',
    title: 'OSINT & Recon Mastery',
    description: 'Solve 2 flags across reconnaissance and scanning laboratory environments.',
    category: 'OSINT',
    targetCount: 2,
    type: 'SOLVE_FLAGS',
    xpReward: 250,
    badgeIcon: 'Search',
    startsAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
  },
  {
    id: 'wc-weekly-packet-hunter',
    slug: 'weekly-packet-hunter',
    title: 'Packet Analysis Specialist',
    description: 'Complete 1 deep packet inspection or network forensics lab.',
    category: 'Networking',
    targetCount: 1,
    type: 'COMPLETE_LABS',
    xpReward: 300,
    badgeIcon: 'Activity',
    startsAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
  },
  {
    id: 'wc-weekly-consistent-defender',
    slug: 'weekly-consistent-defender',
    title: 'Persistent Defense',
    description: 'Maintain an active learning streak for at least 3 consecutive days.',
    category: 'General',
    targetCount: 3,
    type: 'STREAK_DAYS',
    xpReward: 350,
    badgeIcon: 'Flame',
    startsAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
  },
  {
    id: 'wc-weekly-knowledge-voyager',
    slug: 'weekly-knowledge-voyager',
    title: 'Knowledge Voyager',
    description: 'Complete 3 lessons across any cybersecurity curriculum path.',
    category: 'Curriculum',
    targetCount: 3,
    type: 'COMPLETE_LESSONS',
    xpReward: 200,
    badgeIcon: 'BookOpen',
    startsAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
  },
]

function getLocalClaims(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_CLAIMS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalClaims(claims: string[]) {
  try {
    localStorage.setItem(LOCAL_CLAIMS_KEY, JSON.stringify(claims))
  } catch {
    // ignore
  }
}

function getLocalExtraXp(): number {
  try {
    const raw = localStorage.getItem(LOCAL_EXTRA_XP_KEY)
    return raw ? parseInt(raw, 10) || 0 : 0
  } catch {
    return 0
  }
}

function addLocalExtraXp(amount: number) {
  try {
    const current = getLocalExtraXp()
    localStorage.setItem(LOCAL_EXTRA_XP_KEY, (current + amount).toString())
  } catch {
    // ignore
  }
}

function getLocalLabStats(): { completedLabsCount: number; completedFlagsCount: number; labXp: number } {
  try {
    const raw = localStorage.getItem('kw_local_lab_attempts_v1')
    if (!raw) return { completedLabsCount: 0, completedFlagsCount: 0, labXp: 0 }
    const data = JSON.parse(raw) as Record<string, { status: string; completedTasks: string[]; xpAwarded: number }>
    let completedLabsCount = 0
    let completedFlagsCount = 0
    let labXp = 0

    for (const val of Object.values(data)) {
      if (val.status === 'COMPLETED') completedLabsCount++
      if (Array.isArray(val.completedTasks)) completedFlagsCount += val.completedTasks.length
      if (val.xpAwarded) labXp += val.xpAwarded
    }

    return { completedLabsCount, completedFlagsCount, labXp }
  } catch {
    return { completedLabsCount: 0, completedFlagsCount: 0, labXp: 0 }
  }
}

export async function fetchGamificationStats(): Promise<GamificationStats> {
  try {
    const res = await fetch('/api/gamification/stats')
    if (res.ok) {
      const data = await res.json()
      // format weekly challenges structure
      const formattedWeekly: WeeklyChallengeProgress[] = data.weeklyChallenges.map(
        (item: { challenge: WeeklyChallenge; currentCount: number; isCompleted: boolean; isClaimed: boolean }) => ({
          ...item.challenge,
          currentCount: item.currentCount,
          isCompleted: item.isCompleted,
          isClaimed: item.isClaimed,
        })
      )
      return {
        totalXp: data.totalXp,
        levelProgress: data.levelProgress,
        streak: data.streak,
        achievements: data.achievements,
        weeklyChallenges: formattedWeekly,
        recentTransactions: data.recentTransactions ?? [],
      }
    }
  } catch {
    // Network error or offline - fallback to local computation
  }

  // Fallback computation
  const progress = readLearningProgress()
  const completedLessons = courses.reduce((sum, c) => sum + (progress[c.id]?.length ?? 0), 0)
  const { completedLabsCount, completedFlagsCount, labXp } = getLocalLabStats()
  const extraXp = getLocalExtraXp()

  const lessonXp = completedLessons * 100
  const totalXp = lessonXp + labXp + extraXp
  const levelProgress = calculateUserLevel(totalXp)

  const claims = getLocalClaims()
  const currentStreak = completedLessons > 0 || completedFlagsCount > 0 ? 1 : 0

  const weeklyChallenges: WeeklyChallengeProgress[] = DEFAULT_WEEKLY_CHALLENGES.map((ch) => {
    let currentCount = 0
    if (ch.type === 'COMPLETE_LESSONS') currentCount = completedLessons
    else if (ch.type === 'COMPLETE_LABS') currentCount = completedLabsCount
    else if (ch.type === 'SOLVE_FLAGS') currentCount = completedFlagsCount
    else if (ch.type === 'STREAK_DAYS') currentCount = currentStreak

    const isClaimed = claims.includes(ch.slug)
    const isCompleted = currentCount >= ch.targetCount

    return {
      ...ch,
      currentCount: Math.min(currentCount, ch.targetCount),
      isCompleted,
      isClaimed,
    }
  })

  // Calculate local achievements
  let unlockedAchievementsCount = 0
  if (completedLessons >= 1) unlockedAchievementsCount++
  if (completedFlagsCount >= 1) unlockedAchievementsCount++
  if (completedFlagsCount >= 5) unlockedAchievementsCount++
  if (completedLabsCount >= 1) unlockedAchievementsCount++
  if (levelProgress.level >= 4) unlockedAchievementsCount++

  return {
    totalXp,
    levelProgress,
    streak: {
      currentStreak,
      longestStreak: Math.max(currentStreak, 1),
      lastActiveDate: new Date().toISOString(),
      isActiveToday: true,
    },
    achievements: {
      unlockedCount: unlockedAchievementsCount,
      totalCount: DEFAULT_ACHIEVEMENTS.length,
    },
    weeklyChallenges,
    recentTransactions: [
      {
        id: 'tx-fallback-lessons',
        amount: lessonXp,
        source: 'LESSONS_PROGRESS',
        description: `Completed ${completedLessons} cybersecurity curriculum lessons`,
        createdAt: new Date().toISOString(),
      },
      ...(labXp > 0
        ? [
            {
              id: 'tx-fallback-labs',
              amount: labXp,
              source: 'LAB_ACTIVITIES',
              description: `Solved ${completedFlagsCount} laboratory sandbox challenges`,
              createdAt: new Date().toISOString(),
            },
          ]
        : []),
    ],
  }
}

export async function fetchAchievements(): Promise<AchievementItem[]> {
  try {
    const res = await fetch('/api/gamification/achievements')
    if (res.ok) {
      const data = await res.json()
      return data.achievements
    }
  } catch {
    // Fallback to local
  }

  const progress = readLearningProgress()
  const completedLessons = courses.reduce((sum, c) => sum + (progress[c.id]?.length ?? 0), 0)
  const { completedLabsCount, completedFlagsCount } = getLocalLabStats()
  const totalXp = completedLessons * 100 + getLocalExtraXp()
  const levelProgress = calculateUserLevel(totalXp)

  return DEFAULT_ACHIEVEMENTS.map((ach) => {
    let unlocked = false
    if (ach.slug === 'first-step' && completedLessons >= 1) unlocked = true
    if (ach.slug === 'first-flag' && completedFlagsCount >= 1) unlocked = true
    if (ach.slug === 'flag-hunter' && completedFlagsCount >= 5) unlocked = true
    if (ach.slug === 'terminal-ninja' && completedLabsCount >= 2) unlocked = true
    if (ach.slug === 'sentinel-rank' && levelProgress.level >= 4) unlocked = true
    if (ach.slug === 'bug-bounty-hunter' && completedLabsCount >= 1) unlocked = true

    return {
      ...ach,
      unlocked,
      unlockedAt: unlocked ? new Date().toISOString() : null,
    }
  })
}

export async function claimWeeklyChallenge(slug: string, csrfToken?: string): Promise<ClaimChallengeResult> {
  try {
    const url =
      typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('null')
        ? `${window.location.origin}/api/gamification/claim-challenge/${slug}`
        : `/api/gamification/claim-challenge/${slug}`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
    })

    if (res.ok) {
      const data = await res.json()
      dispatchGamificationUpdate()
      return data
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to claim challenge.' }))
      throw new Error(err.error || 'Failed to claim challenge reward.')
    }
  } catch (err: unknown) {
    // If not a network/URL failure, propagate the business error
    if (
      err instanceof Error &&
      !err.message.includes('fetch') &&
      !err.message.includes('URL') &&
      !err.message.includes('Failed to parse')
    ) {
      throw err
    }
  }

  // Offline / local fallback claiming
  const challenge =
    DEFAULT_WEEKLY_CHALLENGES.find((c) => c.slug === slug) ?? {
      id: `wc-${slug}`,
      slug,
      title: slug.replace(/-/g, ' '),
      xpReward: 250,
    }

  const claims = getLocalClaims()
  if (claims.includes(slug)) {
    throw new Error('Reward for this challenge has already been claimed.')
  }

  claims.push(slug)
  saveLocalClaims(claims)
  addLocalExtraXp(challenge.xpReward)

  const stats = await fetchGamificationStats()
  dispatchGamificationUpdate()

  return {
    success: true,
    message: `Claimed +${challenge.xpReward} XP for completing "${challenge.title}"!`,
    xpAwarded: challenge.xpReward,
    newTotalXp: stats.totalXp,
    levelProgress: stats.levelProgress,
  }
}
