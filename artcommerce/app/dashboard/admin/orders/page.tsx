"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowRight,
  Clock,
  CircleCheck,
  CircleX,
  Download,
  Loader2,
  Mail,
  Package,
  ReceiptText,
  Search,
  Truck,
  Wallet,
  X,
} from "lucide-react"

import { useAuth } from "../../../contexts/AuthContext"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface OrderItem {
  id: number
  quantity: number
  priceAtPurchase: number
  product: { id: number; name: string }
}

interface AdminOrder {
  id: number
  orderNumber: string
  status: string
  totalAmount: number
  discountedTotal?: number
  createdAt: string
  paymentMethod: string
  paymentStatus: string
  user: { id: number; fullName: string; email: string }
  shippingAddress: {
    line1: string
    city: string
    postalCode: string
    country: string
  }
  orderItems?: OrderItem[]
}

const STATUS_FILTERS = ["all", "pending", "accepted", "shipped", "delivered", "cancelled"] as const
const EDITABLE_STATUSES = ["accepted", "shipped", "delivered"] as const
const PAYMENT_FILTERS = ["all", "unpaid", "paypal", "credit card", "cod"] as const

type StatusState = "pending" | "success" | "error"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatRelative(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const min = Math.round(diffMs / 60000)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day}d ago`
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })
}

function formatDateExact(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function initialsOf(name?: string) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export default function AdminOrdersPage() {
  const { token, user } = useAuth()
  const search = useSearchParams()
  const filterUid = search.get("userId")

  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPayment, setFilterPayment] = useState<string>("all")
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")
  const [searchText, setSearchText] = useState<string>("")

  // Status change state per order
  const [statusState, setStatusState] = useState<Record<number, StatusState>>({})
  const [exporting, setExporting] = useState(false)

  // Recently-arrived orders (for a subtle highlight animation)
  const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (user?.role !== "admin") {
      setLoading(false)
      return
    }
    let cancelled = false
    const url = `/api/orders${filterUid ? `?userId=${filterUid}` : ""}`
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed to load (${r.status})`)
        return r.json()
      })
      .then((data) => {
        if (!cancelled) setOrders((data.orders as AdminOrder[]) || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load orders")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, user, filterUid])

  // SSE for real-time updates
  useEffect(() => {
    if (user?.role !== "admin") return
    const evt = new EventSource("/api/orders/stream", { withCredentials: true })
    evt.onmessage = (e) => {
      try {
        const { type, order } = JSON.parse(e.data)
        if (type === "created") {
          setOrders((prev) =>
            prev.some((o) => o.id === order.id) ? prev : [order, ...prev]
          )
          setNewOrderIds((prev) => new Set(prev).add(order.id))
          setTimeout(() => {
            setNewOrderIds((prev) => {
              const next = new Set(prev)
              next.delete(order.id)
              return next
            })
          }, 3000)
        } else if (type === "updated") {
          setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)))
        }
      } catch {
        // ignore malformed events
      }
    }
    return () => evt.close()
  }, [user?.role])

  const stats = useMemo(() => {
    const total = orders.length
    const pending = orders.filter((o) => o.status.toLowerCase() === "pending").length
    const active = orders.filter((o) =>
      ["accepted", "shipped"].includes(o.status.toLowerCase())
    ).length
    const revenue = orders
      .filter((o) => o.status.toLowerCase() !== "cancelled")
      .reduce((s, o) => s + (o.discountedTotal ?? o.totalAmount), 0)
    return { total, pending, active, revenue }
  }, [orders])

  const displayed = useMemo(() => {
    let list = orders
    if (filterStatus !== "all") {
      list = list.filter((o) => o.status.toLowerCase() === filterStatus)
    }
    if (filterPayment !== "all") {
      if (filterPayment === "unpaid") {
        list = list.filter((o) => o.paymentStatus.toLowerCase() === "unpaid")
      } else {
        list = list.filter(
          (o) => o.paymentMethod.toLowerCase() === filterPayment
        )
      }
    }
    if (fromDate) {
      const fromTs = new Date(fromDate).getTime()
      list = list.filter((o) => new Date(o.createdAt).getTime() >= fromTs)
    }
    if (toDate) {
      const toTs = new Date(toDate).getTime() + 24 * 60 * 60 * 1000
      list = list.filter((o) => new Date(o.createdAt).getTime() < toTs)
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase()
      list = list.filter(
        (o) =>
          o.user.fullName.toLowerCase().includes(q) ||
          o.user.email.toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q)
      )
    }
    return list
  }, [orders, filterStatus, filterPayment, fromDate, toDate, searchText])

  const anyFilterActive =
    filterStatus !== "all" ||
    filterPayment !== "all" ||
    fromDate !== "" ||
    toDate !== "" ||
    searchText.trim() !== ""

  function clearFilters() {
    setFilterStatus("all")
    setFilterPayment("all")
    setFromDate("")
    setToDate("")
    setSearchText("")
  }

  const handleStatusChange = useCallback(
    async (orderId: number, newStatus: string) => {
      const target = orders.find((o) => o.id === orderId)
      if (!target || target.status === newStatus) return

      // Optimistic update + per-row pending state
      const previousStatus = target.status
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
      setStatusState((prev) => ({ ...prev, [orderId]: "pending" }))

      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `HTTP ${res.status}`)
        }
        const { order: updated } = await res.json()
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o))
        )
        setStatusState((prev) => ({ ...prev, [orderId]: "success" }))
        setTimeout(() => {
          setStatusState((prev) => {
            const next = { ...prev }
            delete next[orderId]
            return next
          })
        }, 1400)
      } catch (err) {
        // Revert
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: previousStatus } : o
          )
        )
        setStatusState((prev) => ({ ...prev, [orderId]: "error" }))
        setTimeout(() => {
          setStatusState((prev) => {
            const next = { ...prev }
            delete next[orderId]
            return next
          })
        }, 2200)
      }
    },
    [orders, token]
  )

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch("/api/orders/export", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert("Export failed: " + (err?.message || "Unknown error"))
    } finally {
      setExporting(false)
    }
  }

  if (user?.role !== "admin") {
    return (
      <main className="p-8">
        <p className="text-sm text-muted-foreground">Unauthorized</p>
      </main>
    )
  }

  return (
    <main className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs text-muted-foreground sm:text-sm">Admin</p>
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            All orders
            {!loading && (
              <Badge variant="secondary" className="rounded-full">
                {orders.length}
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and update order status in place. Changes are saved instantly and emailed to the customer.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exporting || orders.length === 0}
          className="shrink-0 gap-1.5 self-start sm:self-end"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export CSV
        </Button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {loading ? (
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
              value={stats.total.toLocaleString()}
            />
            <StatTile
              icon={Clock}
              label="Awaiting action"
              value={stats.pending.toLocaleString()}
              tone={stats.pending > 0 ? "warn" : "muted"}
            />
            <StatTile
              icon={Truck}
              label="Active"
              value={stats.active.toLocaleString()}
              tone={stats.active > 0 ? "primary" : "muted"}
            />
            <StatTile
              icon={Wallet}
              label="Revenue"
              value={formatCurrency(stats.revenue)}
            />
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="grid gap-3 p-4 sm:p-5 md:grid-cols-2 lg:grid-cols-6">
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <Label htmlFor="order-search" className="text-xs text-muted-foreground">
              Search
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="order-search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Order #, name or email"
                className="pl-9"
              />
            </div>
          </div>

          <FilterSelect
            label="Status"
            value={filterStatus}
            onChange={setFilterStatus}
            options={STATUS_FILTERS}
          />
          <FilterSelect
            label="Payment"
            value={filterPayment}
            onChange={setFilterPayment}
            options={PAYMENT_FILTERS}
          />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="from-date" className="text-xs text-muted-foreground">
              From
            </Label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="to-date" className="text-xs text-muted-foreground">
              To
            </Label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9"
            />
          </div>

          {anyFilterActive && (
            <div className="flex items-end md:col-span-2 lg:col-span-6">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </Button>
              <span className="ml-auto text-xs text-muted-foreground">
                {displayed.length} of {orders.length} shown
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders table */}
      <Card className="shadow-sm">
        <CardHeader className="gap-1 p-5 pb-3">
          <CardTitle className="text-base">Orders</CardTitle>
          <CardDescription>
            Click the status pill on any row to update it. The customer is notified by email.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto border-t">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="px-4">Order</TableHead>
                  <TableHead className="px-4">Customer</TableHead>
                  <TableHead className="px-4">Items</TableHead>
                  <TableHead className="px-4">Payment</TableHead>
                  <TableHead className="px-4 text-right">Total</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                  <TableHead className="px-4 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <AdminOrderRowSkeleton key={i} />
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-destructive"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : displayed.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="px-4 py-12 text-center"
                    >
                      <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-muted-foreground">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Package className="h-4 w-4" />
                        </span>
                        <p className="text-sm font-medium text-foreground">
                          No orders here
                        </p>
                        <p className="text-xs">
                          {anyFilterActive
                            ? "Try clearing filters to see all orders."
                            : "When customers place an order it will appear here."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayed.map((o) => (
                    <AdminOrderRow
                      key={o.id}
                      order={o}
                      isNew={newOrderIds.has(o.id)}
                      statusState={statusState[o.id]}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

/* -------------------------------------------------------------- */
/* ROW                                                             */
/* -------------------------------------------------------------- */

function AdminOrderRow({
  order,
  isNew,
  statusState,
  onStatusChange,
}: {
  order: AdminOrder
  isNew: boolean
  statusState?: StatusState
  onStatusChange: (id: number, status: string) => void
}) {
  const totalItems =
    order.orderItems?.reduce((s, i) => s + i.quantity, 0) ?? 0
  const finalTotal = order.discountedTotal ?? order.totalAmount
  const paymentPaid = order.paymentStatus.toLowerCase() === "paid"

  return (
    <TableRow
      className={cn(
        "align-middle transition-colors",
        isNew &&
          "bg-emerald-500/5 animate-in fade-in slide-in-from-top-2 duration-500"
      )}
    >
      <TableCell className="px-4 py-3">
        <div className="flex flex-col">
          <Link
            href={`/dashboard/orders/${order.id}`}
            className="text-sm font-medium text-foreground hover:underline"
          >
            #{order.orderNumber}
          </Link>
          <span
            className="text-xs text-muted-foreground"
            title={formatDateExact(order.createdAt)}
          >
            {formatRelative(order.createdAt)}
          </span>
        </div>
      </TableCell>

      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border">
            <AvatarFallback className="bg-secondary text-[11px] font-medium text-foreground">
              {initialsOf(order.user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {order.user.fullName}
            </span>
            <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{order.user.email}</span>
            </span>
          </div>
        </div>
      </TableCell>

      <TableCell className="px-4 py-3">
        <span className="text-sm text-foreground tabular-nums">
          {totalItems}
        </span>
        <span className="ml-1 text-xs text-muted-foreground">
          item{totalItems === 1 ? "" : "s"}
        </span>
      </TableCell>

      <TableCell className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-foreground">
            {capitalize(order.paymentMethod)}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px]",
              paymentPaid
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-500"
            )}
          >
            <span
              className={cn(
                "inline-flex h-1.5 w-1.5 rounded-full",
                paymentPaid ? "bg-emerald-500" : "bg-amber-500"
              )}
            />
            {capitalize(order.paymentStatus)}
          </span>
        </div>
      </TableCell>

      <TableCell className="px-4 py-3 text-right text-sm font-semibold tabular-nums">
        {formatCurrency(finalTotal)}
      </TableCell>

      <TableCell className="px-4 py-3">
        <StatusSelect
          current={order.status}
          state={statusState}
          onChange={(next) => onStatusChange(order.id, next)}
        />
      </TableCell>

      <TableCell className="px-4 py-3">
        <div className="flex justify-end">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <Link
              href={`/dashboard/orders/${order.id}`}
              aria-label={`View order ${order.orderNumber}`}
            >
              View
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

/* -------------------------------------------------------------- */
/* INLINE STATUS SELECT                                            */
/* -------------------------------------------------------------- */

function StatusSelect({
  current,
  state,
  onChange,
}: {
  current: string
  state?: StatusState
  onChange: (next: string) => void
}) {
  const s = current.toLowerCase()
  const terminal = s === "cancelled" || s === "delivered"
  const isPending = state === "pending"
  const isSuccess = state === "success"
  const isError = state === "error"

  const tone = statusTone(s)

  return (
    <div className="flex items-center gap-2">
      <Select
        value={s}
        onValueChange={onChange}
        disabled={isPending || s === "cancelled"}
      >
        <SelectTrigger
          className={cn(
            "h-8 w-[148px] gap-1.5 border text-xs font-medium transition-colors",
            tone.bg,
            tone.text,
            tone.border,
            isError && "ring-2 ring-destructive/40",
            isSuccess && "ring-2 ring-emerald-500/40"
          )}
          aria-label="Change order status"
        >
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex h-1.5 w-1.5 shrink-0 rounded-full",
                tone.dot
              )}
            />
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          {/* Show current status as a non-actionable hint if not editable */}
          {(s === "pending" || s === "cancelled") && (
            <SelectItem value={s} disabled>
              {capitalize(s)} <span className="text-muted-foreground">(current)</span>
            </SelectItem>
          )}
          {EDITABLE_STATUSES.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {capitalize(opt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Right-hand state indicator */}
      <div className="h-5 w-5 shrink-0">
        {isPending && (
          <Loader2
            className="h-4 w-4 animate-spin text-muted-foreground"
            aria-label="Saving"
          />
        )}
        {isSuccess && (
          <CircleCheck
            className="h-4 w-4 text-emerald-600 animate-in zoom-in-50 duration-200"
            aria-label="Saved"
          />
        )}
        {isError && (
          <CircleX
            className="h-4 w-4 text-destructive animate-in zoom-in-50 duration-200"
            aria-label="Failed"
          />
        )}
        {terminal && !state && (
          <span title="Final status" className="sr-only">
            Final status
          </span>
        )}
      </div>
    </div>
  )
}

function statusTone(status: string): {
  bg: string
  text: string
  border: string
  dot: string
} {
  switch (status) {
    case "delivered":
      return {
        bg: "bg-emerald-500/10 hover:bg-emerald-500/15",
        text: "text-emerald-700 dark:text-emerald-400",
        border: "border-emerald-500/30",
        dot: "bg-emerald-500",
      }
    case "shipped":
      return {
        bg: "bg-sky-500/10 hover:bg-sky-500/15",
        text: "text-sky-700 dark:text-sky-400",
        border: "border-sky-500/30",
        dot: "bg-sky-500",
      }
    case "accepted":
      return {
        bg: "bg-indigo-500/10 hover:bg-indigo-500/15",
        text: "text-indigo-700 dark:text-indigo-400",
        border: "border-indigo-500/30",
        dot: "bg-indigo-500",
      }
    case "cancelled":
      return {
        bg: "bg-destructive/10 hover:bg-destructive/15",
        text: "text-destructive",
        border: "border-destructive/30",
        dot: "bg-destructive",
      }
    default:
      // pending
      return {
        bg: "bg-amber-500/10 hover:bg-amber-500/15",
        text: "text-amber-700 dark:text-amber-500",
        border: "border-amber-500/30",
        dot: "bg-amber-500",
      }
  }
}

/* -------------------------------------------------------------- */
/* HELPERS                                                         */
/* -------------------------------------------------------------- */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: readonly string[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt === "all" ? `All ${label.toLowerCase()}` : capitalize(opt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Package
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

function StatTileSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
        <Skeleton className="h-9 w-9 rounded-md sm:h-10 sm:w-10" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

function AdminOrderRowSkeleton() {
  return (
    <TableRow className="align-middle">
      <TableCell className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-36" />
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <Skeleton className="h-3.5 w-12" />
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </TableCell>
      <TableCell className="px-4 py-3 text-right">
        <Skeleton className="ml-auto h-4 w-16" />
      </TableCell>
      <TableCell className="px-4 py-3">
        <Skeleton className="h-8 w-[148px] rounded-md" />
      </TableCell>
      <TableCell className="px-4 py-3">
        <Skeleton className="ml-auto h-8 w-14" />
      </TableCell>
    </TableRow>
  )
}
