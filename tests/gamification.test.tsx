import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { WeeklyChallengesCard } from '../src/components/gamification/WeeklyChallengesCard'
import { AchievementsModal } from '../src/components/gamification/AchievementsModal'
import { StudentDashboard } from '../src/components/StudentDashboard'
import type { WeeklyChallengeProgress, AchievementItem } from '../src/data/gamificationClient'

const mockChallenges: WeeklyChallengeProgress[] = [
  {
    id: 'ch-1',
    slug: 'recon-weekly',
    title: 'OSINT & Recon Mastery',
    description: 'Solve 2 flags in reconnaissance labs.',
    category: 'OSINT',
    targetCount: 2,
    type: 'SOLVE_FLAGS',
    xpReward: 250,
    badgeIcon: 'Search',
    startsAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    currentCount: 2,
    isCompleted: true,
    isClaimed: false,
  },
  {
    id: 'ch-2',
    slug: 'streak-weekly',
    title: 'Persistent Defense',
    description: 'Maintain 3 day streak.',
    category: 'General',
    targetCount: 3,
    type: 'STREAK_DAYS',
    xpReward: 350,
    badgeIcon: 'Flame',
    startsAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    currentCount: 1,
    isCompleted: false,
    isClaimed: false,
  },
]

const mockAchievements: AchievementItem[] = [
  {
    id: 'ach-1',
    slug: 'first-step',
    title: 'First Contact',
    description: 'Complete your first cybersecurity lesson',
    icon: 'BookOpen',
    xpValue: 50,
    unlocked: true,
    unlockedAt: '2026-11-20T10:00:00.000Z',
  },
  {
    id: 'ach-2',
    slug: 'crypto-master',
    title: 'Cipher Breaker',
    description: 'Decipher protected hashes and cryptographic challenges',
    icon: 'KeyRound',
    xpValue: 200,
    unlocked: false,
    unlockedAt: null,
  },
]

describe('Phase 6: Frontend Gamification Components', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it('WeeklyChallengesCard renders active challenges with rewards and progress', () => {
    render(<WeeklyChallengesCard challenges={mockChallenges} />)

    expect(screen.getByText('Cyber Operative Challenges')).toBeInTheDocument()
    expect(screen.getByText('OSINT & Recon Mastery')).toBeInTheDocument()
    expect(screen.getByText('+250 XP')).toBeInTheDocument()
    expect(screen.getByText('Persistent Defense')).toBeInTheDocument()
    expect(screen.getByText('+350 XP')).toBeInTheDocument()

    // Completed challenge has claim button
    expect(screen.getByRole('button', { name: /Claim \+250 XP/i })).toBeInTheDocument()

    // In-progress challenge shows in-progress label
    expect(screen.getByText('In Progress (1/3)')).toBeInTheDocument()
  })

  it('WeeklyChallengesCard handles claiming completed challenge and triggers callback', async () => {
    const onClaim = vi.fn()
    render(
      <WeeklyChallengesCard
        challenges={mockChallenges}
        csrfToken="test-token"
        onChallengeClaimed={onClaim}
      />
    )

    const claimBtn = screen.getByRole('button', { name: /Claim \+250 XP/i })
    fireEvent.click(claimBtn)

    await waitFor(() => {
      expect(onClaim).toHaveBeenCalledWith(250, expect.any(String))
    })
  })

  it('AchievementsModal displays badges, statistics, and handles filters', () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <AchievementsModal isOpen={false} onClose={onClose} achievements={mockAchievements} />
    )

    // Hidden when closed
    expect(screen.queryByText('Cybersecurity Badges & Achievements')).not.toBeInTheDocument()

    // Shown when open
    rerender(<AchievementsModal isOpen={true} onClose={onClose} achievements={mockAchievements} />)
    expect(screen.getByText('Cybersecurity Badges & Achievements')).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument() // 1 unlocked of 2 total
    expect(screen.getByText('50% Mastery')).toBeInTheDocument()

    // Shows both unlocked and locked badges in All tab
    expect(screen.getByText('First Contact')).toBeInTheDocument()
    expect(screen.getByText('Cipher Breaker')).toBeInTheDocument()
    expect(screen.getByText(/Unlocked on /i)).toBeInTheDocument()
    expect(screen.getByText('Locked Objective')).toBeInTheDocument()

    // Filter by Unlocked
    fireEvent.click(screen.getByRole('button', { name: /^Unlocked \(1\)$/ }))
    expect(screen.getByText('First Contact')).toBeInTheDocument()
    expect(screen.queryByText('Cipher Breaker')).not.toBeInTheDocument()

    // Filter by Locked
    fireEvent.click(screen.getByRole('button', { name: /^Locked \(1\)$/ }))
    expect(screen.queryByText('First Contact')).not.toBeInTheDocument()
    expect(screen.getByText('Cipher Breaker')).toBeInTheDocument()

    // Close button
    fireEvent.click(screen.getByRole('button', { name: /Close achievements dialog/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('StudentDashboard integrates rank progress bar, streaks, and opens achievements modal', async () => {
    render(<StudentDashboard />)

    // Check gamification cards
    expect(screen.getByText('EXPERIENCE POINTS')).toBeInTheDocument()
    expect(screen.getByText('CURRENT RANK')).toBeInTheDocument()
    expect(screen.getByText('LEARNING STREAK')).toBeInTheDocument()
    expect(screen.getByText('BADGES & TROPHIES')).toBeInTheDocument()

    // Open achievements modal from dashboard card
    const badgesCard = screen.getByText('BADGES & TROPHIES').closest('.gamification-card')!
    fireEvent.click(badgesCard)

    await waitFor(() => {
      expect(screen.getByText('Cybersecurity Badges & Achievements')).toBeInTheDocument()
    })

    // Close modal
    fireEvent.click(screen.getByRole('button', { name: /Close achievements dialog/i }))
    await waitFor(() => {
      expect(screen.queryByText('Cybersecurity Badges & Achievements')).not.toBeInTheDocument()
    })
  })
})
