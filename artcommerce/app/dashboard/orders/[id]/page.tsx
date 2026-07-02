"use client"

import { Fragment, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CircleCheck,
  CircleX,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  PackageX,
  Receipt,
  Star,
  Truck,
  User as UserIcon,
} from "lucide-react"

import { useAuth } from "../../../contexts/AuthContext"
import { OrderStatusBadge } from "../../_components/OrderStatusBadge"
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
import { Input } from "@/components/ui/input"
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
    currency: string
    price: number
    imageUrls: string[] | Record<string, never>
  }
}

interface Address {
  line1: string
  city: string
  postalCode: string
  country: string
}

interface OrderNote {
  id: number
  text: string
  createdAt: string
  author: { id: number; fullName: string }
}

interface Order {
  id: number
  orderNumber: string
  status: string
  subtotal: number
  tax: number
  shippingFee: number
  totalAmount: number
  couponCode?: string
  discountAmount?: number
  discountedTotal?: number
  shippingAddress: Address
  billingAddress: Address
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  orderItems: OrderItem[]
  orderNotes?: OrderNote[]
  user: { id: string; fullName: string; email: string }
}

const STATUS_FLOW = ["pending", "accepted", "shipped", "delivered"] as const

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDateLong(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getImageUrl(p: OrderItem["product"]) {
  if (Array.isArray(p.imageUrls)) return p.imageUrls[0]
  return undefined
}

export default function OrderDetailsPage() {
  const params = useParams()
  const { user, token } = useAuth()
  const router = useRouter()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState<string>("")
  const [statusSaving, setStatusSaving] = useState(false)
  const [notes, setNotes] = useState<OrderNote[]>([])
  const [noteText, setNoteText] = useState("")
  const [noteSaving, setNoteSaving] = useState(false)
  const [ratedItems, setRatedItems] = useState<Record<number, number>>({})

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/orders/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.status === 401) {
          router.replace("/auth/login")
          return
        }
        if (!res.ok) throw new Error("Failed to load order")
        const { order } = await res.json()
        setOrder(order)
        setNewStatus(order.status)
        setNotes(user?.role === "admin" ? order.orderNotes ?? [] : [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (token) load()
  }, [params.id, token, router, user?.role])

  async function handleStatusUpdate() {
    if (!order || newStatus === order.status) return
    setStatusSaving(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const { order: updated } = await res.json()
      setOrder(updated)
    } catch (err: any) {
      alert("Failed to update status: " + err.message)
    } finally {
      setStatusSaving(false)
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteText.trim() || !order) return
    setNoteSaving(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: noteText.trim() }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        return alert(`Failed to add note: ${error}`)
      }
      const { note } = await res.json()
      setNotes((prev) => [...prev, note])
      setNoteText("")
    } finally {
      setNoteSaving(false)
    }
  }

  async function handleRate(productId: number, rating: number) {
    setRatedItems((prev) => ({ ...prev, [productId]: rating }))
    try {
      await fetch(`/api/products/${productId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          comment: "",
          locale: typeof navigator !== "undefined" ? navigator.language : "en",
        }),
      })
    } catch (err) {
      console.error(err)
    }
  }

  if (loading || !order) {
    return <OrderDetailsSkeleton />
  }

  const isAdmin = user?.role === "admin"
  const finalTotal = order.discountedTotal ?? order.totalAmount
  const totalItems =
    order.orderItems?.reduce((s, i) => s + i.quantity, 0) ?? 0

  return (
    <main className="flex flex-col gap-6">
      {/* Back link */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>
        </Button>
      </div>

      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Order #{order.orderNumber}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Placed {formatDateLong(order.createdAt)}
          </span>
          <span className="text-border">•</span>
          <span>{totalItems} item{totalItems === 1 ? "" : "s"}</span>
          <span className="text-border">•</span>
          <span className="font-medium text-foreground">
            {formatCurrency(finalTotal)}
          </span>
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left/Main column */}
        <div className="flex flex-col gap-6">
          {/* Progress tracker */}
          <TrackingCard status={order.status} />

          {/* Items */}
          <Card className="shadow-sm">
            <CardHeader className="gap-1 p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-muted-foreground" />
                Items in this order
              </CardTitle>
              <CardDescription>
                {totalItems} item{totalItems === 1 ? "" : "s"} from{" "}
                {order.orderItems?.length ?? 0} product
                {(order.orderItems?.length ?? 0) === 1 ? "" : "s"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y border-t">
                {(order.orderItems ?? []).map((item) => {
                  const src = getImageUrl(item.product)
                  const line = item.priceAtPurchase * item.quantity
                  return (
                    <li
                      key={item.id}
                      className="flex flex-col gap-3 p-4 sm:p-5"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <Link
                          href={`/products/${item.product.id}`}
                          className="h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted/40 sm:h-20 sm:w-20"
                        >
                          {src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={src}
                              alt={item.product.name}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <PackageX className="h-5 w-5" />
                            </div>
                          )}
                        </Link>

                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <Link
                            href={`/products/${item.product.id}`}
                            className="line-clamp-2 text-sm font-medium text-foreground hover:underline sm:text-base"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {formatCurrency(item.priceAtPurchase)} ×{" "}
                            {item.quantity}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground sm:text-base">
                          {formatCurrency(line)}
                        </p>
                      </div>

                      {order.status.toLowerCase() === "delivered" && (
                        <RatingRow
                          productName={item.product.name}
                          rated={ratedItems[item.product.id] ?? 0}
                          onRate={(n) => handleRate(item.product.id, n)}
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>

          {/* Customer & Addresses */}
          <Card className="shadow-sm">
            <CardHeader className="gap-1 p-5 pb-3">
              <CardTitle className="text-base">Customer & delivery</CardTitle>
              <CardDescription>
                Shipping, billing, and payment information.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-5 pt-0 sm:grid-cols-2 lg:grid-cols-3">
              <InfoBlock
                icon={UserIcon}
                title="Customer"
                lines={[order.user?.fullName, order.user?.email].filter(
                  Boolean
                ) as string[]}
              />
              <InfoBlock
                icon={MapPin}
                title="Shipping"
                lines={[
                  order.shippingAddress.line1,
                  `${order.shippingAddress.city}, ${order.shippingAddress.postalCode}`,
                  order.shippingAddress.country,
                ]}
              />
              <InfoBlock
                icon={MapPin}
                title="Billing"
                lines={[
                  order.billingAddress.line1,
                  `${order.billingAddress.city}, ${order.billingAddress.postalCode}`,
                  order.billingAddress.country,
                ]}
              />
              <InfoBlock
                icon={CreditCard}
                title="Payment"
                lines={[
                  order.paymentMethod,
                  `Status: ${order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}`,
                ]}
              />
            </CardContent>
          </Card>

          {/* Admin: status update */}
          {isAdmin && (
            <Card className="shadow-sm">
              <CardHeader className="gap-1 p-5 pb-3">
                <CardTitle className="text-base">Update order status</CardTitle>
                <CardDescription>
                  Customer receives an email confirmation on change.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 p-5 pt-0 sm:flex-row">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="h-10 w-full sm:w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={statusSaving || newStatus === order.status}
                  className="gap-1.5"
                >
                  {statusSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    "Save status"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Admin: notes */}
          {isAdmin && (
            <Card className="shadow-sm">
              <CardHeader className="gap-1 p-5 pb-3">
                <CardTitle className="text-base">Notes & audit trail</CardTitle>
                <CardDescription>
                  Internal notes are not visible to customers.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 p-5 pt-0">
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No notes yet.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {notes.map((note) => (
                      <li
                        key={note.id}
                        className="rounded-md border bg-muted/30 p-3"
                      >
                        <p className="text-sm text-foreground">{note.text}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          — {note.author.fullName} ·{" "}
                          {formatDateTime(note.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <form
                  onSubmit={handleAddNote}
                  className="flex flex-col gap-2 sm:flex-row"
                >
                  <Input
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add an internal note…"
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!noteText.trim() || noteSaving}
                    className="gap-1.5"
                  >
                    {noteSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Add note
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: summary (sticky on desktop) */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <SummaryCard order={order} />
        </div>
      </div>
    </main>
  )
}

/* -------------------------------------------------------------- */

function TrackingCard({ status }: { status: string }) {
  const s = status.toLowerCase()
  const cancelled = s === "cancelled"
  const currentIdx = cancelled ? -1 : STATUS_FLOW.indexOf(s as any)

  return (
    <Card className="shadow-sm">
      <CardHeader className="gap-1 p-5 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="h-4 w-4 text-muted-foreground" />
          Tracking
        </CardTitle>
        <CardDescription>
          {cancelled
            ? "This order was cancelled."
            : currentIdx >= STATUS_FLOW.length - 1
            ? "Delivered — thanks for shopping with us."
            : "Here's where your order is right now."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 pt-2">
        {cancelled ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <CircleX className="h-4 w-4" />
            Order cancelled
          </div>
        ) : (
          <ol className="flex items-start justify-between gap-2">
            {STATUS_FLOW.map((step, i) => {
              const reached = i <= currentIdx
              const isCurrent = i === currentIdx
              return (
                <Fragment key={step}>
                  <li className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                        reached
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground",
                        isCurrent && "ring-2 ring-foreground/20 ring-offset-2 ring-offset-background"
                      )}
                    >
                      {reached ? (
                        <CircleCheck className="h-3.5 w-3.5" />
                      ) : (
                        <span className="text-[11px] font-semibold">
                          {i + 1}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-medium capitalize sm:text-xs",
                        reached
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {step}
                    </span>
                  </li>
                  {i < STATUS_FLOW.length - 1 && (
                    <li
                      aria-hidden
                      className={cn(
                        "mt-3.5 h-px flex-[2] transition-colors",
                        i < currentIdx ? "bg-foreground" : "bg-border"
                      )}
                    />
                  )}
                </Fragment>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryCard({ order }: { order: Order }) {
  const hasDiscount = !!order.discountAmount && order.discountAmount > 0
  const finalTotal = order.discountedTotal ?? order.totalAmount

  return (
    <Card className="shadow-sm">
      <CardHeader className="gap-1 p-5 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          Order summary
        </CardTitle>
        <CardDescription>Final amount charged at checkout.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-5 pt-0">
        <dl className="flex flex-col gap-2 text-sm">
          <SummaryRow label="Subtotal" value={formatCurrency(order.subtotal)} />
          {hasDiscount && (
            <SummaryRow
              label={
                <span className="flex items-center gap-1.5">
                  Discount
                  {order.couponCode && (
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {order.couponCode}
                    </Badge>
                  )}
                </span>
              }
              value={`−${formatCurrency(order.discountAmount!)}`}
              valueClassName="text-emerald-600 dark:text-emerald-400"
            />
          )}
          <SummaryRow label="Tax" value={formatCurrency(order.tax)} />
          <SummaryRow label="Shipping" value={formatCurrency(order.shippingFee)} />
        </dl>

        <Separator />

        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-foreground">
            Total paid
          </span>
          <span className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
            {formatCurrency(finalTotal)}
          </span>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/dashboard/support">Need help with this order?</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/products">Continue shopping</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryRow({
  label,
  value,
  valueClassName,
}: {
  label: React.ReactNode
  value: React.ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "font-medium tabular-nums text-foreground",
          valueClassName
        )}
      >
        {value}
      </dd>
    </div>
  )
}

function InfoBlock({
  icon: Icon,
  title,
  lines,
}: {
  icon: typeof MapPin
  title: string
  lines: string[]
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div className="flex flex-col gap-0.5 text-sm text-foreground">
        {lines.map((l, i) => (
          <p key={i} className={cn(i === 0 ? "font-medium" : "text-muted-foreground")}>
            {l}
          </p>
        ))}
      </div>
    </div>
  )
}

function RatingRow({
  productName,
  rated,
  onRate,
}: {
  productName: string
  rated: number
  onRate: (n: number) => void
}) {
  return (
    <div className="ml-[76px] flex items-center gap-2 rounded-md bg-muted/30 px-3 py-2 sm:ml-24">
      <span className="text-xs text-muted-foreground">
        {rated > 0 ? "Thanks for rating!" : "Rate this item:"}
      </span>
      <div className="flex items-center gap-0.5" role="radiogroup" aria-label={`Rate ${productName}`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onRate(n)}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <Star
              className={cn(
                "h-4 w-4 transition-colors",
                n <= rated
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- */

function OrderDetailsSkeleton() {
  return (
    <main className="flex flex-col gap-6">
      <Skeleton className="h-8 w-32" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <Card className="shadow-sm">
            <CardHeader className="p-5 pb-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-1.5 h-3 w-48" />
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Fragment key={i}>
                    <div className="flex flex-1 flex-col items-center gap-1.5">
                      <Skeleton className="h-7 w-7 rounded-full" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                    {i < 4 && <Skeleton className="mt-3.5 h-px flex-[2]" />}
                  </Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="p-5 pb-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1.5 h-3 w-44" />
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y border-t">
                {[1, 2].map((i) => (
                  <li key={i} className="flex items-center gap-3 p-5">
                    <Skeleton className="h-16 w-16 rounded-md sm:h-20 sm:w-20" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="shadow-sm">
            <CardHeader className="p-5 pb-3">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-5 pt-0">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
              <Separator />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
