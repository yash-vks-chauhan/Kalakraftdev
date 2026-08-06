"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronRight,
  Clock,
  Package,
  PackageX,
  ShoppingBag,
  CircleX,
} from "lucide-react"

import { useAuth } from "../../contexts/AuthContext"
import { OrderStatusBadge } from "../_components/OrderStatusBadge"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

interface OrderItem {
  id: number
  productId: number
  quantity: number
  priceAtPurchase: number
  product: {
    id: number
    name: string
    imageUrls: string[]
  }
}

interface ShippingAddress {
  line1: string
  city: string
  postalCode: string
  country: string
}

interface OrderUser {
  id: number
  fullName: string
  email: string
}

interface Order {
  id: number
  orderNumber: string
  status: string
  subtotal: number
  tax: number
  shippingFee: number
  totalAmount: number
  discountedTotal?: number
  discountAmount?: number
  couponCode?: string
  createdAt: string
  orderItems: OrderItem[]
  user: OrderUser
  shippingAddress: ShippingAddress
}

type StatusFilter = "all" | "pending" | "accepted" | "shipped" | "delivered" | "cancelled"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function DashboardOrdersPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterUserId = searchParams.get("userId")

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  useEffect(() => {
    if (user === null) {
      router.replace("/auth/login")
      return
    }
    if (user && token) {
      fetchOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, filterUserId])

  async function fetchOrders() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/orders", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch orders")
      let ordersList = data.orders as Order[]
      if (filterUserId) {
        ordersList = ordersList.filter(
          (order) => order.user.id === Number(filterUserId)
        )
      }
      setOrders(ordersList)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Server error")
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders
    return orders.filter(
      (o) => o.status.toLowerCase() === statusFilter.toLowerCase()
    )
  }, [orders, statusFilter])

  if (!user) return null

  if (loading) {
    return (
      <main className="flex flex-col gap-6">
        <OrdersHeader count={0} loading />
        <OrdersSkeleton />
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex flex-col gap-6">
        <OrdersHeader count={0} />
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <CircleX className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-foreground">
              Couldn’t load your orders
            </p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button size="sm" variant="outline" onClick={fetchOrders}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (orders.length === 0) {
    return (
      <main className="flex flex-col gap-6">
        <OrdersHeader count={0} />
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center sm:p-16">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Package className="h-6 w-6" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium text-foreground">
                No orders yet
              </p>
              <p className="text-sm text-muted-foreground">
                When you place an order, it will appear here so you can track it.
              </p>
            </div>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/products">
                <ShoppingBag className="h-4 w-4" />
                Start shopping
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex flex-col gap-6">
      <OrdersHeader count={orders.length} />

      {/* Filter row — stacks on mobile so the select gets full width instead
          of fighting the count text for a 160px slot */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredOrders.length}
          </span>{" "}
          of {orders.length}
        </p>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
            <PackageX className="h-5 w-5" />
            No orders match this filter.
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {filteredOrders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              isAdmin={user.role === "admin"}
            />
          ))}
        </ul>
      )}
    </main>
  )
}

function OrdersHeader({
  count,
  loading,
}: {
  count: number
  loading?: boolean
}) {
  return (
    <header className="flex items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-xs text-muted-foreground sm:text-sm">History</p>
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Your orders
          {!loading && count > 0 && (
            <Badge variant="secondary" className="rounded-full">
              {count} order{count === 1 ? "" : "s"}
            </Badge>
          )}
        </h1>
        <p className="text-sm text-muted-foreground">
          Track every purchase from order placed to delivered.
        </p>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5"
      >
        {/* Labelled on every width — an unlabelled icon button was the only
            affordance here on a phone. */}
        <Link href="/products" aria-label="Browse products">
          <ShoppingBag className="h-4 w-4" />
          Browse<span className="hidden sm:inline">&nbsp;products</span>
        </Link>
      </Button>
    </header>
  )
}

function OrderRow({
  order,
  isAdmin,
}: {
  order: Order
  isAdmin: boolean
}) {
  const items = order.orderItems ?? []
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const previewItems = items.slice(0, 2)
  const extra = items.length - previewItems.length
  const finalTotal = order.discountedTotal ?? order.totalAmount

  return (
    <li>
      <Card className="group/row relative shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md">
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
          {/* Header — the order link stretches over the whole card */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <Link
                href={`/dashboard/orders/${order.id}`}
                className="text-sm font-semibold text-foreground after:absolute after:inset-0 after:content-[''] sm:text-base"
              >
                Order #{order.orderNumber}
              </Link>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(order.createdAt)}
                </span>
                <span className="text-border">•</span>
                <span>
                  {totalItems} item{totalItems === 1 ? "" : "s"}
                </span>
                <span className="text-border">•</span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatCurrency(finalTotal)}
                </span>
                {order.discountAmount && order.discountAmount > 0 ? (
                  <>
                    <span className="text-border">•</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      saved {formatCurrency(order.discountAmount)}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <OrderStatusBadge status={order.status} />
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover/row:translate-x-0.5" />
            </div>
          </div>

          {/* Item mini-list */}
          <ul className="flex flex-col gap-2.5">
            {previewItems.map((item) => {
              const src = item.product.imageUrls?.[0]
              const lineTotal = item.priceAtPurchase * item.quantity
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted/40">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <PackageX className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatCurrency(item.priceAtPurchase)} × {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(lineTotal)}
                  </p>
                </li>
              )
            })}
            {extra > 0 && (
              <li className="pl-[60px] text-xs text-muted-foreground">
                + {extra} more item{extra === 1 ? "" : "s"}
              </li>
            )}
          </ul>

          {isAdmin && (
            <>
              <Separator />
              <div className="flex justify-end">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="relative z-10"
                >
                  <Link href={`/dashboard/orders/${order.id}/edit-status`}>
                    Edit status
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </li>
  )
}

function OrdersSkeleton() {
  return (
    <>
      {/* Filter row */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-11 w-full sm:h-9 sm:w-[160px]" />
      </div>

      {/* Order list */}
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i}>
            <OrderRowSkeleton itemRows={i === 0 ? 2 : i === 1 ? 1 : 2} />
          </li>
        ))}
      </ul>
    </>
  )
}

function OrderRowSkeleton({ itemRows = 2 }: { itemRows?: number }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
        {/* Header: order # + meta line, status badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Skeleton className="h-4 w-32 sm:h-5 sm:w-36" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Item mini-list */}
        <ul className="flex flex-col gap-2.5">
          {Array.from({ length: itemRows }).map((_, i) => (
            <li key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 shrink-0 rounded-md" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-3/4 max-w-[16rem]" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </li>
          ))}
        </ul>

      </CardContent>
    </Card>
  )
}
