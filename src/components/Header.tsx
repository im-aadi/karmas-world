import { useState } from 'react'
import { ArrowUpRight, Github, Linkedin, Mail, Menu, Shield, X } from 'lucide-react'
import type { LearnerAccount } from '../data/account'

const links = [
  ['Home', '#home', 'home'],
  ['Courses', '#catalog', 'catalog'],
  ['Labs', '#labs', 'labs'],
  ['Visualizers', '#visualizers', 'visualizers'],
  ['Quizzes', '#quizzes', 'quizzes'],
  ['My progress', '#dashboard', 'dashboard'],
  ['Learn', '#academy', 'academy'],
  ['Glossary', '#glossary', 'glossary'],
  ['Games', '#games', 'games'],
  ['Practice', '#practice', 'practice'],
  ['Updates', '#updates', 'updates'],
  ['Community', '#community', 'community'],
  ['Feedback', '#feedback', 'feedback'],
]

type Props = {
  account: LearnerAccount | null
  currentView?: string
  onLogin: () => void
  onRegister: () => void
  onLogout: () => void
  onSettings: () => void
}

export function Header({ account, currentView = 'home', onLogin, onRegister, onLogout, onSettings }: Props) {
  const [open, setOpen] = useState(false)
  const visibleLinks = account?.role === 'ADMIN' ? [...links, ['Admin', '#admin', 'admin']] : links
  return <header className="topbar">
    <a className="brand" href="#home" aria-label="Karma's World home"><span className="brand-mark"><Shield size={18} strokeWidth={2.4} /></span><span>KARMA'S<span className="brand-light">WORLD</span></span></a>
    <nav className={open ? 'nav-links nav-open' : 'nav-links'} aria-label="Main navigation">
      {visibleLinks.map(([label, href, viewKey]) => (
        <a
          key={label}
          href={href}
          className={currentView === viewKey ? 'nav-link active' : 'nav-link'}
          onClick={() => setOpen(false)}
        >
          {label}
        </a>
      ))}
      <div className="mobile-creator-links">
        <a
          href="mailto:adityakumar748847@gmail.com"
          className="mobile-creator-link"
          aria-label="Email Aditya Kumar"
        >
          <Mail size={15} /> adityakumar748847@gmail.com
        </a>
        <a
          href="https://github.com/im-aadi"
          target="_blank"
          rel="noopener noreferrer"
          className="mobile-creator-link"
          aria-label="GitHub Profile (im-aadi)"
        >
          <Github size={15} /> GitHub / im-aadi
        </a>
        <a
          href="https://www.linkedin.com/in/aditya-kumar-250131263/"
          target="_blank"
          rel="noopener noreferrer"
          className="mobile-creator-link"
          aria-label="LinkedIn Profile (Aditya Kumar)"
        >
          <Linkedin size={15} /> LinkedIn / Aditya Kumar
        </a>
      </div>
      {account && <button className="mobile-nav-action" onClick={() => { setOpen(false); onSettings() }}>Account settings</button>}
      {account && <button className="mobile-nav-action" onClick={() => { setOpen(false); onLogout() }}>Sign out</button>}
      {!account && <button className="mobile-nav-action" onClick={() => { setOpen(false); onLogin() }}>Log in</button>}
      {!account && <button className="mobile-nav-action" onClick={() => { setOpen(false); onRegister() }}>Create account</button>}
    </nav>
    <div className="nav-actions">
      <div className="nav-social-links" aria-label="Creator Profiles & Contact">
        <a
          href="mailto:adityakumar748847@gmail.com?subject=[Karma's%20World]"
          className="header-social-btn"
          title="Email Aditya Kumar (adityakumar748847@gmail.com)"
          aria-label="Email Aditya Kumar"
        >
          <Mail size={15} />
        </a>
        <a
          href="https://github.com/im-aadi"
          target="_blank"
          rel="noopener noreferrer"
          className="header-social-btn"
          title="Aditya Kumar on GitHub (@im-aadi)"
          aria-label="GitHub Profile"
        >
          <Github size={15} />
        </a>
        <a
          href="https://www.linkedin.com/in/aditya-kumar-250131263/"
          target="_blank"
          rel="noopener noreferrer"
          className="header-social-btn"
          title="Aditya Kumar on LinkedIn"
          aria-label="LinkedIn Profile"
        >
          <Linkedin size={15} />
        </a>
      </div>
      {account ? <><span className="account-greeting">Hi, {account.displayName.split(' ')[0]}</span><button className="login-link" onClick={onSettings}>Account settings</button><button className="login-link" onClick={onLogout}>Sign out</button></> : <><button className="login-link" onClick={onLogin}>Log in</button><button className="nav-cta" onClick={onRegister}>Create account <ArrowUpRight size={15} /></button></>}
    </div>
    <button className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
  </header>
}
