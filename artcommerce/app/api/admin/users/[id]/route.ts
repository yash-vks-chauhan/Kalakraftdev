// File: app/api/admin/users/[id]/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'
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

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const userId = id // userId is a string (cuid)

  // 1️⃣ Fetch the user before deleting
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, email: true }
  })
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  try {
    // 2️⃣ Cascade‐delete related data
    await prisma.cartItem.deleteMany({ where: { userId } })
    await prisma.wishlistItem.deleteMany({ where: { userId } })
    await prisma.address.deleteMany({ where: { userId } })

    const orders = await prisma.order.findMany({
      where: { userId },
      select: { id: true }
    })
    for (const o of orders) {
      await prisma.orderItem.deleteMany({ where: { orderId: o.id } })
      await prisma.orderNote.deleteMany({ where: { orderId: o.id } })
      await prisma.order.delete({ where: { id: o.id } })
    }

    // 3️⃣ Delete the user
    await prisma.user.delete({ where: { id: userId } })

    // 4️⃣ Send notification email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    })

    if (target.email) {
      await transporter.sendMail({
        from: `"Artcommerce Support" <${process.env.SMTP_USER!}>`,
        to: target.email,
        subject: 'Your Artcommerce Account Has Been Deleted',
        html: `
          <p>Hi ${target.fullName},</p>
          <p>We're writing to let you know that your Artcommerce account has been deleted by an administrator.</p>
          <p>If you believe this was in error, please contact support@example.com.</p>
          <p>Regards,<br/>The Artcommerce Team</p>
        `,
      })
    }

    // 5️⃣ Log to terminal
    console.log(`✅ Deleted user ${userId} (${target.email}) and sent notification email.`)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('❌ delete-user error:', e)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}