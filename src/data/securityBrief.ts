export type SecurityUpdate = {
  id: string
  source: string
  type: 'LEARNING GUIDE' | 'RESEARCH UPDATE' | 'SECURITY ADVISORY'
  title: string
  date: string
  summary: string
  takeaway: string
  href: string
}

export const briefCheckedDate = 'November 3, 2026'

export const securityUpdates: SecurityUpdate[] = [
  {
    id: 'solopreneur-guide', source: 'NIST', type: 'LEARNING GUIDE',
    title: 'A practical cybersecurity guide for solo business owners', date: 'November 2, 2026',
    summary: 'NIST published a plain-language guide to help people running one-person businesses choose and prioritize security actions.',
    takeaway: 'Good entry point for learning how backups, updates, and basic risk planning fit into everyday work.',
    href: 'https://www.nist.gov/news-events/news/2026/11/self-employed-solopreneur-nist-has-cybersecurity-guide-just-you',
  },
  {
    id: 'goahead-advisory', source: 'CERT-In', type: 'SECURITY ADVISORY',
    title: 'Multiple vulnerabilities in GoAhead Web Server', date: 'October 28, 2026',
    summary: 'CERT-In advisory CIAD-2026-0057 describes risks affecting specified GoAhead builds used in some embedded and device-management products.',
    takeaway: 'For real systems, check the affected build and vendor guidance in the advisory before deciding what action applies.',
    href: 'https://cert-in.org.in/s2cMainServlet?VLCODE=CIAD-2026-0057&pageid=PUBVLNOTES02',
  },
  {
    id: 'pqc-transition', source: 'NIST', type: 'RESEARCH UPDATE',
    title: 'A roadmap for moving to post-quantum cryptography', date: 'October 27, 2026',
    summary: 'NISTIR 8547 outlines a transition from quantum-vulnerable algorithms toward post-quantum cryptography standards.',
    takeaway: 'A useful example of long-term security planning: identify dependencies first, then migrate carefully over time.',
    href: 'https://www.nist.gov/news-events/news/2026/10/nist-report-provides-guidelines-transition-post-quantum-cryptography',
  },
]

export const officialUpdateSources = [
  { name: 'CISA alerts and advisories', href: 'https://www.cisa.gov/news-events/cybersecurity-advisories' },
  { name: 'NIST cybersecurity news', href: 'https://www.nist.gov/news-events/news' },
  { name: 'CERT-In advisories', href: 'https://www.cert-in.org.in/s2cMainServlet?pageid=PUBADVLIST02' },
]

export async function loadPublishedSecurityBrief(): Promise<{ updates: SecurityUpdate[]; checkedDate: string }> {
  const response = await fetch('/api/news', { headers: { Accept: 'application/json' } })
  const body = await response.json().catch(() => ({})) as { updates?: Array<Omit<SecurityUpdate, 'date' | 'href' | 'type'> & { type: SecurityUpdate['type'] | 'LEARNING_GUIDE' | 'RESEARCH_UPDATE' | 'SECURITY_ADVISORY'; sourcePublishedAt: string; sourceUrl: string; verifiedAt: string | null }> }
  if (!response.ok || !body.updates) throw new Error('The latest published brief could not be loaded.')
  const formatDate = (date: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date))
  const updates = body.updates.map(item => ({
    id: item.id, source: item.source,
    type: item.type.replace(/_/g, ' ') as SecurityUpdate['type'],
    title: item.title, date: formatDate(item.sourcePublishedAt), summary: item.summary, takeaway: item.takeaway,
    href: item.sourceUrl,
  }))
  const checks = body.updates.map(item => item.verifiedAt).filter((value): value is string => Boolean(value))
  const orderedChecks = checks.sort()
  const checkedDate = orderedChecks.length ? formatDate(orderedChecks[orderedChecks.length - 1]) : briefCheckedDate
  return { updates, checkedDate }
}
