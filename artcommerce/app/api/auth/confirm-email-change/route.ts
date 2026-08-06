import { NextResponse } from 'next/server'
import { renderEmail } from '../../../../lib/emailTemplate'
import { sendSecureMail } from '../../../../lib/mailer'
import { getOtpSecretValidationError, hashOtpForScope } from '../../../../lib/otp-security'
import prisma from '../../../../lib/prisma'
import { consumeRateLimit, getClientIp } from '../../../../lib/rateLimit'
import { getAuthenticatedUser } from '../../../../lib/session-auth'

export const runtime = 'nodejs'

const VERIFY_WINDOW_MS = 15 * 60 * 1000
const MAX_VERIFY_ATTEMPTS = 10

export async function POST(request: Request) {
  const otpSecretError = getOtpSecretValidationError()
  if (otpSecretError) {
    console.error(`[auth/confirm-email-change] ${otpSecretError}`)
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
  const limit = consumeRateLimit(`email-change:verify:${authUser.id}:ip:${clientIp}`, {
    windowMs: VERIFY_WINDOW_MS,
    max: MAX_VERIFY_ATTEMPTS,
  })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const newEmail = String(body?.newEmail || '').trim().toLowerCase()
  const otp = String(body?.otp || '').trim().toUpperCase()
  if (!newEmail || !otp) {
    return NextResponse.json({ error: 'Missing newEmail or OTP' }, { status: 400 })
  }

  const userPending = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      emailChangeOtp: true,
      emailChangeNew: true,
      emailChangeExpires: true,
      fullName: true,
    },
  })

  const otpHash = hashOtpForScope(otp, 'email-change')
  const isOtpValid =
    !!userPending &&
    !!userPending.emailChangeOtp &&
    userPending.emailChangeOtp === otpHash &&
    userPending.emailChangeNew === newEmail &&
    !!userPending.emailChangeExpires &&
    userPending.emailChangeExpires > new Date()

  if (!isOtpValid) {
    return NextResponse.json({ error: 'Invalid OTP or email' }, { status: 400 })
  }

  const emailInUse = await prisma.user.findUnique({ where: { email: newEmail } })
  if (emailInUse && emailInUse.id !== authUser.id) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  let updatedUser
  try {
    updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        email: newEmail,
        emailChangeOtp: null,
        emailChangeNew: null,
        emailChangeExpires: null,
      },
      select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
    })
  } catch (err: any) {
    console.error('Error updating email:', err)
    const status = err.code === 'P2002' ? 409 : 500
    const msg = err.code === 'P2002' ? 'Email already in use' : 'Server error'
    return NextResponse.json({ error: msg }, { status })
  }

  try {
    await sendSecureMail({
      to: updatedUser.email,
      subject: 'Your Kalakraft email has been changed',
      html: renderEmail({
        preheader: `Your Kalakraft account email is now ${updatedUser.email}.`,
        eyebrow: 'Account security',
        heading: 'Your email has been changed',
        body: [
          `Hi ${(updatedUser.fullName || '').trim().split(' ')[0] || 'there'} — the address on your Kalakraft account has been updated. Sign-ins and order updates now go here.`,
        ],
        module: {
          kind: 'facts',
          rows: [{ label: 'New email', value: updatedUser.email, accent: true }],
        },
        note: 'If you did not make this change, contact us straight away and we will restore the previous address.',
        footerReason: 'You are receiving this because the email on your Kalakraft account was changed.',
      }),
    })
  } catch (error) {
    console.error('[auth/confirm-email-change] Error sending confirmation email:', error)
  }

  return NextResponse.json({ ok: true, user: updatedUser })
}
