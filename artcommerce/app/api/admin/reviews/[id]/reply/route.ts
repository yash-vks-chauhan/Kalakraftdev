// @ts-nocheck
import { NextResponse } from 'next/server'
import prisma from '../../../../../../lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

function requireAdmin(request: Request) {
  const auth = request.headers.get('Authorization')?.replace('Bearer ', '') || ''
  try {
    const decoded = jwt.verify(auth, JWT_SECRET) as any;
    return { isAdmin: decoded.role === 'admin', userId: decoded.userId };
  } catch {
    return { isAdmin: false, userId: null };
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { isAdmin, userId } = requireAdmin(request);
  if (!isAdmin) {
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
      reply: reply ?? undefined,
      adminReaction: reaction ?? undefined,
      repliedAt: reply ? new Date() : undefined,
      repliedById: reply ? userId : undefined
    },
    include: {
      user: { select: { fullName: true, id: true } },
      product: { select: { name: true, id: true } },
    },
  })

  return NextResponse.json({ review: updated })
} 