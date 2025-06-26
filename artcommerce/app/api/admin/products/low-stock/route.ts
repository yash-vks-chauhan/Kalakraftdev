// app/api/admin/products/low-stock/route.ts
import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

function requireAdmin(req: Request) {
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '') || ''
  try {
    return (jwt.verify(auth, JWT_SECRET) as any).role === 'admin'
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // find all products with stockQuantity <= threshold (e.g. 5)
  const lowStock = await prisma.product.findMany({
    where: { stockQuantity: { lte: 5 } },
    select: {
      id: true,
      name: true,
      slug: true,
      stockQuantity: true,
      price: true,
      currency: true,
      imageUrls: true,
    },
    orderBy: { stockQuantity: 'asc' }
  })

  return NextResponse.json({ products: lowStock })
}