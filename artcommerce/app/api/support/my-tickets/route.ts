// File: app/api/support/my-tickets/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSupportAuth } from '@/lib/support-auth'

export async function GET(request: Request) {
  const auth = await getSupportAuth(request)
  if (!auth?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { email: auth.email },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ tickets })
}
