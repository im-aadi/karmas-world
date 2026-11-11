import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AccountSettingsDialog } from '../src/components/AccountSettingsDialog'
import { changePassword, deleteOwnAccount, enableMfa, getActiveSessions, getSecurityActivity, requestEmailChange, revokeActiveSession, revokeOtherSessions, rotateMfaRecoveryCodes, startMfaSetup, updateProfile, type ActiveSession, type LearnerAccount } from '../src/data/account'

vi.mock('../src/data/account', () => ({ changePassword: vi.fn(), deleteOwnAccount: vi.fn(), disableMfa: vi.fn(), enableMfa: vi.fn(), getActiveSessions: vi.fn().mockResolvedValue([]), getSecurityActivity: vi.fn().mockResolvedValue([]), requestEmailChange: vi.fn(), revokeActiveSession: vi.fn(), revokeOtherSessions: vi.fn(), rotateMfaRecoveryCodes: vi.fn(), startMfaSetup: vi.fn(), updateProfile: vi.fn() }))

const account: LearnerAccount = { id: 'learner-1', displayName: 'Learner One', email: 'learner@example.com', role: 'LEARNER' }

describe('account settings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates the display name and returns the refreshed account', async () => {
    vi.mocked(updateProfile).mockResolvedValue({ user: { ...account, displayName: 'New Learner' } })
    const onUpdated = vi.fn()
    render(<AccountSettingsDialog account={account} csrfToken="csrf" onClose={() => {}} onUpdated={onUpdated} onDeleted={vi.fn().mockResolvedValue(undefined)} />)

    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'New Learner' } })
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith({ ...account, displayName: 'New Learner' }))
    expect(updateProfile).toHaveBeenCalledWith('New Learner', 'csrf')
    expect(screen.getByRole('status')).toHaveTextContent('Your display name has been updated.')
  })

  it('shows recent security events and browser details in account settings', async () => {
    vi.mocked(getSecurityActivity).mockResolvedValue([{ id: 'event-1', type: 'SIGN_IN', userAgent: 'Test Browser', createdAt: '2026-11-04T10:00:00.000Z' }])
    render(<AccountSettingsDialog account={account} csrfToken="csrf" onClose={() => {}} onUpdated={() => {}} onDeleted={vi.fn().mockResolvedValue(undefined)} />)

    expect(await screen.findByText('Sign-in completed')).toBeInTheDocument()
    expect(screen.getByText('Test Browser')).toBeInTheDocument()
    expect(getSecurityActivity).toHaveBeenCalledOnce()
  })

  it('rotates the current session after a password change and tells the learner other sessions ended', async () => {
    vi.mocked(changePassword).mockResolvedValue({ user: account, csrfToken: 'rotated-csrf', otherSessionsRevoked: true })
    const onUpdated = vi.fn()
    render(<AccountSettingsDialog account={account} csrfToken="csrf" onClose={() => {}} onUpdated={onUpdated} onDeleted={vi.fn().mockResolvedValue(undefined)} />)

    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'current-password' } })
    fireEvent.change(screen.getByLabelText(/^New password/i), { target: { value: 'a-new-password-long-enough' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'a-new-password-long-enough' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(account, 'rotated-csrf'))
    expect(changePassword).toHaveBeenCalledWith('current-password', 'a-new-password-long-enough', 'csrf')
    expect(screen.getByRole('status')).toHaveTextContent('Other signed-in devices have been signed out.')
    expect(screen.getByRole('status')).toHaveTextContent('This device stays signed in.')
  })

  it('blocks a password change when the confirmation does not match', async () => {
    render(<AccountSettingsDialog account={account} csrfToken="csrf" onClose={() => {}} onUpdated={() => {}} onDeleted={vi.fn().mockResolvedValue(undefined)} />)
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'current-password' } })
    fireEvent.change(screen.getByLabelText(/^New password/i), { target: { value: 'a-new-password-long-enough' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'a-different-new-password' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The new passwords do not match.')
    expect(changePassword).not.toHaveBeenCalled()
  })

  it('requires password and typed confirmation before deleting the account', async () => {
    vi.mocked(deleteOwnAccount).mockResolvedValue(undefined)
    const onDeleted = vi.fn().mockResolvedValue(undefined)
    render(<AccountSettingsDialog account={account} csrfToken="csrf" onClose={() => {}} onUpdated={() => {}} onDeleted={onDeleted} />)

    fireEvent.click(screen.getByRole('button', { name: /delete account/i }))
    expect(screen.getByRole('button', { name: /delete my account/i })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Account password'), { target: { value: 'current-password' } })
    fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), { target: { value: 'DELETE' } })
    fireEvent.click(screen.getByRole('button', { name: /delete my account/i }))

    await waitFor(() => expect(deleteOwnAccount).toHaveBeenCalledWith('current-password', 'csrf'))
    expect(onDeleted).toHaveBeenCalledWith(account.id)
  })

  it('shows recovery codes once after authenticator setup is confirmed', async () => {
    vi.mocked(startMfaSetup).mockResolvedValue({ secret: 'JBSWY3DPEHPK3PXP', provisioningUri: 'otpauth://totp/test', expiresAt: new Date().toISOString() })
    vi.mocked(enableMfa).mockResolvedValue({ enabled: true, recoveryCodes: ['AAAA-BBBB-CCCC-DDDD'], csrfToken: 'rotated-csrf' })
    const onUpdated = vi.fn()
    render(<AccountSettingsDialog account={account} csrfToken="csrf" onClose={() => {}} onUpdated={onUpdated} onDeleted={vi.fn().mockResolvedValue(undefined)} />)

    fireEvent.change(screen.getByLabelText('Password to set up an authenticator'), { target: { value: 'current-password' } })
    fireEvent.click(screen.getByRole('button', { name: /set up authenticator/i }))
    expect(await screen.findByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Password to enable two-step verification'), { target: { value: 'current-password' } })
    fireEvent.change(screen.getByLabelText('Six-digit authenticator code'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /enable two-step verification/i }))

    expect(await screen.findByText('AAAA-BBBB-CCCC-DDDD')).toBeInTheDocument()
    expect(onUpdated).toHaveBeenCalledWith({ ...account, mfaEnabled: true }, 'rotated-csrf')
    expect(enableMfa).toHaveBeenCalledWith('current-password', '123456', 'csrf')
  })

  it('lists signed-in devices and lets the learner end a different session', async () => {
    const active: ActiveSession[] = [
      { id: 'this-session-id-1234567890', current: true, userAgent: 'Firefox on Windows', signedInAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60_000).toISOString() },
      { id: 'other-session-id-1234567890', current: false, userAgent: 'Chrome on Android', signedInAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60_000).toISOString() },
    ]
    vi.mocked(getActiveSessions).mockResolvedValue(active)
    vi.mocked(revokeActiveSession).mockResolvedValue({ revoked: true })
    render(<AccountSettingsDialog account={account} csrfToken="csrf" onClose={() => {}} onUpdated={() => {}} onDeleted={vi.fn().mockResolvedValue(undefined)} />)

    expect(await screen.findByText('Chrome on Android')).toBeInTheDocument()
    expect(screen.getByText('This device')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /sign out$/i }))

    await waitFor(() => expect(revokeActiveSession).toHaveBeenCalledWith('other-session-id-1234567890', 'csrf'))
    expect(await screen.findByRole('status')).toHaveTextContent('That sign-in has been ended.')
    expect(screen.queryByText('Chrome on Android')).not.toBeInTheDocument()
  })

  it('can end all other sessions while keeping the current device signed in', async () => {
    vi.mocked(getActiveSessions).mockResolvedValue([
      { id: 'this-session-id-1234567890', current: true, userAgent: 'Firefox', signedInAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60_000).toISOString() },
      { id: 'other-session-id-1234567890', current: false, userAgent: 'Chrome', signedInAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60_000).toISOString() },
    ])
    vi.mocked(revokeOtherSessions).mockResolvedValue({ revokedCount: 1 })
    render(<AccountSettingsDialog account={account} csrfToken="csrf" onClose={() => {}} onUpdated={() => {}} onDeleted={vi.fn().mockResolvedValue(undefined)} />)

    fireEvent.click(await screen.findByRole('button', { name: /sign out all other devices/i }))

    await waitFor(() => expect(revokeOtherSessions).toHaveBeenCalledWith('csrf'))
    expect(await screen.findByRole('status')).toHaveTextContent('One other sign-in has been ended.')
    expect(screen.getByText('This device')).toBeInTheDocument()
    expect(screen.queryByText('Chrome')).not.toBeInTheDocument()
  })

  it('replaces existing recovery codes only after password and a second factor', async () => {
    const protectedAccount = { ...account, mfaEnabled: true }
    const replacement = ['1111-AAAA-2222-BBBB']
    vi.mocked(rotateMfaRecoveryCodes).mockResolvedValue({ recoveryCodes: replacement, csrfToken: 'next-csrf' })
    const onUpdated = vi.fn()
    render(<AccountSettingsDialog account={protectedAccount} csrfToken="csrf" onClose={() => {}} onUpdated={onUpdated} onDeleted={vi.fn().mockResolvedValue(undefined)} />)

    fireEvent.click(screen.getByRole('button', { name: /replace recovery codes/i }))
    fireEvent.change(screen.getByLabelText('Current account password for recovery code replacement'), { target: { value: 'current-password' } })
    fireEvent.change(screen.getByLabelText('Authenticator or unused recovery code'), { target: { value: 'ABCD-EF01-2345-6789' } })
    fireEvent.click(screen.getByRole('button', { name: /generate new recovery codes/i }))

    expect(await screen.findByText(replacement[0])).toBeInTheDocument()
    expect(rotateMfaRecoveryCodes).toHaveBeenCalledWith('current-password', 'ABCD-EF01-2345-6789', 'csrf')
    expect(onUpdated).toHaveBeenCalledWith(protectedAccount, 'next-csrf')
    expect(screen.getByRole('status')).toHaveTextContent(/old codes no longer work/i)
  })

  it('requests an email change with the current password and an MFA code when enabled', async () => {
    const protectedAccount = { ...account, mfaEnabled: true }
    vi.mocked(requestEmailChange).mockResolvedValue({ message: 'A confirmation link has been sent. Your current email remains active until you confirm the new address.' })
    render(<AccountSettingsDialog account={protectedAccount} csrfToken="csrf" onClose={() => {}} onUpdated={() => {}} onDeleted={vi.fn().mockResolvedValue(undefined)} />)

    fireEvent.change(screen.getByLabelText('New email address'), { target: { value: 'new@example.com' } })
    fireEvent.change(screen.getByLabelText('Password to change email'), { target: { value: 'current-password' } })
    fireEvent.change(screen.getByLabelText('Authenticator or recovery code to change email'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /send confirmation link/i }))

    await waitFor(() => expect(requestEmailChange).toHaveBeenCalledWith('new@example.com', 'current-password', 'csrf', '123456'))
    expect(await screen.findByRole('status')).toHaveTextContent(/current email remains active/i)
  })
})
