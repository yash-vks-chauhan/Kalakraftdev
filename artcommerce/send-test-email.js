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
console.log(
  'Loaded SMTP_PASS:',
  process.env.SMTP_PASS ? '****(hidden)****' : process.env.SMTP_PASS
)

;(async () => {
  // Create the transporter using those env vars:
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,                   // e.g. smtp.gmail.com
    port: Number(process.env.SMTP_PORT),           // e.g. 587 or 465
    secure: process.env.SMTP_PORT === '465',       // true if port 465
    auth: {
      user: process.env.SMTP_USER,                 // your Gmail address
      pass: process.env.SMTP_PASS,                 // your 16-character App Password
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
      from: `"Artcommerce Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,  // send to yourself
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