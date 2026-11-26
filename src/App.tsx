import { useEffect, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Check, Globe2, LockKeyhole, Radio, Shield, ShieldCheck, Sparkles, TerminalSquare } from 'lucide-react'
import { Header } from './components/Header'
import { AccountDialog } from './components/AccountDialog'
import { AccountSettingsDialog } from './components/AccountSettingsDialog'
import { AccountActionDialog } from './components/AccountActionDialog'
import { getCsrfToken, getCurrentAccount, logout, syncLearningProgress, type LearnerAccount } from './data/account'
import { clearAccountLearningProgress, setProgressAccountId } from './data/progress'
import { clearPrivateReflections } from './data/reflections'
import { PathCard } from './components/PathCard'
import { learningPaths } from './data/paths'
import { CourseCatalog } from './components/CourseCatalog'
import type { CatalogCourse } from './data/catalog'
import { LabCatalog } from './components/labs/LabCatalog'
import { InteractiveVisualizersSection } from './components/visualizers/InteractiveVisualizersSection'
import { QuizCatalog } from './components/quizzes/QuizCatalog'
import { LearningAcademy } from './components/LearningAcademy'
import { CyberGames } from './components/CyberGames'
import { PracticeLab } from './components/PracticeLab'
import { StudentDashboard } from './components/StudentDashboard'
import { CommunityCorner } from './components/CommunityCorner'
import { SecurityBrief } from './components/SecurityBrief'
import { AdminOverview } from './components/AdminOverview'
import { Glossary } from './components/Glossary'
import { downloadLearnerData } from './data/learnerExport'

