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

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT p.id, p.name,
            AVG(r.rating)  AS avgRating,
            COUNT(r.id)    AS reviewCount
     FROM   "Product" p
     JOIN   "ProductReview" r ON r."productId" = p.id
     GROUP  BY p.id
     HAVING COUNT(r.id) > 0
     ORDER  BY avgRating DESC
     LIMIT  20;`
  )

  // SQLite may return BigInt objects for aggregate COUNT(); convert them and any other BigInt values
  const sanitized = rows.map((row) => {
    const converted: Record<string, any> = {}
    for (const [key, value] of Object.entries(row)) {
      converted[key] = typeof value === 'bigint' ? Number(value) : value
    }
    // Ensure numeric aggregates are plain numbers
    if (converted.avgRating !== null) converted.avgRating = Number(converted.avgRating)
    return converted
  })

  return NextResponse.json({ products: sanitized })
} 