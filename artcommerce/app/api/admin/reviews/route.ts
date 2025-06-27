// @ts-nocheck
import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

function requireAdmin(request: Request) {
  const auth = request.headers.get('Authorization')?.replace('Bearer ', '') || ''
  try {
    return (jwt.verify(auth, JWT_SECRET) as any).role === 'admin'
  } catch {
    return false
  }
}

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