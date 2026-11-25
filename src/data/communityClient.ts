import type {
  ForumCategoryItem,
  ForumThreadItem,
  ForumThreadDetail,
  ForumReplyItem,
  CreateThreadPayload,
  CreateReplyPayload,
  KnowledgeArticleSummary,
  KnowledgeArticleDetail,
} from '../../packages/shared/src/index'
import {
  CURATED_FORUM_CATEGORIES,
  CURATED_FORUM_THREADS,
  CURATED_KNOWLEDGE_ARTICLES,
} from './communityCurated'
import { dispatchGamificationUpdate } from './gamificationClient'

export type {
  ForumCategoryItem,
  ForumThreadItem,
  ForumThreadDetail,
  ForumReplyItem,
  CreateThreadPayload,
  CreateReplyPayload,
  KnowledgeArticleSummary,
  KnowledgeArticleDetail,
}

const LOCAL_FORUM_THREADS_KEY = 'kw_local_forum_threads_v1'
const LOCAL_THREAD_VOTES_KEY = 'kw_local_thread_votes_v1'
const LOCAL_REPLY_VOTES_KEY = 'kw_local_reply_votes_v1'
const LOCAL_ARTICLE_VOTES_KEY = 'kw_local_article_votes_v1'

function getStoredThreads(): ForumThreadDetail[] {
  try {
    const raw = localStorage.getItem(LOCAL_FORUM_THREADS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ForumThreadDetail[]
  } catch {
    return []
  }
}

function saveStoredThreads(threads: ForumThreadDetail[]): void {
  try {
    localStorage.setItem(LOCAL_FORUM_THREADS_KEY, JSON.stringify(threads))
  } catch {
    // Ignore storage quota errors
  }
}

function getStoredVotes(key: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, boolean>
  } catch {
    return {}
  }
}

function saveStoredVotes(key: string, votes: Record<string, boolean>): void {
  try {
    localStorage.setItem(key, JSON.stringify(votes))
  } catch {
    // Ignore
  }
}

export async function fetchForumCategories(): Promise<ForumCategoryItem[]> {
  try {
    const res = await fetch('/api/community/forums/categories')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.categories)) return data.categories
    }
  } catch {
    // API unavailable - fallback
  }
  return CURATED_FORUM_CATEGORIES
}

export async function fetchForumThreads(filters?: {
  category?: string
  sort?: string
  q?: string
}): Promise<ForumThreadItem[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.category && filters.category !== 'all') params.set('category', filters.category)
    if (filters?.sort) params.set('sort', filters.sort)
    if (filters?.q) params.set('q', filters.q)

    const url = `/api/community/forums/threads${params.toString() ? `?${params.toString()}` : ''}`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.threads)) return data.threads
    }
  } catch {
    // Fallback
  }

  // Combine curated + locally added threads
  const custom = getStoredThreads()
  let all: ForumThreadDetail[] = [...custom, ...CURATED_FORUM_THREADS]

  if (filters?.category && filters.category !== 'all') {
    all = all.filter((t) => t.categorySlug === filters.category)
  }
  if (filters?.q) {
    const queryLower = filters.q.toLowerCase()
    all = all.filter(
      (t) =>
        t.title.toLowerCase().includes(queryLower) ||
        t.content.toLowerCase().includes(queryLower)
    )
  }

  if (filters?.sort === 'popular') {
    all.sort((a, b) => b.upvotesCount - a.upvotesCount)
  } else if (filters?.sort === 'unanswered') {
    all = all.filter((t) => t.repliesCount === 0)
  } else {
    all.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return all.map((t) => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    preview: t.preview,
    categorySlug: t.categorySlug,
    categoryName: t.categoryName,
    authorName: t.authorName,
    authorRank: t.authorRank,
    upvotesCount: t.upvotesCount,
    repliesCount: t.replies.length,
    viewsCount: t.viewsCount,
    isPinned: t.isPinned,
    isLocked: t.isLocked,
    status: t.status,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }))
}

