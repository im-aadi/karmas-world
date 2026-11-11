import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAccountMailer } from './mailer.js'

const baseConfig = {
  WEB_ORIGIN: 'http://localhost:5173',
  SMTP_HOST: 'localhost',
  SMTP_PORT: 1025,
  SMTP_SECURE: false,
  SMTP_FROM: 'no-reply@karmas.world',
}

describe('account email delivery', () => {
  afterEach(() => vi.restoreAllMocks())

  it('prints a local preview when development SMTP is unavailable', async () => {
    const sendEmail = vi.fn().mockRejectedValue(new Error('SMTP unavailable'))
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {})
    const mailer = createAccountMailer({ ...baseConfig, NODE_ENV: 'development' }, sendEmail)

    await mailer.sendVerification('learner@example.com', 'Learner', 'one-time-token')

    expect(consoleInfo).toHaveBeenCalledWith(expect.stringContaining('http://localhost:5173/?verify=one-time-token'))
    expect(consoleInfo).toHaveBeenCalledWith(expect.stringContaining('[development-only email preview]'))
  })

  it('never prints a failed production email or exposes its link in the error', async () => {
    const sendEmail = vi.fn().mockRejectedValue(new Error('provider credentials unavailable'))
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {})
    const mailer = createAccountMailer({ ...baseConfig, NODE_ENV: 'production', SMTP_HOST: 'smtp.example.com', SMTP_FROM: 'accounts@example.com' }, sendEmail)

    await expect(mailer.sendPasswordReset('learner@example.com', 'Learner', 'secret-reset-token')).rejects.toThrow('provider credentials unavailable')
    expect(consoleInfo).not.toHaveBeenCalled()
  })

  it('sends a confirmation link to the new address and a notice to the old address', async () => {
    const sendEmail = vi.fn().mockResolvedValue(undefined)
    const mailer = createAccountMailer({ ...baseConfig, NODE_ENV: 'test' }, sendEmail)

    await mailer.sendEmailChangeVerification('new@example.com', 'Learner', 'email-change-token')
    await mailer.sendEmailChangedNotice('old@example.com', 'Learner', 'new@example.com')

    expect(sendEmail).toHaveBeenNthCalledWith(1, expect.objectContaining({
      to: 'new@example.com',
      subject: expect.stringMatching(/confirm your new/i),
      text: expect.stringContaining('http://localhost:5173/?changeEmail=email-change-token'),
    }))
    expect(sendEmail).toHaveBeenNthCalledWith(2, expect.objectContaining({ to: 'old@example.com', text: expect.stringContaining('new@example.com') }))
  })
})
