import { customAlphabet } from 'nanoid'
import { NextResponse } from 'next/server'
import { getOtpSecretValidationError, hashOtpForScope } from '../../../../lib/otp-security'
import prisma from '../../../../lib/prisma'
import { consumeRateLimit, getClientIp } from '../../../../lib/rateLimit'
import { isAllowedOrigin } from '../../../../lib/security'
import { getAuthenticatedUser } from '../../../../lib/session-auth'

export const runtime = 'nodejs'

const OTP_EXPIRY_MS = 5 * 60 * 1000
const EMAIL_CHANGE_WINDOW_MS = 15 * 60 * 1000
const EMAIL_CHANGE_MAX_REQUESTS = 5
const OTP_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const OTP_LENGTH = 6

const generateOtp = customAlphabet(OTP_ALPHABET, OTP_LENGTH)

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const otpSecretError = getOtpSecretValidationError()
  if (otpSecretError) {
    console.error(`[auth/request-email-change] ${otpSecretError}`)
    return NextResponse.json(
      { error: 'Email change is temporarily unavailable' },
      { status: 503 }
    )
  }

  const authUser = await getAuthenticatedUser(request)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientIp = getClientIp(request)
  const limit = consumeRateLimit(`email-change:req:${authUser.id}:ip:${clientIp}`, {
    windowMs: EMAIL_CHANGE_WINDOW_MS,
    max: EMAIL_CHANGE_MAX_REQUESTS,
  })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const newEmail = String(body?.newEmail || '').trim().toLowerCase()
  if (!newEmail || !isValidEmail(newEmail)) {
    return NextResponse.json({ error: 'Missing or invalid newEmail' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, email: true, fullName: true },
  })
  if (!user || !user.email) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (newEmail === user.email.toLowerCase()) {
    return NextResponse.json(
      { error: 'New email must be different from current email' },
      { status: 400 }
    )
  }

  const existing = await prisma.user.findUnique({ where: { email: newEmail } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  const code = generateOtp()
  const expires = new Date(Date.now() + OTP_EXPIRY_MS)
  const otpHash = hashOtpForScope(code, 'email-change')

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailChangeOtp: otpHash,
      emailChangeNew: newEmail,
      emailChangeExpires: expires,
    },
  })

  const resp = await fetch('https://api.sendinblue.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.SENDINBLUE_API_KEY!,
    },
    body: JSON.stringify({
      sender: {
        name: 'Artcommerce Support',
        email: process.env.SENDINBLUE_FROM_EMAIL!,
      },
      to: [{ email: user.email, name: user.fullName }],
      subject: 'Your OTP to change your Artcommerce email',
      htmlContent: `
        <p>Hi ${user.fullName},</p>
        <p>Your OTP to change your email to <strong>${newEmail}</strong> is:</p>
        <h2 style="letter-spacing:4px;">${code}</h2>
        <p>This code expires in 5 minutes.</p>
        <p>If you didn’t request this, ignore this email.</p>
      `,
    }),
  })

  if (!resp.ok) {
    console.error('Sendinblue error:', await resp.text())
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
