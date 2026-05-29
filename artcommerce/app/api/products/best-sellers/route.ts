// File: app/api/products/best-sellers/route.ts

import { NextResponse } from 'next/server'
import { clampInteger } from '../../../../lib/inputValidation'
import prisma from '../../../../lib/prisma'

const MAX_BEST_SELLERS_LIMIT = 50

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = clampInteger(url.searchParams.get('limit'), 5, 1, MAX_BEST_SELLERS_LIMIT)

    // Query to get best-selling products based on total quantity sold
    // We'll join OrderItem with Product and sum the quantities, only including completed/paid orders
    const bestSellers = await prisma.$queryRaw<any[]>`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.price,
        p."imageUrls",
        p."stockQuantity",
        p."isActive",
        p."shortDesc",
        c.name as "categoryName",
        c.slug as "categorySlug",
        COALESCE(SUM(oi.quantity), 0) as "totalSold",
        COUNT(DISTINCT o.id) as "orderCount"
      FROM "Product" p
      LEFT JOIN "OrderItem" oi ON oi."productId" = p.id
      LEFT JOIN "Order" o ON o.id = oi."orderId" 
        AND o.status IN ('completed', 'shipped', 'delivered')
        AND o."paymentStatus" = 'paid'
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      WHERE p."isActive" = true
      GROUP BY p.id, c.name, c.slug
      ORDER BY "totalSold" DESC, p."createdAt" DESC
      LIMIT ${limit}
    `

    // Get rating stats for these products
    const productIds = bestSellers.map(p => p.id)
    let ratingDict: Record<number, { avg: number; count: number }> = {}
    
    if (productIds.length > 0) {
      const ratingRows = await prisma.productReview.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds } },
        _avg: { rating: true },
        _count: { rating: true },
      })
      
      ratingRows.forEach((r: any) => {
        ratingDict[r.productId] = { 
          avg: r._avg.rating ?? 0, 
          count: r._count.rating 
        }
      })
    }

    // Format the response
    const formattedProducts = bestSellers.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      imageUrls: typeof product.imageUrls === 'string' 
        ? JSON.parse(product.imageUrls) 
        : product.imageUrls,
      stockQuantity: product.stockQuantity,
      isActive: product.isActive,
      shortDesc: product.shortDesc,
      category: product.categoryName ? {
        name: product.categoryName,
        slug: product.categorySlug
      } : null,
      totalSold: Number(product.totalSold) || 0,
      orderCount: Number(product.orderCount) || 0,
      avgRating: ratingDict[product.id]?.avg ?? 0,
      ratingCount: ratingDict[product.id]?.count ?? 0,
    }))

    return NextResponse.json({ 
      products: formattedProducts,
      message: `Top ${limit} best-selling products`
    })

  } catch (error: any) {
    console.error('Error fetching best sellers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch best sellers' },
      { status: 500 }
    )
  }
}
