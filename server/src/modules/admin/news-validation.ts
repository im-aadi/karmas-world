import { z } from 'zod'

const sourceHostAllowlist: Record<string, string[]> = {
  NIST: ['www.nist.gov', 'csrc.nist.gov'],
  'CERT-In': ['cert-in.org.in', 'www.cert-in.org.in'],
  CISA: ['www.cisa.gov', 'cisa.gov'],
}

const allowedSourceUrl = z.string().url().max(2048).superRefine((value, context) => {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('unsafe URL')
    if (!Object.values(sourceHostAllowlist).some(hosts => hosts.includes(url.hostname.toLowerCase()))) throw new Error('unapproved source')
  } catch {
    context.addIssue({ code: 'custom', message: 'Use an HTTPS link from NIST, CERT-In, or CISA.' })
  }
})

const updateFields = {
  source: z.enum(['NIST', 'CERT-In', 'CISA']),
  type: z.enum(['LEARNING_GUIDE', 'RESEARCH_UPDATE', 'SECURITY_ADVISORY']),
  title: z.string().trim().min(10).max(180),
  sourceUrl: allowedSourceUrl,
  sourcePublishedAt: z.string().datetime(),
  summary: z.string().trim().min(30).max(600),
  takeaway: z.string().trim().min(20).max(360),
}

function matchesPublisher(source: string, sourceUrl: string) {
  try { return sourceHostAllowlist[source]?.includes(new URL(sourceUrl).hostname.toLowerCase()) ?? false } catch { return false }
}

function publicationDateIsNotInFuture(value: string) {
  return new Date(value).getTime() <= Date.now() + 24 * 60 * 60 * 1000
}

export const createSecurityUpdateSchema = z.object(updateFields).strict().superRefine((value, context) => {
  if (!matchesPublisher(value.source, value.sourceUrl)) context.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'The source label must match the approved publisher domain.' })
  if (!publicationDateIsNotInFuture(value.sourcePublishedAt)) context.addIssue({ code: 'custom', path: ['sourcePublishedAt'], message: 'The publication date cannot be in the future.' })
})

export const editSecurityUpdateSchema = z.object({ ...updateFields, status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']) }).strict().superRefine((value, context) => {
  if (!matchesPublisher(value.source, value.sourceUrl)) context.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'The source label must match the approved publisher domain.' })
  if (!publicationDateIsNotInFuture(value.sourcePublishedAt)) context.addIssue({ code: 'custom', path: ['sourcePublishedAt'], message: 'The publication date cannot be in the future.' })
})
