import { useEffect, useState, type FormEvent } from 'react'
import { Activity, Check, Copy, KeyRound, LogOut, MailCheck, MonitorSmartphone, Save, Shield, ShieldCheck, Trash2, X } from 'lucide-react'
import { changePassword, deleteOwnAccount, disableMfa, enableMfa, getActiveSessions, getSecurityActivity, requestEmailChange, revokeActiveSession, revokeOtherSessions, rotateMfaRecoveryCodes, startMfaSetup, updateProfile, type ActiveSession, type LearnerAccount, type SecurityActivityEvent, type SecurityEventType } from '../data/account'

type Props = {
  account: LearnerAccount
  csrfToken: string
  onClose: () => void
  onUpdated: (account: LearnerAccount, csrfToken?: string) => void
  onDeleted: (accountId: string) => Promise<void>
}

export function AccountSettingsDialog({ account, csrfToken, onClose, onUpdated, onDeleted }: Props) {
  const [displayName, setDisplayName] = useState(account.displayName)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileBusy, setProfileBusy] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailChangePassword, setEmailChangePassword] = useState('')
  const [emailChangeMfaCode, setEmailChangeMfaCode] = useState('')
  const [emailChangeMessage, setEmailChangeMessage] = useState('')
  const [emailChangeError, setEmailChangeError] = useState('')
  const [emailChangeBusy, setEmailChangeBusy] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMfaCode, setPasswordMfaCode] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [deleteExpanded, setDeleteExpanded] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteMfaCode, setDeleteMfaCode] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [mfaSetupPassword, setMfaSetupPassword] = useState('')
  const [mfaConfirmPassword, setMfaConfirmPassword] = useState('')
  const [mfaConfirmCode, setMfaConfirmCode] = useState('')
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; provisioningUri: string } | null>(null)
  const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState<string[] | null>(null)
  const [mfaEnabledOverride, setMfaEnabledOverride] = useState<boolean | null>(null)
  const mfaEnabled = mfaEnabledOverride ?? Boolean(account.mfaEnabled)
  const [mfaDisablePassword, setMfaDisablePassword] = useState('')
  const [mfaDisableCode, setMfaDisableCode] = useState('')
  const [rotateCodesExpanded, setRotateCodesExpanded] = useState(false)
  const [rotateCodesPassword, setRotateCodesPassword] = useState('')
  const [rotateCodesFactor, setRotateCodesFactor] = useState('')
  const [mfaMessage, setMfaMessage] = useState('')
  const [mfaError, setMfaError] = useState('')
  const [mfaBusy, setMfaBusy] = useState(false)
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsBusy, setSessionsBusy] = useState(false)
  const [sessionsMessage, setSessionsMessage] = useState('')
  const [sessionsError, setSessionsError] = useState('')
  const [securityActivity, setSecurityActivity] = useState<SecurityActivityEvent[]>([])
  const [securityActivityLoading, setSecurityActivityLoading] = useState(true)
  const [securityActivityError, setSecurityActivityError] = useState('')

  async function refreshSessions() {
    setSessionsLoading(true)
    setSessionsError('')
    try {
      setSessions(await getActiveSessions())
    } catch (error) {
      setSessionsError(error instanceof Error ? error.message : 'Could not load active sessions.')
    } finally { setSessionsLoading(false) }
  }

  async function refreshSecurityActivity() {
    setSecurityActivityLoading(true)
    setSecurityActivityError('')
    try {
      setSecurityActivity(await getSecurityActivity())
    } catch (error) {
      setSecurityActivityError(error instanceof Error ? error.message : 'Could not load security activity.')
    } finally { setSecurityActivityLoading(false) }
  }

  useEffect(() => { void refreshSessions(); void refreshSecurityActivity() }, [])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileError('')
    setProfileMessage('')
    setProfileBusy(true)
    try {
      const result = await updateProfile(displayName, csrfToken)
      setDisplayName(result.user.displayName)
      onUpdated(result.user)
      setProfileMessage('Your display name has been updated.')
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not update your profile.')
    } finally {
      setProfileBusy(false)
    }
  }

  async function submitEmailChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEmailChangeError('')
    setEmailChangeMessage('')
    setEmailChangeBusy(true)
    try {
      const result = mfaEnabled
        ? await requestEmailChange(newEmail, emailChangePassword, csrfToken, emailChangeMfaCode)
        : await requestEmailChange(newEmail, emailChangePassword, csrfToken)
      setNewEmail('')
      setEmailChangePassword('')
      setEmailChangeMfaCode('')
      setEmailChangeMessage(result.message)
      void refreshSecurityActivity()
    } catch (error) {
      setEmailChangeError(error instanceof Error ? error.message : 'Could not request an email change.')
    } finally { setEmailChangeBusy(false) }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError('')
    setPasswordMessage('')
    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match.')
      return
    }
    setPasswordBusy(true)
    try {
      const result = mfaEnabled
        ? await changePassword(currentPassword, newPassword, csrfToken, passwordMfaCode)
        : await changePassword(currentPassword, newPassword, csrfToken)
      onUpdated(result.user, result.csrfToken)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMfaCode('')
      void refreshSessions()
      void refreshSecurityActivity()
      setPasswordMessage('Password updated. Other signed-in devices have been signed out.')
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Could not change your password.')
    } finally {
      setPasswordBusy(false)
    }
  }

  async function confirmAccountDeletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDeleteError('')
    setDeleteBusy(true)
    try {
      if (mfaEnabled) await deleteOwnAccount(deletePassword, csrfToken, deleteMfaCode)
      else await deleteOwnAccount(deletePassword, csrfToken)
      await onDeleted(account.id)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Could not delete your account.')
    } finally {
      setDeleteBusy(false)
    }
  }

  async function beginMfaSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMfaError('')
    setMfaMessage('')
    setMfaBusy(true)
    try {
      const result = await startMfaSetup(mfaSetupPassword, csrfToken)
      setMfaSetup({ secret: result.secret, provisioningUri: result.provisioningUri })
      setMfaSetupPassword('')
    } catch (error) {
      setMfaError(error instanceof Error ? error.message : 'Could not start authenticator setup.')
    } finally { setMfaBusy(false) }
  }

  async function confirmMfaSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMfaError('')
    setMfaMessage('')
    setMfaBusy(true)
    try {
      const result = await enableMfa(mfaConfirmPassword, mfaConfirmCode, csrfToken)
      setMfaRecoveryCodes(result.recoveryCodes)
      setMfaSetup(null)
      setMfaConfirmPassword('')
      setMfaConfirmCode('')
      setMfaEnabledOverride(true)
      onUpdated({ ...account, mfaEnabled: true }, result.csrfToken)
      void refreshSessions()
      void refreshSecurityActivity()
      setMfaMessage('Two-step verification is enabled. Save these recovery codes now.')
    } catch (error) {
      setMfaError(error instanceof Error ? error.message : 'Could not enable two-step verification.')
    } finally { setMfaBusy(false) }
  }

  async function turnOffMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMfaError('')
    setMfaMessage('')
    setMfaBusy(true)
    try {
      const result = await disableMfa(mfaDisablePassword, mfaDisableCode, csrfToken)
      setMfaDisablePassword('')
      setMfaDisableCode('')
      setMfaRecoveryCodes(null)
      setMfaEnabledOverride(false)
      onUpdated({ ...account, mfaEnabled: false }, result.csrfToken)
      void refreshSessions()
      void refreshSecurityActivity()
      setMfaMessage('Two-step verification is disabled.')
    } catch (error) {
      setMfaError(error instanceof Error ? error.message : 'Could not disable two-step verification.')
    } finally { setMfaBusy(false) }
  }

  async function replaceRecoveryCodes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMfaError('')
    setMfaMessage('')
    setMfaBusy(true)
    try {
      const result = await rotateMfaRecoveryCodes(rotateCodesPassword, rotateCodesFactor, csrfToken)
      setMfaRecoveryCodes(result.recoveryCodes)
      setRotateCodesPassword('')
      setRotateCodesFactor('')
      setRotateCodesExpanded(false)
      onUpdated({ ...account, mfaEnabled: true }, result.csrfToken)
      void refreshSessions()
      void refreshSecurityActivity()
      setMfaMessage('Recovery codes replaced. The old codes no longer work; save these new codes now.')
    } catch (error) {
      setMfaError(error instanceof Error ? error.message : 'Could not replace your recovery codes.')
    } finally { setMfaBusy(false) }
  }

  async function copyRecoveryCodes() {
    if (!mfaRecoveryCodes) return
    try {
      await navigator.clipboard.writeText(mfaRecoveryCodes.join('\n'))
      setMfaMessage('Recovery codes copied. Store them somewhere private.')
    } catch {
      setMfaError('Copy is unavailable here. Select and copy the recovery codes manually.')
    }
  }

  async function signOutSession(session: ActiveSession) {
    setSessionsError('')
    setSessionsMessage('')
    setSessionsBusy(true)
    try {
      await revokeActiveSession(session.id, csrfToken)
      setSessions(items => items.filter(item => item.id !== session.id))
      void refreshSecurityActivity()
      setSessionsMessage('That sign-in has been ended.')
    } catch (error) {
      setSessionsError(error instanceof Error ? error.message : 'Could not end that sign-in.')
    } finally { setSessionsBusy(false) }
  }

  async function signOutOtherSessions() {
    setSessionsError('')
    setSessionsMessage('')
    setSessionsBusy(true)
    try {
      const result = await revokeOtherSessions(csrfToken)
      setSessions(items => items.filter(item => item.current))
      void refreshSecurityActivity()
      setSessionsMessage(result.revokedCount === 1 ? 'One other sign-in has been ended.' : `${result.revokedCount} other sign-ins have been ended.`)
    } catch (error) {
      setSessionsError(error instanceof Error ? error.message : 'Could not end other sign-ins.')
    } finally { setSessionsBusy(false) }
  }

  function formatSessionDate(value: string | null) {
    if (!value) return 'Sign-in time unavailable'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 'Sign-in time unavailable' : `Signed in ${date.toLocaleString()}`
  }

  function securityEventLabel(type: SecurityEventType) {
    const labels: Record<SecurityEventType, string> = {
      SIGN_IN: 'Sign-in completed',
      PASSWORD_CHANGED: 'Password changed',
      PASSWORD_RESET: 'Password reset completed',
      EMAIL_CHANGE_REQUESTED: 'Email change requested',
      EMAIL_CHANGED: 'Email address changed',
      MFA_ENABLED: 'Two-step verification enabled',
      MFA_DISABLED: 'Two-step verification disabled',
      RECOVERY_CODES_ROTATED: 'Recovery codes replaced',
      SESSION_REVOKED: 'Another sign-in ended',
      OTHER_SESSIONS_REVOKED: 'Other sign-ins ended',
    }
    return labels[type]
  }

  return <div className="account-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="account-dialog settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <button className="account-close" type="button" aria-label="Close account settings" onClick={onClose}><X size={18} /></button>
      <div className="account-mark"><Shield size={20} /></div>
      <div className="eyebrow"><span className="eyebrow-line" /> YOUR LEARNING SPACE</div>
      <h2 id="settings-title">Account settings.</h2>
      <p className="account-intro">Update the name shown around Karma’s World or secure your account with a new password.</p>

      <form className="account-form settings-form" onSubmit={saveProfile}>
        <h3>Profile</h3>
        <label>Display name<input required minLength={2} maxLength={60} autoComplete="name" value={displayName} onChange={event => { setDisplayName(event.target.value); setProfileMessage('') }} /></label>
        <label>Email address<input type="email" value={account.email} readOnly /></label>
        {profileError && <p className="account-error" role="alert">{profileError}</p>}
        {profileMessage && <p className="settings-success" role="status">{profileMessage}</p>}
        <button className="button-primary account-submit" type="submit" disabled={profileBusy || displayName.trim() === account.displayName}>{profileBusy ? 'Saving…' : 'Save profile'} <Save size={14} /></button>
      </form>

      <section className="settings-form email-settings" aria-labelledby="email-change-title">
        <h3 id="email-change-title"><MailCheck size={15} /> Change email address</h3>
        <p className="mfa-description">We’ll send a confirmation link to the new address. Your current email stays active until you confirm it.</p>
        <form className="account-form email-change-form" onSubmit={event => void submitEmailChange(event)}>
          <label>New email address<input required type="email" maxLength={254} autoComplete="email" value={newEmail} onChange={event => { setNewEmail(event.target.value); setEmailChangeMessage('') }} /></label>
          <label>Password to change email<input required type="password" maxLength={128} autoComplete="current-password" value={emailChangePassword} onChange={event => setEmailChangePassword(event.target.value)} /></label>
          {mfaEnabled && <label>Authenticator or recovery code to change email<input required autoComplete="one-time-code" value={emailChangeMfaCode} onChange={event => setEmailChangeMfaCode(event.target.value)} /></label>}
          {emailChangeError && <p className="account-error" role="alert">{emailChangeError}</p>}
          {emailChangeMessage && <p className="account-notice-inline" role="status">{emailChangeMessage}</p>}
          <button className="button-primary account-submit" type="submit" disabled={emailChangeBusy}>{emailChangeBusy ? 'Sending…' : 'Send confirmation link'} <MailCheck size={14} /></button>
        </form>
      </section>

      <form className="account-form settings-form password-settings" onSubmit={event => void savePassword(event)}>
        <h3><KeyRound size={15} /> Change password</h3>
        <label>Current password<input required type="password" maxLength={128} autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} /></label>
        <label>New password<input required type="password" minLength={15} maxLength={128} autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} /><small>Use 15 to 128 characters.</small></label>
        <label>Confirm new password<input required type="password" minLength={15} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>
        {mfaEnabled && <label>Authenticator or recovery code<input required autoComplete="one-time-code" value={passwordMfaCode} onChange={event => setPasswordMfaCode(event.target.value)} /></label>}
        {passwordError && <p className="account-error" role="alert">{passwordError}</p>}
        {passwordMessage && <p className="settings-success" role="status">{passwordMessage} This device stays signed in.</p>}
        <button className="button-primary account-submit" type="submit" disabled={passwordBusy}>{passwordBusy ? 'Updating…' : 'Update password'} <KeyRound size={14} /></button>
      </form>
      <p className="account-privacy">Changing your password ends other active sessions. Your password is stored as a secure hash.</p>

      <section className="settings-form mfa-settings" aria-labelledby="mfa-title">
        <h3 id="mfa-title"><ShieldCheck size={15} /> Two-step verification</h3>
        <p className="mfa-description">Add a time-based code from an authenticator app to protect sign-ins.</p>
        {mfaEnabled ? <>
          <p className="mfa-status"><span className="live-dot" /> Authenticator verification is enabled.</p>
          {mfaRecoveryCodes && <div className="mfa-recovery-panel"><strong>Save your recovery codes</strong><p>Each code works once. They are shown only now; keep them somewhere private and separate from this device.</p><div className="mfa-recovery-codes">{mfaRecoveryCodes.map(code => <code key={code}>{code}</code>)}</div><button className="mfa-copy-button" type="button" onClick={() => void copyRecoveryCodes()}><Copy size={13} /> Copy codes</button></div>}
          {!rotateCodesExpanded ? <button className="mfa-secondary-button" type="button" onClick={() => setRotateCodesExpanded(true)}>Replace recovery codes…</button> : <form className="account-form mfa-action-form" onSubmit={event => void replaceRecoveryCodes(event)}>
            <p className="mfa-description">This invalidates every existing recovery code. Confirm with your password and authenticator, or an unused recovery code.</p>
            <label>Current account password for recovery code replacement<input required type="password" maxLength={128} autoComplete="current-password" value={rotateCodesPassword} onChange={event => setRotateCodesPassword(event.target.value)} /></label>
            <label>Authenticator or unused recovery code<input required autoComplete="one-time-code" value={rotateCodesFactor} onChange={event => setRotateCodesFactor(event.target.value)} /></label>
            <button className="button-primary account-submit" type="submit" disabled={mfaBusy}>{mfaBusy ? 'Replacing…' : 'Generate new recovery codes'} <KeyRound size={14} /></button>
          </form>}
          <form className="account-form mfa-action-form" onSubmit={event => void turnOffMfa(event)}>
            <label>Password to disable two-step verification<input required type="password" maxLength={128} autoComplete="current-password" value={mfaDisablePassword} onChange={event => setMfaDisablePassword(event.target.value)} /></label>
            <label>Authenticator or recovery code<input required autoComplete="one-time-code" value={mfaDisableCode} onChange={event => setMfaDisableCode(event.target.value)} /></label>
            <button className="mfa-secondary-button" type="submit" disabled={mfaBusy}>{mfaBusy ? 'Updating…' : 'Disable two-step verification'}</button>
          </form>
        </> : mfaSetup ? <>
          <div className="mfa-setup-panel"><p>In your authenticator app, add an account manually and enter this setup key:</p><code className="mfa-secret">{mfaSetup.secret}</code><p>Then enter the six-digit code from the app to confirm setup. This key expires in ten minutes.</p></div>
          <form className="account-form mfa-action-form" onSubmit={event => void confirmMfaSetup(event)}>
            <label>Password to enable two-step verification<input required type="password" maxLength={128} autoComplete="current-password" value={mfaConfirmPassword} onChange={event => setMfaConfirmPassword(event.target.value)} /></label>
            <label>Six-digit authenticator code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={mfaConfirmCode} onChange={event => setMfaConfirmCode(event.target.value)} /></label>
            <button className="button-primary account-submit" type="submit" disabled={mfaBusy}>{mfaBusy ? 'Verifying…' : 'Enable two-step verification'} <Check size={14} /></button>
          </form>
        </> : <form className="account-form mfa-action-form" onSubmit={event => void beginMfaSetup(event)}>
          <label>Password to set up an authenticator<input required type="password" maxLength={128} autoComplete="current-password" value={mfaSetupPassword} onChange={event => setMfaSetupPassword(event.target.value)} /></label>
          <button className="button-primary account-submit" type="submit" disabled={mfaBusy}>{mfaBusy ? 'Starting…' : 'Set up authenticator'} <ShieldCheck size={14} /></button>
        </form>}
        {mfaError && <p className="account-error" role="alert">{mfaError}</p>}
        {mfaMessage && <p className="settings-success" role="status">{mfaMessage}</p>}
      </section>

      <section className="settings-form sessions-settings" aria-labelledby="sessions-title">
        <h3 id="sessions-title"><MonitorSmartphone size={15} /> Active sign-ins</h3>
        <p className="mfa-description">Review signed-in devices and end access you no longer recognize.</p>
        {sessionsLoading ? <p className="sessions-empty">Loading your sign-ins…</p> : sessions.length === 0 ? <p className="sessions-empty">No active sign-ins were found.</p> : <div className="sessions-list">
          {sessions.map(item => <article className="session-item" key={item.id}>
            <div className="session-item-main"><strong>{item.current ? 'This device' : 'Signed-in device'}</strong><span>{item.userAgent || 'Browser details unavailable'}</span><small>{formatSessionDate(item.signedInAt)} · Expires {new Date(item.expiresAt).toLocaleString()}</small></div>
            {item.current ? <span className="session-current">CURRENT</span> : <button className="session-revoke" type="button" onClick={() => void signOutSession(item)} disabled={sessionsBusy}><LogOut size={13} /> Sign out</button>}
          </article>)}
        </div>}
        {sessionsError && <p className="account-error" role="alert">{sessionsError}</p>}
        {sessionsMessage && <p className="settings-success" role="status">{sessionsMessage}</p>}
        {!sessionsLoading && sessions.some(item => !item.current) && <button className="session-revoke-all" type="button" onClick={() => void signOutOtherSessions()} disabled={sessionsBusy}>{sessionsBusy ? 'Signing out…' : 'Sign out all other devices'} <LogOut size={13} /></button>}
      </section>

      <section className="settings-form security-activity-settings" aria-labelledby="security-activity-title">
        <h3 id="security-activity-title"><Activity size={15} /> Recent security activity</h3>
        <p className="mfa-description">Review recent sign-ins and important account changes. This private history shows browser details without storing IP addresses.</p>
        {securityActivityLoading ? <p className="sessions-empty">Loading security activity…</p> : securityActivity.length === 0 ? <p className="sessions-empty">No recent security activity was found.</p> : <div className="security-activity-list">
          {securityActivity.map(event => <article className="security-activity-item" key={event.id}>
            <div><strong>{securityEventLabel(event.type)}</strong><span>{event.userAgent || 'Browser details unavailable'}</span></div>
            <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString()}</time>
          </article>)}
        </div>}
        {securityActivityError && <p className="account-error" role="alert">{securityActivityError}</p>}
      </section>

      <section className="delete-account-section" aria-labelledby="delete-account-title">
        <div><h3 id="delete-account-title"><Trash2 size={15} /> Delete account</h3><p>Permanently remove your account and its saved learning data.</p></div>
        {!deleteExpanded ? <button className="delete-account-trigger" type="button" onClick={() => setDeleteExpanded(true)}>Delete account…</button> : <form className="account-form delete-account-form" onSubmit={event => void confirmAccountDeletion(event)}>
          <p className="delete-account-warning">This removes your account, cloud progress, community posts and reports, leaderboard entry, and this account’s private reflections and browser progress. Previously downloaded data files are not removed. This cannot be undone.</p>
          <label>Account password<input required type="password" maxLength={128} autoComplete="current-password" value={deletePassword} onChange={event => setDeletePassword(event.target.value)} /></label>
          {mfaEnabled && <label>Authenticator or recovery code<input required autoComplete="one-time-code" value={deleteMfaCode} onChange={event => setDeleteMfaCode(event.target.value)} /></label>}
          <label>Type DELETE to confirm<input required autoComplete="off" value={deleteConfirmation} onChange={event => setDeleteConfirmation(event.target.value)} /></label>
          {deleteError && <p className="account-error" role="alert">{deleteError}</p>}
          <div className="delete-account-actions"><button className="delete-account-trigger" type="button" onClick={() => { setDeleteExpanded(false); setDeletePassword(''); setDeleteConfirmation(''); setDeleteError('') }} disabled={deleteBusy}>Cancel</button><button className="delete-account-confirm" type="submit" disabled={deleteBusy || deleteConfirmation !== 'DELETE'}>{deleteBusy ? 'Deleting…' : 'Delete my account'}</button></div>
        </form>}
      </section>
    </section>
  </div>
}
