// File: app/api/orders/[id]/status/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { orderEvents } from '../../../../../lib/orderEvents'

const JWT_SECRET = process.env.JWT_SECRET!

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  // 1️⃣ Authenticate & require admin
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/, '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let payload: { userId: number; role: string }
  try {
    payload = jwt.verify(token, JWT_SECRET) as any
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
  if (payload.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // 2️⃣ Validate incoming status
  const { status } = await req.json()
  const allowed = ['accepted', 'shipped', 'delivered'] as const
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // 3️⃣ Await the dynamic params, then update
  const { id } = await context.params
  const order = await prisma.order.update({
    where: { id: Number(id) },
    data: { status },
    include: {
      user: { select: { email: true, fullName: true } }
    }
  })

  // 4️⃣ Send notification email (wrapped in try/catch)
  try {
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST!,
      port:   Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    })

    await transporter.sendMail({
      from:    `"Artcommerce" <${process.env.SMTP_USER}>`,
      to:      order.user.email,
      subject: `Your order #${order.orderNumber} is now ${status}`,
      html: `
        <p>Hi ${order.user.fullName},</p>
        <p>Your order <strong>${order.orderNumber}</strong> status has changed to <strong>${status}</strong>.</p>
        <p>Thanks for shopping with us!</p>
      `,
    })
  } catch (mailErr) {
    console.error('❌ [status route] Error sending status email:', mailErr)
    // We don’t fail the route just because email failed
  }
// emit the update event for real-time subscribers
    orderEvents.emit('order', JSON.stringify({
    type: 'updated',
    order
  }))
  // 5️⃣ Return the updated order
  return NextResponse.json({ order })
}