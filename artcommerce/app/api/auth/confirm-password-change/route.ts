// File: app/api/auth/confirm-password-change/route.ts
import { NextResponse } from 'next/server'
import prisma           from '../../../../lib/prisma'
import bcrypt           from 'bcryptjs'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  // 1️⃣ Parse body
  const { otp, newPassword } = await request.json()
  if (!otp || !newPassword) {
    return NextResponse.json(
      { error: 'Missing OTP or newPassword' },
      { status: 400 }
    )
  }

  // 2️⃣ Find the user whose OTP matches and hasn’t expired
  const user = await prisma.user.findFirst({
    where: {
      passwordChangeOtp:     otp.toUpperCase(),
      passwordChangeExpires: { gt: new Date() },
    },
  })

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired OTP' },
      { status: 400 }
    )
  }

  console.log(`✅ Password-reset OTP verified for ${user.email} (${otp})`)

  // 3️⃣ Hash the new password and clear OTP fields
  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      // adjust this to your actual password field name
      passwordHash:               hash,
      passwordChangeOtp:      null,
      passwordChangeExpires:  null,
    },
  })

  // 4️⃣ Done!
  return NextResponse.json({ ok: true })
}