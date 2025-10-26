// File: app/api/auth/confirm-email-change/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getAuthFromRequest } from '../../../../lib/auth'

export const runtime = 'nodejs'
const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(request: Request) {
  // 1️⃣ Authenticate via cookie or header
  const auth = getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = auth.userId

  // 2️⃣ Parse newEmail & OTP
  const { newEmail, otp } = await request.json()
  if (!newEmail || !otp) {
    return NextResponse.json({ error: 'Missing newEmail or OTP' }, { status: 400 })
  }

  // 3️⃣ Fetch pending OTP from DB
  const userPending = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailChangeOtp: true,
      emailChangeNew: true,
      emailChangeExpires: true,
      fullName: true,
    },
  })

  if (
    !userPending ||
    userPending.emailChangeOtp !== otp ||
    userPending.emailChangeNew !== newEmail ||
    !userPending.emailChangeExpires ||
    userPending.emailChangeExpires < new Date()
  ) {
    return NextResponse.json({ error: 'Invalid OTP or email' }, { status: 400 })
  }

  // 4️⃣ Update user email and clear pending fields
  let updatedUser
  try {
    updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        emailChangeOtp: null,
        emailChangeNew: null,
        emailChangeExpires: null,
      },
      select: { id: true, fullName: true, email: true, avatarUrl: true }
    })
  } catch (err: any) {
    console.error('Error updating email:', err)
    const status = err.code === 'P2002' ? 409 : 500
    const msg = err.code === 'P2002' ? 'Email already in use' : 'Server error'
    return NextResponse.json({ error: msg }, { status })
  }

  // 5️⃣ Send confirmation email to the new address
  try {
    const resp = await fetch('https://api.sendinblue.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'api-key': process.env.SENDINBLUE_API_KEY!,
      },
      body: JSON.stringify({
        sender: { name: 'Artcommerce Support', email: process.env.SENDINBLUE_FROM_EMAIL! },
        to:     [{ email: updatedUser.email, name: updatedUser.fullName }],
        subject: 'Your Artcommerce email has been changed',
        htmlContent: `
          <p>Hi ${updatedUser.fullName},</p>
          <p>Your account email has been successfully updated to <strong>${updatedUser.email}</strong>.</p>
          <p>If you did not make this change, please contact support immediately.</p>
        `,
      }),
    })
    if (!resp.ok) console.error('Sendinblue confirm-email error:', await resp.text())
  } catch (e) {
    console.error('Error sending confirm email:', e)
  }

  // 6️⃣ Return the updated user
  return NextResponse.json({ ok: true, user: updatedUser })
}
