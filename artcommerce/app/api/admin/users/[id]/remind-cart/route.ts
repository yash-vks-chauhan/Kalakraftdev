// app/api/admin/users/[id]/remind-cart/route.ts
import { NextResponse } from 'next/server'
import prisma from '../../../../../../lib/prisma'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'

const JWT_SECRET = process.env.JWT_SECRET!

function requireAdmin(req: Request) {
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '') || ''
  try {
    return (jwt.verify(auth, JWT_SECRET) as any).role === 'admin'
  } catch {
    return false
  }
}

function makeTransporter() {
  return nodemailer.createTransport({
    host:    process.env.SMTP_HOST!,
    port:    Number(process.env.SMTP_PORT),
    secure:  process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
    tls: { rejectUnauthorized: false }
  })
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1️⃣ Auth
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2️⃣ Get userId from dynamic params
  const { id } = params
  const userId = id // Keep as string for prisma

  // 3️⃣ Find their cart items older than 5 minutes
  const cutoff = new Date(Date.now() - 5 * 60 * 1000)
  const items = await prisma.cartItem.findMany({
    where: { userId, addedAt: { lt: cutoff } },
    include: { product: true }
  })
  if (items.length === 0) {
    return NextResponse.json({ error: 'No abandoned cart items found' }, { status: 404 })
  }

  // 4️⃣ Load user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, email: true }
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 5️⃣ Send the reminder email
  try {
    const transporter = makeTransporter()
    const info = await transporter.sendMail({
      from:    `"Artcommerce" <${process.env.SMTP_USER!}>`,
      to:      user.email,
      subject: 'You left items in your cart!',
      html: `
        <p>Hi ${user.fullName},</p>
        <p>We noticed you left these items in your cart:</p>
        <ul>
          ${items.map(i => `<li>${i.product.name} (qty: ${i.quantity})</li>`).join('')}
        </ul>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://kalakraftdev.vercel.app'}/cart">Return to your cart & checkout</a></p>
      `,
    })
    console.log('✉️ Cart reminder sent, messageId=', info.messageId)
  } catch (err) {
    console.error('❌ remind-cart error:', err)
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}