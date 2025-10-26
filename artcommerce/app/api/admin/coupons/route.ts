import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { requireAdmin } from '../../../../lib/auth'

export async function GET() {
  // list all
  return NextResponse.json({ coupons: await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } }) })
}

export async function POST(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { code, type, amount, expiresAt, usageLimit } = await req.json()
  const c = await prisma.coupon.create({ data: { code, type, amount, expiresAt: new Date(expiresAt), usageLimit }})
  return NextResponse.json({ coupon: c }, { status: 201 })
}

export async function PATCH(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...data } = await req.json()
  const c = await prisma.coupon.update({ where: { id }, data })
  return NextResponse.json({ coupon: c })
}

export async function DELETE(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await prisma.coupon.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
