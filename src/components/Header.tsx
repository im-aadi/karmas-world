import { useState } from 'react'
import { ArrowUpRight, Menu, Shield, X } from 'lucide-react'
import type { LearnerAccount } from '../data/account'

const links = [
  ['Courses', '#catalog'], ['Labs', '#labs'], ['My progress', '#dashboard'], ['Learn', '#academy'], ['Glossary', '#glossary'], ['Games', '#games'], ['Practice', '#practice'], ['Updates', '#updates'], ['Community', '#community'],
]

type Props = { account: LearnerAccount | null; onLogin: () => void; onRegister: () => void; onLogout: () => void; onSettings: () => void }

export function Header({ account, onLogin, onRegister, onLogout, onSettings }: Props) {
  const [open, setOpen] = useState(false)
  const visibleLinks = account?.role === 'ADMIN' ? [...links, ['Admin', '#admin']] : links
  return <header className="topbar">
    <a className="brand" href="#home" aria-label="Karma's World home"><span className="brand-mark"><Shield size={18} strokeWidth={2.4} /></span><span>KARMA'S<span className="brand-light">WORLD</span></span></a>
    <nav className={open ? 'nav-links nav-open' : 'nav-links'} aria-label="Main navigation">
      {visibleLinks.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)}>{label}</a>)}
      {account && <button className="mobile-nav-action" onClick={() => { setOpen(false); onSettings() }}>Account settings</button>}
      {account && <button className="mobile-nav-action" onClick={() => { setOpen(false); onLogout() }}>Sign out</button>}
      {!account && <button className="mobile-nav-action" onClick={() => { setOpen(false); onLogin() }}>Log in</button>}
      {!account && <button className="mobile-nav-action" onClick={() => { setOpen(false); onRegister() }}>Create account</button>}
    </nav>
    <div className="nav-actions">{account ? <><span className="account-greeting">Hi, {account.displayName.split(' ')[0]}</span><button className="login-link" onClick={onSettings}>Account settings</button><button className="login-link" onClick={onLogout}>Sign out</button></> : <><button className="login-link" onClick={onLogin}>Log in</button><button className="nav-cta" onClick={onRegister}>Create account <ArrowUpRight size={15} /></button></>}</div>
    <button className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
  </header>
}
