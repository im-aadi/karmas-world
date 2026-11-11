import { useState, type FormEvent } from 'react'
import { ArrowRight, KeyRound, MailCheck, Shield, X } from 'lucide-react'
import { completePasswordReset, confirmEmailChange, confirmEmailVerification } from '../data/account'

type Action = { type: 'verify' | 'reset' | 'change-email'; token: string }
type Props = { action: Action; onClose: () => void; onSignIn: () => void; onPasswordReset: () => Promise<void>; onEmailChange: () => Promise<void> }

export function AccountActionDialog({ action, onClose, onSignIn, onPasswordReset, onEmailChange }: Props) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [complete, setComplete] = useState(false)
  const [busy, setBusy] = useState(false)

  async function verifyEmail() {
    setError('')
    setBusy(true)
    try {
      const result = await confirmEmailVerification(action.token)
      setMessage(result.message)
      setComplete(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not verify that email link.')
    } finally {
      setBusy(false)
    }
  }

  async function verifyEmailChange() {
    setError('')
    setBusy(true)
    try {
      const result = await confirmEmailChange(action.token)
      setMessage(result.message)
      setComplete(true)
      await onEmailChange()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not confirm this email change.')
    } finally { setBusy(false) }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.')
      return
    }
    setBusy(true)
    try {
      const result = await completePasswordReset(action.token, newPassword)
      setMessage(result.message)
      setComplete(true)
      setNewPassword('')
      setConfirmPassword('')
      await onPasswordReset()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not reset your password.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="account-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-action-title">
      <button className="account-close" type="button" aria-label="Close account action" onClick={onClose}><X size={18} /></button>
      <div className="account-mark">{action.type !== 'reset' ? <MailCheck size={20} /> : <KeyRound size={20} />}</div>
      <div className="eyebrow"><span className="eyebrow-line" /> YOUR LEARNING SPACE</div>
      <h2 id="account-action-title">{action.type === 'verify' ? 'Verify your email.' : action.type === 'change-email' ? 'Confirm your new email.' : 'Choose a new password.'}</h2>
      <p className="account-intro">{action.type === 'verify' ? 'Confirm your email address to finish creating your account.' : action.type === 'change-email' ? 'Confirm this address to update your account. You’ll be signed out and can sign back in with the new email.' : 'Your reset link is valid for one hour and can only be used once.'}</p>
      {action.type === 'reset' && !complete && <form className="account-form" onSubmit={event => void resetPassword(event)}>
        <label>New password<input required type="password" minLength={15} maxLength={128} autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} /><small>Use 15 to 128 characters.</small></label>
        <label>Confirm new password<input required type="password" minLength={15} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>
        {error && <p className="account-error" role="alert">{error}</p>}
        <button className="button-primary account-submit" type="submit" disabled={busy}>{busy ? 'Updating…' : 'Reset password'} <ArrowRight size={15} /></button>
      </form>}
      {action.type === 'verify' && !complete && <>
        {error && <p className="account-error" role="alert">{error}</p>}
        <button className="button-primary account-submit" type="button" onClick={() => void verifyEmail()} disabled={busy}>{busy ? 'Verifying…' : 'Verify email'} <ArrowRight size={15} /></button>
      </>}
      {action.type === 'change-email' && !complete && <>
        {error && <p className="account-error" role="alert">{error}</p>}
        <button className="button-primary account-submit" type="button" onClick={() => void verifyEmailChange()} disabled={busy}>{busy ? 'Confirming…' : 'Confirm email change'} <ArrowRight size={15} /></button>
      </>}
      {message && <p className="account-notice-inline" role="status">{message}</p>}
      {complete && <button className="button-primary account-submit" type="button" onClick={onSignIn}>Sign in <ArrowRight size={15} /></button>}
      <p className="account-privacy"><Shield size={12} /> {action.type === 'change-email' ? 'If this link expires, sign in with your current email and request another change.' : 'If this link is expired or already used, request a fresh one from the sign-in window.'}</p>
    </section>
  </div>
}
