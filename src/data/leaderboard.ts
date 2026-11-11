export type LeaderboardEntry = { rank: number; displayName: string; lessonsCompleted: number; isYou: boolean }
export type LeaderboardData = { entries: LeaderboardEntry[]; optedIn: boolean }

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(body.error ?? 'The leaderboard is unavailable.')
  return body as T
}

export async function getLeaderboard() {
  return parseResponse<LeaderboardData>(await fetch('/api/leaderboard', { credentials: 'include', headers: { Accept: 'application/json' } }))
}

export async function updateLeaderboardParticipation(optedIn: boolean, csrfToken: string) {
  return parseResponse<{ optedIn: boolean }>(await fetch('/api/leaderboard/participation', {
    method: 'PATCH', credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ optedIn }),
  }))
}
