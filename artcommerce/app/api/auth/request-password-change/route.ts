// File: app/api/auth/request-password-change/route.ts

import { customAlphabet } from 'nanoid'
import { NextResponse } from 'next/server'
import { getAuthContext } from '../../../../lib/auth'
import { renderEmail } from '../../../../lib/emailTemplate'
import { sendSecureMail } from '../../../../lib/mailer'
import { getOtpSecretValidationError, hashOtpForScope } from '../../../../lib/otp-security'
import prisma from '../../../../lib/prisma'
import { consumeRateLimit, getClientIp } from '../../../../lib/rateLimit'

export const runtime = 'nodejs'

const OTP_EXPIRY_MS = 5 * 60 * 1000
const OTP_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const OTP_LENGTH = 6
const REQUEST_WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 5

const generateOtp = customAlphabet(OTP_ALPHABET, OTP_LENGTH)

export async function POST(request: Request) {
  const otpSecretError = getOtpSecretValidationError()
  if (otpSecretError) {
    console.error(`[auth/request-password-change] ${otpSecretError}`)
    return NextResponse.json(
      { error: 'Password reset is temporarily unavailable' },
      { status: 503 }
    )
  }

  const auth = getAuthContext(request)
  let user = auth?.userId
    ? await prisma.user.findUnique({ where: { id: String(auth.userId) } })
    : null

  let requestedEmail: string | null = null
  if (!user) {
    const body = await request.json().catch(() => ({}))
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email) {
      return NextResponse.json(
        { error: 'Missing or invalid email' },
        { status: 400 }
      )
    }

    requestedEmail = email
    user = await prisma.user.findUnique({ where: { email } })
  }

  const rateLimitScope = user?.id || requestedEmail || 'unknown'
  const rateLimitKey = `password-reset:${getClientIp(request)}:${rateLimitScope}`

  // Return 200 for public requests to avoid account enumeration.
  const limit = consumeRateLimit(rateLimitKey, {
    windowMs: REQUEST_WINDOW_MS,
    max: MAX_REQUESTS_PER_WINDOW,
  })
  if (!limit.allowed) {
    return NextResponse.json({ ok: true })
  }

  if (!user || !user.email) {
    return NextResponse.json({ ok: true })
  }

  const code = generateOtp()
  const expires = new Date(Date.now() + OTP_EXPIRY_MS)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordChangeOtp: hashOtpForScope(code, 'password-reset'),
      passwordChangeExpires: expires,
    },
  })

  const firstName = (user.fullName || '').trim().split(' ')[0]

  const html = renderEmail({
    preheader: `Your password reset code is ${code}. It expires in 5 minutes.`,
    eyebrow: 'Account security',
    heading: 'Reset your password',
    body: [
      firstName
        ? `Hi ${firstName} — use the code below to finish resetting your password.`
        : 'Use the code below to finish resetting your password.',
    ],
    module: { kind: 'code', code, caption: 'Expires in 5 minutes' },
    note: "Didn't ask for this? Ignore this email — your password stays as it is.",
    footerReason: 'You are receiving this because someone requested a password reset for this address.',
  })

  try {
    await sendSecureMail({
      to: user.email as string,
      subject: 'Your Kalakraft password reset code',
      html,
    })
  } catch (err) {
    console.error('❌ Error sending OTP email:', err)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordChangeOtp: null,
        passwordChangeExpires: null,
      },
    }).catch(() => undefined)

    if (auth?.userId) {
      return NextResponse.json(
        { error: 'Could not send OTP email. Please try again later.' },
        { status: 502 }
      )
    }
  }

  return NextResponse.json({ ok: true })
}
