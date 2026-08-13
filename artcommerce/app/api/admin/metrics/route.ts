import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { requireAdminUser } from '../../../../lib/session-auth'

const DAY_MS = 24 * 60 * 60 * 1000
const LOW_STOCK_THRESHOLD = 5

/** Matches the window app/api/admin/users/route.ts uses to call a cart abandoned. */
const ABANDONED_CART_IDLE_MS = 5 * 60 * 1000

/** The two terminal states that mean the order never earned anything. */
const CANCELLED_STATUSES = ['cancelled', 'rejected']

/**
 * A groupBy over every buyer feeds an `in` filter, so a very large store would
 * otherwise build an unbounded query. Past this many buyers the returning /
 * new split is reported as null rather than risking the query.
 */
const MAX_BUYERS_FOR_COHORT_SPLIT = 5000

interface Window {
  /** Inclusive lower bound of the reporting window; null means all time. */
  start: Date | null
  /** The equivalent window immediately before it, for period-over-period deltas. */
  prevStart: Date | null
  prevEnd: Date | null
}

function resolveWindow(period: string): Window {
  const now = new Date()

  switch (period) {
    case 'today': {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      const prevStart = new Date(start)
      prevStart.setDate(prevStart.getDate() - 1)
      return { start, prevStart, prevEnd: start }
    }
    case 'week': {
      const start = new Date(Date.now() - 7 * DAY_MS)
      return { start, prevStart: new Date(start.getTime() - 7 * DAY_MS), prevEnd: start }
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start, prevStart: new Date(now.getFullYear(), now.getMonth() - 1, 1), prevEnd: start }
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1)
      return { start, prevStart: new Date(now.getFullYear() - 1, 0, 1), prevEnd: start }
    }
    case 'all':
    default:
      return { start: null, prevStart: null, prevEnd: null }
  }
}

function createdBetween(gte: Date | null, lt?: Date | null) {
  if (!gte) return {}
  return { createdAt: lt ? { gte, lt } : { gte } }
}

