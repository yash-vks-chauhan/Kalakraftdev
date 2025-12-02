// File: app/api/support/ticket/[id]/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSupportAuth } from '@/lib/support-auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getSupportAuth(request)
  if (!auth?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.id },
    include: { messages: true },
  })
  if (!ticket) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const isOwner = ticket.email === auth.email
  const isAdmin = auth.role === 'admin'
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(ticket)
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getSupportAuth(request)
  if (!auth?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.id },
    select: { email: true, status: true },
  })
  if (!ticket) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const isOwner = ticket.email === auth.email
  if (!isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (ticket.status === 'closed') {
    return NextResponse.json({ error: 'Ticket is closed' }, { status: 400 })
  }

  const { content } = (await request.json()) as { content?: string }
  if (!content) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  await prisma.supportMessage.create({
    data: { ticketId: params.id, sender: 'customer', content },
  })

  return NextResponse.json({ ok: true })
}
