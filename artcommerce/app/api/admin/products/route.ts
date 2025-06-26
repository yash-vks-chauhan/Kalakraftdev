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

  const products = await prisma.product.findMany({
    orderBy: { updatedAt: 'desc' },
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
  })

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