// app/api/admin/users/[id]/remind-cart/route.ts
import { NextResponse } from 'next/server'
import { renderEmail } from '../../../../../../lib/emailTemplate'
import prisma from '../../../../../../lib/prisma'
import { sendSecureMail } from '../../../../../../lib/mailer'
import { consumeRateLimit, getClientIp } from '../../../../../../lib/rateLimit'
import { requireAdminUser } from '../../../../../../lib/session-auth'
import { getPublicAppUrlForPath } from '../../../../../../lib/appUrl'

const REMIND_WINDOW_MS = 60 * 60 * 1000
const REMIND_MAX_PER_TARGET = 3

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  if (!user.email) {
    return NextResponse.json({ error: 'User does not have an email address' }, { status: 400 })
  }

  try {
    await sendSecureMail({
      to: user.email,
      subject: 'You left something in your cart',
      html: renderEmail({
        preheader: 'Your cart is still saved — pick up where you left off.',
        eyebrow: 'Your cart',
        heading: 'Still thinking it over?',
        body: [
          `Hi ${(user.fullName || '').trim().split(' ')[0] || 'there'} — these pieces are still in your cart. Each one is made in small batches, so stock can move quickly.`,
        ],
        module: {
          kind: 'list',
          items: items.map(i => ({ name: i.product.name, meta: `Qty ${i.quantity}` })),
        },
        cta: { label: 'Return to cart', href: getPublicAppUrlForPath('/cart') },
        footerReason: 'You are receiving this because you have items saved in your Kalakraft cart.',
      }),
      fromName: 'Kalakraft Support',
    })
  } catch (err) {
    console.error('❌ remind-cart error:', err)
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
