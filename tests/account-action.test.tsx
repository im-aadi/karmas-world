import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AccountActionDialog } from '../src/components/AccountActionDialog'
import { completePasswordReset, confirmEmailChange, confirmEmailVerification } from '../src/data/account'

vi.mock('../src/data/account', () => ({ completePasswordReset: vi.fn(), confirmEmailChange: vi.fn(), confirmEmailVerification: vi.fn() }))

describe('email account links', () => {
  beforeEach(() => vi.clearAllMocks())

  it('waits for an explicit click before verifying an address', async () => {
    vi.mocked(confirmEmailVerification).mockResolvedValue({ message: 'Email verified. You can now sign in.' })
    render(<AccountActionDialog action={{ type: 'verify', token: 'verification-token' }} onClose={() => {}} onSignIn={() => {}} onPasswordReset={async () => {}} onEmailChange={async () => {}} />)
    expect(confirmEmailVerification).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /verify email/i }))
    await waitFor(() => expect(confirmEmailVerification).toHaveBeenCalledWith('verification-token'))
    expect(screen.getByRole('status')).toHaveTextContent(/email verified/i)
  })

  it('resets a password with the email token and requires matching confirmation', async () => {
    vi.mocked(completePasswordReset).mockResolvedValue({ message: 'Password updated. You can now sign in.' })
    const onPasswordReset = vi.fn().mockResolvedValue(undefined)
    render(<AccountActionDialog action={{ type: 'reset', token: 'reset-token' }} onClose={() => {}} onSignIn={() => {}} onPasswordReset={onPasswordReset} onEmailChange={async () => {}} />)

    fireEvent.change(screen.getByLabelText(/^New password/i), { target: { value: 'a-long-new-password-for-testing' } })
    fireEvent.change(screen.getByLabelText(/Confirm new password/i), { target: { value: 'a-different-new-password' } })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The new passwords do not match.')
    expect(completePasswordReset).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/Confirm new password/i), { target: { value: 'a-long-new-password-for-testing' } })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))
    await waitFor(() => expect(completePasswordReset).toHaveBeenCalledWith('reset-token', 'a-long-new-password-for-testing'))
    expect(onPasswordReset).toHaveBeenCalledOnce()
    expect(screen.getByRole('status')).toHaveTextContent(/password updated/i)
  })

  it('waits for an explicit click before changing an account email', async () => {
    vi.mocked(confirmEmailChange).mockResolvedValue({ message: 'Your email has been updated. Sign in again with the new address.' })
    const onEmailChange = vi.fn().mockResolvedValue(undefined)
    render(<AccountActionDialog action={{ type: 'change-email', token: 'email-change-token' }} onClose={() => {}} onSignIn={() => {}} onPasswordReset={async () => {}} onEmailChange={onEmailChange} />)
    expect(confirmEmailChange).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /confirm email change/i }))
    await waitFor(() => expect(confirmEmailChange).toHaveBeenCalledWith('email-change-token'))
    expect(onEmailChange).toHaveBeenCalledOnce()
    expect(screen.getByRole('status')).toHaveTextContent(/email has been updated/i)
  })
})
