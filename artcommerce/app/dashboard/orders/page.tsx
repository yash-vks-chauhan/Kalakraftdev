"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronRight,
  Clock,
  Package,
  PackageX,
  ReceiptText,
  ShoppingBag,
  Truck,
  CircleCheck,
  CircleX,
  Loader2,
} from "lucide-react"

import { useAuth } from "../../contexts/AuthContext"
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

  const stats = useMemo(() => {
    const totalSpend = orders.reduce(
      (sum, o) => sum + (o.discountedTotal ?? o.totalAmount),
      0
    )
    const active = orders.filter((o) =>
      ["pending", "accepted", "shipped"].includes(o.status.toLowerCase())
    ).length
    return { totalSpend, active, count: orders.length }
  }, [orders])

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

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile
          icon={ReceiptText}
          label="Orders placed"
          value={stats.count.toString()}
        />
        <StatTile
          icon={Truck}
          label="Active"
          value={stats.active.toString()}
          tone={stats.active > 0 ? "primary" : "muted"}
        />
        <StatTile
          icon={ShoppingBag}
          label="Lifetime spend"
          value={formatCurrency(stats.totalSpend)}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Filter row */}
      <div className="flex items-center justify-between gap-3">
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
          <SelectTrigger className="h-9 w-[160px]">
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
        <Link href="/products" aria-label="Browse products">
          <ShoppingBag className="h-4 w-4" />
          <span className="hidden sm:inline">Browse products</span>
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
      <Card className="shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md">
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <Link
                href={`/dashboard/orders/${order.id}`}
                className="text-sm font-semibold text-foreground hover:underline sm:text-base"
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
            <StatusBadge status={order.status} />
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

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            {isAdmin && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/orders/${order.id}/edit-status`}>
                  Edit status
                </Link>
              </Button>
            )}
            <Button asChild size="sm" className="gap-1.5">
              <Link href={`/dashboard/orders/${order.id}`}>
                View details
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </li>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()

  if (s === "delivered") {
    return (
      <Badge className="gap-1 border-transparent bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
        <CircleCheck className="h-3 w-3" />
        {label}
      </Badge>
    )
  }
  if (s === "shipped") {
    return (
      <Badge className="gap-1 border-transparent bg-sky-500/10 text-sky-700 hover:bg-sky-500/15 dark:text-sky-400">
        <Truck className="h-3 w-3" />
        {label}
      </Badge>
    )
  }
  if (s === "accepted") {
    return (
      <Badge className="gap-1 border-transparent bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/15 dark:text-indigo-400">
        <Package className="h-3 w-3" />
        {label}
      </Badge>
    )
  }
  if (s === "cancelled") {
    return (
      <Badge className="gap-1 border-transparent bg-destructive/10 text-destructive hover:bg-destructive/15">
        <CircleX className="h-3 w-3" />
        {label}
      </Badge>
    )
  }
  return (
    <Badge className="gap-1 border-transparent bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400">
      <Loader2 className="h-3 w-3" />
      {label}
    </Badge>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone = "default",
  className,
}: {
  icon: typeof Package
  label: string
  value: string
  tone?: "default" | "primary" | "muted"
  className?: string
}) {
  const toneStyles =
    tone === "primary"
      ? "bg-foreground/5 text-foreground border"
      : tone === "muted"
      ? "bg-muted text-muted-foreground"
      : "bg-muted/50 text-foreground border"

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md sm:h-10 sm:w-10",
            toneStyles
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            {label}
          </span>
          <span className="truncate text-base font-semibold tabular-nums tracking-tight text-foreground sm:text-lg">
            {value}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function OrdersSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i}>
            <Card className="shadow-sm">
              <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
                <div className="flex justify-between gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div
                      key={j}
                      className="h-12 w-12 animate-pulse rounded-md bg-muted sm:h-14 sm:w-14"
                    />
                  ))}
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                    <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-8 w-28 animate-pulse rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
