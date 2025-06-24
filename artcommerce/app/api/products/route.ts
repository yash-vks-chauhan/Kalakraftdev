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

    // 4) Log the final whereClause for debugging
    console.log('GET /api/products → whereClause =', whereClause)

    // 5) Query Prisma with that whereClause, including the category relation
    const products = await prisma.product.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ products })
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