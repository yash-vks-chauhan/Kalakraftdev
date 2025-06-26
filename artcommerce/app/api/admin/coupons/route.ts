import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

// simple helper
function requireAdmin(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') || ''
  try {
    return (jwt.verify(token, JWT_SECRET) as any).role === 'admin'
  } catch {
    return false
  }
}

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