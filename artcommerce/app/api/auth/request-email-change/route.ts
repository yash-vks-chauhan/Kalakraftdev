// File: app/api/auth/request-email-change/route.ts
import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import jwt from 'jsonwebtoken'
import { nanoid } from 'nanoid'

export const runtime = 'nodejs'
const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(request: Request) {
  // 1️⃣ Authenticate
  const auth = request.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let userId: number
  try {
    userId = (jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any).userId
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // 2️⃣ Parse newEmail
  const { newEmail } = await request.json()
  if (!newEmail) {
    return NextResponse.json({ error: 'Missing newEmail' }, { status: 400 })
  }

  // 3️⃣ Generate OTP + expiry (10m)
  const code = nanoid(6).toUpperCase()
  const expires = new Date(Date.now() + 5 * 60 * 1000)

  // 4️⃣ Persist into DB and select for logging
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      emailChangeOtp:     code,
      emailChangeNew:     newEmail,
      emailChangeExpires: expires,
    },
    select: {
      id:                  true,
      emailChangeOtp:      true,
      emailChangeNew:      true,
      emailChangeExpires:  true,
    },
  })
  console.log('📝 [request-email-change] Updated user record:', updated)

  // 5️⃣ Lookup complete user for sending email
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 6️⃣ Send via Sendinblue
  const resp = await fetch('https://api.sendinblue.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'api-key':       process.env.SENDINBLUE_API_KEY!,
    },
    body: JSON.stringify({
      sender:  { name: 'Artcommerce Support', email: process.env.SENDINBLUE_FROM_EMAIL! },
      to:      [{ email: user.email, name: user.fullName }],
      subject: 'Your OTP to change your Artcommerce email',
      htmlContent: `
        <p>Hi ${user.fullName},</p>
        <p>Your OTP to change your email to <strong>${newEmail}</strong> is:</p>
        <h2 style="letter-spacing:4px;">${updated.emailChangeOtp}</h2>
        <p>This code expires in 5 minutes </p>
        <p>If you didn’t request this, just ignore this email.</p>
      `,
    }),
  })

  if (!resp.ok) {
    console.error('Sendinblue error:', await resp.text())
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}