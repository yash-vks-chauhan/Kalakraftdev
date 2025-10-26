// @ts-nocheck
import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { requireAdmin } from '../../../../lib/auth'

export async function GET(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reviews = await prisma.productReview.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { id: true, name: true } },
      user: { select: { id: true, fullName: true } },
    },
    take: 200,
  })

  return NextResponse.json({ reviews })
} 