function percentChange(current: number, previous: number | null): number | null {
  if (previous === null) return null
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

type OrderWhere = Record<string, unknown>

/** Everything derived purely from the orders inside one window. */
async function summariseOrders(where: OrderWhere) {
  const [totals, discounts, units, cancelled] = await Promise.all([
    prisma.order.aggregate({
      where,
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where,
      _sum: { discountAmount: true },
    }),
    // Units live on the line items, so the window filter travels through the
    // relation rather than being applied to orderItem.createdAt (it has none).
    prisma.orderItem.aggregate({
      where: { order: where },
      _sum: { quantity: true },
    }),
    prisma.order.aggregate({
      where: { ...where, status: { in: CANCELLED_STATUSES } },
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
  ])

  return {
    orders: totals._count._all,
    revenue: totals._sum.totalAmount ?? 0,
    discounts: discounts._sum.discountAmount ?? 0,
    units: units._sum.quantity ?? 0,
    cancelledCount: cancelled._count._all,
    cancelledValue: cancelled._sum.totalAmount ?? 0,
  }
}

/**
 * Splits the window's buyers into first-timers and repeat customers.
 *
 * "Returning" means the customer had already ordered before this window opened
 * — not that they ordered twice inside it — which is the question an admin is
 * actually asking. All-time has no "before", so there it means more than one
 * order in total.
 */
async function splitBuyerCohorts(where: OrderWhere, start: Date | null) {
  const buyers = await prisma.order.groupBy({ by: ['userId'], where })
  const buyerIds = buyers.map((b) => b.userId)

  if (buyerIds.length === 0) return { buyers: 0, returning: 0 }
  if (buyerIds.length > MAX_BUYERS_FOR_COHORT_SPLIT) {
    return { buyers: buyerIds.length, returning: null }
  }

  if (!start) {
    const lifetime = await prisma.order.groupBy({
      by: ['userId'],
      _count: { _all: true },
    })
    return {
      buyers: buyerIds.length,
      returning: lifetime.filter((row) => row._count._all > 1).length,
    }
  }

  const earlier = await prisma.order.groupBy({
    by: ['userId'],
    where: { userId: { in: buyerIds }, createdAt: { lt: start } },
  })
  return { buyers: buyerIds.length, returning: earlier.length }
}

export async function GET(request: Request) {
  const admin = await requireAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const period = url.searchParams.get('period') || 'today'
  const { start, prevStart, prevEnd } = resolveWindow(period)

  const dateFilter = createdBetween(start)
  const prevFilter = createdBetween(prevStart, prevEnd)

  const [
    current,
    previous,
    statusCounts,
    cohorts,
    newCustomers,
    prevNewCustomers,
    catalogue,
    attention,
    abandonedCarts,
    ordersPerDay,
    paymentBreakdown,
  ] = await Promise.all([
    summariseOrders(dateFilter),
    prevStart ? summariseOrders(prevFilter) : Promise.resolve(null),
    prisma.order.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: { status: true },
    }),
    splitBuyerCohorts(dateFilter, start),
    prisma.user.count({ where: createdBetween(start) }),
    prevStart
      ? prisma.user.count({ where: createdBetween(prevStart, prevEnd) })
      : Promise.resolve(null),
    catalogueSnapshot(),
    attentionCounts(),
    // One row per (user, product), so distinct users is the number that matters.
    prisma.cartItem
      .groupBy({
        by: ['userId'],
        where: { addedAt: { lt: new Date(Date.now() - ABANDONED_CART_IDLE_MS) } },
      })
      .then((rows) => rows.length),
    countOrdersPerDay(),
    countPaymentBreakdown(dateFilter),
  ])

  return NextResponse.json({
    period,

    // ── Existing shape, unchanged: the desktop Overview reads these ──
    totalOrders: current.orders,
    statusCounts,
    revenue: current.revenue,
    ordersPerDay,
    paymentBreakdown,

    // ── Window totals ──
    units: current.units,
    discounts: current.discounts,
    cancelledCount: current.cancelledCount,
    cancelledValue: current.cancelledValue,

    // ── Customers ──
    newCustomers,
    buyers: cohorts.buyers,
    returningCustomers: cohorts.returning,
    abandonedCarts,

    // ── Current state, deliberately not filtered by the window ──
    catalogue,
    attention,

    // ── Period over period. Null on all-time, which has no previous window ──
    previous: previous && {
      revenue: previous.revenue,
      orders: previous.orders,
      units: previous.units,
      newCustomers: prevNewCustomers,
    },
    deltas: {
      revenue: percentChange(current.revenue, previous?.revenue ?? null),
      orders: percentChange(current.orders, previous?.orders ?? null),
      units: percentChange(current.units, previous?.units ?? null),
      discounts: percentChange(current.discounts, previous?.discounts ?? null),
      newCustomers: percentChange(newCustomers, prevNewCustomers ?? null),
    },
  })
}

/** Catalogue health — a snapshot of now, never of the reporting window. */
async function catalogueSnapshot() {
  const [live, lowStock, outOfStock, rating] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({
      where: { stockQuantity: { gt: 0, lte: LOW_STOCK_THRESHOLD } },
    }),
    prisma.product.count({ where: { stockQuantity: { lte: 0 } } }),
    prisma.productReview.aggregate({ _avg: { rating: true } }),
  ])

  return {
    live,
    lowStock,
    outOfStock,
    averageRating: rating._avg.rating,
  }
}

/**
 * The four queues the mobile Overview ranks under "Needs you". These are counts
 * of work outstanding right now, so a period filter would make them lie.
 */
async function attentionCounts() {
  const [pendingOrders, lowStock, openTickets, unansweredReviews] = await Promise.all([
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.product.count({ where: { stockQuantity: { lte: LOW_STOCK_THRESHOLD } } }),
    prisma.supportTicket.count({ where: { status: 'open' } }),
    prisma.productReview.count({
      where: { OR: [{ adminReply: null }, { adminReply: '' }] },
    }),
  ])

  return { pendingOrders, lowStock, openTickets, unansweredReviews }
}

async function countOrdersPerDay() {
  const days = Array.from({ length: 7 })
    .map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      return d
    })
    .reverse()

  return Promise.all(
    days.map(async (day) => ({
      date: day.toISOString().slice(0, 10),
      count: await prisma.order.count({
        where: { createdAt: { gte: day, lt: new Date(day.getTime() + DAY_MS) } },
      }),
    }))
  )
}

async function countPaymentBreakdown(dateFilter: OrderWhere) {
  const methods = ['unpaid', 'paypal', 'credit card', 'cod']
  return Promise.all(
    methods.map(async (method) => ({
      method,
      value: await prisma.order.count({ where: { paymentMethod: method, ...dateFilter } }),
    }))
  )
}
