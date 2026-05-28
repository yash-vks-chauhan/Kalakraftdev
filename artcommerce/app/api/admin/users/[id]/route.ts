// File: app/api/admin/users/[id]/route.ts

import { NextResponse } from 'next/server'
import { escapeHtml } from '../../../../../lib/emailContent'
import { getSecureMailer } from '../../../../../lib/mailer'
import prisma from '../../../../../lib/prisma'
import { requireAdminUser } from '../../../../../lib/session-auth'

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminUser(request)
  if (!admin) {
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
    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { userId } })
      await tx.wishlistItem.deleteMany({ where: { userId } })
      await tx.address.deleteMany({ where: { userId } })

      const orders = await tx.order.findMany({
        where: { userId },
        select: { id: true }
      })
      for (const o of orders) {
        await tx.orderItem.deleteMany({ where: { orderId: o.id } })
        await tx.orderNote.deleteMany({ where: { orderId: o.id } })
        await tx.order.delete({ where: { id: o.id } })
      }

      // 3️⃣ Delete the user
      await tx.user.delete({ where: { id: userId } })
    })

    if (target.email) {
      try {
        const { transporter, smtpUser } = getSecureMailer()

        await transporter.sendMail({
          from: `"Artcommerce Support" <${smtpUser}>`,
          to: target.email,
          subject: 'Your Artcommerce Account Has Been Deleted',
          html: `
            <p>Hi ${escapeHtml(target.fullName)},</p>
            <p>We're writing to let you know that your Artcommerce account has been deleted by an administrator.</p>
            <p>If you believe this was in error, please contact support@example.com.</p>
            <p>Regards,<br/>The Artcommerce Team</p>
          `,
        })
      } catch (mailErr) {
        console.error('❌ delete-user notification email failed:', mailErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('❌ delete-user error:', e)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
