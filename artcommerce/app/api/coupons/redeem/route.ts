import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { consumeRateLimit, getClientIp } from '../../../../lib/rateLimit'
import { isAllowedOrigin } from '../../../../lib/security'
import { getAuthenticatedUser } from '../../../../lib/session-auth'

export const runtime = 'nodejs'

const REDEEM_WINDOW_MS = 10 * 60 * 1000
const REDEEM_MAX_ATTEMPTS = 30

export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientIp = getClientIp(req)
  const limit = consumeRateLimit(`coupon-redeem:${user.id}:ip:${clientIp}`, {
    windowMs: REDEEM_WINDOW_MS,
    max: REDEEM_MAX_ATTEMPTS,
  })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many coupon attempts. Please try again later.' },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const code = String(body.code || '').trim().toUpperCase()
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code },
    select: {
      code: true,
      type: true,
      amount: true,
      expiresAt: true,
      usageLimit: true,
      usedCount: true,
    },
  })

  if (!coupon) {
    return NextResponse.json({ error: 'Invalid coupon' }, { status: 404 })
  }

  if (coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Coupon expired' }, { status: 400 })
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 })
  }

  // Validation endpoint only; usage count is incremented on successful order creation.
  return NextResponse.json({
    code: coupon.code,
    type: coupon.type,
    amount: coupon.amount,
  })
}
