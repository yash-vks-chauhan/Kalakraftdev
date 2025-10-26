import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { requireAdmin } from '../../../../lib/auth'

export async function GET(request: Request) {
  const payload = requireAdmin(request)
  if (!payload) {
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
