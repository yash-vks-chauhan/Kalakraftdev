import nodemailer from 'nodemailer'

type SecureMailer = {
  transporter: nodemailer.Transporter
  smtpUser: string
}

let cachedMailer: SecureMailer | null = null

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
