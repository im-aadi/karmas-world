import { useEffect, useState, type FormEvent } from 'react'
import { FilePlus2, Pencil, Save } from 'lucide-react'
import { getAdminNews, saveAdminNews, type AdminSecurityUpdate } from '../data/admin'

type Draft = Omit<AdminSecurityUpdate, 'id' | 'verifiedAt' | 'updatedAt'>
const blankDraft = (): Draft => ({ source: 'NIST', type: 'LEARNING_GUIDE', title: '', sourceUrl: '', sourcePublishedAt: new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z', summary: '', takeaway: '', status: 'DRAFT' })

export function AdminNewsManager({ csrfToken }: { csrfToken: string }) {
  const [updates, setUpdates] = useState<AdminSecurityUpdate[]>([])
  const [draft, setDraft] = useState<Draft>(blankDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function refresh() {
    try { setUpdates((await getAdminNews()).updates); setMessage('') }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load editorial items.') }
  }
  useEffect(() => { void refresh() }, [])

  function edit(item: AdminSecurityUpdate) {
    setEditingId(item.id)
    setDraft({ source: item.source, type: item.type, title: item.title, sourceUrl: item.sourceUrl, sourcePublishedAt: item.sourcePublishedAt.slice(0, 10) + 'T00:00:00.000Z', summary: item.summary, takeaway: item.takeaway, status: item.status })
    setMessage('')
  }

  function newDraft() { setEditingId(null); setDraft(blankDraft()); setMessage('') }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    try {
      const isNew = !editingId
      await saveAdminNews(draft, csrfToken, editingId ?? undefined)
      await refresh()
      if (isNew) { setEditingId(null); setDraft(blankDraft()) }
      setMessage(editingId ? 'Editorial item saved.' : 'Draft created. Edit it again when you are ready to publish.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save this editorial item.') }
    finally { setBusy(false) }
  }

  function change<K extends keyof Draft>(key: K, value: Draft[K]) { setDraft(current => ({ ...current, [key]: value })) }

  return <section className="admin-news-manager" aria-labelledby="admin-news-title">
    <div className="admin-news-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> SECURITY BRIEF EDITOR</div><h3 id="admin-news-title">Review and publish updates.</h3><p>New items start as drafts. Check the original source and date before publishing. Links are limited to NIST, CERT-In, and CISA.</p></div><button type="button" className="admin-new-story" onClick={newDraft}><FilePlus2 size={14} /> New draft</button></div>
    <div className="admin-news-layout"><div className="admin-news-list" aria-label="Editorial items">{updates.map(item => <button type="button" key={item.id} className={`admin-news-item ${editingId === item.id ? 'selected' : ''}`} onClick={() => edit(item)}><span className={`editorial-status ${item.status.toLowerCase()}`}>{item.status}</span><strong>{item.title}</strong><small>{item.source} · {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(item.sourcePublishedAt))}</small><Pencil size={13} /></button>)}{updates.length === 0 && <p>No editorial items yet.</p>}</div>
      <form className="admin-news-form" onSubmit={save}>
        <div className="admin-news-form-row"><label>Publisher<select value={draft.source} onChange={event => change('source', event.target.value as Draft['source'])}><option>NIST</option><option>CERT-In</option><option>CISA</option></select></label><label>Type<select value={draft.type} onChange={event => change('type', event.target.value as Draft['type'])}><option value="LEARNING_GUIDE">Learning guide</option><option value="RESEARCH_UPDATE">Research update</option><option value="SECURITY_ADVISORY">Security advisory</option></select></label></div>
        <label>Headline<input required minLength={10} maxLength={180} value={draft.title} onChange={event => change('title', event.target.value)} /></label>
        <div className="admin-news-form-row"><label>Official source link<input type="url" required maxLength={2048} value={draft.sourceUrl} onChange={event => change('sourceUrl', event.target.value)} placeholder="https://…" /></label><label>Source publication date<input type="date" required value={draft.sourcePublishedAt.slice(0, 10)} onChange={event => change('sourcePublishedAt', `${event.target.value}T00:00:00.000Z`)} /></label></div>
        <label>Learner-friendly summary<textarea required minLength={30} maxLength={600} value={draft.summary} onChange={event => change('summary', event.target.value)} /></label>
        <label>Why it matters<textarea required minLength={20} maxLength={360} value={draft.takeaway} onChange={event => change('takeaway', event.target.value)} /></label>
        {editingId && <label>Visibility<select value={draft.status} onChange={event => change('status', event.target.value as Draft['status'])}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label>}
        <div className="admin-news-form-footer"><span>{editingId ? 'Changes to a published item update the public brief.' : 'New items are saved as drafts.'}</span><button className="button-primary" type="submit" disabled={busy}><Save size={14} />{busy ? 'Saving…' : draft.status === 'PUBLISHED' ? 'Save and publish' : draft.status === 'ARCHIVED' ? 'Archive item' : 'Save draft'}</button></div>
        {message && <p className="admin-news-message" role="status">{message}</p>}
      </form>
    </div>
  </section>
}
