import { useEffect, useState, type FormEvent } from 'react'
import { BookHeart, Check, MessageCircle, ShieldCheck } from 'lucide-react'
import { createCommunityPost, loadCommunityPosts, loadModerationQueue, reportCommunityPost, setPostStatus, setReportStatus, type CommunityPost, type CommunityReport } from '../data/community'
import { privateReflectionStorageKey, readPrivateReflections, type PrivateReflections } from '../data/reflections'

const prompts = [
  { id: 'safer-spaces', title: 'Safer spaces online', prompt: 'What small actions help make an online space safer for everyone?' },
  { id: 'explain-security', title: 'Teach one idea', prompt: 'How would you explain one security habit to someone who is new to it?' },
  { id: 'ask-a-mentor', title: 'Ask a mentor', prompt: 'What would you ask someone working in cybersecurity about their learning journey?' },
]
type Props = { accountId?: string | null; role?: 'LEARNER' | 'ADMIN' | null; csrfToken?: string; onSignIn?: () => void }

export function CommunityCorner({ accountId = null, role = null, csrfToken = '', onSignIn }: Props) {
  const [reflections, setReflections] = useState<PrivateReflections>(() => readPrivateReflections(accountId))
  const [selectedId, setSelectedId] = useState(prompts[0].id)
  const [draft, setDraft] = useState(() => readPrivateReflections(accountId)[prompts[0].id] ?? '')
  const [notice, setNotice] = useState('')
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [queuePosts, setQueuePosts] = useState<CommunityPost[]>([])
  const [reports, setReports] = useState<CommunityReport[]>([])
  const [postDraft, setPostDraft] = useState('')
  const [reportTarget, setReportTarget] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('SPAM')
  const [reportDetails, setReportDetails] = useState('')
  const [communityMessage, setCommunityMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const selected = prompts.find(item => item.id === selectedId) ?? prompts[0]

  useEffect(() => {
    const scopedReflections = readPrivateReflections(accountId)
    setReflections(scopedReflections)
    setDraft(scopedReflections[selectedId] ?? '')
  }, [accountId, selectedId])

  async function refreshCommunity() {
    try {
      const entries = await loadCommunityPosts()
      setPosts(entries)
      if (role === 'ADMIN') {
        const queue = await loadModerationQueue()
        setQueuePosts(queue.posts)
        setReports(queue.reports)
      } else {
        setQueuePosts([])
        setReports([])
      }
      setCommunityMessage('')
    } catch (error) {
      setCommunityMessage(error instanceof Error ? error.message : 'The community space is unavailable right now.')
    }
  }

  useEffect(() => { void refreshCommunity() }, [accountId, role])

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    try {
      const post = await createCommunityPost(postDraft, csrfToken)
      setPosts(current => [{ ...post, isOwn: true }, ...current])
      setPostDraft('')
      setCommunityMessage('Post sent for moderator review. It will appear publicly after approval.')
    } catch (error) {
      setCommunityMessage(error instanceof Error ? error.message : 'Could not submit your post.')
    } finally { setBusy(false) }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reportTarget) return
    setBusy(true)
    try {
      const result = await reportCommunityPost(reportTarget, reportReason, reportDetails, csrfToken)
      setCommunityMessage(result.message)
      setReportTarget(null)
      setReportDetails('')
    } catch (error) {
      setCommunityMessage(error instanceof Error ? error.message : 'Could not send your report.')
    } finally { setBusy(false) }
  }

  async function moderatePost(postId: string, status: 'APPROVED' | 'HIDDEN') {
    setBusy(true)
    try { await setPostStatus(postId, status, csrfToken); await refreshCommunity() }
    catch (error) { setCommunityMessage(error instanceof Error ? error.message : 'Could not update this post.') }
    finally { setBusy(false) }
  }

  async function moderateReport(reportId: string, status: 'REVIEWED' | 'DISMISSED') {
    setBusy(true)
    try { await setReportStatus(reportId, status, csrfToken); await refreshCommunity() }
    catch (error) { setCommunityMessage(error instanceof Error ? error.message : 'Could not update this report.') }
    finally { setBusy(false) }
  }

  function selectPrompt(id: string) {
    setSelectedId(id)
    setDraft(reflections[id] ?? '')
    setNotice('')
  }

  function saveReflection() {
    const next = { ...reflections, [selectedId]: draft.trim() }
    try {
      window.localStorage.setItem(privateReflectionStorageKey(accountId), JSON.stringify(next))
      setReflections(next)
      setNotice('Reflection saved privately on this device.')
    } catch {
      setNotice('Could not save in this browser. Copy your reflection before leaving.')
    }
  }

  function clearReflection() {
    const next = { ...reflections }
    delete next[selectedId]
    try {
      window.localStorage.setItem(privateReflectionStorageKey(accountId), JSON.stringify(next))
      setReflections(next)
      setDraft('')
      setNotice('Reflection cleared from this device.')
    } catch {
      setNotice('Could not update this browser’s saved reflections.')
    }
  }

  return <section id="community" className="community-section">
    <div className="wrap">
      <div className="community-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> PHASE 07 / COMMUNITY & REFLECTION</div><h2>Learn with care.<br /><span>Make space for others.</span></h2></div><p>Cybersecurity grows stronger when people share ideas and treat each other with respect. Start with a prompt, reflect, and carry a useful question into your next conversation.</p></div>
      <div className="community-grid">
        <div className="community-prompt-panel"><div className="community-panel-label"><MessageCircle size={15} /> DISCUSSION PROMPTS</div><p className="community-panel-intro">Choose a prompt to guide a conversation with a classmate, friend, or mentor.</p>
          <div className="community-prompts">{prompts.map(item => <button key={item.id} className={`community-prompt ${selectedId === item.id ? 'active' : ''}`} onClick={() => selectPrompt(item.id)}><span>{item.title}</span><span>{item.prompt}</span>{reflections[item.id] && <small><Check size={12} /> REFLECTION SAVED</small>}</button>)}</div>
        </div>
        <div className="reflection-panel"><div className="community-panel-label"><BookHeart size={15} /> PRIVATE REFLECTION</div><h3>{selected.prompt}</h3><label className="sr-only" htmlFor="community-reflection">Write a private reflection</label><textarea id="community-reflection" maxLength={500} value={draft} onChange={event => { setDraft(event.target.value); setNotice('') }} placeholder="Jot down an idea or question…" /><div className="reflection-meta"><span>{draft.length} / 500</span><span><ShieldCheck size={13} /> SAVED ONLY IN THIS BROWSER</span></div><div className="reflection-actions"><button className="button-primary" disabled={!draft.trim()} onClick={saveReflection}>Save reflection <Check size={14} /></button>{reflections[selectedId] && <button className="reflection-clear" onClick={clearReflection}>Clear saved reflection</button>}</div>{notice && <p className="reflection-notice" role="status">{notice}</p>}<p className="reflection-privacy">Keep it personal: don’t write passwords, account details, private messages, or identifying information. Reflections are not shared with other learners.</p></div>
      </div>
      <div className="shared-community">
        <div className="shared-community-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> LEARNER COMMUNITY</div><h3>Ideas worth sharing.</h3></div><p>Posts are reviewed before they appear to everyone, and approved posts show your account display name. Be kind, stay on topic, and keep personal details out.</p></div>
        {accountId ? <form className="community-compose" onSubmit={submitPost}><label htmlFor="community-post">Share a learning question or a helpful idea</label><textarea id="community-post" minLength={20} maxLength={800} value={postDraft} onChange={event => setPostDraft(event.target.value)} placeholder="What did you learn, or what would you like to understand better?" /><div className="compose-footer"><span>{postDraft.length} / 800 · posts need moderator approval</span><button className="button-primary" disabled={busy || postDraft.trim().length < 20}>Submit for review <Check size={14} /></button></div></form> : <div className="community-signin"><p>Sign in to share a question or report a post.</p><button className="button-primary" onClick={onSignIn}>Sign in to join</button></div>}
        {communityMessage && <p className="community-message" role="status">{communityMessage}</p>}
        <div className="community-feed" aria-label="Community posts">{posts.length ? posts.map(post => <article className="community-post" key={post.id}><div className="post-meta"><strong>{post.author.displayName}</strong><time>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(post.createdAt))}</time>{post.isOwn && post.status !== 'APPROVED' && <span className={`post-status ${post.status.toLowerCase()}`}>{post.status === 'PENDING' ? 'IN REVIEW' : 'HIDDEN'}</span>}</div><p>{post.body}</p>{accountId && !post.isOwn && post.status === 'APPROVED' && <button className="report-post-button" onClick={() => setReportTarget(reportTarget === post.id ? null : post.id)}>Report post</button>}{reportTarget === post.id && <form className="report-form" onSubmit={submitReport}><label>Reason<select value={reportReason} onChange={event => setReportReason(event.target.value)}><option value="SPAM">Spam</option><option value="HARASSMENT">Harassment</option><option value="PERSONAL_INFORMATION">Personal information</option><option value="UNSAFE_ADVICE">Unsafe advice</option><option value="OTHER">Other</option></select></label><label>Details (optional)<input maxLength={300} value={reportDetails} onChange={event => setReportDetails(event.target.value)} /></label><button disabled={busy}>Send report</button></form>}</article>) : <p className="community-empty">No approved posts yet. Start a thoughtful conversation—your post will be reviewed first.</p>}</div>
        {role === 'ADMIN' && <section className="moderation-panel" aria-labelledby="moderation-title"><div className="community-panel-label"><ShieldCheck size={15} /> MODERATION QUEUE</div><h4 id="moderation-title">Review before publishing</h4>{queuePosts.length === 0 && reports.length === 0 ? <p>The queue is clear.</p> : <><div className="moderation-list">{queuePosts.map(post => <article key={post.id}><p><b>{post.author.displayName}</b> · {post.body}</p><div><button disabled={busy} onClick={() => void moderatePost(post.id, 'APPROVED')}>Approve</button><button disabled={busy} onClick={() => void moderatePost(post.id, 'HIDDEN')}>Hide</button></div></article>)}</div><div className="moderation-list">{reports.map(report => <article key={report.id}><p><b>{report.reason.replace(/_/g, ' ')}</b> · reported by {report.reporter.displayName}<br />Post by {report.post.author.displayName}: {report.post.body}{report.details && <><br />Note: {report.details}</>}</p><div><button disabled={busy} onClick={() => void moderatePost(report.post.id, 'HIDDEN')}>Hide post</button><button disabled={busy} onClick={() => void moderateReport(report.id, 'REVIEWED')}>Resolve</button><button disabled={busy} onClick={() => void moderateReport(report.id, 'DISMISSED')}>Dismiss</button></div></article>)}</div></>}</section>}
      </div>
      <p className="community-guideline"><ShieldCheck size={16} /> Be curious, credit other people’s ideas, and ask before sharing someone else’s story.</p>
    </div>
  </section>
}
