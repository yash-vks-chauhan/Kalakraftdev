import type { StatusCount } from "./PipelineBar"

export type { StatusCount }

/**
 * The shape `/api/admin/metrics` returns.
 *
 * Everything below `paymentBreakdown` was added for the mobile Overview; the
 * fields above it are the original contract the desktop still reads. All of the
 * additions are optional so a stale deploy of the route degrades to "—" rather
 * than throwing.
 */
export interface AdminMetrics {
  period: string
  totalOrders: number
  statusCounts: StatusCount[]
  revenue: number
  ordersPerDay?: { date: string; count: number }[]
  paymentBreakdown?: { method: string; value: number }[]

  units?: number
  discounts?: number
  cancelledCount?: number
  cancelledValue?: number

  newCustomers?: number
  buyers?: number
  /** Null when the store has too many buyers to split the cohort safely. */
  returningCustomers?: number | null
  abandonedCarts?: number

  catalogue?: {
    live: number
    lowStock: number
    outOfStock: number
    averageRating: number | null
  }

  attention?: {
    pendingOrders: number
    lowStock: number
    openTickets: number
    unansweredReviews: number
  }

  /** Null on all-time, which has no previous window to compare against. */
  previous?: {
    revenue: number
    orders: number
    units: number
    newCustomers: number | null
  } | null

  deltas?: {
    revenue: number | null
    orders: number | null
    units: number | null
    discounts: number | null
    newCustomers: number | null
  }
}

export interface OverviewProduct {
  id: number
  name: string
  imageUrls: string[]
}

export interface OverviewOrderItem {
  id: number
  quantity: number
  priceAtPurchase: number
  product: OverviewProduct
}

export interface OverviewOrder {
  id: number
  orderNumber: string
  status: string
  totalAmount: number
  discountedTotal?: number
  createdAt: string
  orderItems: OverviewOrderItem[]
  user?: { id: string; fullName: string; email: string }
}

export interface LowStockProduct {
  id: number
  name: string
  slug: string
  stockQuantity: number
  price: number
  imageUrls: string[]
}

/** The statuses that mean an order is still moving. */
export const ACTIVE_ORDER_STATUSES = ["pending", "accepted", "shipped"]

export function isActiveOrder(order: { status: string }): boolean {
  return ACTIVE_ORDER_STATUSES.includes(order.status.toLowerCase())
}
