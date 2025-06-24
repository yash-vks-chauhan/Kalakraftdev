// File: app/api/auth/request-password-change/route.ts

import { NextResponse } from 'next/server'
import prisma           from '../../../../lib/prisma'
import jwt              from 'jsonwebtoken'
import { nanoid }       from 'nanoid'
import nodemailer       from 'nodemailer'

export const runtime = 'nodejs'
const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(request: Request) {
  let user

  // ── 1️⃣ Try dashboard flow via JWT ───────────────────────
  const auth = request.headers.get('authorization') || ''
  if (auth.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any
      user = await prisma.user.findUnique({ where: { id: payload.userId } })
    } catch {
      // invalid or expired token → fall back to public flow
    }
  }

  // ── 2️⃣ Public flow: parse email from body ───────────────
  if (!user) {
    const { email } = await request.json().catch(() => ({}))
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid email' },
        { status: 400 }
      )
    }
    user = await prisma.user.findUnique({ where: { email } })
  }

  // ── 3️⃣ No such user? return OK (don't reveal existence) ─
  if (!user) {
    return NextResponse.json({ ok: true })
  }

  // ── 4️⃣ Generate & persist OTP ───────────────────────────
  const code    = nanoid(6).toUpperCase()
  const expires = new Date(Date.now() + 5 * 60 * 1000)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordChangeOtp:     code,
      passwordChangeExpires: expires,
    },
  })

  // Log for admin/debugging purposes (visible in server console)
  console.log(`🔐 Password-reset OTP generated for ${user.email}: ${code}`)

  // ── 5️⃣ Email the OTP ──────────────────────────────────
  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST!,
    port:   Number(process.env.SMTP_PORT!),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  })

  // craft a simple text + fallback link in case
  const html = `
    <p>Hi ${user.fullName || ''},</p>
    <p>Your one-time code to reset your password is:</p>
    <h2 style="letter-spacing:4px;">${code}</h2>
    <p>This code expires in 5 minutes.</p>
    <p>If you didn't request this, ignore this email.</p>
  `
  try {
    await transporter.sendMail({
      from:    `"Artcommerce Support" <${process.env.SMTP_USER}>`,
      to:        user.email as string,
      subject:   'Your Artcommerce password reset code',
      html,
    })
  } catch (err) {
    console.error('❌ Error sending OTP email:', err)
    // swallow errors so we still return 200
  }

  // ── 6️⃣ Done ─────────────────────────────────────────────
  return NextResponse.json({ ok: true })
}