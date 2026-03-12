// app/api/admin/users/[id]/remind-cart/route.ts
import { NextResponse } from 'next/server'
import prisma from '../../../../../../lib/prisma'
import { getSecureMailer } from '../../../../../../lib/mailer'
import { consumeRateLimit, getClientIp } from '../../../../../../lib/rateLimit'
import { isAllowedOrigin } from '../../../../../../lib/security'
import { requireAdminUser } from '../../../../../../lib/session-auth'

const REMIND_WINDOW_MS = 60 * 60 * 1000
const REMIND_MAX_PER_TARGET = 3

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = await requireAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientIp = getClientIp(request)
  const { id } = await params
  const userId = id

  const limiter = consumeRateLimit(`remind-cart:${admin.id}:target:${userId}:ip:${clientIp}`, {
    windowMs: REMIND_WINDOW_MS,
    max: REMIND_MAX_PER_TARGET,
  })
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: 'Reminder rate limit reached for this user.' },
      { status: 429 }
    )
  }

  const cutoff = new Date(Date.now() - 5 * 60 * 1000)
  const items = await prisma.cartItem.findMany({
    where: { userId, addedAt: { lt: cutoff } },
    include: { product: true }
  })
  if (items.length === 0) {
    return NextResponse.json({ error: 'No abandoned cart items found' }, { status: 404 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, email: true }
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  try {
    const { transporter, smtpUser } = getSecureMailer()
    await transporter.sendMail({
      from:    `"Artcommerce" <${smtpUser}>`,
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
  } catch (err) {
    console.error('❌ remind-cart error:', err)
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
