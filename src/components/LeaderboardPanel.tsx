import { useEffect, useState } from 'react'
import { ArrowUp, Medal, ShieldCheck } from 'lucide-react'
import { getLeaderboard, updateLeaderboardParticipation, type LeaderboardData } from '../data/leaderboard'

type Props = { signedIn: boolean; csrfToken?: string; onSignIn?: () => void }

export function LeaderboardPanel({ signedIn, csrfToken = '', onSignIn }: Props) {
  const [board, setBoard] = useState<LeaderboardData>({ entries: [], optedIn: false })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function refresh() {
    try {
      setBoard(await getLeaderboard())
      setMessage('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The leaderboard is unavailable.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void refresh() }, [signedIn])

  async function toggleParticipation() {
    setSaving(true)
    try {
      const result = await updateLeaderboardParticipation(!board.optedIn, csrfToken)
      setBoard(current => ({ ...current, optedIn: result.optedIn }))
      await refresh()
      setMessage(result.optedIn ? 'You’re on the board. Your display name and lesson count are visible to everyone.' : 'You’ve left the leaderboard.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update your leaderboard setting.')
    } finally { setSaving(false) }
  }

  return <section className="leaderboard-panel" aria-labelledby="leaderboard-title">
    <div className="leaderboard-header"><div><div className="eyebrow"><span className="eyebrow-line" /> OPT-IN LEARNING BOARD</div><h3 id="leaderboard-title">Celebrate the progress.</h3><p>Ranked by completed lessons. Only learners who opt in are listed.</p></div><span className="leaderboard-icon"><Medal size={21} /></span></div>
    {signedIn ? <div className="leaderboard-choice"><p><ShieldCheck size={14} /> Joining shares your account display name and completed lesson count publicly. You can leave at any time.</p><button className={board.optedIn ? 'leaderboard-optout' : 'button-primary'} onClick={() => void toggleParticipation()} disabled={saving || loading}>{saving ? 'Saving…' : board.optedIn ? 'Leave leaderboard' : 'Join leaderboard'}{!board.optedIn && <ArrowUp size={14} />}</button></div> : <div className="leaderboard-choice"><p>Sign in if you’d like to join. Participation is always optional.</p><button className="button-primary" onClick={onSignIn}>Sign in to join</button></div>}
    {message && <p className="leaderboard-message" role="status">{message}</p>}
    <ol className="leaderboard-list" aria-label="Opted-in learners ranked by completed lessons">{board.entries.map(entry => <li key={`${entry.rank}-${entry.displayName}`} className={entry.isYou ? 'leaderboard-you' : ''}><span className="leaderboard-rank">{String(entry.rank).padStart(2, '0')}</span><span className="leaderboard-name">{entry.displayName}{entry.isYou && <small>YOU</small>}</span><span className="leaderboard-score">{entry.lessonsCompleted} <small>{entry.lessonsCompleted === 1 ? 'LESSON' : 'LESSONS'}</small></span></li>)}</ol>
    {!loading && board.entries.length === 0 && <p className="leaderboard-empty">The board is ready. Your opt-in lets other learners see your progress.</p>}
    <p className="leaderboard-footnote">Ranks update from saved course completions. No email addresses or account details are shown.</p>
  </section>
}
