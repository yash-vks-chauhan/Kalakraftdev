import nodemailer from 'nodemailer'
import { cleanEmailHeader } from './emailContent'

type SecureMailer = {
  transporter: nodemailer.Transporter
  smtpUser: string
}

let cachedMailer: SecureMailer | null = null

type TransactionalEmail = {
  to: string
  subject: string
  html: string
  fromName?: string
}

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

async function sendViaBrevo({ to, subject, html, fromName = 'Artcommerce Support' }: TransactionalEmail) {
  const apiKey = process.env.SENDINBLUE_API_KEY
  const senderEmail = process.env.SENDINBLUE_FROM_EMAIL
  const senderName = process.env.SENDINBLUE_FROM || fromName

  if (!apiKey || !senderEmail) {
    throw new Error('Missing Brevo email configuration')
  }

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
      to: [{ email: to }],
      subject: cleanEmailHeader(subject),
      htmlContent: html,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Brevo email failed with status ${response.status}: ${body.slice(0, 300)}`)
  }
}

async function sendViaSmtp(message: TransactionalEmail) {
  const { transporter, smtpUser } = getSecureMailer()
  const info = await transporter.sendMail({
    from: `"${message.fromName || 'Artcommerce Support'}" <${smtpUser}>`,
    to: message.to,
    subject: cleanEmailHeader(message.subject),
    html: message.html,
  })
  if (Array.isArray(info.rejected) && info.rejected.length > 0) {
    throw new Error(`SMTP rejected recipients: ${info.rejected.join(', ')}`)
  }
}

function hasBrevoConfig() {
  return Boolean(process.env.SENDINBLUE_API_KEY && process.env.SENDINBLUE_FROM_EMAIL)
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
