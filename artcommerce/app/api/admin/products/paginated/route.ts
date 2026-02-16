import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'
import { requireAdminUser } from '../../../../../lib/session-auth'

const MAX_PAGE_SIZE = 100
const SOLD_ORDER_STATUSES = ['completed', 'shipped', 'delivered']

export async function GET(request: Request) {
  const admin = await requireAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(searchParams.get('limit') || 10))
  )
  const search = (searchParams.get('search') || '').trim()
  const status = (searchParams.get('status') || 'all').toLowerCase()
  const skip = (page - 1) * limit

  const whereClause: any = {}
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { shortDesc: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (status === 'active') whereClause.isActive = true
  if (status === 'inactive') whereClause.isActive = false

  try {
    const [totalProducts, products] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          currency: true,
          stockQuantity: true,
          isActive: true,
          categoryId: true,
          imageUrls: true,
          shortDesc: true,
        },
      }),
    ])

    const productIds = products.map((p) => p.id)
    const soldRows = productIds.length
      ? await prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            productId: { in: productIds },
            order: {
              status: { in: SOLD_ORDER_STATUSES },
              paymentStatus: 'paid',
            },
          },
          _sum: { quantity: true },
        })
      : []

    const soldByProductId = new Map<number, number>(
      soldRows.map((row) => [row.productId, Number(row._sum.quantity || 0)])
    )

    const serialized = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      currency: product.currency,
      stockQuantity: product.stockQuantity,
      isActive: product.isActive,
      categoryId: product.categoryId,
      imageUrls: Array.isArray(product.imageUrls) ? product.imageUrls : [],
      shortDesc: product.shortDesc,
      totalSold: soldByProductId.get(product.id) || 0,
    }))

    const totalPages = Math.ceil(totalProducts / limit)
    return NextResponse.json({
      products: serialized,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit,
      },
    })
  } catch (error) {
    console.error('Error fetching paginated products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
