import { useEffect, useState, type FormEvent } from 'react'
import {
  Award,
  BookHeart,
  BookOpen,
  Check,
  Clock,
  Eye,
  Flame,
  Globe,
  MessageCircle,
  MessageSquare,
  MessageSquarePlus,
  Pin,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Terminal,
  ThumbsUp,
  User,
} from 'lucide-react'
import {
  fetchForumCategories,
  fetchForumThreads,
  fetchKnowledgeArticles,
  type ForumCategoryItem,
  type ForumThreadDetail,
  type ForumThreadItem,
  type KnowledgeArticleSummary,
} from '../../data/communityClient'
import {
  createCommunityPost,
  loadCommunityPosts,
  loadModerationQueue,
  reportCommunityPost,
  setPostStatus,
  setReportStatus,
  type CommunityPost,
  type CommunityReport,
} from '../../data/community'
import {
  readPrivateReflections,
  privateReflectionStorageKey,
  type PrivateReflections,
} from '../../data/reflections'
import {
  CURATED_FORUM_CATEGORIES,
  CURATED_FORUM_THREADS,
  CURATED_KNOWLEDGE_ARTICLES,
} from '../../data/communityCurated'
import { ArticleReaderModal } from './ArticleReaderModal'
import { CreateThreadModal } from './CreateThreadModal'
import { ThreadDetailModal } from './ThreadDetailModal'

const REFLECTION_PROMPTS = [
  {
    id: 'safer-spaces',
    title: 'Safer spaces online',
    prompt: 'What small actions help make an online space safer for everyone?',
  },
  {
    id: 'explain-security',
    title: 'Teach one idea',
    prompt: 'How would you explain one security habit to someone who is new to it?',
  },
  {
    id: 'ask-a-mentor',
    title: 'Ask a mentor',
    prompt: 'What would you ask someone working in cybersecurity about their learning journey?',
  },
]

type CommunityHubProps = {
  accountId?: string | null
  role?: 'LEARNER' | 'ADMIN' | null
  csrfToken?: string
  onSignIn?: () => void
}

