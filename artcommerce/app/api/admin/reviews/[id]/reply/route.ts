// @ts-nocheck
import { NextResponse } from 'next/server'
import { getBoundedString, parsePositiveInteger } from '../../../../../../lib/inputValidation'
import prisma from '../../../../../../lib/prisma'
import { requireAdminUser } from '../../../../../../lib/session-auth'

const MAX_REPLY_LENGTH = 2000
const MAX_REACTION_LENGTH = 80

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const reviewIdResult = parsePositiveInteger(id, 'reviewId')
  if (!reviewIdResult.ok) return NextResponse.json({ error: reviewIdResult.error }, { status: 400 })
  const reviewId = reviewIdResult.value

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const reply = getBoundedString((body as any).reply, 'reply', MAX_REPLY_LENGTH)
  if (!reply.ok) return NextResponse.json({ error: reply.error }, { status: 400 })
  const reaction = getBoundedString((body as any).reaction, 'reaction', MAX_REACTION_LENGTH)
  if (!reaction.ok) return NextResponse.json({ error: reaction.error }, { status: 400 })

  // @ts-nocheck
  const updated = await prisma.productReview.update({
    where: { id: reviewId },
    data: {
      adminReply: reply.value ?? undefined,
      adminReaction: reaction.value ?? undefined,
    },
    include: {
      user: { select: { fullName: true, id: true } },
      product: { select: { name: true, id: true } },
    },
  })

  return NextResponse.json({ review: updated })
} 
