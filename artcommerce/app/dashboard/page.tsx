"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  ArrowUpRight,
  Package,
  Heart,
  ShoppingCart,
  LifeBuoy,
  User,
  ShoppingBag,
  Users,
  Tag,
  Star,
  AlertTriangle,
  Boxes,
  BarChart3,
  Mountain,
  TrendingUp,
  ReceiptText,
  Clock,
  PackageX,
  ChevronRight,
  CircleCheck,
  Truck,
  Wallet,
  LucideIcon,
} from "lucide-react"

import { useAuth } from "../contexts/AuthContext"
import { OrderStatusBadge } from "./_components/OrderStatusBadge"
import { useCart } from "../contexts/CartContext"
import { useWishlist } from "../contexts/WishlistContext"
import { useIsDesktop } from "../hooks/useMediaQuery"
import { AdminMobile } from "./_components/overview/AdminMobile"
import { UserMobile } from "./_components/overview/UserMobile"
import { periodLabels, type Period } from "./_components/overview/buckets"
import {
  capitalise as capitalize,
  formatCurrency,
  formatShortDate,
} from "./_components/overview/format"
import type {
  AdminMetrics,
  LowStockProduct,
  OverviewOrder,
  StatusCount,
} from "./_components/overview/types"
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

/*
 * Types, period labels and number formatting are shared with the mobile screens
 * in ./_components/overview, so the two layouts cannot drift apart.
 */

type QuickLink = {
  href: string
  label: string
  description: string
  icon: LucideIcon
}

const adminLinks: QuickLink[] = [
  { href: "/dashboard/admin/orders", label: "All Orders", description: "Manage customer orders and statuses", icon: ShoppingBag },
  { href: "/dashboard/admin/products", label: "Products", description: "Edit listings, pricing, and inventory", icon: Boxes },
  { href: "/dashboard/admin/products/low-stock", label: "Low Stock", description: "Items at or below threshold", icon: AlertTriangle },
  { href: "/dashboard/admin/users", label: "Users", description: "Roles, access, and customer accounts", icon: Users },
  { href: "/dashboard/admin/coupons", label: "Coupons", description: "Discount codes and campaigns", icon: Tag },
  { href: "/dashboard/admin/reviews", label: "Reviews", description: "Moderate ratings and feedback", icon: Star },
  { href: "/dashboard/admin/support", label: "Support", description: "Tickets from customers", icon: LifeBuoy },
]

type ChartType = "bar" | "line" | "area"

interface ChartBucket {
  key: string
  label: string
  date: string
  count: number
}

