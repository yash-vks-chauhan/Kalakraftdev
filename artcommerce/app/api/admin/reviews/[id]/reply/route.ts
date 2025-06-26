// @ts-nocheck
import { NextResponse } from 'next/server'
import prisma from '../../../../../../lib/prisma'
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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const reviewId = Number(params.id)
  if (isNaN(reviewId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
  const { reply, reaction } = await request.json()

  // @ts-nocheck
  const updated = await prisma.productReview.update({
    where: { id: reviewId },
    data: {
      adminReply: reply ?? undefined,
      adminReaction: reaction ?? undefined,
    },
  })

  return NextResponse.json({ review: updated })
} 