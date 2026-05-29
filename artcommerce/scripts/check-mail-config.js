const fs = require('fs')
const path = require('path')
const nodemailer = require('nodemailer')

function loadEnvFile(filename, options = {}) {
  const filepath = path.isAbsolute(filename) ? filename : path.join(process.cwd(), filename)
  if (!fs.existsSync(filepath)) return

  const content = fs.readFileSync(filepath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const equalsIndex = trimmed.indexOf('=')
    if (equalsIndex === -1) continue

    const key = trimmed.slice(0, equalsIndex).trim()
    let value = trimmed.slice(equalsIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (options.override || !process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvFile('.env')
loadEnvFile('.env.local')
for (const envFile of process.argv.slice(2)) {
  loadEnvFile(envFile, { override: true })
}

function has(name) {
  return Boolean(process.env[name]?.trim())
}

function emailStatus(name, required = true) {
  if (!has(name)) return { ok: !required, message: `${name}: ${required ? 'missing' : 'missing (optional)'}` }

  const value = process.env[name].trim()
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/[\r\n]/.test(value)
  return { ok, message: `${name}: ${ok ? 'valid email shape' : 'INVALID email shape'}` }
}

function urlStatus(name, required = true) {
  if (!has(name)) return { ok: !required, message: `${name}: ${required ? 'missing' : 'missing (optional)'}` }

  try {
    const parsed = new URL(process.env[name].trim())
    const ok = ['http:', 'https:'].includes(parsed.protocol)
    return { ok, message: `${name}: ${ok ? `valid URL (${parsed.origin})` : 'INVALID URL protocol'}` }
  } catch {
    return { ok: false, message: `${name}: INVALID URL` }
  }
}

async function checkBrevo() {
  const required = ['SENDINBLUE_API_KEY', 'SENDINBLUE_FROM_EMAIL']
  const missing = required.filter((name) => !has(name))
  if (missing.length > 0) {
    return { ok: false, message: `Brevo API auth: skipped; missing ${missing.join(', ')}` }
  }

  const sender = emailStatus('SENDINBLUE_FROM_EMAIL')
  if (!sender.ok) {
    return { ok: false, message: `Brevo API auth: skipped; ${sender.message}` }
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/account', {
      headers: {
        accept: 'application/json',
        'api-key': process.env.SENDINBLUE_API_KEY.trim(),
      },
    })

    return {
      ok: response.ok,
      message: `Brevo API auth: ${response.ok ? 'ok' : `failed (${response.status})`}`,
    }
  } catch (error) {
    return {
      ok: false,
      message: `Brevo API auth: network error (${error.message || error})`,
    }
  }
}

async function checkSmtp() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']
  const missing = required.filter((name) => !has(name))
  const port = Number(process.env.SMTP_PORT)
  const invalidPort = !Number.isInteger(port) || port <= 0 || port > 65535

  if (missing.length > 0 || invalidPort) {
    const invalid = invalidPort && !missing.includes('SMTP_PORT') ? ['SMTP_PORT'] : []
    return {
      ok: false,
      message: `SMTP auth/TLS verify: skipped; missing or invalid ${missing.concat(invalid).join(', ')}`,
    }
  }

  const secure = port === 465
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST.trim(),
    port,
    secure,
    requireTLS: !secure,
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
      servername: process.env.SMTP_HOST.trim(),
    },
  })

  try {
    await transporter.verify()
    return { ok: true, message: 'SMTP auth/TLS verify: ok' }
  } catch (error) {
    return {
      ok: false,
      message: `SMTP auth/TLS verify: failed (${error.message || error})`,
    }
  }
}

async function main() {
  const configStatuses = [
    emailStatus('SENDINBLUE_FROM_EMAIL'),
    emailStatus('ADMIN_EMAIL'),
    emailStatus('EMAIL_FROM', false),
    urlStatus('APP_URL', false),
    urlStatus('NEXT_PUBLIC_APP_URL', false),
  ]

  for (const status of configStatuses) {
    console.log(status.message)
  }

  const brevo = await checkBrevo()
  const smtp = await checkSmtp()

  console.log(brevo.message)
  console.log(smtp.message)

  if (!brevo.ok && !smtp.ok) {
    console.error('No working email provider is configured.')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Mail config check crashed:', error.message || error)
  process.exit(1)
})
