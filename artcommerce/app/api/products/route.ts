// File: app/api/products/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

const LOW_STOCK_THRESHOLD = 5

const SYNONYMS: Record<string, string[]> = {
  plate:    ['tray'],
  platter:  ['tray'],
  'ressin tray': ['resin tray'], 
  'ressin': ['resin'],
  'jewerly tray': ['tray'],     
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const categorySlug = url.searchParams.get('category')?.trim() || undefined
    let rawSearch = url.searchParams.get('search')?.trim()   || undefined
    const lowStock = url.searchParams.get('lowStock') === 'true'
    const usageTagParam = url.searchParams.get('usageTag')?.trim() || undefined
    const priceMin = url.searchParams.get('priceMin')
    const priceMax = url.searchParams.get('priceMax')
    const ratingMinParam = url.searchParams.get('ratingMin')
    const sortParam = url.searchParams.get('sort')?.trim() || undefined
    const inStockParam = url.searchParams.get('inStock') === 'true'

    if (rawSearch) {
      const lower = rawSearch.toLowerCase()
      if (SYNONYMS[lower]) {
        rawSearch = SYNONYMS[lower].join(' ')
      }
    }
    const whereClause: Record<string, any> = { isActive: true }

    if (categorySlug) {
      whereClause.category = { slug: categorySlug }
    }
    if (rawSearch) {
      whereClause.OR = [
        { name:        { contains: rawSearch } },
        { shortDesc:   { contains: rawSearch } },
        { description: { contains: rawSearch } },
      ]
    }
    if (lowStock) {
      whereClause.stockQuantity = { lt: LOW_STOCK_THRESHOLD }
    }
    if (inStockParam) {
      whereClause.stockQuantity = { gt: 0 }
    }
    if (priceMin || priceMax) {
      whereClause.price = {}
      if (priceMin) (whereClause.price as any).gte = parseFloat(priceMin)
      if (priceMax) (whereClause.price as any).lte = parseFloat(priceMax)
    }

    // 4) Log the final whereClause for debugging
    console.log('GET /api/products → whereClause =', whereClause)

    // 5) Query Prisma with whereClause and dynamic orderBy
    let orderBy: any = { createdAt: 'desc' }
    if (sortParam === 'price_asc') orderBy = { price: 'asc' }
    else if (sortParam === 'price_desc') orderBy = { price: 'desc' }
    else if (sortParam === 'oldest') orderBy = { createdAt: 'asc' }
    else if (sortParam === 'best_sellers') {
      // For best sellers, we'll use a different approach with raw SQL
      // This is handled after the initial query
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: { category: true },
      orderBy,
    })

    // Attach rating stats in a single query: groupBy on ProductReview
    const productIds = products.map(p => p.id)
    let ratingDict: Record<number, { avg: number; count: number }> = {}
    if (productIds.length > 0) {
      // @ts-ignore – productReview model exists in runtime, TypeScript type mismatch due to Prisma client generation timing
      const ratingRows = await prisma.productReview.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds } },
        _avg: { rating: true },
        _count: { rating: true },
      })
      // @ts-ignore – runtime structure is known
      ratingRows.forEach((r: any) => {
        ratingDict[r.productId] = { avg: r._avg.rating ?? 0, count: r._count.rating }
      })
    }

    let filteredProducts = products.map(p => ({
      ...p,
      avgRating: ratingDict[p.id]?.avg ?? 0,
      ratingCount: ratingDict[p.id]?.count ?? 0,
    }))

    // Filter by minimum rating if requested
    if (ratingMinParam) {
      const min = parseFloat(ratingMinParam)
      if (!isNaN(min)) {
        filteredProducts = filteredProducts.filter(p => (p as any).avgRating >= min)
      }
    }

    // Handle best sellers sorting
    if (sortParam === 'best_sellers') {
      // Get sales data for all products
      const salesData = await prisma.$queryRaw<any[]>`
        SELECT 
          p.id,
          COALESCE(SUM(oi.quantity), 0) as "totalSold"
        FROM "Product" p
        LEFT JOIN "OrderItem" oi ON oi."productId" = p.id
        LEFT JOIN "Order" o ON o.id = oi."orderId" 
          AND o.status IN ('completed', 'shipped', 'delivered')
          AND o."paymentStatus" = 'paid'
        WHERE p.id IN (${filteredProducts.map(p => p.id).join(',')})
        GROUP BY p.id
      `
      
      // Create a map of product ID to total sold
      const salesMap = new Map()
      salesData.forEach(item => {
        salesMap.set(item.id, Number(item.totalSold) || 0)
      })
      
      // Sort products by total sold (descending)
      filteredProducts.sort((a, b) => {
        const aSold = salesMap.get(a.id) || 0
        const bSold = salesMap.get(b.id) || 0
        return bSold - aSold
      })
    }

    if (usageTagParam) {
      const tagList = usageTagParam.split(',').map(t => t.trim()).filter(Boolean)
      filteredProducts = filteredProducts.filter(p => {
        const tagsRaw = (p as any).usageTags
        const tags: string[] = Array.isArray(tagsRaw) ? tagsRaw : []
        // Ensure lower-case comparison for robustness
        const lowerTags = tags.map(t => t.toLowerCase())
        return tagList.every(t => lowerTags.includes(t.toLowerCase()))
      })
    }

    return NextResponse.json({ products: filteredProducts })
  } catch (err: any) {
    // 7) Log the full error so you can inspect it
    console.error('GET /api/products error (full):', err)
    if (err?.code) {
      console.error('Prisma error code:', err.code)
    }
    return NextResponse.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    )
  }
}