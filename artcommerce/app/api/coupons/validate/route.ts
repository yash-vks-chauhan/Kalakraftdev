import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { consumeRateLimit, getClientIp } from '../../../../lib/rateLimit'
import { isAllowedOrigin } from '../../../../lib/security'
import { getAuthenticatedUser } from '../../../../lib/session-auth'

export const runtime = 'nodejs'

const VALIDATE_WINDOW_MS = 10 * 60 * 1000
const VALIDATE_MAX_ATTEMPTS = 20
const MAX_COUPON_CODE_LENGTH = 64

export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientIp = getClientIp(req)
  const limit = consumeRateLimit(`coupon-validate:${user.id}:ip:${clientIp}`, {
    windowMs: VALIDATE_WINDOW_MS,
    max: VALIDATE_MAX_ATTEMPTS,
  })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many coupon attempts. Please try again later.' },
      { status: 429 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const code = String(body.code || '').trim().toUpperCase()
  if (!code || code.length > MAX_COUPON_CODE_LENGTH) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code },
    select: {
      id:           true,
      code:         true,
      type:         true,
      amount:       true,
      expiresAt:    true,
      usageLimit:   true,
      usedCount:    true,
    },
  })

  if (!coupon) {
    return NextResponse.json({ error: 'Invalid coupon' }, { status: 404 })
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Coupon expired' }, { status: 400 })
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 })
  }

  return NextResponse.json({
    code: coupon.code,
    type: coupon.type,
    amount: coupon.amount,
  })
}
