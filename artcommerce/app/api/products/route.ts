// File: app/api/products/route.ts

import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { getBoundedString } from '../../../lib/inputValidation'

const LOW_STOCK_THRESHOLD = 5
const MAX_SEARCH_LENGTH = 120
const MAX_ID_LOOKUP = 100

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
    const searchValue = getBoundedString(url.searchParams.get('search'), 'search', MAX_SEARCH_LENGTH)
    if (!searchValue.ok) {
      return NextResponse.json({ error: searchValue.error }, { status: 400 })
    }
    let rawSearch = searchValue.value || undefined
    const lowStock = url.searchParams.get('lowStock') === 'true'
    const usageTagParam = url.searchParams.get('usageTag')?.trim() || undefined
    const priceMin = url.searchParams.get('priceMin')
    const priceMax = url.searchParams.get('priceMax')
    const ratingMinParam = url.searchParams.get('ratingMin')
    const sortParam = url.searchParams.get('sort')?.trim() || undefined
    const inStockParam = url.searchParams.get('inStock') === 'true'
    const idsParam = url.searchParams.get('ids')?.trim() || undefined
    const fieldsParam = url.searchParams.get('fields')?.trim() || undefined
    const limitParam = url.searchParams.get('limit')?.trim() || undefined

    /*
     * Batched stock lookup. The wishlist needs stockQuantity for every saved
     * piece and was firing one request per item on mount — twenty saved
     * pieces meant twenty round trips. This answers all of them at once and
     * returns before the ratings groupBy and best-seller work, none of which
     * a stock check has any use for.
     */
    if (idsParam) {
      const ids = Array.from(
        new Set(
          idsParam
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => Number.isInteger(n) && n > 0)
        )
      ).slice(0, MAX_ID_LOOKUP)

      if (ids.length === 0) {
        return NextResponse.json({ products: [] })
      }

      const rows = await prisma.product.findMany({
        where: { id: { in: ids }, isActive: true },
        select: { id: true, stockQuantity: true },
      })
      return NextResponse.json({ products: rows })
    }

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
      if (priceMin) {
        const parsedMin = Number(priceMin)
        if (Number.isFinite(parsedMin) && parsedMin >= 0) (whereClause.price as any).gte = parsedMin
      }
      if (priceMax) {
        const parsedMax = Number(priceMax)
        if (Number.isFinite(parsedMax) && parsedMax >= 0) (whereClause.price as any).lte = parsedMax
      }
    }

    /*
     * Search index projection. Placed after the where clause is complete, so
     * category/price/stock filters still apply if a caller passes them.
     *
     * The storefront search fetches the catalogue once per session and matches
     * it in memory. It was asking for `?limit=200` — a parameter that did not
     * exist — so it received every active product with its full description,
     * plus a groupBy across every review for ratings it never displayed. This
     * returns only what a result row and its preview need, and skips the
     * ratings round trip entirely.
     */
    if (fieldsParam === 'search') {
      const requested = Number(limitParam)
      const take = Math.min(Number.isFinite(requested) && requested > 0 ? requested : 500, 1000)
      const rows = await prisma.product.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          name: true,
          slug: true,
          shortDesc: true,
          price: true,
          currency: true,
          imageUrls: true,
          stockQuantity: true,
          createdAt: true,
          usageTags: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      })
      return NextResponse.json({ products: rows })
    }

    // 4) Query Prisma with whereClause and dynamic orderBy
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
      const filteredProductIds = filteredProducts.map(p => p.id)
      const salesData = filteredProductIds.length
        ? await prisma.$queryRaw<any[]>(Prisma.sql`
            SELECT
              p.id,
              COALESCE(SUM(oi.quantity), 0) as "totalSold"
            FROM "Product" p
            LEFT JOIN "OrderItem" oi ON oi."productId" = p.id
            LEFT JOIN "Order" o ON o.id = oi."orderId"
              AND o.status IN ('completed', 'shipped', 'delivered')
              AND o."paymentStatus" = 'paid'
            WHERE p.id IN (${Prisma.join(filteredProductIds)})
            GROUP BY p.id
          `)
        : []
      
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
    console.error('GET /api/products error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
