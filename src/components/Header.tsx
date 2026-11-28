import { useState, useRef, useEffect } from 'react'
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  Gamepad2,
  Github,
  GraduationCap,
  Linkedin,
  Mail,
  Menu,
  MessageSquare,
  MessageSquarePlus,
  Newspaper,
  Shield,
  ShieldAlert,
  TrendingUp,
  X,
} from 'lucide-react'
import type { LearnerAccount } from '../data/account'

const primaryLinks = [
  ['Home', '#home', 'home'],
  ['Courses', '#catalog', 'catalog'],
  ['Labs', '#labs', 'labs'],
  ['Visualizers', '#visualizers', 'visualizers'],
  ['Quizzes', '#quizzes', 'quizzes'],
  ['Practice', '#practice', 'practice'],
]

const exploreLinks = [
  { label: 'Learn Academy', href: '#academy', viewKey: 'academy', icon: GraduationCap, desc: 'Curriculum & structured lessons' },
  { label: 'Cyber Glossary', href: '#glossary', viewKey: 'glossary', icon: BookOpen, desc: '100+ cybersecurity terms & concepts' },
  { label: 'Arcade Games', href: '#games', viewKey: 'games', icon: Gamepad2, desc: 'Interactive defense minigames' },
  { label: 'My Progress', href: '#dashboard', viewKey: 'dashboard', icon: TrendingUp, desc: 'Tracker, stats & completion records' },
  { label: 'Security Briefs', href: '#updates', viewKey: 'updates', icon: Newspaper, desc: 'Threat advisories & patch updates' },
  { label: 'Community Hub', href: '#community', viewKey: 'community', icon: MessageSquare, desc: 'Discussion forums & peer knowledge' },
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
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isExploreActive = exploreLinks.some(link => link.viewKey === currentView)
  const isAdmin = account?.role === 'ADMIN'

  return (
    <header className="topbar">
      <a className="brand" href="#home" aria-label="Karma's World home">
        <span className="brand-mark"><Shield size={18} strokeWidth={2.4} /></span>
        <span>KARMA'S<span className="brand-light">WORLD</span></span>
      </a>

      {/* Desktop & Mobile Navigation */}
      <nav className={open ? 'nav-links nav-open' : 'nav-links'} aria-label="Main navigation">
        {/* Mobile Header Title */}
        {open && (
          <div className="mobile-nav-header">
            <span className="mobile-nav-title">Navigation Menu</span>
          </div>
        )}

        {/* Primary Links */}
        <div className="nav-primary-group">
          {primaryLinks.map(([label, href, viewKey]) => (
            <a
              key={label}
              href={href}
              className={currentView === viewKey ? 'nav-link active' : 'nav-link'}
              onClick={() => {
                setOpen(false)
                setDropdownOpen(false)
              }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Desktop Explore Dropdown */}
        <div className="nav-dropdown" ref={dropdownRef}>
          <button
            type="button"
            className={`nav-dropdown-trigger ${isExploreActive ? 'active' : ''}`}
            onClick={() => setDropdownOpen(prev => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <span>Explore</span>
            <ChevronDown size={14} className={`dropdown-chevron ${dropdownOpen ? 'rotate' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="nav-dropdown-menu" role="menu">
              <div className="dropdown-section-title">Academy & Resources</div>
              {exploreLinks.map(item => {
                const Icon = item.icon
                const isActive = currentView === item.viewKey
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    role="menuitem"
                    className={`nav-dropdown-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setDropdownOpen(false)
                      setOpen(false)
                    }}
                  >
                    <span className="dropdown-item-icon">
                      <Icon size={15} />
                    </span>
                    <div className="dropdown-item-text">
                      <span className="dropdown-item-label">{item.label}</span>
                      <span className="dropdown-item-desc">{item.desc}</span>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>

        {/* Feedback Quick Link */}
        <a
          href="#feedback"
          className={`nav-feedback-btn ${currentView === 'feedback' ? 'active' : ''}`}
          onClick={() => {
            setOpen(false)
            setDropdownOpen(false)
          }}
          title="Share feedback, feature requests, or bug reports"
        >
          <MessageSquarePlus size={14} />
          <span>Feedback</span>
        </a>

        {/* Admin Link/Badge */}
        {isAdmin ? (
          <a
            href="#admin"
            className={`nav-admin-badge ${currentView === 'admin' ? 'active' : ''}`}
            onClick={() => {
              setOpen(false)
              setDropdownOpen(false)
            }}
            title="Admin Management Console"
          >
            <ShieldAlert size={13} />
            <span>Admin</span>
          </a>
        ) : (
          <a
            href="#admin"
            className={`nav-admin-link ${currentView === 'admin' ? 'active' : ''}`}
            onClick={() => {
              setOpen(false)
              setDropdownOpen(false)
            }}
            title="Admin Login Gateway"
          >
            <ShieldAlert size={13} />
            <span>Admin</span>
          </a>
        )}

        {/* Mobile-Only Explore Items Expanded List */}
        <div className="mobile-explore-section">
          <div className="mobile-section-heading">Explore Resources</div>
          <div className="mobile-explore-grid">
            {exploreLinks.map(item => {
              const Icon = item.icon
              const isActive = currentView === item.viewKey
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`mobile-explore-link ${isActive ? 'active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </a>
              )
            })}
            <a
              href="#admin"
              className={`mobile-explore-link ${currentView === 'admin' ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <ShieldAlert size={15} />
              <span>Admin Gateway</span>
            </a>
          </div>
        </div>

        {/* Mobile Creator Links */}
        <div className="mobile-creator-links">
          <div className="mobile-section-heading">Platform Creator & Support</div>
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

        {/* Mobile Account Actions */}
        <div className="mobile-auth-actions">
          {account ? (
            <>
              <div className="mobile-user-greeting">Signed in as <strong>{account.displayName}</strong></div>
              <button className="mobile-nav-action" onClick={() => { setOpen(false); onSettings() }}>Account settings</button>
              <button className="mobile-nav-action mobile-signout" onClick={() => { setOpen(false); onLogout() }}>Sign out</button>
            </>
          ) : (
            <>
              <button className="mobile-nav-action primary" onClick={() => { setOpen(false); onLogin() }}>Log in</button>
              <button className="mobile-nav-action" onClick={() => { setOpen(false); onRegister() }}>Create account</button>
            </>
          )}
        </div>
      </nav>

      {/* Right Desktop Nav Actions */}
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

        {account ? (
          <div className="user-nav-profile">
            <span className="account-greeting">Hi, {account.displayName.split(' ')[0]}</span>
            <button className="login-link settings-btn" onClick={onSettings}>Account settings</button>
            <button className="login-link signout-btn" onClick={onLogout}>Sign out</button>
          </div>
        ) : (
          <>
            <button className="login-link" onClick={onLogin}>Log in</button>
            <button className="nav-cta" onClick={onRegister}>Create account <ArrowUpRight size={15} /></button>
          </>
        )}
      </div>

      <button
        className="menu-toggle"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
    </header>
  )
}