export async function fetchForumThread(slug: string): Promise<ForumThreadDetail> {
  try {
    const res = await fetch(`/api/community/forums/threads/${slug}`)
    if (res.ok) {
      const data = await res.json()
      return data.thread
    }
  } catch {
    // Fallback
  }

  const custom = getStoredThreads()
  const found = custom.find((t) => t.slug === slug) || CURATED_FORUM_THREADS.find((t) => t.slug === slug)
  if (!found) throw new Error('Discussion thread not found.')

  const threadVotes = getStoredVotes(LOCAL_THREAD_VOTES_KEY)
  const replyVotes = getStoredVotes(LOCAL_REPLY_VOTES_KEY)

  return {
    ...found,
    viewsCount: found.viewsCount + 1,
    hasVoted: Boolean(threadVotes[found.id]),
    replies: found.replies.map((r) => ({
      ...r,
      hasVoted: Boolean(replyVotes[r.id]),
    })),
  }
}

export async function createForumThread(
  payload: CreateThreadPayload,
  csrfToken?: string
): Promise<ForumThreadDetail> {
  try {
    const res = await fetch('/api/community/forums/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const data = await res.json()
      dispatchGamificationUpdate()
      return data.thread
    } else {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to create discussion thread.')
    }
  } catch (err: unknown) {
    if (err instanceof Error && !err.message.includes('fetch') && !err.message.includes('URL') && !err.message.includes('Network')) {
      throw err
    }
  }

  // Local fallback creation
  const slug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)
  const category = CURATED_FORUM_CATEGORIES.find((c) => c.slug === payload.categorySlug)
  const newThread: ForumThreadDetail = {
    id: `local-th-${Date.now()}`,
    slug,
    title: payload.title,
    content: payload.content,
    preview: payload.content.slice(0, 160) + (payload.content.length > 160 ? '...' : ''),
    categorySlug: payload.categorySlug,
    categoryName: category?.name || 'General Discussion',
    authorName: 'Learner',
    authorRank: 'Cadet',
    upvotesCount: 1,
    repliesCount: 0,
    viewsCount: 1,
    isPinned: false,
    isLocked: false,
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isOwn: true,
    hasVoted: true,
    replies: [],
  }

  const custom = getStoredThreads()
  saveStoredThreads([newThread, ...custom])
  dispatchGamificationUpdate()
  return newThread
}

