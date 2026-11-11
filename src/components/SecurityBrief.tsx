import { ArrowUpRight, ExternalLink, FileText, RadioTower } from 'lucide-react'
import { useEffect, useState } from 'react'
import { briefCheckedDate, loadPublishedSecurityBrief, officialUpdateSources, securityUpdates, type SecurityUpdate } from '../data/securityBrief'

export function SecurityBrief() {
  const [updates, setUpdates] = useState<SecurityUpdate[]>(securityUpdates)
  const [checkedDate, setCheckedDate] = useState(briefCheckedDate)
  const [usingSnapshot, setUsingSnapshot] = useState(false)

  useEffect(() => {
    let active = true
    loadPublishedSecurityBrief().then(data => {
      if (!active) return
      setUpdates(data.updates)
      setCheckedDate(data.checkedDate)
      setUsingSnapshot(false)
    }).catch(() => { if (active) setUsingSnapshot(true) })
    return () => { active = false }
  }, [])

  return <section id="updates" className="security-brief-section" aria-label="Security brief">
    <div className="wrap">
      <div className="security-brief-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> PHASE 09 / SECURITY BRIEF</div><h2>What’s changing<br /><span>in digital security.</span></h2></div><div className="brief-freshness"><span className="live-dot" /> CURATED {checkedDate.toUpperCase()}<p>{usingSnapshot ? 'Showing the saved editorial snapshot. ' : 'Selected from official sources. '}Summaries are for learning; check the linked source for full details and current guidance.</p></div></div>
      <div className="security-updates-grid">{updates.map((item, index) => <article className="security-update-card" key={item.id}>
        <div className="security-update-top"><span className="security-source-icon">{index === 1 ? <RadioTower size={17} /> : <FileText size={17} />}</span><span className="security-update-type">{item.type}</span><time>{item.date}</time></div>
        <div className="security-source-name">{item.source} <span>·</span> OFFICIAL SOURCE</div>
        <h3>{item.title}</h3><p className="security-update-summary">{item.summary}</p>
        <div className="security-takeaway"><span>WHY IT MATTERS</span><p>{item.takeaway}</p></div>
        <a href={item.href} target="_blank" rel="noopener noreferrer">Read the original <ExternalLink size={14} /></a>
      </article>)}</div>
      <div className="official-sources"><div><span className="eyebrow"><span className="eyebrow-line" /> FOLLOW THE PRIMARY SOURCES</span><p>Check official channels for new advisories and updates.</p></div><div className="official-source-links">{officialUpdateSources.map(source => <a href={source.href} key={source.name} target="_blank" rel="noopener noreferrer">{source.name} <ArrowUpRight size={13} /></a>)}</div></div>
    </div>
  </section>
}
