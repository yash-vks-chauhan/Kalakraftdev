"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
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
  LucideIcon,
} from "lucide-react"

import { useAuth } from "../contexts/AuthContext"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Period = "today" | "week" | "month" | "year" | "all"

interface Metrics {
  period: string
  totalOrders: number
  statusCounts: { status: string; _count: { status: number } }[]
  revenue: number
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

function MetricTile({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function QuickLinkRow({ link }: { link: QuickLink }) {
  const Icon = link.icon
  return (
    <Link
      href={link.href}
      className={cn(
        "group flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-4 transition-colors",
        "hover:border-foreground/20 hover:bg-secondary/40"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground group-hover:text-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{link.label}</p>
          <p className="truncate text-xs text-muted-foreground">{link.description}</p>
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  )
}

export default function DashboardHomePage() {
  const { user, token } = useAuth()
  const [period, setPeriod] = useState<Period>("today")
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  useEffect(() => {
    if (user?.role !== "admin" || !token) return
    let cancelled = false
    fetch(`/api/admin/metrics?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setMetrics(data)
      })
      .catch(console.error)
    return () => {
      cancelled = true
    }
  }, [token, user, period])

  if (!user) return null

  const isAdmin = user.role === "admin"
  const firstName = user.fullName?.split(" ")[0] ?? user.fullName

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Here's a quick look at your store today."
            : "Manage your orders, profile, and saved items."}
        </p>
      </header>

      {/* Admin metrics */}
      {isAdmin && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-foreground">
              Overview
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
            <MetricTile
              label="Orders"
              value={metrics ? metrics.totalOrders.toLocaleString("en-IN") : "—"}
              hint={periodLabels[period]}
            />
            <MetricTile
              label="Revenue"
              value={metrics ? formatCurrency(metrics.revenue ?? 0) : "—"}
              hint={periodLabels[period]}
            />
            {(metrics?.statusCounts ?? []).slice(0, 2).map((sc) => (
              <MetricTile
                key={sc.status}
                label={capitalize(sc.status)}
                value={sc._count.status.toLocaleString("en-IN")}
              />
            ))}
            {metrics && metrics.statusCounts.length < 2 &&
              Array.from({ length: 2 - metrics.statusCounts.length }).map((_, i) => (
                <MetricTile key={`placeholder-${i}`} label="—" value="—" />
              ))}
          </div>
        </section>
      )}

      {/* Quick links */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Account
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {userLinks.map((link) => (
            <QuickLinkRow key={link.href} link={link} />
          ))}
        </div>
      </section>

      {isAdmin && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Admin
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {adminLinks.map((link) => (
              <QuickLinkRow key={link.href} link={link} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