export async function createForumReply(
  threadSlug: string,
  payload: CreateReplyPayload,
  csrfToken?: string
): Promise<ForumReplyItem> {
  try {
    const res = await fetch(`/api/community/forums/threads/${threadSlug}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const data = await res.json()
      dispatchGamificationUpdate()
      return data.reply
    } else {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to submit reply.')
    }
  } catch (err: unknown) {
    if (err instanceof Error && !err.message.includes('fetch') && !err.message.includes('URL') && !err.message.includes('Network')) {
      throw err
    }
  }

  // Local fallback reply
  const newReply: ForumReplyItem = {
    id: `local-rep-${Date.now()}`,
    threadId: threadSlug,
    authorName: 'Learner',
    authorRank: 'Cadet',
    content: payload.content,
    upvotesCount: 0,
    isAcceptedAnswer: false,
    createdAt: new Date().toISOString(),
    isOwn: true,
    hasVoted: false,
  }

  const custom = getStoredThreads()
  const idx = custom.findIndex((t) => t.slug === threadSlug)
  if (idx >= 0) {
    custom[idx].replies.push(newReply)
    custom[idx].repliesCount = custom[idx].replies.length
    saveStoredThreads(custom)
  }

  dispatchGamificationUpdate()
  return newReply
}

export async function voteForumThread(
  threadSlug: string,
  csrfToken?: string
): Promise<{ upvotesCount: number; hasVoted: boolean }> {
  try {
    const res = await fetch(`/api/community/forums/threads/${threadSlug}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // Fallback
  }

  const votes = getStoredVotes(LOCAL_THREAD_VOTES_KEY)
  const currentlyVoted = Boolean(votes[threadSlug])
  votes[threadSlug] = !currentlyVoted
  saveStoredVotes(LOCAL_THREAD_VOTES_KEY, votes)

  return {
    upvotesCount: currentlyVoted ? 0 : 1,
    hasVoted: !currentlyVoted,
  }
}

export async function voteForumReply(
  replyId: string,
  csrfToken?: string
): Promise<{ upvotesCount: number; hasVoted: boolean }> {
  try {
    const res = await fetch(`/api/community/forums/replies/${replyId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // Fallback
  }

  const votes = getStoredVotes(LOCAL_REPLY_VOTES_KEY)
  const currentlyVoted = Boolean(votes[replyId])
  votes[replyId] = !currentlyVoted
  saveStoredVotes(LOCAL_REPLY_VOTES_KEY, votes)

  return {
    upvotesCount: currentlyVoted ? 0 : 1,
    hasVoted: !currentlyVoted,
  }
}

export async function fetchKnowledgeArticles(filters?: {
  category?: string
  tag?: string
  difficulty?: string
  q?: string
}): Promise<KnowledgeArticleSummary[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.category && filters.category !== 'all') params.set('category', filters.category)
    if (filters?.tag) params.set('tag', filters.tag)
    if (filters?.difficulty && filters.difficulty !== 'ALL') params.set('difficulty', filters.difficulty)
    if (filters?.q) params.set('q', filters.q)

    const url = `/api/community/articles${params.toString() ? `?${params.toString()}` : ''}`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.articles)) return data.articles
    }
  } catch {
    // Fallback
  }

  let list = CURATED_KNOWLEDGE_ARTICLES
  if (filters?.category && filters.category !== 'all') {
    list = list.filter((a) => a.categorySlug === filters.category)
  }
  if (filters?.difficulty && filters.difficulty !== 'ALL') {
    list = list.filter((a) => a.difficulty === filters.difficulty)
  }
  if (filters?.tag) {
    const tagLower = filters.tag.toLowerCase()
    list = list.filter((a) => a.tags.some((t) => t.toLowerCase().includes(tagLower)))
  }
  if (filters?.q) {
    const queryLower = filters.q.toLowerCase()
    list = list.filter(
      (a) =>
        a.title.toLowerCase().includes(queryLower) ||
        a.summary.toLowerCase().includes(queryLower) ||
        a.tags.some((t) => t.toLowerCase().includes(queryLower))
    )
  }

  return list.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    summary: a.summary,
    categorySlug: a.categorySlug,
    tags: a.tags,
    difficulty: a.difficulty,
    readTimeMinutes: a.readTimeMinutes,
    authorName: a.authorName,
    viewsCount: a.viewsCount,
    helpfulVotesCount: a.helpfulVotesCount,
    isFeatured: a.isFeatured,
    publishedAt: a.publishedAt,
  }))
}

export async function fetchKnowledgeArticle(slug: string): Promise<KnowledgeArticleDetail> {
  try {
    const res = await fetch(`/api/community/articles/${slug}`)
    if (res.ok) {
      const data = await res.json()
      return data.article
    }
  } catch {
    // Fallback
  }

  const found = CURATED_KNOWLEDGE_ARTICLES.find((a) => a.slug === slug)
  if (!found) throw new Error('Security article not found.')

  const votes = getStoredVotes(LOCAL_ARTICLE_VOTES_KEY)
  return {
    ...found,
    viewsCount: found.viewsCount + 1,
    hasVotedHelpful: Boolean(votes[found.slug]),
  }
}

export async function voteArticleHelpful(
  slug: string
): Promise<{ helpfulVotesCount: number }> {
  try {
    const res = await fetch(`/api/community/articles/${slug}/helpful`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // Fallback
  }

  const votes = getStoredVotes(LOCAL_ARTICLE_VOTES_KEY)
  votes[slug] = true
  saveStoredVotes(LOCAL_ARTICLE_VOTES_KEY, votes)

  const found = CURATED_KNOWLEDGE_ARTICLES.find((a) => a.slug === slug)
  return { helpfulVotesCount: (found?.helpfulVotesCount || 0) + 1 }
}