function parseHash(hash: string): string {
  const raw = hash.replace(/^#\/?/, '').trim().toLowerCase()
  if (!raw || raw === 'home' || raw === 'paths') return 'home'
  if (raw === 'courses') return 'catalog'
  if (raw === 'learn') return 'academy'
  if (raw === 'brief' || raw === 'news') return 'updates'
  return raw
}

function App() {
  const [currentView, setCurrentView] = useState<string>(() => parseHash(window.location.hash))
  const [account, setAccount] = useState<LearnerAccount | null>(null)
  const [csrfToken, setCsrfToken] = useState('')
  const [accountMode, setAccountMode] = useState<'login' | 'register' | null>(null)
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false)
  const [accountAction, setAccountAction] = useState<{ type: 'verify' | 'reset' | 'change-email'; token: string } | null>(null)
  const [accountNotice, setAccountNotice] = useState('')
  const [lessonRequest, setLessonRequest] = useState<{ courseId: string; lessonIndex: number } | null>(null)

  useEffect(() => {
    let active = true
    async function initializeAccount() {
      try {
        const token = await getCsrfToken()
        const user = await getCurrentAccount()
        if (!active) return
        setCsrfToken(token)
        setAccount(user)
        setProgressAccountId(user?.id ?? null)
        if (user) {
          await syncLearningProgress(token)
          if (active) setAccountNotice('Your learning progress is synced.')
        }
      } catch {
        if (active) setAccountNotice('Accounts are temporarily unavailable. You can keep learning on this device.')
      }
    }
    void initializeAccount()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const url = new URL(window.location.href)
    const verificationToken = url.searchParams.get('verify')
    const resetToken = url.searchParams.get('reset')
    const emailChangeToken = url.searchParams.get('changeEmail')
    if (verificationToken) setAccountAction({ type: 'verify', token: verificationToken })
    else if (resetToken) setAccountAction({ type: 'reset', token: resetToken })
    else if (emailChangeToken) setAccountAction({ type: 'change-email', token: emailChangeToken })
    if (verificationToken || resetToken || emailChangeToken) {
      url.searchParams.delete('verify')
      url.searchParams.delete('reset')
      url.searchParams.delete('changeEmail')
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    }
  }, [])

  async function handleAuthenticated(user: LearnerAccount, token: string) {
    setProgressAccountId(user.id)
    setAccount(user)
    setCsrfToken(token)
    setAccountNotice('')
    try {
      await syncLearningProgress(token)
      setAccountNotice('Your learning progress is synced.')
    } catch {
      setAccountNotice(`Welcome, ${user.displayName}! Active in Local Learner mode (progress saved in this browser).`)
    }
  }

  async function handleLogout() {
    try {
      await logout(csrfToken)
      setAccount(null)
      setProgressAccountId(null)
      setCsrfToken(await getCsrfToken())
      setAccountNotice('Signed out. New progress will stay on this device.')
    } catch {
      setAccountNotice('Could not sign out just now. Please try again.')
    }
  }

  async function handlePasswordResetComplete() {
    setAccount(null)
    setProgressAccountId(null)
    try { setCsrfToken(await getCsrfToken()) } catch { setCsrfToken('') }
  }

  async function handleEmailChangeComplete() {
    setAccount(null)
    setProgressAccountId(null)
    setAccountSettingsOpen(false)
    setAccountMode(null)
    try { setCsrfToken(await getCsrfToken()) } catch { setCsrfToken('') }
    setAccountNotice('Your email has been updated. Sign in again with the new address.')
  }

  async function handleAccountDeleted(accountId: string) {
    const progressCleared = clearAccountLearningProgress(accountId)
    const reflectionsCleared = clearPrivateReflections(accountId)
    const browserDataCleared = progressCleared && reflectionsCleared
    setAccount(null)
    setProgressAccountId(null)
    setAccountSettingsOpen(false)
    try { setCsrfToken(await getCsrfToken()) } catch { setCsrfToken('') }
    setAccountNotice(browserDataCleared
      ? 'Your account and its saved data have been deleted.'
      : 'Your account and server data were deleted, but this browser could not clear its saved data.')
  }

  function handleAccountActionSignIn() {
    setAccountAction(null)
    setAccountMode('login')
  }

  useEffect(() => {
    function onHashChange() {
      const target = parseHash(window.location.hash)
      setCurrentView(target)
      if (window.location.hash !== '#paths') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        const el = document.getElementById('paths')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function handleStartCatalogCourse(course: CatalogCourse) {
    const targetCourseId = course.academyCourseId || course.id
    setLessonRequest({ courseId: targetCourseId, lessonIndex: 0 })
    setCurrentView('academy')
    window.location.hash = '#academy'
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setAccountNotice(`🚀 Interactive Course Active: "${course.title}" — Starting with Lesson 01 below!`)
  }

  return <div id="home" className="site-shell">
    <div className="announcement"><span className="live-dot" /> YOUR NEXT CHAPTER STARTS HERE <span className="announcement-sep">/</span> 100% FREE, ALWAYS <ArrowUpRight size={13} /></div>
    <Header account={account} currentView={currentView} onLogin={() => setAccountMode('login')} onRegister={() => setAccountMode('register')} onLogout={() => void handleLogout()} onSettings={() => setAccountSettingsOpen(true)} />
    {accountNotice && <div className="account-notice" role="status">{accountNotice}</div>}
    {accountMode && <AccountDialog initialMode={accountMode} onClose={() => setAccountMode(null)} onAuthenticated={handleAuthenticated} />}
    {account && accountSettingsOpen && <AccountSettingsDialog account={account} csrfToken={csrfToken} onClose={() => setAccountSettingsOpen(false)} onUpdated={(user, token) => { setAccount(user); if (token) setCsrfToken(token) }} onDeleted={handleAccountDeleted} />}
    {accountAction && <AccountActionDialog action={accountAction} onClose={() => setAccountAction(null)} onSignIn={handleAccountActionSignIn} onPasswordReset={handlePasswordResetComplete} onEmailChange={handleEmailChangeComplete} />}
    <main>
      {currentView !== 'home' && (
        <div className="view-breadcrumb wrap" style={{ padding: '24px 0 10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#929eaa' }}>
          <a href="#home" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--mint)', fontWeight: 600 }}>
            ← Home
          </a>
          <span>/</span>
          <span style={{ textTransform: 'capitalize', color: '#eef2f0', fontWeight: 600 }}>
            {currentView === 'catalog' ? 'Courses & Pathways' : currentView === 'dashboard' ? 'My Progress & Certifications' : currentView === 'academy' ? 'Learning Academy' : currentView === 'updates' ? 'Security Brief' : currentView}
          </span>
        </div>
      )}

      {currentView === 'home' && (
        <>
          <section className="hero wrap">
            <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> THE OPEN CYBER ACADEMY</div>
              <h1>Curiosity is<br />your <span className="accent-word">superpower.</span></h1>
              <p className="hero-lede">A safer digital world starts with people who know how to protect it. Learn the skills, understand the threats, and find your place in cybersecurity.</p>
              <div className="hero-actions"><a className="button-primary" href="#paths">Explore learning paths <ArrowRight size={17} /></a><a className="text-link" href="#practice">See how it works <ArrowDown size={15} /></a></div>
              <div className="hero-note"><span className="note-icon"><Check size={13} /></span> No experience needed <span className="note-dot">·</span> No paywall. Ever.</div>
            </div>
            <div className="hero-art" aria-label="Illustration of a digital security shield" role="img">
              <div className="art-grid" /><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
              <div className="orbit-label label-a"><span /> SYSTEMS / SECURE</div><div className="orbit-label label-b">01 — 03 <span>PATHWAYS</span></div>
              <div className="shield-glow"><div className="shield-shape"><ShieldCheck size={96} strokeWidth={1.15} /></div></div>
              <div className="floating-chip chip-top"><span className="chip-pulse" /> LEARNING MODE <b>ON</b></div><div className="floating-chip chip-bottom"><span className="chip-square"><LockKeyhole size={14} /></span> YOUR SPACE TO PRACTICE</div>
              <div className="art-cross cross-one">+</div><div className="art-cross cross-two">+</div>
            </div>
            <div className="hero-index"><span>01</span><i /> ACADEMY / OPEN ACCESS</div>
          </section>
          <section className="proof-strip wrap" aria-label="Academy features"><div><Globe2 /><span>OPEN TO EVERYONE</span></div><div><BookOpen /><span>LEARN AT YOUR PACE</span></div><div><ShieldCheck /><span>SAFE BY DESIGN</span></div><div><Sparkles /><span>BUILT FOR CURIOSITY</span></div></section>
          <section id="paths" className="paths-section"><div className="wrap"><div className="section-head"><div><div className="eyebrow"><span className="eyebrow-line" /> FIND YOUR STARTING POINT</div><h2>Choose a path.<br /><span>Make it yours.</span></h2></div><p>Small steps become serious skills. Pick a guided path and learn by doing, one idea at a time.</p></div>
            <div className="path-grid">{learningPaths.map(path => <PathCard key={path.number} path={path} />)}</div>
            <a className="all-paths" href="#academy">Explore the academy <ArrowRight size={16} /></a>
          </div></section>
          <section id="practice" className="practice-section wrap"><div className="practice-copy"><div className="eyebrow"><span className="eyebrow-line" /> LEARNING THAT STICKS</div><h2>Read a little.<br /><span>Try a lot.</span></h2><p>Cybersecurity makes more sense when you can explore it. Follow guided lessons, check your understanding, and build confidence in safe simulations.</p><a className="text-link" href="#paths">Find your first lesson <ArrowRight size={15} /></a></div>
            <div className="practice-panel"><div className="panel-header"><span><span className="live-dot" /> PRACTICE SPACE</span><span>SIMULATION / 001</span></div><div className="terminal-content"><div className="terminal-glyph"><TerminalSquare size={31} /></div><p className="terminal-prompt">$ learn --by-doing</p><div className="terminal-rule" /><div className="terminal-row"><span><Radio /> Guided simulations</span><Check /></div><div className="terminal-row"><span><ShieldCheck /> Safe, controlled practice</span><Check /></div><div className="terminal-row"><span><BookOpen /> Lessons for every level</span><Check /></div></div><div className="panel-foot">A GOOD PLACE TO ASK “WHAT IF?” <span>↗</span></div></div>
          </section>
        </>
      )}

      {currentView === 'catalog' && (
        <CourseCatalog onStartCourse={handleStartCatalogCourse} />
      )}

      {currentView === 'labs' && (
        <LabCatalog csrfToken={csrfToken} />
      )}

      {currentView === 'visualizers' && (
        <InteractiveVisualizersSection />
      )}

      {currentView === 'quizzes' && (
        <QuizCatalog csrfToken={csrfToken} />
      )}

      {currentView === 'dashboard' && (
        <StudentDashboard displayName={account?.displayName} signedIn={Boolean(account)} csrfToken={csrfToken} onSignIn={() => setAccountMode('login')} onExport={() => downloadLearnerData(account)} />
      )}

      {currentView === 'academy' && (
        <LearningAcademy accountId={account?.id ?? null} csrfToken={csrfToken} lessonRequest={lessonRequest} />
      )}

      {currentView === 'glossary' && (
        <Glossary onOpenLesson={(courseId, lessonIndex) => {
          setLessonRequest({ courseId, lessonIndex })
          setCurrentView('academy')
          window.location.hash = '#academy'
        }} />
      )}

      {currentView === 'games' && (
        <CyberGames />
      )}

      {currentView === 'practice' && (
        <PracticeLab />
      )}

      {currentView === 'updates' && (
        <SecurityBrief />
      )}

      {currentView === 'community' && (
        <CommunityCorner accountId={account?.id ?? null} role={account?.role ?? null} csrfToken={csrfToken} onSignIn={() => setAccountMode('login')} />
      )}

      {currentView === 'admin' && account?.role === 'ADMIN' && (
        <AdminOverview csrfToken={csrfToken} />
      )}
    </main>
    <footer className="footer wrap"><a className="brand" href="#home"><span className="brand-mark"><Shield size={16} /></span><span>KARMA'S<span className="brand-light">WORLD</span></span></a><p>Learn. Explore. Defend.</p><span>© 2026 KARMA'S WORLD · MADE FOR THE CURIOUS</span></footer>
  </div>
}

export default App
