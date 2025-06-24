import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { code } = await req.json()
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  // 1. Look up coupon
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

  // 2. Check expiry
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Coupon expired' }, { status: 400 })
  }

  // 3. Check usage limit
  if (
    coupon.usageLimit !== null &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 })
  }

  // 4. Increment usedCount
  await prisma.coupon.update({
    where: { id: coupon.id },
    data: { usedCount: { increment: 1 } },
  })

  // 5. Return amount & type
  return NextResponse.json({
    code: coupon.code,
    type: coupon.type,     // 'percentage' or 'flat'
    amount: coupon.amount, // e.g. 10 (for 10% or ₹10)
  })
}