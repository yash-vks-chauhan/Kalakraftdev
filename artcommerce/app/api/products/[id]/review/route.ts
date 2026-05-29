import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'
import { getBoundedString, parsePositiveInteger } from '../../../../../lib/inputValidation'
import { getAuthenticatedUser } from '../../../../../lib/session-auth'

const MAX_REVIEW_COMMENT_LENGTH = 1000
const MAX_LOCALE_LENGTH = 12

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const productIdResult = parsePositiveInteger(id, 'productId')
  if (!productIdResult.ok) return NextResponse.json({ error: productIdResult.error }, { status: 400 })
  const productId = productIdResult.value

  // @ts-ignore
  const stats = await prisma.productReview.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  })

  // Fetch recent reviews (latest 20)
  // @ts-ignore
  const reviews = await prisma.productReview.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      adminReply: true,
      adminReaction: true,
      user: { select: { fullName: true, avatarUrl: true } },
    }
  })

  return NextResponse.json({ avg: stats._avg.rating ?? 0, count: stats._count.rating, reviews })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthenticatedUser(req)

  if (!authUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = authUser.id

  const { id } = await params
  const productIdResult = parsePositiveInteger(id, 'productId')
  if (!productIdResult.ok) return NextResponse.json({ error: productIdResult.error }, { status: 400 })
  const productId = productIdResult.value

  const body = await req.json().catch(() => ({}))
  const rating = Number(body.rating)
  if (![1, 2, 3, 4, 5].includes(rating)) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
  }
  const comment = getBoundedString(body.comment, 'comment', MAX_REVIEW_COMMENT_LENGTH)
  if (!comment.ok) return NextResponse.json({ error: comment.error }, { status: 400 })
  const locale = getBoundedString(body.locale ?? 'en', 'locale', MAX_LOCALE_LENGTH, { required: true })
  if (!locale.ok) return NextResponse.json({ error: locale.error }, { status: 400 })

  // @ts-ignore
  const eligible = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId, status: 'delivered' },
    },
  })
  if (!eligible) return NextResponse.json({ error: 'Not eligible to rate' }, { status: 403 })

  // @ts-ignore
  const review = await prisma.productReview.upsert({
    where: { productId_userId: { productId, userId } },
    update: { rating, comment: comment.value, locale: locale.value! },
    create: { productId, userId, rating, comment: comment.value, locale: locale.value! },
  })
  return NextResponse.json({ review })
} 
