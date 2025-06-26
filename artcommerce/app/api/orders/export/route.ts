import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

function getUserPayload(req: Request) {
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '') || ''
  try {
    return jwt.verify(auth, JWT_SECRET) as { role: string }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const payload = getUserPayload(request)
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all orders + related user info
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { fullName: true, email: true } }
    }
  })

  // Build CSV
  const header = [
    'OrderNumber',
    'CustomerName',
    'CustomerEmail',
    'TotalAmount',
    'Status',
    'CreatedAt'
  ].join(',')

  const rows = orders.map(o => [
    o.orderNumber,
    `"${o.user.fullName}"`,
    o.user.email,
    o.totalAmount.toFixed(2),
    o.status,
    o.createdAt
  ].join(',')).join('\n')

  const csv = [header, rows].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="orders.csv"',
    },
  })
}