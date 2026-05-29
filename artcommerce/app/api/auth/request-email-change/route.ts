import { customAlphabet } from 'nanoid'
import { NextResponse } from 'next/server'
import { escapeHtml } from '../../../../lib/emailContent'
import { sendSecureMail } from '../../../../lib/mailer'
import { getOtpSecretValidationError, hashOtpForScope } from '../../../../lib/otp-security'
import prisma from '../../../../lib/prisma'
import { consumeRateLimit, getClientIp } from '../../../../lib/rateLimit'
import { getAuthenticatedUser } from '../../../../lib/session-auth'
import { isValidEmailAddress } from '../../../../lib/inputValidation'

export const runtime = 'nodejs'

const OTP_EXPIRY_MS = 5 * 60 * 1000
const EMAIL_CHANGE_WINDOW_MS = 15 * 60 * 1000
const EMAIL_CHANGE_MAX_REQUESTS = 5
const OTP_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const OTP_LENGTH = 6

const generateOtp = customAlphabet(OTP_ALPHABET, OTP_LENGTH)

export async function POST(request: Request) {
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
  if (!newEmail || !isValidEmailAddress(newEmail)) {
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

  try {
    await sendSecureMail({
      to: newEmail,
      subject: 'Verify your new Artcommerce email',
      html: `
        <p>Hi ${escapeHtml(user.fullName)},</p>
        <p>Your OTP to verify this new Artcommerce account email is:</p>
        <h2 style="letter-spacing:4px;">${code}</h2>
        <p>This code expires in 5 minutes.</p>
        <p>If you didn’t request this, ignore this email. Your account email will not change without this code.</p>
      `,
    })
  } catch (error) {
    console.error('[auth/request-email-change] Failed to send OTP email:', error)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailChangeOtp: null,
        emailChangeNew: null,
        emailChangeExpires: null,
      },
    }).catch(() => undefined)

    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
