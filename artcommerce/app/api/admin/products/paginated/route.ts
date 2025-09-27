// app/api/admin/products/paginated/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'
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

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || 'all'

  const skip = (page - 1) * limit

  // Build where clause for filtering
  const whereClause: any = {}
  
  if (search) {
    whereClause.OR = [
      {
        name: {
          contains: search,
          mode: 'insensitive'
        }
      },
      {
        shortDesc: {
          contains: search,
          mode: 'insensitive'
        }
      },
      {
        description: {
          contains: search,
          mode: 'insensitive'
        }
      }
    ]
  }

  if (status === 'active') {
    whereClause.isActive = true
  } else if (status === 'inactive') {
    whereClause.isActive = false
  }

  try {
    // Get total count for pagination
    const totalProducts = await prisma.product.count({
      where: whereClause
    })

    // Get products with sales data using raw query for better performance
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
      WHERE 
        ${search ? `(
          p.name ILIKE '%${search}%' OR 
          p."shortDesc" ILIKE '%${search}%' OR 
          p.description ILIKE '%${search}%'
        )` : 'TRUE'}
        ${status === 'active' ? 'AND p."isActive" = TRUE' : ''}
        ${status === 'inactive' ? 'AND p."isActive" = FALSE' : ''}
      GROUP BY p.id
      ORDER BY p."updatedAt" DESC
      LIMIT ${limit}
      OFFSET ${skip}
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
        : product.imageUrls || [],
      shortDesc: product.shortDesc,
      totalSold: Number(product.totalSold) || 0,
    }))

    // Calculate pagination info
    const totalPages = Math.ceil(totalProducts / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    const pagination = {
      currentPage: page,
      totalPages,
      totalProducts,
      hasNextPage,
      hasPrevPage,
      limit
    }

    return NextResponse.json({ 
      products,
      pagination
    })

  } catch (error) {
    console.error('Error fetching paginated products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' }, 
      { status: 500 }
    )
  }
}
