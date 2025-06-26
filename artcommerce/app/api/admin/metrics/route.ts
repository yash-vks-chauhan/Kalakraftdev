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

function computeStart(period: string): Date | null {
  const now = new Date()
  switch (period) {
    case 'today':
      now.setHours(0,0,0,0)
      return now
    case 'week':
      return new Date(Date.now() - 7*24*60*60*1000)
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case 'year':
      return new Date(now.getFullYear(), 0, 1)
    case 'all':
    default:
      return null
  }
}

export async function GET(request: Request) {
  const payload = getUserPayload(request)
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const period = url.searchParams.get('period') || 'today'
  const start = computeStart(period)

  // Build a `where` filter for the time window
  const dateFilter = start
    ? { createdAt: { gte: start } }
    : {}

  const totalOrders = await prisma.order.count({
    where: dateFilter
  })

  const statusCounts = await prisma.order.groupBy({
    by: ['status'],
    where: dateFilter,
    _count: { status: true }
  })

  const revenueAgg = await prisma.order.aggregate({
    where: dateFilter,
    _sum: { totalAmount: true }
  })
  const revenue = revenueAgg._sum.totalAmount ?? 0

  // Get orders for the last 7 days
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0,0,0,0)
    return d
  }).reverse()

  const ordersLast7Days = await Promise.all(
    last7.map(async day => ({
      date: day.toISOString().slice(0,10),
      count: await prisma.order.count({
        where: { 
          createdAt: { 
            gte: day, 
            lt: new Date(day.getTime() + 24*60*60*1000) 
          } 
        }
      })
    }))
  )

  // Get payment method breakdown
  const paymentMethods = ['unpaid', 'paypal', 'credit card', 'cod']
  const paymentBreakdown = await Promise.all(
    paymentMethods.map(async m => ({
      method: m,
      value: await prisma.order.count({ 
        where: { 
          paymentMethod: m,
          ...dateFilter // Apply the same date filter as other metrics
        } 
      })
    }))
  )

   return NextResponse.json({
       period,
       totalOrders,
       statusCounts,
       revenue,
       ordersPerDay: ordersLast7Days,
       paymentBreakdown,
     })
}