function bucketizeOrders(orders: OverviewOrder[], period: Period): ChartBucket[] {
  const now = new Date()
  const buckets: ChartBucket[] = []

  if (period === "today") {
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    for (let h = 0; h < 24; h++) {
      const d = new Date(startOfDay)
      d.setHours(h)
      buckets.push({
        key: `${h}`,
        label: h % 3 === 0 ? `${h}h` : "",
        date: d.toISOString(),
        count: 0,
      })
    }
    orders.forEach((o) => {
      const d = new Date(o.createdAt)
      if (d >= startOfDay) buckets[d.getHours()].count++
    })
    return buckets
  }

  if (period === "week") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      buckets.push({
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 3),
        date: d.toISOString(),
        count: 0,
      })
    }
    const start = new Date(buckets[0].date)
    orders.forEach((o) => {
      const d = new Date(o.createdAt)
      if (d >= start) {
        const key = new Date(d.getFullYear(), d.getMonth(), d.getDate())
          .toISOString()
          .slice(0, 10)
        const b = buckets.find((b) => b.key === key)
        if (b) b.count++
      }
    })
    return buckets
  }

  if (period === "month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(now.getFullYear(), now.getMonth(), day)
      buckets.push({
        key: d.toISOString().slice(0, 10),
        label: day % 5 === 0 || day === 1 ? `${day}` : "",
        date: d.toISOString(),
        count: 0,
      })
    }
    orders.forEach((o) => {
      const d = new Date(o.createdAt)
      if (
        d >= startOfMonth &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        buckets[d.getDate() - 1].count++
      }
    })
    return buckets
  }

  if (period === "year") {
    for (let m = 0; m < 12; m++) {
      const d = new Date(now.getFullYear(), m, 1)
      buckets.push({
        key: `${m}`,
        label: d.toLocaleDateString("en-GB", { month: "short" }),
        date: d.toISOString(),
        count: 0,
      })
    }
    orders.forEach((o) => {
      const d = new Date(o.createdAt)
      if (d.getFullYear() === now.getFullYear()) {
        buckets[d.getMonth()].count++
      }
    })
    return buckets
  }

  // all-time: monthly buckets from earliest order to now
  if (orders.length === 0) return []
  const earliest = orders.reduce((min, o) => {
    const d = new Date(o.createdAt)
    return d < min ? d : min
  }, new Date())
  const cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1)
  while (cursor <= now) {
    buckets.push({
      key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
      label: cursor.toLocaleDateString("en-GB", {
        month: "short",
        year: "2-digit",
      }),
      date: cursor.toISOString(),
      count: 0,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  orders.forEach((o) => {
    const d = new Date(o.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const b = buckets.find((b) => b.key === key)
    if (b) b.count++
  })
  return buckets
}

export default function DashboardHomePage() {
  const { user, token } = useAuth()
  const { cartItems, cartLoading } = useCart()
  const { wishlistItems, loading: wishlistLoading } = useWishlist()
  const [period, setPeriod] = useState<Period>("week")
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [orders, setOrders] = useState<OverviewOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([])
  const [lowStockLoading, setLowStockLoading] = useState(true)

  const isAdmin = user?.role === "admin"
  const isDesktop = useIsDesktop()

  // Admin metrics
  useEffect(() => {
    if (!isAdmin || !token) {
      if (!isAdmin) setMetricsLoading(false)
      return
    }
    let cancelled = false
    setMetricsLoading(true)
    fetch(`/api/admin/metrics?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setMetrics(data)
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setMetricsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, isAdmin, period])

  // Orders (for both, admin sees all, user sees their own)
  useEffect(() => {
    if (!user || !token) return
    let cancelled = false
    setOrdersLoading(true)
    fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setOrders((data.orders as OverviewOrder[]) ?? [])
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setOrdersLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, token])

  // Low stock — admin, and only the desktop card renders the list. The mobile
  // screen ranks the same items from metrics.attention.lowStock, which is a
  // count rather than a full product payload.
  useEffect(() => {
    if (!isAdmin || !token || !isDesktop) {
      if (!isAdmin || !isDesktop) setLowStockLoading(false)
      return
    }
    let cancelled = false
    setLowStockLoading(true)
    fetch("/api/admin/products/low-stock", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setLowStock((data.products as LowStockProduct[]) ?? [])
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLowStockLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, isAdmin, isDesktop])

  const userStats = useMemo(() => {
    const totalSpend = orders.reduce(
      (sum, o) => sum + (o.discountedTotal ?? o.totalAmount),
      0
    )
    const active = orders.filter((o) =>
      ["pending", "accepted", "shipped"].includes(o.status.toLowerCase())
    ).length
    const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)
    return {
      orderCount: orders.length,
      totalSpend,
      active,
      cartCount,
      wishlistCount: wishlistItems.length,
    }
  }, [orders, cartItems, wishlistItems])

  if (!user) return null

  const firstName = user.fullName?.split(" ")[0] ?? user.fullName

  /*
   * Two trees, not one restyled.
   *
   * Below lg the Overview is a different screen rather than a narrower version
   * of this one — a scrubbable hero, a ranked work queue, a tabbed ledger — so
   * hiding one with `lg:hidden` would mount both, and the hidden recharts
   * instances would measure zero and warn. `useIsDesktop` defaults to false, so
   * a phone paints its own layout first and never swaps.
   */
  if (!isDesktop) {
    return isAdmin ? (
      <AdminMobile
        period={period}
        onPeriodChange={setPeriod}
        metrics={metrics}
        metricsLoading={metricsLoading}
        orders={orders}
        ordersLoading={ordersLoading}
      />
    ) : (
      <UserMobile
        firstName={firstName}
        orders={orders}
        ordersLoading={ordersLoading}
        cartItems={cartItems}
        cartLoading={cartLoading}
        wishlistItems={wishlistItems}
        wishlistLoading={wishlistLoading}
      />
    )
  }

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      {/* Header */}
      <header className="flex flex-col gap-1 md:gap-2">
        <p className="hidden text-sm text-muted-foreground md:block">Welcome back</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {firstName}
        </h1>
        <p className="hidden text-sm text-muted-foreground md:block">
          {isAdmin
            ? "A quick look at your store today."
            : "Pick up where you left off."}
        </p>
      </header>

      {isAdmin ? (
        <AdminDesktop
          period={period}
          setPeriod={setPeriod}
          metrics={metrics}
          metricsLoading={metricsLoading}
          orders={orders}
          ordersLoading={ordersLoading}
          lowStock={lowStock}
          lowStockLoading={lowStockLoading}
        />
      ) : (
        <UserDesktop
          stats={userStats}
          orders={orders}
          ordersLoading={ordersLoading}
          wishlistLoading={wishlistLoading}
          cartLoading={cartLoading}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------- */
/* USER DESKTOP                                                   */
/* -------------------------------------------------------------- */

function UserDesktop({
  stats,
  orders,
  ordersLoading,
  wishlistLoading,
  cartLoading,
}: {
  stats: {
    orderCount: number
    totalSpend: number
    active: number
    cartCount: number
    wishlistCount: number
  }
  orders: OverviewOrder[]
  ordersLoading: boolean
  wishlistLoading: boolean
  cartLoading: boolean
}) {
  const recentOrders = orders.slice(0, 4)

  return (
    <>
      {/* Stats strip */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {ordersLoading ? (
          <>
            <StatTileSkeleton />
            <StatTileSkeleton />
            <StatTileSkeleton />
            <StatTileSkeleton />
          </>
        ) : (
          <>
            <StatTile icon={ReceiptText} label="Orders" value={stats.orderCount.toString()} />
            <StatTile
              icon={Truck}
              label="Active"
              value={stats.active.toString()}
              tone={stats.active > 0 ? "primary" : "muted"}
            />
            <StatTile icon={Wallet} label="Lifetime spend" value={formatCurrency(stats.totalSpend)} />
            <StatTile icon={Heart} label="Saved" value={stats.wishlistCount.toString()} />
          </>
        )}
      </section>

      {/* Content sections (stack on mobile, side-by-side on desktop) */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders (2 cols on desktop) */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 p-5 pb-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base">Recent orders</CardTitle>
              <CardDescription>Your latest purchases at a glance.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/dashboard/orders">
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {ordersLoading ? (
              <ul className="divide-y border-t">
                {Array.from({ length: 3 }).map((_, i) => (
                  <RecentOrderRowSkeleton key={i} />
                ))}
              </ul>
            ) : recentOrders.length === 0 ? (
              <EmptyHint
                icon={Package}
                title="No orders yet"
                description="Once you place an order, it'll show up here."
                action={
                  <Button asChild size="sm" className="gap-1.5">
                    <Link href="/products">
                      <ShoppingBag className="h-4 w-4" /> Browse products
                    </Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y border-t">
                {recentOrders.map((o) => (
                  <RecentOrderRow key={o.id} order={o} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Spending trend chart */}
        <SpendChartCard orders={orders} loading={ordersLoading} />
      </section>

      {/* Wishlist + Cart side-by-side on desktop, stacked on mobile */}
      <section className="grid gap-6 sm:grid-cols-2">
        <WishlistPreviewCard loading={wishlistLoading} />
        <CartPreviewCard loading={cartLoading} />
      </section>
    </>
  )
}

function RecentOrderRow({ order }: { order: OverviewOrder }) {
  const items = order.orderItems ?? []
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)
  const displayed = items.slice(0, 3)
  const extra = items.length - displayed.length
  const total = order.discountedTotal ?? order.totalAmount

  return (
    <li>
      <Link
        href={`/dashboard/orders/${order.id}`}
        className="group flex items-center gap-4 p-4 transition-colors hover:bg-muted/40"
      >
        <div className="flex -space-x-2">
          {displayed.map((item) => {
            const src = item.product.imageUrls?.[0]
            return (
              <div
                key={item.id}
                className="h-10 w-10 shrink-0 overflow-hidden rounded-md border-2 border-background bg-muted/40 ring-1 ring-border"
                title={item.product.name}
              >
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
            )
          })}
          {extra > 0 && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-background bg-muted text-[11px] font-medium text-muted-foreground ring-1 ring-border">
              +{extra}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              #{order.orderNumber}
            </p>
            <OrderStatusBadge status={order.status} className="text-[10px]" />
          </div>
          <p className="text-xs text-muted-foreground">
            {formatShortDate(order.createdAt)} • {itemCount} item
            {itemCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {formatCurrency(total)}
          </p>
          <p className="text-[11px] text-muted-foreground">Total</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  )
}

function SpendChartCard({
  orders,
  loading,
}: {
  orders: OverviewOrder[]
  loading: boolean
}) {
  const months = useMemo(() => {
    const arr: { key: string; label: string; value: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      arr.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString("en-GB", { month: "short" }),
        value: 0,
      })
    }
    orders.forEach((o) => {
      const d = new Date(o.createdAt)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const bucket = arr.find((m) => m.key === key)
      if (bucket) bucket.value += o.discountedTotal ?? o.totalAmount
    })
    return arr
  }, [orders])

  const total = months.reduce((s, m) => s + m.value, 0)
  const lastMonthValue = months[months.length - 1]?.value ?? 0
  const prevMonthValue = months[months.length - 2]?.value ?? 0
  const delta = prevMonthValue
    ? Math.round(((lastMonthValue - prevMonthValue) / prevMonthValue) * 100)
    : null

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Spend trend</CardTitle>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            {months.length} mo
          </span>
        </div>
        {loading ? (
          <Skeleton className="h-4 w-40" />
        ) : (
          <CardDescription>
            {formatCurrency(total)} across the period
            {delta !== null && (
              <span className="ml-2 text-xs font-medium text-muted-foreground">
                {delta >= 0 ? "+" : ""}
                {delta}% vs prev mo
              </span>
            )}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {loading ? (
          <ChartSkeleton bars={6} height="h-32" />
        ) : total === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
            No spend recorded in this window yet
          </div>
        ) : (
          <ChartContainer
            config={SPEND_CONFIG}
            className="aspect-auto h-32 w-full"
          >
            <BarChart
              accessibilityLayer
              data={months}
              margin={{ left: 4, right: 4, top: 4, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                fontSize={10}
              />
              <YAxis hide />
              <ChartTooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Bar
                dataKey="value"
                name="Spend"
                fill="var(--color-value)"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

const SPEND_CONFIG: ChartConfig = {
  value: {
    label: "Spend",
    color: "hsl(var(--foreground))",
  },
}

function WishlistPreviewCard({ loading }: { loading: boolean }) {
  const { wishlistItems } = useWishlist()
  const preview = wishlistItems.slice(0, 4)

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 p-5 pb-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-muted-foreground" />
            Saved for later
          </CardTitle>
          {loading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <CardDescription>
              {wishlistItems.length === 0
                ? "Nothing saved yet."
                : `${wishlistItems.length} item${wishlistItems.length === 1 ? "" : "s"} in your wishlist.`}
            </CardDescription>
          )}
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/dashboard/wishlist">
            Open
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {loading ? (
          <ul className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i}>
                <div className="overflow-hidden rounded-md border bg-muted/40">
                  <Skeleton className="aspect-square w-full rounded-none" />
                  <div className="px-2 py-1.5">
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : preview.length === 0 ? (
          <EmptyHint
            icon={Heart}
            title="Your wishlist is empty"
            description="Save pieces you love and they’ll appear here."
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/products">Browse products</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid grid-cols-4 gap-2">
            {preview.map((item) => {
              const src = item.product.imageUrls?.[0]
              return (
                <li key={item.id}>
                  <Link
                    href={`/products/${item.product.id}`}
                    className="group block overflow-hidden rounded-md border bg-muted/40 transition-colors hover:border-foreground/20"
                  >
                    <div className="aspect-square w-full overflow-hidden">
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt={item.product.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <PackageX className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <p className="truncate px-2 py-1.5 text-[11px] font-medium text-foreground">
                      {item.product.name}
                    </p>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function CartPreviewCard({ loading }: { loading: boolean }) {
  const { cartItems } = useCart()
  const preview = cartItems.slice(0, 3)
  const count = cartItems.reduce((s, i) => s + i.quantity, 0)
  const subtotal = cartItems.reduce(
    (s, i) => s + i.quantity * i.product.price,
    0
  )

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 p-5 pb-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            In your cart
          </CardTitle>
          {loading ? (
            <Skeleton className="h-4 w-36" />
          ) : (
            <CardDescription>
              {count === 0
                ? "Your cart is empty."
                : `${count} item${count === 1 ? "" : "s"} ready for checkout`}
            </CardDescription>
          )}
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/dashboard/cart">
            Open
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-5 pt-0">
        {loading ? (
          <>
            <ul className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-md border bg-background p-2"
                >
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-12" />
                  </div>
                  <Skeleton className="h-3 w-12" />
                </li>
              ))}
            </ul>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-2 w-14" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </>
        ) : preview.length === 0 ? (
          <EmptyHint
            icon={ShoppingCart}
            title="Cart is empty"
            description="Add items from the catalog to start a checkout."
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/products">Browse products</Link>
              </Button>
            }
          />
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {preview.map((item) => {
                const src = Array.isArray(item.product.imageUrls)
                  ? item.product.imageUrls[0]
                  : undefined
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-md border bg-background p-2"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted/40">
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
                      <p className="truncate text-xs font-medium text-foreground">
                        {item.product.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-xs font-semibold tabular-nums text-foreground">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </li>
                )
              })}
            </ul>

            <Separator />

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground">
                  Subtotal
                </p>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {formatCurrency(subtotal)}
                </p>
              </div>
              <Button asChild size="sm" className="gap-1">
                <Link href="/checkout">
                  Checkout
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------- */
/* ADMIN DESKTOP                                                  */
/* -------------------------------------------------------------- */

function AdminDesktop({
  period,
  setPeriod,
  metrics,
  metricsLoading,
  orders,
  ordersLoading,
  lowStock,
  lowStockLoading,
}: {
  period: Period
  setPeriod: (p: Period) => void
  metrics: AdminMetrics | null
  metricsLoading: boolean
  orders: OverviewOrder[]
  ordersLoading: boolean
  lowStock: LowStockProduct[]
  lowStockLoading: boolean
}) {
  const recentOrders = orders.slice(0, 5)
  const avgOrder =
    metrics && metrics.totalOrders > 0
      ? Math.round((metrics.revenue ?? 0) / metrics.totalOrders)
      : 0

  const [chartType, setChartType] = useState<ChartType>("bar")
  const chartData = useMemo(
    () => bucketizeOrders(orders, period),
    [orders, period]
  )

  return (
    <>
      {/* Period + stats */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xs font-mediumr text-muted-foreground">
            Overview
            {/* Period lives in the select beside this, not in the label too */}
            <span className="hidden md:inline"> · {periodLabels[period]}</span>
          </h2>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(periodLabels) as Period[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {periodLabels[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {metricsLoading ? (
            <>
              <StatTileSkeleton />
              <StatTileSkeleton />
              <StatTileSkeleton />
              <StatTileSkeleton />
            </>
          ) : (
            <>
              <StatTile
                icon={ReceiptText}
                label="Orders"
                value={metrics ? metrics.totalOrders.toLocaleString("en-IN") : "—"}
              />
              <StatTile
                icon={Wallet}
                label="Revenue"
                value={metrics ? formatCurrency(metrics.revenue ?? 0) : "—"}
                tone="primary"
              />
              <StatTile
                icon={TrendingUp}
                label="Avg order"
                value={metrics ? formatCurrency(avgOrder) : "—"}
              />
              <StatTile
                icon={AlertTriangle}
                label="Low stock"
                value={lowStock.length.toString()}
                tone={lowStock.length > 0 ? "warn" : "muted"}
              />
            </>
          )}
        </div>
      </section>

      {/* Charts row */}
      <section className="grid gap-6 lg:grid-cols-3">
        <OrdersChart
          data={chartData}
          period={period}
          type={chartType}
          onTypeChange={setChartType}
          loading={ordersLoading}
        />
        <StatusBreakdown
          statusCounts={metrics?.statusCounts ?? []}
          loading={metricsLoading}
        />
      </section>

      {/* Recent orders + Low stock */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-2 p-5 pb-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base">Recent orders</CardTitle>
              <CardDescription>Latest orders across the store.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/dashboard/admin/orders">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {ordersLoading ? (
              <ul className="divide-y border-t">
                {Array.from({ length: 4 }).map((_, i) => (
                  <AdminRecentOrderRowSkeleton key={i} />
                ))}
              </ul>
            ) : recentOrders.length === 0 ? (
              <EmptyHint
                icon={Package}
                title="No recent orders"
                description="Orders will appear here as customers buy."
              />
            ) : (
              <ul className="divide-y border-t">
                {recentOrders.map((o) => (
                  <AdminRecentOrderRow key={o.id} order={o} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-2 p-5 pb-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Low stock alerts
              </CardTitle>
              <CardDescription>
                Items at or under 5 units — restock soon.
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/dashboard/admin/products/low-stock">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {lowStockLoading ? (
              <ul className="divide-y border-t">
                {Array.from({ length: 4 }).map((_, i) => (
                  <LowStockRowSkeleton key={i} />
                ))}
              </ul>
            ) : lowStock.length === 0 ? (
              <EmptyHint
                icon={CircleCheck}
                title="All stocked up"
                description="Every product is comfortably above threshold."
              />
            ) : (
              <ul className="divide-y border-t">
                {lowStock.slice(0, 5).map((p) => (
                  <LowStockRow key={p.id} product={p} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Admin quick links strip (desktop only — replaces full Account/Admin block) */}
      <section className="hidden lg:block">
        <Card className="shadow-sm">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base">Admin shortcuts</CardTitle>
            <CardDescription>Jump to common management tasks.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-3">
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
              {adminLinks.map((link) => (
                <CompactShortcut key={link.href} link={link} />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  )
}

function OrdersChart({
  data,
  period,
  type,
  onTypeChange,
  loading,
}: {
  data: ChartBucket[]
  period: Period
  type: ChartType
  onTypeChange: (t: ChartType) => void
  loading: boolean
}) {
  const total = data.reduce((s, p) => s + p.count, 0)

  return (
    <Card className="shadow-sm lg:col-span-2">
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">Order volume</CardTitle>
            <CardDescription>
              {periodDescription(period)}
              {!loading && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {total} total
                </span>
              )}
            </CardDescription>
          </div>
          <ChartTypeToggle value={type} onChange={onTypeChange} />
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {loading ? (
          <ChartSkeleton bars={7} height="h-40" />
        ) : data.length === 0 || total === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
            No orders {periodDescription(period).toLowerCase()}
          </div>
        ) : (
          <ChartContainer
            config={ORDERS_CONFIG}
            className="aspect-auto h-40 w-full"
          >
            {type === "bar" ? (
              <BarChart
                accessibilityLayer
                data={data}
                margin={{ left: 4, right: 4, top: 8, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  fontSize={10}
                  interval="preserveStartEnd"
                />
                <YAxis hide />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={chartLabelFormatter}
                    />
                  }
                />
                <Bar
                  dataKey="count"
                  name="Orders"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            ) : type === "line" ? (
              <LineChart
                accessibilityLayer
                data={data}
                margin={{ left: 4, right: 4, top: 8, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  fontSize={10}
                  interval="preserveStartEnd"
                />
                <YAxis hide />
                <ChartTooltip
                  cursor={{ stroke: "hsl(var(--border))" }}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={chartLabelFormatter}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Orders"
                  stroke="var(--color-count)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--color-count)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : (
              <AreaChart
                accessibilityLayer
                data={data}
                margin={{ left: 4, right: 4, top: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="ordersAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-count)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  fontSize={10}
                  interval="preserveStartEnd"
                />
                <YAxis hide />
                <ChartTooltip
                  cursor={{ stroke: "hsl(var(--border))" }}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={chartLabelFormatter}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Orders"
                  stroke="var(--color-count)"
                  strokeWidth={2}
                  fill="url(#ordersAreaFill)"
                />
              </AreaChart>
            )}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

const ORDERS_CONFIG: ChartConfig = {
  count: {
    label: "Orders",
    color: "hsl(var(--foreground))",
  },
}

function periodDescription(period: Period) {
  if (period === "today") return "Orders by hour today"
  if (period === "week") return "Orders by day, last 7 days"
  if (period === "month") return "Orders by day, this month"
  if (period === "year") return "Orders by month, this year"
  return "Orders by month, all time"
}

function chartLabelFormatter(_: any, payload: any[]) {
  const date = payload?.[0]?.payload?.date
  if (!date) return ""
  const d = new Date(date)
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function ChartTypeToggle({
  value,
  onChange,
}: {
  value: ChartType
  onChange: (t: ChartType) => void
}) {
  const options: { type: ChartType; icon: LucideIcon; label: string }[] = [
    { type: "bar", icon: BarChart3, label: "Bar" },
    { type: "line", icon: Activity, label: "Line" },
    { type: "area", icon: Mountain, label: "Area" },
  ]
  return (
    <div className="inline-flex items-center rounded-md border bg-background p-0.5 shadow-xs">
      {options.map(({ type, icon: Icon, label }) => {
        const active = value === type
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            aria-label={`${label} chart`}
            aria-pressed={active}
            title={`${label} chart`}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded transition-colors",
              active
                ? "bg-secondary text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        )
      })}
    </div>
  )
}

function StatusBreakdown({
  statusCounts,
  loading,
}: {
  statusCounts: StatusCount[]
  loading: boolean
}) {
  const total = statusCounts.reduce((s, sc) => s + sc._count.status, 0)
  return (
    <Card className="shadow-sm">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-base">Status breakdown</CardTitle>
        <CardDescription>How orders are distributed.</CardDescription>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {loading ? (
          <ul className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </li>
            ))}
          </ul>
        ) : statusCounts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No data.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {statusCounts.map((sc) => {
              const pct = total > 0 ? (sc._count.status / total) * 100 : 0
              return (
                <li key={sc.status} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">
                      {capitalize(sc.status)}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {sc._count.status} · {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground/60"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function AdminRecentOrderRow({ order }: { order: OverviewOrder }) {
  const itemCount =
    order.orderItems?.reduce((s, i) => s + i.quantity, 0) ?? 0
  return (
    <li>
      <Link
        href={`/dashboard/orders/${order.id}`}
        className="group flex items-center gap-3 p-4 transition-colors hover:bg-muted/40"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              #{order.orderNumber}
            </p>
            <OrderStatusBadge status={order.status} className="text-[10px]" />
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {order.user?.fullName ?? "Customer"} · {itemCount} item
            {itemCount === 1 ? "" : "s"} ·{" "}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatShortDate(order.createdAt)}
            </span>
          </p>
        </div>
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {formatCurrency(order.discountedTotal ?? order.totalAmount)}
        </p>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  )
}

function LowStockRow({ product }: { product: LowStockProduct }) {
  const src = product.imageUrls?.[0]
  return (
    <li>
      <Link
        href={`/dashboard/admin/products/${product.id}`}
        className="group flex items-center gap-3 p-4 transition-colors hover:bg-muted/40"
      >
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted/40">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={product.name}
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
            {product.name}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatCurrency(product.price)}
          </p>
        </div>
        <Badge
          className={cn(
            "gap-1 border-transparent",
            product.stockQuantity <= 0
              ? "bg-destructive/10 text-destructive"
              : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
          )}
        >
          {product.stockQuantity <= 0
            ? "Out"
            : `${product.stockQuantity} left`}
        </Badge>
      </Link>
    </li>
  )
}

/* -------------------------------------------------------------- */
/* SHARED PIECES                                                  */
/* -------------------------------------------------------------- */

function StatTile({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon
  label: string
  value: string
  tone?: "default" | "primary" | "muted" | "warn"
}) {
  const toneStyles =
    tone === "primary"
      ? "bg-foreground/5 text-foreground border"
      : tone === "warn"
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      : tone === "muted"
      ? "bg-muted text-muted-foreground"
      : "bg-muted/50 text-foreground border"

  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-2.5 p-2.5 sm:gap-4 sm:p-4">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md sm:h-10 sm:w-10",
            toneStyles
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-[11px] font-medium leading-tight text-muted-foreground sm:truncate sm:text-xs">
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


function CompactShortcut({ link }: { link: QuickLink }) {
  const Icon = link.icon
  return (
    <Link
      href={link.href}
      className="group flex items-center gap-3 rounded-md border bg-background px-3 py-2.5 transition-colors hover:border-foreground/20 hover:bg-muted/40"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground group-hover:text-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span className="truncate text-sm font-medium text-foreground">
        {link.label}
      </span>
      <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  )
}

function EmptyHint({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
      {action}
    </div>
  )
}

/* -------------------------------------------------------------- */
/* SKELETONS                                                      */
/* -------------------------------------------------------------- */

function StatTileSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-2.5 p-2.5 sm:gap-4 sm:p-4">
        <Skeleton className="h-9 w-9 rounded-md sm:h-10 sm:w-10" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-2.5 w-14" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSkeleton({
  bars = 7,
  height = "h-40",
}: {
  bars?: number
  height?: string
}) {
  const heightPattern = [42, 68, 54, 82, 48, 64, 46, 72, 58, 78, 44, 66]
  const heights = Array.from({ length: bars }, (_, i) => heightPattern[i % heightPattern.length])

  return (
    <div className={cn("relative w-full overflow-hidden", height)}>
      {/* Dashed gridlines mimic CartesianGrid */}
      <div
        aria-hidden
        className="absolute inset-x-1 inset-y-2 flex flex-col justify-between pb-6"
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-px w-full opacity-60"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, hsl(var(--border)) 0 4px, transparent 4px 7px)",
            }}
          />
        ))}
      </div>

      {/* Bars + axis labels */}
      <div className="relative flex h-full flex-col">
        <div className="flex flex-1 items-end gap-2 px-1 pb-6">
          {heights.map((h, i) => (
            <div
              key={i}
              className="chartSkelBar relative flex-1 overflow-hidden rounded-sm bg-muted"
              style={
                {
                  height: `${h}%`,
                  "--shimmer-delay": `${(i % bars) * 90}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <div className="absolute inset-x-1 bottom-0 flex items-center justify-between gap-2">
          {heights.map((_, i) => (
            <div
              key={i}
              className="h-2 w-3 rounded-sm bg-muted opacity-70"
            />
          ))}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .chartSkelBar::after {
              content: "";
              position: absolute;
              inset: 0;
              transform: translateX(-120%);
              background: linear-gradient(
                90deg,
                transparent 0%,
                hsl(var(--foreground) / 0.08) 45%,
                hsl(var(--foreground) / 0.12) 50%,
                hsl(var(--foreground) / 0.08) 55%,
                transparent 100%
              );
              animation: chartSkelShimmer 1.4s ease-in-out infinite;
              animation-delay: var(--shimmer-delay, 0ms);
            }
            @keyframes chartSkelShimmer {
              0% { transform: translateX(-120%); }
              60% { transform: translateX(120%); }
              100% { transform: translateX(120%); }
            }
          `,
        }}
      />
    </div>
  )
}

function RecentOrderRowSkeleton() {
  return (
    <li className="flex items-center gap-4 p-4">
      <div className="flex -space-x-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-10 w-10 rounded-md border-2 border-background"
          />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-2.5 w-24" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-2.5 w-10" />
      </div>
      <Skeleton className="h-4 w-4 rounded" />
    </li>
  )
}

function AdminRecentOrderRowSkeleton() {
  return (
    <li className="flex items-center gap-3 p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-2.5 w-44" />
      </div>
      <Skeleton className="h-3.5 w-16" />
      <Skeleton className="h-4 w-4 rounded" />
    </li>
  )
}

function LowStockRowSkeleton() {
  return (
    <li className="flex items-center gap-3 p-4">
      <Skeleton className="h-10 w-10 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-2.5 w-12" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </li>
  )
}
