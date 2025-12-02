import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminFromRequest } from '@/lib/auth-helpers'

export async function GET(request: Request) {
  if (!requireAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(tickets)
}
