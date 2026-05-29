"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
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
import { useCart } from "../contexts/CartContext"
import { useWishlist } from "../contexts/WishlistContext"
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

type Period = "today" | "week" | "month" | "year" | "all"

interface StatusCount {
  status: string
  _count: { status: number }
}

interface DayPoint {
  date: string
  count: number
}

interface Metrics {
  period: string
  totalOrders: number
  statusCounts: StatusCount[]
  revenue: number
  ordersPerDay?: DayPoint[]
  paymentBreakdown?: { method: string; value: number }[]
}

interface OrderProduct {
  id: number
  name: string
  imageUrls: string[]
}

interface OrderItemLite {
  id: number
  quantity: number
  priceAtPurchase: number
  product: OrderProduct
}

interface OrderLite {
  id: number
  orderNumber: string
  status: string
  totalAmount: number
  discountedTotal?: number
  createdAt: string
  orderItems: OrderItemLite[]
  user?: { id: number; fullName: string; email: string }
}

interface LowStockProduct {
  id: number
  name: string
  slug: string
  stockQuantity: number
  price: number
  imageUrls: string[]
}

const periodLabels: Record<Period, string> = {
  today: "Today",
  week: "Last 7 days",
  month: "This month",
  year: "This year",
  all: "All time",
}

type QuickLink = {
  href: string
  label: string
  description: string
  icon: LucideIcon
}

const userLinks: QuickLink[] = [
  { href: "/dashboard/orders", label: "Orders", description: "Track and review your past orders", icon: Package },
  { href: "/dashboard/wishlist", label: "Wishlist", description: "Items you've saved for later", icon: Heart },
  { href: "/dashboard/cart", label: "Cart", description: "Continue your in-progress checkout", icon: ShoppingCart },
  { href: "/dashboard/support", label: "Support", description: "Open a ticket or browse FAQs", icon: LifeBuoy },
  { href: "/dashboard/profile", label: "Profile", description: "Manage personal details and security", icon: User },
]

const adminLinks: QuickLink[] = [
  { href: "/dashboard/admin/orders", label: "All Orders", description: "Manage customer orders and statuses", icon: ShoppingBag },
  { href: "/dashboard/admin/products", label: "Products", description: "Edit listings, pricing, and inventory", icon: Boxes },
  { href: "/dashboard/admin/products/low-stock", label: "Low Stock", description: "Items at or below threshold", icon: AlertTriangle },
  { href: "/dashboard/admin/users", label: "Users", description: "Roles, access, and customer accounts", icon: Users },
  { href: "/dashboard/admin/coupons", label: "Coupons", description: "Discount codes and campaigns", icon: Tag },
  { href: "/dashboard/admin/reviews", label: "Reviews", description: "Moderate ratings and feedback", icon: Star },
  { href: "/dashboard/admin/support", label: "Support", description: "Tickets from customers", icon: LifeBuoy },
]

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "₹0"
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatShortDate(value: string) {
  const d = new Date(value)
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function formatDayLabel(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 1)
}

