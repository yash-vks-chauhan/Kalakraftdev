import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { requireAdminUser } from '../../../../lib/session-auth'

type CouponType = 'percentage' | 'flat'

function parseCouponType(type: unknown): CouponType | null {
  if (type === 'percentage' || type === 'flat') return type
  return null
}

export async function GET(request: Request) {
  const admin = await requireAdminUser(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ coupons })
}

export async function POST(req: Request) {
  const admin = await requireAdminUser(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const code = String(body.code || '').trim().toUpperCase()
  const type = parseCouponType(body.type)
  const amount = Number(body.amount)
  const usageLimit = body.usageLimit == null ? null : Number(body.usageLimit)
  const expiresAtRaw = body.expiresAt

  if (!code || !type || !Number.isFinite(amount) || amount <= 0 || !expiresAtRaw) {
    return NextResponse.json({ error: 'Invalid coupon payload' }, { status: 400 })
  }

  const expiresAt = new Date(expiresAtRaw)
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    return NextResponse.json({ error: 'Invalid expiresAt' }, { status: 400 })
  }

  if (type === 'percentage' && amount > 100) {
    return NextResponse.json({ error: 'Percentage coupon cannot exceed 100' }, { status: 400 })
  }

  if (usageLimit != null && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
    return NextResponse.json({ error: 'Invalid usageLimit' }, { status: 400 })
  }

  try {
    const coupon = await prisma.coupon.create({
      data: { code, type, amount, expiresAt, usageLimit },
    })
    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })
    }
    throw error
  }
}

export async function PATCH(req: Request) {
  const admin = await requireAdminUser(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const id = Number(body.id)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid coupon id' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  if (body.code !== undefined) {
    const code = String(body.code || '').trim().toUpperCase()
    if (!code) return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    data.code = code
  }

  if (body.type !== undefined) {
    const type = parseCouponType(body.type)
    if (!type) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    data.type = type
  }

  if (body.amount !== undefined) {
    const amount = Number(body.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }
    data.amount = amount
  }

  if (body.expiresAt !== undefined) {
    const expiresAt = new Date(body.expiresAt)
    if (Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: 'Invalid expiresAt' }, { status: 400 })
    }
    data.expiresAt = expiresAt
  }

  if (body.usageLimit !== undefined) {
    if (body.usageLimit === null) {
      data.usageLimit = null
    } else {
      const usageLimit = Number(body.usageLimit)
      if (!Number.isInteger(usageLimit) || usageLimit < 1) {
        return NextResponse.json({ error: 'Invalid usageLimit' }, { status: 400 })
      }
      data.usageLimit = usageLimit
    }
  }

  const coupon = await prisma.coupon.update({
    where: { id },
    data,
  })
  return NextResponse.json({ coupon })
}

export async function DELETE(req: Request) {
  const admin = await requireAdminUser(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const id = Number(body.id)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid coupon id' }, { status: 400 })
  }

  await prisma.coupon.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
