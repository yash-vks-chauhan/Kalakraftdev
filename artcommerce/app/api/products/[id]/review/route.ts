import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

function getUserIdFromToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return null
  try {
    const payload: any = jwt.verify(token, JWT_SECRET)
    return payload.userId
  } catch {
    return null
  }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const productId = Number(params.id)
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
    include: {
      user: { select: { fullName: true, avatarUrl: true } }
    }
  })

  return NextResponse.json({ avg: stats._avg.rating ?? 0, count: stats._count.rating, reviews })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  // First try to authenticate via JWT (used by most of our client calls)
  const tokenUserId = getUserIdFromToken(req)

  // Fallback to Next-Auth session cookie (used when browsing without the custom AuthContext)
  const session = await getServerSession()

  const userId = tokenUserId || session?.user?.id

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const productId = Number(params.id)
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