import nodemailer from 'nodemailer'
import { cleanEmailHeader } from './emailContent'
import { isValidEmailAddress } from './inputValidation'

type SecureMailer = {
  transporter: nodemailer.Transporter
  smtpUser: string
}

let cachedMailer: SecureMailer | null = null

export type TransactionalEmail = {
  to: string | string[]
  subject: string
  html: string
  fromName?: string
}

export type AdminEmail = Omit<TransactionalEmail, 'to'>

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value.trim()
}

export function getSecureMailer(): SecureMailer {
  if (cachedMailer) return cachedMailer

  const host = getRequiredEnv('SMTP_HOST')
  const portRaw = getRequiredEnv('SMTP_PORT')
  const smtpUser = getRequiredEnv('SMTP_USER')
  const smtpPass = getRequiredEnv('SMTP_PASS')

  const port = Number(portRaw)
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('SMTP_PORT must be a valid TCP port')
  }

  const secure = port === 465

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
      servername: host,
    },
  })

  cachedMailer = { transporter, smtpUser }
  return cachedMailer
}

function normalizeRecipients(to: string | string[]): string[] {
  const recipients = (Array.isArray(to) ? to : [to])
    .map((recipient) => recipient.trim())
    .filter(Boolean)

  if (recipients.length === 0) {
    throw new Error('Email must include at least one recipient')
  }

  for (const recipient of recipients) {
    assertPlainEmailAddress(recipient, 'recipient')
  }

  return recipients
}

function assertPlainEmailAddress(value: string, label: string) {
  if (/[\r\n]/.test(value) || !isValidEmailAddress(value)) {
    throw new Error(`Invalid email ${label}`)
  }
}

function getConfiguredSenderName(fromName?: string) {
  const configuredName = process.env.SENDINBLUE_FROM?.trim()
  const fallback = fromName || 'Kalakraft Support'

  return cleanEmailHeader(configuredName && !configuredName.includes('@') ? configuredName : fallback)
}

function getConfiguredSenderEmail(fallback: string) {
  const senderEmail = (process.env.EMAIL_FROM || fallback).trim()
  assertPlainEmailAddress(senderEmail, 'sender')
  return senderEmail
}

async function sendViaBrevo({ to, subject, html, fromName = 'Kalakraft Support' }: TransactionalEmail) {
  const apiKey = process.env.SENDINBLUE_API_KEY?.trim()
  const senderEmail = process.env.SENDINBLUE_FROM_EMAIL?.trim()
  const senderName = getConfiguredSenderName(fromName)
  const recipients = normalizeRecipients(to)

  if (!apiKey || !senderEmail) {
    throw new Error('Missing Brevo email configuration')
  }
  assertPlainEmailAddress(senderEmail, 'sender')

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: recipients.map((email) => ({ email })),
      subject: cleanEmailHeader(subject),
      htmlContent: html,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Brevo email failed with status ${response.status}${body ? `: ${body.slice(0, 300)}` : ''}`)
  }
}

async function sendViaSmtp(message: TransactionalEmail) {
  const { transporter, smtpUser } = getSecureMailer()
  const fromName = getConfiguredSenderName(message.fromName)
  const fromEmail = getConfiguredSenderEmail(smtpUser)
  const recipients = normalizeRecipients(message.to)
  const info = await transporter.sendMail({
    from: { name: fromName, address: fromEmail },
    to: recipients,
    subject: cleanEmailHeader(message.subject),
    html: message.html,
  })
  if (Array.isArray(info.rejected) && info.rejected.length > 0) {
    throw new Error(`SMTP rejected recipients: ${info.rejected.join(', ')}`)
  }
}

function hasBrevoConfig() {
  return Boolean(process.env.SENDINBLUE_API_KEY?.trim() && process.env.SENDINBLUE_FROM_EMAIL?.trim())
}

export async function sendSecureMail(message: TransactionalEmail) {
  if (hasBrevoConfig()) {
    try {
      await sendViaBrevo(message)
      return
    } catch (brevoError) {
      console.error('Brevo email failed; trying SMTP fallback:', brevoError)
    }
  }

  await sendViaSmtp(message)
}

export async function sendAdminMail(message: AdminEmail) {
  await sendSecureMail({
    ...message,
    to: getRequiredEnv('ADMIN_EMAIL'),
  })
}