export default function DashboardHomePage() {
  const { user, token } = useAuth()
  const { cartItems, cartLoading } = useCart()
  const { wishlistItems, loading: wishlistLoading } = useWishlist()
  const [period, setPeriod] = useState<Period>("week")
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [orders, setOrders] = useState<OrderLite[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([])
  const [lowStockLoading, setLowStockLoading] = useState(true)

  const isAdmin = user?.role === "admin"

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
        if (!cancelled) setOrders((data.orders as OrderLite[]) ?? [])
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setOrdersLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, token])

  // Low stock (admin only)
  useEffect(() => {
    if (!isAdmin || !token) {
      if (!isAdmin) setLowStockLoading(false)
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
  }, [token, isAdmin])

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

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
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

      {/* Mobile: Account & Admin quick links (hidden on lg) */}
      <section className="flex flex-col gap-3 lg:hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Account
          </h2>
        </div>
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <ul className="divide-y">
              {userLinks.map((link) => (
                <li key={link.href}>
                  <CompactLinkRow link={link} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {isAdmin && (
        <section className="flex flex-col gap-3 lg:hidden">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Admin
          </h2>
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <ul className="divide-y">
                {adminLinks.map((link) => (
                  <li key={link.href}>
                    <CompactLinkRow link={link} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
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
  orders: OrderLite[]
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

      {/* Desktop-only content sections */}
      <section className="hidden gap-6 lg:grid lg:grid-cols-3">
        {/* Recent orders (2 cols) */}
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

      {/* Wishlist + Cart side-by-side on desktop */}
      <section className="hidden gap-6 lg:grid lg:grid-cols-2">
        <WishlistPreviewCard loading={wishlistLoading} />
        <CartPreviewCard loading={cartLoading} />
      </section>
    </>
  )
}

function RecentOrderRow({ order }: { order: OrderLite }) {
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
            <SmallStatusBadge status={order.status} />
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
  orders: OrderLite[]
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

  const max = Math.max(1, ...months.map((m) => m.value))
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
              <span
                className={cn(
                  "ml-2 text-xs font-medium",
                  delta >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
                )}
              >
                {delta >= 0 ? "+" : ""}
                {delta}% vs prev mo
              </span>
            )}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {loading ? (
          <BarChartSkeleton bars={6} />
        ) : (
          <div className="flex h-32 items-end gap-2">
            {months.map((m) => {
              const h = max > 0 ? Math.max(2, (m.value / max) * 100) : 2
              return (
                <div
                  key={m.key}
                  className="group flex flex-1 flex-col items-center gap-1.5"
                  title={`${m.label}: ${formatCurrency(m.value)}`}
                >
                  <div className="flex w-full flex-1 items-end">
                    <div
                      style={{ height: `${h}%` }}
                      className="w-full rounded-sm bg-foreground/15 transition-colors group-hover:bg-foreground/30"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {m.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
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
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
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
  metrics: Metrics | null
  metricsLoading: boolean
  orders: OrderLite[]
  ordersLoading: boolean
  lowStock: LowStockProduct[]
  lowStockLoading: boolean
}) {
  const recentOrders = orders.slice(0, 5)
  const avgOrder =
    metrics && metrics.totalOrders > 0
      ? Math.round((metrics.revenue ?? 0) / metrics.totalOrders)
      : 0

  return (
    <>
      {/* Period + stats */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Overview · {periodLabels[period]}
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

      {/* Charts row (desktop only) */}
      <section className="hidden gap-6 lg:grid lg:grid-cols-3">
        <OrdersBarChart points={metrics?.ordersPerDay ?? []} loading={metricsLoading} />
        <StatusBreakdown
          statusCounts={metrics?.statusCounts ?? []}
          loading={metricsLoading}
        />
      </section>

      {/* Recent orders + Low stock (desktop only) */}
      <section className="hidden gap-6 lg:grid lg:grid-cols-2">
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

function OrdersBarChart({
  points,
  loading,
}: {
  points: DayPoint[]
  loading: boolean
}) {
  const max = Math.max(1, ...points.map((p) => p.count))
  const total = points.reduce((s, p) => s + p.count, 0)

  return (
    <Card className="shadow-sm lg:col-span-2">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Orders, last 7 days</CardTitle>
          {loading ? (
            <Skeleton className="h-4 w-16" />
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              {total} total
            </span>
          )}
        </div>
        <CardDescription>Daily order volume.</CardDescription>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {loading ? (
          <BarChartSkeleton bars={7} />
        ) : points.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
            No data yet
          </div>
        ) : (
          <div className="flex h-32 items-end gap-2">
            {points.map((p) => {
              const h = max > 0 ? Math.max(2, (p.count / max) * 100) : 2
              return (
                <div
                  key={p.date}
                  className="group flex flex-1 flex-col items-center gap-1.5"
                  title={`${p.date}: ${p.count}`}
                >
                  <span className="text-[10px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {p.count}
                  </span>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      style={{ height: `${h}%` }}
                      className="w-full rounded-sm bg-foreground/15 transition-colors group-hover:bg-foreground/30"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDayLabel(p.date)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
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

function AdminRecentOrderRow({ order }: { order: OrderLite }) {
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
            <SmallStatusBadge status={order.status} />
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

function SmallStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  const label = capitalize(status.toLowerCase())
  const tone =
    s === "delivered"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : s === "shipped"
      ? "bg-sky-500/10 text-sky-700 dark:text-sky-400"
      : s === "accepted"
      ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
      : s === "cancelled"
      ? "bg-destructive/10 text-destructive"
      : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
  return (
    <Badge className={cn("border-transparent text-[10px] font-medium", tone)}>
      {label}
    </Badge>
  )
}

function CompactLinkRow({ link }: { link: QuickLink }) {
  const Icon = link.icon
  return (
    <Link
      href={link.href}
      className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground group-hover:text-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-sm font-medium text-foreground">{link.label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {link.description}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
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
      <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
        <Skeleton className="h-9 w-9 rounded-md sm:h-10 sm:w-10" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-2.5 w-14" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

function BarChartSkeleton({ bars = 7 }: { bars?: number }) {
  return (
    <div className="flex h-32 items-end gap-2">
      {Array.from({ length: bars }).map((_, i) => {
        const heights = [40, 70, 55, 85, 50, 65, 45]
        const h = heights[i % heights.length]
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full flex-1 items-end">
              <Skeleton
                className="w-full rounded-sm"
                style={{ height: `${h}%` }}
              />
            </div>
            <Skeleton className="h-2 w-4" />
          </div>
        )
      })}
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
