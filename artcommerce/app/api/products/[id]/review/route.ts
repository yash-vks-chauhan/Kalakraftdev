import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'
import { getBoundedString, parsePositiveInteger } from '../../../../../lib/inputValidation'
import { getAuthenticatedUser } from '../../../../../lib/session-auth'

const MAX_REVIEW_COMMENT_LENGTH = 1000
const MAX_LOCALE_LENGTH = 12
const MAX_SLUG_LENGTH = 200

/*
 * /products/[id] accepts either the numeric id or the slug, and the product
 * page passes that same route parameter straight through to here. Rejecting
 * slugs meant a product reached by its slug came back 400 and the page drew
 * every rating on it as zero — so resolve the slug rather than refuse it.
 */
async function resolveProductId(raw: string): Promise<number | null> {
  if (/^[0-9]+$/.test(raw)) {
    const parsed = parsePositiveInteger(raw, 'productId')
    return parsed.ok ? parsed.value : null
  }
  if (!raw || raw.length > MAX_SLUG_LENGTH) return null
  const product = await prisma.product.findUnique({
    where: { slug: raw },
    select: { id: true },
  })
  return product?.id ?? null
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const productId = await resolveProductId(id)
  if (productId === null) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

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
  const productId = await resolveProductId(id)
  if (productId === null) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

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
