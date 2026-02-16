// File: app/api/orders/[id]/status/route.ts

import { NextResponse } from 'next/server'
import { getSecureMailer } from '../../../../../lib/mailer'
import prisma from '../../../../../lib/prisma'
import { orderEvents } from '../../../../../lib/orderEvents'
import { requireAdminUser } from '../../../../../lib/session-auth'

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminUser(req)
  if (!admin) {
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
    const { transporter, smtpUser } = getSecureMailer()

    await transporter.sendMail({
      from:    `"Artcommerce" <${smtpUser}>`,
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
