import { useEffect, useState } from 'react'
import { Activity, ArrowUpRight, BookOpenCheck, Flag, GraduationCap, Users } from 'lucide-react'
import { getAdminOverview, type AdminOverviewData } from '../data/admin'
import { AdminNewsManager } from './AdminNewsManager'

const metrics = [
  { key: 'learnerAccounts', label: 'LEARNER ACCOUNTS', icon: Users },
  { key: 'completedLessons', label: 'LESSONS COMPLETED', icon: BookOpenCheck },
  { key: 'pendingPosts', label: 'POSTS TO REVIEW', icon: GraduationCap },
  { key: 'openReports', label: 'OPEN REPORTS', icon: Flag },
  { key: 'leaderboardParticipants', label: 'OPTED-IN LEARNERS', icon: Activity },
] as const

export function AdminOverview({ csrfToken }: { csrfToken: string }) {
  const [overview, setOverview] = useState<AdminOverviewData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getAdminOverview().then(data => { if (active) setOverview(data) }).catch(cause => {
      if (active) setError(cause instanceof Error ? cause.message : 'Could not load administration metrics.')
    })
    return () => { active = false }
  }, [])

  return <section id="admin" className="admin-overview-section" aria-labelledby="admin-overview-title">
    <div className="wrap">
      <div className="admin-overview-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> ADMINISTRATION / INTERNAL</div><h2 id="admin-overview-title">Platform overview.</h2><p>Aggregate activity counts for site administrators. No learner email addresses or individual progress records are shown here.</p></div><a href="#moderation-title">Open moderation queue <ArrowUpRight size={14} /></a></div>
      {error && <p className="admin-overview-error" role="alert">{error}</p>}
      <div className="admin-metric-grid">{metrics.map(({ key, label, icon: Icon }) => <article className="admin-metric" key={key}><span className="admin-metric-icon"><Icon size={17} /></span><span className="admin-metric-label">{label}</span><strong>{overview ? overview[key].toLocaleString() : '—'}</strong></article>)}</div>
      {overview && <p className="admin-generated-at">Snapshot generated {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(overview.generatedAt))}. Refresh the page for updated counts.</p>}
      <AdminNewsManager csrfToken={csrfToken} />
    </div>
  </section>
}
