import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'
import { getAuthenticatedUser } from '../../../../../lib/session-auth'

async function getAccessibleOrder(
  orderId: number,
  payload: { id: string; role?: string | null },
  options?: { requireAdmin?: boolean }
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true },
  })

  if (!order) {
    return { ok: false as const, status: 404, error: 'Order not found' }
  }

  if (options?.requireAdmin && payload.role !== 'admin') {
    return { ok: false as const, status: 403, error: 'Forbidden' }
  }

  if (payload.role !== 'admin' && order.userId !== String(payload.id)) {
    return { ok: false as const, status: 403, error: 'Forbidden' }
  }

  return { ok: true as const, order }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getAuthenticatedUser(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const orderId = Number(id)
  if (Number.isNaN(orderId)) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
  }

  const access = await getAccessibleOrder(orderId, payload)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const notes = await prisma.orderNote.findMany({
    where: { orderId },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { fullName: true } },
    },
  })

  return NextResponse.json({ notes })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getAuthenticatedUser(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const orderId = Number(id)
  if (Number.isNaN(orderId)) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
  }

  const access = await getAccessibleOrder(orderId, payload, { requireAdmin: true })
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const body = await req.json().catch(() => ({}))
  const text = typeof body?.text === 'string' ? body.text.trim() : ''

  if (!text) {
    return NextResponse.json({ error: 'Empty note' }, { status: 400 })
  }

  const note = await prisma.orderNote.create({
    data: {
      orderId,
      authorId: String(payload.id),
      text,
    },
    include: { author: { select: { fullName: true } } },
  })

  return NextResponse.json({ note }, { status: 201 })
}
