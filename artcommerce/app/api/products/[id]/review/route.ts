import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { getAuthenticatedUser } from '../../../../../lib/session-auth'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const productId = Number(id)
  if (isNaN(productId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

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

  // Fallback to Next-Auth session cookie (used when browsing without the custom AuthContext)
  const session = authUser ? null : await getServerSession()

  // @ts-ignore - Handle session user ID
  const userId = authUser?.id || session?.user?.id

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const productId = Number(id)
  if (isNaN(productId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const { rating, comment, locale="en" } = await req.json()
  if (![1, 2, 3, 4, 5].includes(rating)) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
  }

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
    update: { rating, comment, locale },
    create: { productId, userId, rating, comment, locale },
  })
  return NextResponse.json({ review })
} 
