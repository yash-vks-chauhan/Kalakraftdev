import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { requireAdminUser } from '../../../../lib/session-auth'

function sanitizeCsvCell(value: unknown): string {
  const asString = String(value ?? '')
  const escaped = asString.replace(/"/g, '""')
  const startsWithFormula = /^[=+\-@]/.test(escaped.trim())
  const safe = startsWithFormula ? `'${escaped}` : escaped
  return `"${safe}"`
}

export async function GET(request: Request) {
  const admin = await requireAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { fullName: true, email: true } },
    },
  })

  const header = [
    'OrderNumber',
    'CustomerName',
    'CustomerEmail',
    'TotalAmount',
    'Status',
    'CreatedAt',
  ].join(',')

  const rows = orders
    .map((o) =>
      [
        sanitizeCsvCell(o.orderNumber),
        sanitizeCsvCell(o.user.fullName),
        sanitizeCsvCell(o.user.email),
        sanitizeCsvCell(o.totalAmount.toFixed(2)),
        sanitizeCsvCell(o.status),
        sanitizeCsvCell(o.createdAt.toISOString()),
      ].join(',')
    )
    .join('\n')

  const csv = [header, rows].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="orders.csv"',
    },
  })
}
