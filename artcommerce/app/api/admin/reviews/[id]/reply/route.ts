// @ts-nocheck
import { NextResponse } from 'next/server'
import prisma from '../../../../../../lib/prisma'
import { requireAdminUser } from '../../../../../../lib/session-auth'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdminUser(request)
  if (!admin) {
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
    include: {
      user: { select: { fullName: true, id: true } },
      product: { select: { name: true, id: true } },
    },
  })

  return NextResponse.json({ review: updated })
} 
