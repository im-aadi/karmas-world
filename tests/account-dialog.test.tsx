import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AccountDialog } from '../src/components/AccountDialog'
import { login, register, requestPasswordReset, resendVerification, verifyMfaLogin, type LearnerAccount } from '../src/data/account'

vi.mock('../src/data/account', () => ({
  login: vi.fn(),
  verifyMfaLogin: vi.fn(),
  register: vi.fn(),
  requestPasswordReset: vi.fn(),
  resendVerification: vi.fn(),
}))

describe('sign-up and recovery dialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('asks a new learner to verify their email and supports resending the link', async () => {
    vi.mocked(register).mockResolvedValue({ verificationRequired: true, message: 'Check your email for next steps.' })
    vi.mocked(resendVerification).mockResolvedValue({ message: 'A new email has been sent.' })
    render(<AccountDialog initialMode="register" onClose={() => {}} onAuthenticated={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Learner One' } })
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'learner@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'a-long-password-for-registration' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Check your email for next steps.')
    fireEvent.click(screen.getByRole('button', { name: /resend verification email/i }))
    await waitFor(() => expect(resendVerification).toHaveBeenCalledWith('learner@example.com'))
    expect(screen.getByRole('status')).toHaveTextContent('A new email has been sent.')
  })

  it('sends a generic password reset request from the sign-in view', async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue({ message: 'If an account uses that address, a password reset email has been sent.' })
    render(<AccountDialog initialMode="login" onClose={() => {}} onAuthenticated={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }))
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'learner@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset email/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/if an account uses that address/i)
    expect(requestPasswordReset).toHaveBeenCalledWith('learner@example.com')
  })

  it('asks for an authenticator or recovery code before completing an MFA sign-in', async () => {
    const user: LearnerAccount = { id: 'learner-1', displayName: 'Learner One', email: 'learner@example.com', role: 'LEARNER', mfaEnabled: true }
    const onAuthenticated = vi.fn().mockResolvedValue(undefined)
    vi.mocked(login).mockResolvedValue({ mfaRequired: true, csrfToken: 'challenge-csrf' })
    vi.mocked(verifyMfaLogin).mockResolvedValue({ user, csrfToken: 'signed-in-csrf' })
    render(<AccountDialog initialMode="login" onClose={() => {}} onAuthenticated={onAuthenticated} />)

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: user.email } })
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'correct-password' } })
    fireEvent.click(screen.getByRole('button', { name: /^Sign in/i }))
    fireEvent.change(await screen.findByLabelText('Authenticator or recovery code'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /verify and sign in/i }))

    await waitFor(() => expect(verifyMfaLogin).toHaveBeenCalledWith('123456', 'challenge-csrf'))
    expect(onAuthenticated).toHaveBeenCalledWith(user, 'signed-in-csrf')
  })
})