export function CommunityHub({
  accountId = null,
  role = null,
  csrfToken = '',
  onSignIn,
}: CommunityHubProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'forums' | 'articles' | 'reflections'>('forums')

  // Forums State
  const [categories, setCategories] = useState<ForumCategoryItem[]>(CURATED_FORUM_CATEGORIES)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [forumSearch, setForumSearch] = useState('')
  const [forumSort, setForumSort] = useState<'recent' | 'popular' | 'unanswered'>('recent')
  const [threads, setThreads] = useState<ForumThreadItem[]>(() =>
    CURATED_FORUM_THREADS.map((t) => ({ ...t, repliesCount: t.replies.length }))
  )
  const [loadingThreads, setLoadingThreads] = useState(false)

  // Knowledge Base State
  const [articles, setArticles] = useState<KnowledgeArticleSummary[]>(CURATED_KNOWLEDGE_ARTICLES)
  const [articleCategory, setArticleCategory] = useState<string>('all')
  const [articleDifficulty, setArticleDifficulty] = useState<string>('ALL')
  const [articleSearch, setArticleSearch] = useState('')
  const [loadingArticles, setLoadingArticles] = useState(false)

  // Modals
  const [activeThreadSlug, setActiveThreadSlug] = useState<string | null>(null)
  const [activeArticleSlug, setActiveArticleSlug] = useState<string | null>(null)
  const [createThreadOpen, setCreateThreadOpen] = useState(false)

  // Existing Reflection & Moderation State
  const [reflections, setReflections] = useState<PrivateReflections>(() =>
    readPrivateReflections(accountId)
  )
  const [selectedPromptId, setSelectedPromptId] = useState(REFLECTION_PROMPTS[0].id)
  const [reflectionDraft, setReflectionDraft] = useState(
    () => readPrivateReflections(accountId)[REFLECTION_PROMPTS[0].id] ?? ''
  )
  const [reflectionNotice, setReflectionNotice] = useState('')
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [queuePosts, setQueuePosts] = useState<CommunityPost[]>([])
  const [reports, setReports] = useState<CommunityReport[]>([])
  const [postDraft, setPostDraft] = useState('')
  const [reportTarget, setReportTarget] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('SPAM')
  const [reportDetails, setReportDetails] = useState('')
  const [communityMessage, setCommunityMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const selectedPrompt =
    REFLECTION_PROMPTS.find((p) => p.id === selectedPromptId) ?? REFLECTION_PROMPTS[0]

  // Synchronize reflections per account
  useEffect(() => {
    const scoped = readPrivateReflections(accountId)
    setReflections(scoped)
    setReflectionDraft(scoped[selectedPromptId] ?? '')
  }, [accountId, selectedPromptId])

  // Load Forum Categories & Threads
  useEffect(() => {
    let mounted = true
    fetchForumCategories()
      .then((cats) => {
        if (mounted) setCategories(cats)
      })
      .catch(() => {})

    setLoadingThreads(true)
    fetchForumThreads({
      category: selectedCategory,
      sort: forumSort,
      q: forumSearch,
    })
      .then((data) => {
        if (mounted) setThreads(data)
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingThreads(false)
      })

    return () => {
      mounted = false
    }
  }, [selectedCategory, forumSort, forumSearch])

  // Load Knowledge Base Articles
  useEffect(() => {
    let mounted = true
    setLoadingArticles(true)
    fetchKnowledgeArticles({
      category: articleCategory,
      difficulty: articleDifficulty,
      q: articleSearch,
    })
      .then((data) => {
        if (mounted) setArticles(data)
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingArticles(false)
      })

    return () => {
      mounted = false
    }
  }, [articleCategory, articleDifficulty, articleSearch])

  // Refresh moderation and posts
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
      setCommunityMessage(
        error instanceof Error ? error.message : 'The community space is unavailable right now.'
      )
    }
  }

  useEffect(() => {
    void refreshCommunity()
  }, [accountId, role])

  function handleSaveReflection() {
    const next = { ...reflections, [selectedPromptId]: reflectionDraft.trim() }
    try {
      window.localStorage.setItem(privateReflectionStorageKey(accountId), JSON.stringify(next))
      setReflections(next)
      setReflectionNotice('Saved privately on this device.')
      setTimeout(() => setReflectionNotice(''), 3000)
    } catch {
      setReflectionNotice('Could not save this reflection locally.')
    }
  }

  async function handleSubmitPost(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const post = await createCommunityPost(postDraft, csrfToken)
      setPosts((current) => [{ ...post, isOwn: true }, ...current])
      setPostDraft('')
      setCommunityMessage('Post sent for moderator review. It will appear publicly after approval.')
    } catch (error) {
      setCommunityMessage(error instanceof Error ? error.message : 'Could not submit your post.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmitReport(e: FormEvent) {
    e.preventDefault()
    if (!reportTarget) return
    setBusy(true)
    try {
      const result = await reportCommunityPost(reportTarget, reportReason, reportDetails, csrfToken)
      setCommunityMessage(result.message)
      setReportTarget(null)
      setReportDetails('')
    } catch (error) {
      setCommunityMessage(error instanceof Error ? error.message : 'Could not send your report.')
    } finally {
      setBusy(false)
    }
  }

  async function handleModeratePost(postId: string, status: 'APPROVED' | 'HIDDEN') {
    setBusy(true)
    try {
      await setPostStatus(postId, status, csrfToken)
      await refreshCommunity()
    } catch (error) {
      setCommunityMessage(error instanceof Error ? error.message : 'Could not update this post.')
    } finally {
      setBusy(false)
    }
  }

  async function handleModerateReport(reportId: string, status: 'REVIEWED' | 'DISMISSED') {
    setBusy(true)
    try {
      await setReportStatus(reportId, status, csrfToken)
      await refreshCommunity()
    } catch (error) {
      setCommunityMessage(error instanceof Error ? error.message : 'Could not update this report.')
    } finally {
      setBusy(false)
    }
  }

  function handleThreadCreated(thread: ForumThreadDetail) {
    setThreads((prev) => [
      {
        id: thread.id,
        slug: thread.slug,
        title: thread.title,
        preview: thread.preview,
        categorySlug: thread.categorySlug,
        categoryName: thread.categoryName,
        authorName: thread.authorName,
        authorRank: thread.authorRank,
        upvotesCount: thread.upvotesCount,
        repliesCount: thread.repliesCount,
        viewsCount: thread.viewsCount,
        isPinned: thread.isPinned,
        isLocked: thread.isLocked,
        status: thread.status,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      },
      ...prev,
    ])
    setCreateThreadOpen(false)
    setActiveThreadSlug(thread.slug)
  }

  return (
    <section id="community" className="community-section wrap" aria-label="Learner Community & Knowledge Base">
      {/* Header */}
      <div className="section-head">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> COLLABORATIVE DEFENSE & KNOWLEDGE
          </div>
          <h2>
            Community &<br />
            <span>Cybersecurity Knowledge Base.</span>
          </h2>
        </div>
        <p>
          Ask questions, discuss defensive concepts, explore technical guides, and learn alongside
          fellow defenders in a welcoming, constructive environment.
        </p>
      </div>

      {/* Main Tabs Strip */}
      <div className="community-tabs-strip">
        <button
          className={`community-tab-btn ${activeTab === 'forums' ? 'active' : ''}`}
          onClick={() => setActiveTab('forums')}
        >
          <MessageSquare size={16} />
          <span>Discussion Forums</span>
          <span className="tab-count-badge">{threads.length}</span>
        </button>

        <button
          className={`community-tab-btn ${activeTab === 'articles' ? 'active' : ''}`}
          onClick={() => setActiveTab('articles')}
        >
          <BookOpen size={16} />
          <span>Technical Knowledge Base</span>
          <span className="tab-count-badge">{articles.length}</span>
        </button>

        <button
          className={`community-tab-btn ${activeTab === 'reflections' ? 'active' : ''}`}
          onClick={() => setActiveTab('reflections')}
        >
          <BookHeart size={16} />
          <span>Private Reflections & Safety</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DISCUSSION FORUMS                                   */}
      {/* ========================================================= */}
      <div className={`community-tab-panel ${activeTab === 'forums' ? 'tab-panel-visible' : 'tab-panel-hidden'}`}>
        <div className="community-forum-view">
          {/* Controls Bar */}
          <div className="forum-controls-bar">
            <div className="search-input-wrap">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search discussions, packet queries, tools..."
                value={forumSearch}
                onChange={(e) => setForumSearch(e.target.value)}
              />
            </div>

            <div className="filter-select-wrap">
              <select
                value={forumSort}
                onChange={(e) => setForumSort(e.target.value as 'recent' | 'popular' | 'unanswered')}
                aria-label="Sort discussions"
              >
                <option value="recent">Latest Discussions</option>
                <option value="popular">Most Popular</option>
                <option value="unanswered">Unanswered</option>
              </select>
            </div>

            <button
              className="button-primary start-discussion-btn"
              onClick={() => {
                if (!accountId && onSignIn) {
                  onSignIn()
                } else {
                  setCreateThreadOpen(true)
                }
              }}
            >
              <MessageSquarePlus size={16} />
              <span>Start Discussion</span>
            </button>
          </div>

          {/* Category Pills Strip */}
          <div className="category-pills-strip">
            <button
              className={`cat-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Domains
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                className={`cat-pill ${selectedCategory === c.slug ? 'active' : ''}`}
                onClick={() => setSelectedCategory(c.slug)}
              >
                {c.slug === 'web-security' && <Globe size={13} />}
                {c.slug === 'network-defense' && <Shield size={13} />}
                {c.slug === 'reverse-engineering' && <Terminal size={13} />}
                {c.slug === 'career-certifications' && <Award size={13} />}
                {c.name}
              </button>
            ))}
          </div>

          {/* Threads List */}
          {loadingThreads ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading community discussions...</p>
            </div>
          ) : threads.length === 0 ? (
            <div className="empty-state-box">
              <MessageCircle size={32} />
              <p>No discussion threads match your filter criteria.</p>
              <button
                className="button-secondary"
                onClick={() => {
                  setSelectedCategory('all')
                  setForumSearch('')
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="forum-threads-list">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className={`forum-thread-card ${thread.isPinned ? 'pinned-thread' : ''}`}
                  onClick={() => setActiveThreadSlug(thread.slug)}
                >
                  <div className="thread-card-header">
                    <div className="badges-row">
                      {thread.isPinned && (
                        <span className="pinned-badge">
                          <Pin size={11} /> PINNED
                        </span>
                      )}
                      <span className="channel-badge">{thread.categoryName || thread.categorySlug}</span>
                    </div>
                    <span className="thread-date">
                      {new Date(thread.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="thread-title">{thread.title}</h3>
                  <p className="thread-preview">{thread.preview}</p>

                  <div className="thread-card-footer">
                    <div className="author-tag">
                      <span className="author-icon">
                        <User size={12} />
                      </span>
                      <span className="author-name">{thread.authorName}</span>
                      {thread.authorRank && (
                        <span className="cyber-rank-chip small">{thread.authorRank}</span>
                      )}
                    </div>

                    <div className="thread-stats">
                      <span className="stat-item" title="Upvotes">
                        <ThumbsUp size={13} /> {thread.upvotesCount}
                      </span>
                      <span className="stat-item" title="Replies">
                        <MessageCircle size={13} /> {thread.repliesCount}
                      </span>
                      <span className="stat-item" title="Views">
                        <Eye size={13} /> {thread.viewsCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 2: TECHNICAL KNOWLEDGE BASE                            */}
      {/* ========================================================= */}
      <div className={`community-tab-panel ${activeTab === 'articles' ? 'tab-panel-visible' : 'tab-panel-hidden'}`}>
        <div className="community-kb-view">
          {/* Controls Bar */}
          <div className="kb-controls-bar">
            <div className="search-input-wrap">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search security guides, protocols, CVE explanations..."
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
              />
            </div>

            <div className="filter-select-wrap">
              <select
                value={articleDifficulty}
                onChange={(e) => setArticleDifficulty(e.target.value)}
                aria-label="Filter by difficulty"
              >
                <option value="ALL">All Levels</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
          </div>

          {/* Article Category Pills */}
          <div className="category-pills-strip">
            <button
              className={`cat-pill ${articleCategory === 'all' ? 'active' : ''}`}
              onClick={() => setArticleCategory('all')}
            >
              All Topics
            </button>
            <button
              className={`cat-pill ${articleCategory === 'web-security' ? 'active' : ''}`}
              onClick={() => setArticleCategory('web-security')}
            >
              Web Security
            </button>
            <button
              className={`cat-pill ${articleCategory === 'cryptography' ? 'active' : ''}`}
              onClick={() => setArticleCategory('cryptography')}
            >
              Cryptography
            </button>
            <button
              className={`cat-pill ${articleCategory === 'incident-response' ? 'active' : ''}`}
              onClick={() => setArticleCategory('incident-response')}
            >
              Blue Team & SOC
            </button>
            <button
              className={`cat-pill ${articleCategory === 'cloud-security' ? 'active' : ''}`}
              onClick={() => setArticleCategory('cloud-security')}
            >
              Active Directory & Cloud
            </button>
            <button
              className={`cat-pill ${articleCategory === 'governance' ? 'active' : ''}`}
              onClick={() => setArticleCategory('governance')}
            >
              Architecture & Zero Trust
            </button>
          </div>

          {/* Articles Grid */}
          {loadingArticles ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading security guides...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="empty-state-box">
              <BookOpen size={32} />
              <p>No technical guides match your search.</p>
              <button
                className="button-secondary"
                onClick={() => {
                  setArticleCategory('all')
                  setArticleDifficulty('ALL')
                  setArticleSearch('')
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="kb-articles-grid">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className={`kb-article-card ${article.isFeatured ? 'featured-article' : ''}`}
                  onClick={() => setActiveArticleSlug(article.slug)}
                >
                  {article.isFeatured && (
                    <div className="featured-banner">
                      <Flame size={12} /> FEATURED GUIDE
                    </div>
                  )}

                  <div className="article-card-head">
                    <span className={`difficulty-badge badge-${article.difficulty.toLowerCase()}`}>
                      {article.difficulty}
                    </span>
                    <span className="read-time">
                      <Clock size={12} /> {article.readTimeMinutes} min read
                    </span>
                  </div>

                  <h3 className="article-title">{article.title}</h3>
                  <p className="article-summary">{article.summary}</p>

                  <div className="article-card-tags">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="tag-chip">
                        <Tag size={10} /> {tag}
                      </span>
                    ))}
                  </div>

                  <div className="article-card-foot">
                    <span className="author-credit">By {article.authorName}</span>
                    <button className="read-guide-link">
                      Read Guide ↗
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 3: PRIVATE REFLECTIONS & SAFETY (Existing)             */}
      {/* ========================================================= */}
      <div className={`community-tab-panel ${activeTab === 'reflections' ? 'tab-panel-visible' : 'tab-panel-hidden'}`}>
        <div className="community-reflections-view">
          <div className="community-corner-grid">
            {/* Private Reflection Panel */}
            <div className="reflection-card">
              <div className="card-top">
                <span className="card-label">
                  <BookHeart size={15} /> PRIVATE LEARNING JOURNAL
                </span>
                <span className="card-note">Stored locally on your browser</span>
              </div>
              <h3>Reflect on your cybersecurity journey</h3>
              <p className="card-intro">
                Take a moment to solidify your understanding. These reflections stay on your device
                and are never sent to external servers without explicit intent.
              </p>

              <div className="prompt-selector-row">
                {REFLECTION_PROMPTS.map((p) => (
                  <button
                    key={p.id}
                    className={`prompt-btn ${selectedPromptId === p.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedPromptId(p.id)
                      setReflectionDraft(reflections[p.id] ?? '')
                      setReflectionNotice('')
                    }}
                  >
                    {p.title}
                  </button>
                ))}
              </div>

              <div className="active-prompt-box">
                <p>
                  <strong>Prompt:</strong> {selectedPrompt.prompt}
                </p>
              </div>

              <textarea
                aria-label="write a private reflection"
                className="textarea-input"
                rows={5}
                placeholder="Capture your thoughts, aha moments, or ideas..."
                value={reflectionDraft}
                onChange={(e) => setReflectionDraft(e.target.value)}
              />

              <div className="card-action-row">
                {reflectionNotice && (
                  <span className="save-status-msg" role="status">
                    <Check size={14} /> {reflectionNotice}
                  </span>
                )}
                <button className="button-primary" onClick={handleSaveReflection}>
                  Save Reflection
                </button>
              </div>
            </div>

            {/* Public Community Review Panel */}
            <div className="reflection-card">
              <div className="card-top">
                <span className="card-label">
                  <ShieldCheck size={15} /> SAFE LEARNER DISCLOSURE
                </span>
                <span className="card-note">Moderated before publication</span>
              </div>
              <h3>Share a learning question with peers</h3>
              <p className="card-intro">
                Questions submitted here undergo moderator review to keep the learning space free
                of spam, harassment, and unsafe advice.
              </p>

              {communityMessage && (
                <div className="community-status-banner" role="status">
                  {communityMessage}
                </div>
              )}

              <form onSubmit={handleSubmitPost}>
                <textarea
                  aria-label="share a learning question"
                  className="textarea-input"
                  rows={4}
                  placeholder="What is one safe way to practice threat modeling? (20 to 800 characters)"
                  value={postDraft}
                  onChange={(e) => setPostDraft(e.target.value)}
                />
                <div className="card-action-row">
                  <span className="char-count">{postDraft.length} / 800 characters</span>
                  <button
                    type="submit"
                    className="button-primary"
                    disabled={busy || postDraft.trim().length < 20}
                  >
                    {busy ? 'Submitting...' : 'Submit for Review'}
                  </button>
                </div>
              </form>

              {/* Submitted posts */}
              <div className="moderated-posts-list">
                <h4>Recently Shared Questions</h4>
                {posts.length === 0 ? (
                  <p className="empty-notice">No public questions published yet.</p>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="moderated-post-card">
                      <div className="post-header-line">
                        <span className="post-author">{post.author.displayName}</span>
                        {post.status === 'PENDING' ? (
                          <span className="status-chip review">IN REVIEW</span>
                        ) : post.status === 'APPROVED' ? (
                          <span className="status-chip approved">APPROVED</span>
                        ) : (
                          <span className="status-chip hidden">HIDDEN</span>
                        )}
                      </div>
                      <p className="post-body">{post.body}</p>
                      {accountId && !post.isOwn && post.status === 'APPROVED' && (
                        <button
                          className="report-post-button"
                          onClick={() => setReportTarget(reportTarget === post.id ? null : post.id)}
                        >
                          Report post
                        </button>
                      )}
                      {reportTarget === post.id && (
                        <form className="report-form" onSubmit={handleSubmitReport}>
                          <label>
                            Reason
                            <select
                              value={reportReason}
                              onChange={(event) => setReportReason(event.target.value)}
                            >
                              <option value="SPAM">Spam</option>
                              <option value="HARASSMENT">Harassment</option>
                              <option value="PERSONAL_INFORMATION">Personal information</option>
                              <option value="UNSAFE_ADVICE">Unsafe advice</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </label>
                          <label>
                            Details (optional)
                            <input
                              maxLength={300}
                              value={reportDetails}
                              onChange={(event) => setReportDetails(event.target.value)}
                            />
                          </label>
                          <button disabled={busy}>Send report</button>
                        </form>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Admin Moderation Queue (if Admin) */}
          {role === 'ADMIN' && (
            <div className="admin-moderation-queue-panel">
              <div className="panel-header">
                <h3>
                  <ShieldAlert size={18} /> Community Moderation Queue (Admin)
                </h3>
              </div>
              <div className="queue-grid">
                <div>
                  <h4>Pending Posts ({queuePosts.length})</h4>
                  {queuePosts.length === 0 ? (
                    <p className="empty-notice">Queue clear. No pending posts.</p>
                  ) : (
                    queuePosts.map((p) => (
                      <div key={p.id} className="queue-item">
                        <p>{p.body}</p>
                        <div className="queue-actions">
                          <button
                            className="btn-approve"
                            onClick={() => handleModeratePost(p.id, 'APPROVED')}
                            disabled={busy}
                          >
                            Approve
                          </button>
                          <button
                            className="btn-hide"
                            onClick={() => handleModeratePost(p.id, 'HIDDEN')}
                            disabled={busy}
                          >
                            Hide
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div>
                  <h4>Reported Content ({reports.length})</h4>
                  {reports.length === 0 ? (
                    <p className="empty-notice">No open reports.</p>
                  ) : (
                    reports.map((r) => (
                      <div key={r.id} className="queue-item">
                        <p>
                          <strong>Reason:</strong> {r.reason}
                        </p>
                        {r.details && <p>{r.details}</p>}
                        <div className="queue-actions">
                          <button
                            className="btn-approve"
                            onClick={() => handleModerateReport(r.id, 'REVIEWED')}
                            disabled={busy}
                          >
                            Reviewed
                          </button>
                          <button
                            className="btn-hide"
                            onClick={() => handleModerateReport(r.id, 'DISMISSED')}
                            disabled={busy}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {createThreadOpen && (
        <CreateThreadModal
          categories={categories}
          csrfToken={csrfToken}
          onClose={() => setCreateThreadOpen(false)}
          onThreadCreated={handleThreadCreated}
        />
      )}

      {activeThreadSlug && (
        <ThreadDetailModal
          slug={activeThreadSlug}
          csrfToken={csrfToken}
          onClose={() => setActiveThreadSlug(null)}
        />
      )}

      {activeArticleSlug && (
        <ArticleReaderModal
          slug={activeArticleSlug}
          onClose={() => setActiveArticleSlug(null)}
          onSelectRelatedArticle={(slug) => setActiveArticleSlug(slug)}
        />
      )}
    </section>
  )
}
