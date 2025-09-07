// app/api/admin/products/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

function requireAdmin(req: Request) {
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '') || ''
  try {
    const { role } = jwt.verify(auth, JWT_SECRET) as any
    return role === 'admin'
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Get products with total sold count
  const productsWithSales = await prisma.$queryRaw<any[]>`
    SELECT 
      p.id,
      p.name,
      p.slug,
      p.price,
      p.currency,
      p."stockQuantity",
      p."isActive",
      p."categoryId",
      p."imageUrls",
      p."shortDesc",
      COALESCE(SUM(oi.quantity), 0) as "totalSold"
    FROM "Product" p
    LEFT JOIN "OrderItem" oi ON oi."productId" = p.id
    LEFT JOIN "Order" o ON o.id = oi."orderId" 
      AND o.status IN ('completed', 'shipped', 'delivered')
      AND o."paymentStatus" = 'paid'
    GROUP BY p.id
    ORDER BY p."updatedAt" DESC
  `

  // Format the products
  const products = productsWithSales.map(product => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price),
    currency: product.currency,
    stockQuantity: product.stockQuantity,
    isActive: product.isActive,
    categoryId: product.categoryId,
    imageUrls: typeof product.imageUrls === 'string' 
      ? JSON.parse(product.imageUrls) 
      : product.imageUrls,
    shortDesc: product.shortDesc,
    totalSold: Number(product.totalSold) || 0,
  }))

  return NextResponse.json({ products })
}

export async function POST(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const {
    name,
    slug,
    price,
    currency,
    stockQuantity: rawStockQuantity,
    isActive,
    categoryId,
    imageUrls,
    shortDesc,
    description,
    specifications,
    careInstructions,
    stylingIdeaImages,
    usageTags = [],
  } = body

  if (
    !name ||
    !slug ||
    price == null ||
    !currency ||
    rawStockQuantity == null ||
    isActive == null ||
    categoryId == null ||
    !Array.isArray(imageUrls) ||
    !shortDesc ||
    !description
  ) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Ensure stockQuantity is never negative
  const stockQuantity = rawStockQuantity < 0 ? 0 : rawStockQuantity;

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      price,
      currency,
      stockQuantity,
      isActive,
      categoryId,
      imageUrls,
      shortDesc,
      description,
      specifications,
      careInstructions,
      stylingIdeaImages: stylingIdeaImages ?? [],
      usageTags,
    } as any,
  })

  return NextResponse.json({ product })
}