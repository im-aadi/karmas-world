import nodemailer from 'nodemailer'

export type AccountMailer = {
  sendVerification: (email: string, displayName: string, token: string) => Promise<void>
  sendPasswordReset: (email: string, displayName: string, token: string) => Promise<void>
  sendEmailChangeVerification: (email: string, displayName: string, token: string) => Promise<void>
  sendEmailChangedNotice: (oldEmail: string, displayName: string, newEmail: string) => Promise<void>
}

type MailerConfig = {
  NODE_ENV: string
  WEB_ORIGIN: string
  SMTP_HOST: string
  SMTP_PORT: number
  SMTP_SECURE: boolean
  SMTP_USER?: string
  SMTP_PASSWORD?: string
  SMTP_FROM: string
}

type OutgoingMessage = { from: string; to: string; subject: string; text: string }
type SendEmail = (message: OutgoingMessage) => Promise<void>

export function createAccountMailer(config: MailerConfig, sendEmail?: SendEmail): AccountMailer {
  const transport = sendEmail ? undefined : nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    ...(config.SMTP_USER && config.SMTP_PASSWORD ? { auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } } : {}),
    requireTLS: config.NODE_ENV === 'production' && !config.SMTP_SECURE,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  })
  const deliver = async (message: OutgoingMessage) => {
    try {
      if (sendEmail) await sendEmail(message)
      else await transport!.sendMail(message)
    } catch (error) {
      if (config.NODE_ENV !== 'development') throw error
      console.info(`[development-only email preview]\nTo: ${message.to}\n${message.text}`)
    }
  }

  return {
    async sendVerification(email, displayName, token) {
      const link = new URL('/', config.WEB_ORIGIN)
      link.searchParams.set('verify', token)
      await deliver({
        from: config.SMTP_FROM,
        to: email,
        subject: 'Verify your Karma’s World email',
        text: `Hi ${displayName},\n\nVerify your email to finish creating your Karma’s World account:\n${link.toString()}\n\nThis link expires in 24 hours. If you did not request this account, you can ignore this message.`,
      })
    },
    async sendPasswordReset(email, displayName, token) {
      const link = new URL('/', config.WEB_ORIGIN)
      link.searchParams.set('reset', token)
      await deliver({
        from: config.SMTP_FROM,
        to: email,
        subject: 'Reset your Karma’s World password',
        text: `Hi ${displayName},\n\nUse this link to choose a new Karma’s World password:\n${link.toString()}\n\nThis link expires in one hour. If you did not request a reset, you can ignore this message.`,
      })
    },
    async sendEmailChangeVerification(email, displayName, token) {
      const link = new URL('/', config.WEB_ORIGIN)
      link.searchParams.set('changeEmail', token)
      await deliver({
        from: config.SMTP_FROM,
        to: email,
        subject: 'Confirm your new Karma’s World email',
        text: `Hi ${displayName},\n\nConfirm this address for your Karma’s World account:\n${link.toString()}\n\nThe link expires in one hour. Your current account email stays in place until you confirm. If you did not request this change, you can ignore this message.`,
      })
    },
    async sendEmailChangedNotice(oldEmail, displayName, newEmail) {
      await deliver({
        from: config.SMTP_FROM,
        to: oldEmail,
        subject: 'Your Karma’s World email was changed',
        text: `Hi ${displayName},\n\nThe email on your Karma’s World account was changed to ${newEmail}. If you did not make this change, reset your password and contact support.`,
      })
    },
  }
}
