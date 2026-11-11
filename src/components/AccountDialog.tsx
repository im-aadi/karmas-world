import { useState, type FormEvent } from 'react'
import { ArrowRight, KeyRound, MailCheck, Shield, X } from 'lucide-react'
import { login, register, requestPasswordReset, resendVerification, verifyMfaLogin, type LearnerAccount } from '../data/account'

type Mode = 'login' | 'register' | 'forgot' | 'mfa'
type Props = {
  initialMode: 'login' | 'register'
  onClose: () => void
  onAuthenticated: (user: LearnerAccount, csrfToken: string) => Promise<void>
}

export function AccountDialog({ initialMode, onClose, onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [challengeCsrf, setChallengeCsrf] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if (mode === 'mfa') {
        const result = await verifyMfaLogin(mfaCode.trim(), challengeCsrf)
        await onAuthenticated(result.user, result.csrfToken)
        onClose()
      } else if (mode === 'register') {
        const result = await register(displayName, email, password)
        setPassword('')
        setVerificationSent(true)
        setNotice(result.message)
      } else if (mode === 'forgot') {
        const result = await requestPasswordReset(email)
        setNotice(result.message)
      } else {
        const result = await login(email, password)
        if ('mfaRequired' in result) {
          setChallengeCsrf(result.csrfToken)
          setPassword('')
          setMfaCode('')
          setMode('mfa')
          setNotice('')
        } else {
          await onAuthenticated(result.user, result.csrfToken)
          onClose()
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not complete that account request.')
    } finally {
      setBusy(false)
    }
  }

  async function resendEmail() {
    setError('')
    setBusy(true)
    try {
      const result = await resendVerification(email)
      setNotice(result.message)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not request another verification email.')
    } finally {
      setBusy(false)
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setNotice('')
    setVerificationSent(false)
    setMfaCode('')
    setPassword('')
    setChallengeCsrf('')
  }

  const title = mode === 'register' ? 'Create your free account.' : mode === 'forgot' ? 'Reset your password.' : mode === 'mfa' ? 'Verify it’s you.' : 'Welcome back.'
  const intro = mode === 'register'
    ? 'Save your progress and verify your email to finish setting up your account.'
    : mode === 'forgot'
      ? 'Enter your account email and we’ll send a link if it matches an account.'
      : mode === 'mfa'
        ? 'Enter a code from your authenticator app or use one of your saved recovery codes.'
        : 'Sign in to sync your learning progress.'

  return <div className="account-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-title">
      <button className="account-close" type="button" aria-label="Close account dialog" onClick={onClose}><X size={18} /></button>
      <div className="account-mark"><Shield size={20} /></div>
      <div className="eyebrow"><span className="eyebrow-line" /> YOUR LEARNING SPACE</div>
      <h2 id="account-title">{title}</h2>
      <p className="account-intro">{intro}</p>
      <form className="account-form" onSubmit={submit}>
        {mode === 'register' && <label>Your name<input required minLength={2} maxLength={60} autoComplete="name" value={displayName} onChange={event => setDisplayName(event.target.value)} /></label>}
        {mode !== 'mfa' && <label>Email address<input required type="email" maxLength={254} autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} /></label>}
        {(mode === 'login' || mode === 'register') && <label>Password<input required type="password" minLength={mode === 'register' ? 15 : 1} maxLength={128} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} />{mode === 'register' && <small>Use at least 15 characters.</small>}</label>}
        {mode === 'mfa' && <label>Authenticator or recovery code<input required autoFocus autoComplete="one-time-code" inputMode="text" maxLength={32} value={mfaCode} onChange={event => setMfaCode(event.target.value)} /></label>}
        {error && <p className="account-error" role="alert">{error}</p>}
        {notice && <p className="account-notice-inline" role="status">{notice}</p>}
        <button className="button-primary account-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset email' : mode === 'mfa' ? 'Verify and sign in' : 'Sign in'} {mode === 'mfa' ? <KeyRound size={15} /> : <ArrowRight size={15} />}</button>
      </form>
      {(verificationSent || mode === 'login') && <button className="resend-verification" type="button" onClick={() => void resendEmail()} disabled={busy}><MailCheck size={14} /> Resend verification email</button>}
      <div className="account-switch">{mode === 'register'
        ? <>Already learning here? <button type="button" onClick={() => switchMode('login')}>Sign in</button></>
        : mode === 'forgot' || mode === 'mfa'
          ? <button type="button" onClick={() => switchMode('login')}>Back to sign in</button>
          : <><button type="button" onClick={() => switchMode('forgot')}>Forgot password?</button><span>New to Karma’s World?</span><button type="button" onClick={() => switchMode('register')}>Create a free account</button></>}
      </div>
      <p className="account-privacy">Your password is stored as a secure hash. Verification and reset links expire and can only be used once.</p>
    </section>
  </div>
}
