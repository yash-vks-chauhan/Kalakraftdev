// File: app/api/auth/confirm-password-change/route.ts
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { PASSWORD_POLICY_MESSAGE, isStrongPassword } from '../../../../lib/password-policy'
import { getAuthContext } from '../../../../lib/auth'
import { getOtpSecretValidationError, hashOtpForScope } from '../../../../lib/otp-security'
import prisma from '../../../../lib/prisma'
import { clearRateLimit, consumeRateLimit, getClientIp } from '../../../../lib/rateLimit'
import { clearAuthCookies } from '../../../../lib/session-auth'

export const runtime = 'nodejs'

const VERIFY_WINDOW_MS = 10 * 60 * 1000
const MAX_VERIFY_ATTEMPTS_PER_WINDOW = 10

export async function POST(request: Request) {
  const otpSecretError = getOtpSecretValidationError()
  if (otpSecretError) {
    console.error(`[auth/confirm-password-change] ${otpSecretError}`)
    return NextResponse.json(
      { error: 'Password reset is temporarily unavailable' },
      { status: 503 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const otp = typeof body?.otp === 'string' ? body.otp.trim().toUpperCase() : ''
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''
  const confirmPassword = typeof body?.confirmPassword === 'string' ? body.confirmPassword : null
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!otp || !newPassword) {
    return NextResponse.json(
      { error: 'Missing OTP or newPassword' },
      { status: 400 }
    )
  }

  if (!isStrongPassword(newPassword)) {
    return NextResponse.json(
      { error: PASSWORD_POLICY_MESSAGE },
      { status: 400 }
    )
  }

  if (confirmPassword !== null && confirmPassword !== newPassword) {
    return NextResponse.json(
      { error: 'Passwords do not match' },
      { status: 400 }
    )
  }

  const auth = getAuthContext(request)
  const authUserId = auth?.userId ? String(auth.userId) : null

  if (!authUserId && !email) {
    return NextResponse.json(
      { error: 'Email is required when not authenticated' },
      { status: 400 }
    )
  }

  const rateLimitScope = authUserId ? `user:${authUserId}` : `email:${email}`
  const rateLimitKey = `password-reset-verify:${getClientIp(request)}:${rateLimitScope}`

  const limit = consumeRateLimit(rateLimitKey, {
    windowMs: VERIFY_WINDOW_MS,
    max: MAX_VERIFY_ATTEMPTS_PER_WINDOW,
  })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    )
  }

  const otpHash = hashOtpForScope(otp, 'password-reset')
  const now = new Date()

  const user = await prisma.user.findFirst({
    where: authUserId
      ? {
          id: authUserId,
          passwordChangeOtp: otpHash,
          passwordChangeExpires: { gt: now },
        }
      : {
          email,
          passwordChangeOtp: otpHash,
          passwordChangeExpires: { gt: now },
        },
    select: { id: true },
  })

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired OTP' },
      { status: 400 }
    )
  }

  clearRateLimit(rateLimitKey)

  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hash,
      passwordChangeOtp: null,
      passwordChangeExpires: null,
      tokenVersion: { increment: 1 },
    },
  })

  // Revoke all refresh sessions after password reset.
  await prisma.session.deleteMany({
    where: { userId: user.id },
  })

  const response = NextResponse.json({ ok: true })
  clearAuthCookies(response)
  return response
}
