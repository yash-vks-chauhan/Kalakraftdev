/**
 * send-test-email.js
 *
 * A minimal script to verify your SMTP credentials in .env.
 * Run with: node send-test-email.js
 */

const nodemailer = require('nodemailer')
require('dotenv').config()  // ← loads from .env in the same folder

// Print out what we loaded:
console.log('Loaded SMTP_HOST:', process.env.SMTP_HOST)
console.log('Loaded SMTP_PORT:', process.env.SMTP_PORT)
console.log('Loaded SMTP_USER:', process.env.SMTP_USER)
console.log('Loaded EMAIL_FROM:', process.env.EMAIL_FROM || '(fallback to SMTP_USER)')
console.log(
  'Loaded SMTP_PASS:',
  process.env.SMTP_PASS ? '****(hidden)****' : process.env.SMTP_PASS
)

;(async () => {
  const host = process.env.SMTP_HOST
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const fromEmail = process.env.EMAIL_FROM || smtpUser
  const port = Number(process.env.SMTP_PORT)

  if (!host || !smtpUser || !smtpPass || !Number.isInteger(port) || port <= 0 || port > 65535) {
    console.error('❌ Invalid SMTP configuration. Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.')
    process.exit(1)
  }

  const secure = port === 465

  // Create the transporter using those env vars:
  const transporter = nodemailer.createTransport({
    host,                                          // e.g. smtp.gmail.com
    port,                                          // e.g. 587 or 465
    secure,                                        // true if port 465
    requireTLS: !secure,
    auth: {
      user: smtpUser,                              // your Gmail address
      pass: smtpPass,                              // your 16-character App Password
    },
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
      servername: host,
    },
  })

  // Verify the connection:
  try {
    await transporter.verify()
    console.log('✅ SMTP configuration is correct; connection successful.')
  } catch (verifyErr) {
    console.error('❌ SMTP verification failed:', verifyErr)
    process.exit(1)
  }

  // Send a test email:
  try {
    const info = await transporter.sendMail({
      from: `"Kalakraft Test" <${fromEmail}>`,
      to: smtpUser,  // send to yourself
      subject: 'Test Email from Next.js App',
      text: 'If you see this, SMTP is working!',
      html: '<p><strong>If you see this, SMTP is working!</strong></p>',
    })
    console.log('✅ Test email sent! Message ID:', info.messageId)
    process.exit(0)
  } catch (sendErr) {
    console.error('❌ Error sending test email:', sendErr)
    process.exit(1)
  }
})()
