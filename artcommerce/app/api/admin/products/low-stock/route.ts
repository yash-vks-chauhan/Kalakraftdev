// app/api/admin/products/low-stock/route.ts
import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'
import { requireAdminUser } from '../../../../../lib/session-auth'

export async function GET(request: Request) {
  const admin = await requireAdminUser(request)
  if (!admin) {
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
      isActive: true,
    },
    orderBy: { stockQuantity: 'asc' }
  })

  return NextResponse.json({ products: lowStock })
}
