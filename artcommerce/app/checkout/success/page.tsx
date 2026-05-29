"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Calendar,
  Check,
  CircleCheck,
  Loader2,
  Mail,
  MapPin,
  Package,
  PackageX,
  ShoppingBag,
  Sparkles,
  Truck,
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
import { Separator } from "@/components/ui/separator"

interface StoredOrderItem {
  id: number
  quantity: number
  priceAtPurchase: number
  product: {
    id: number
    name: string
    imageUrls: string[]
  }
}

interface StoredOrder {
  id: number
  orderNumber: string
  totalAmount: number
  discountedTotal?: number
  subtotal?: number
  createdAt: string
  paymentMethod?: string
  shippingAddress?: {
    line1: string
    city: string
    postalCode: string
    country: string
  }
  orderItems: StoredOrderItem[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

function formatShortDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })
}

function getEstimatedDelivery(placedAt: Date): { from: Date; to: Date } {
  const from = new Date(placedAt)
  from.setDate(from.getDate() + 3)
  const to = new Date(placedAt)
  to.setDate(to.getDate() + 7)
  return { from, to }
}

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [order, setOrder] = useState<StoredOrder | null>(null)
  const [copied, setCopied] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/auth/login")
      return
    }
    if (typeof window === "undefined") return
    const last = localStorage.getItem("lastOrderNumber")
    setOrderNumber(last)
    const orderRaw = localStorage.getItem("lastOrder")
    if (orderRaw) {
      try {
        setOrder(JSON.parse(orderRaw))
      } catch {
        // ignore
      }
    }
    // Trigger confetti once we know we have an order to celebrate.
    setShowConfetti(true)
    const t = setTimeout(() => setShowConfetti(false), 2400)
    return () => clearTimeout(t)
  }, [user, authLoading, router])

  async function handleCopyOrder() {
    if (!orderNumber) return
    try {
      await navigator.clipboard.writeText(orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // noop
    }
  }

  const placedAt = useMemo(
    () => (order?.createdAt ? new Date(order.createdAt) : new Date()),
    [order?.createdAt]
  )
  const estimated = useMemo(() => getEstimatedDelivery(placedAt), [placedAt])

  if (!user || !orderNumber) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Preparing your confirmation…
      </main>
    )
  }

  const firstName = user.fullName?.split(" ")[0] || "friend"
  const total = order?.discountedTotal ?? order?.totalAmount ?? 0
  const totalItems =
    order?.orderItems.reduce((s, i) => s + i.quantity, 0) ?? 0

  return (
    <main className="relative mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {showConfetti && <Confetti />}

      {/* Hero card */}
      <Card
        className="overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-500"
        style={{ animationDelay: "0ms", animationFillMode: "both" }}
      >
        <div className="relative flex flex-col items-center gap-5 px-6 pb-8 pt-12 text-center sm:px-10 sm:pt-14">
          {/* Concentric ring decoration */}
          <div className="relative flex h-20 w-20 items-center justify-center">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-emerald-500/10 animate-in zoom-in-50 duration-500"
              style={{ animationFillMode: "both" }}
            />
            <span
              aria-hidden
              className="absolute -inset-3 rounded-full bg-emerald-500/5 animate-in zoom-in-50 duration-700"
              style={{ animationFillMode: "both" }}
            />
            <span
              aria-hidden
              className="absolute -inset-6 rounded-full ring-1 ring-emerald-500/10 animate-in zoom-in-50 duration-1000"
              style={{ animationFillMode: "both" }}
            />
            <DrawCheck />
            <Sparkles
              aria-hidden
              className="absolute -right-2 -top-1 h-4 w-4 text-amber-500 animate-in fade-in zoom-in-50 duration-500"
              style={{ animationDelay: "500ms", animationFillMode: "both" }}
            />
          </div>

          <div className="flex max-w-md flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Thank you, {firstName}!
            </h1>
            <p className="text-sm text-muted-foreground">
              Your order has been placed. We’ve sent the receipt to your inbox and our team is already on it.
            </p>
          </div>

          {/* Order number chip */}
          <button
            type="button"
            onClick={handleCopyOrder}
            className={cn(
              "group inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm shadow-sm transition-all",
              "hover:border-foreground/30 hover:shadow-md",
              copied && "border-emerald-500/40"
            )}
            aria-label={copied ? "Order number copied" : "Copy order number"}
          >
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Order
            </span>
            <span className="font-mono text-sm font-semibold text-foreground">
              #{orderNumber}
            </span>
            <span
              className={cn(
                "transition-colors",
                copied
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
              aria-hidden
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <CopyIcon className="h-3.5 w-3.5" />
              )}
            </span>
          </button>
          <span aria-live="polite" className="sr-only">
            {copied ? "Order number copied" : ""}
          </span>
        </div>

        <Separator />

        {/* Status timeline */}
        <CardContent className="flex flex-col gap-4 p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            What happens next
          </p>
          <ol className="grid gap-3 sm:grid-cols-4 sm:gap-4">
            <TimelineStep
              icon={CircleCheck}
              title="Confirmed"
              description="We've received your order."
              status="done"
              delay={150}
            />
            <TimelineStep
              icon={Package}
              title="Preparing"
              description="Carefully packing your pieces."
              status="active"
              delay={250}
            />
            <TimelineStep
              icon={Truck}
              title="Shipped"
              description="Tracking link will follow."
              status="upcoming"
              delay={350}
            />
            <TimelineStep
              icon={Sparkles}
              title="Delivered"
              description="Arrives between {dates}."
              dates={`${formatShortDate(estimated.from)}–${formatShortDate(estimated.to)}`}
              status="upcoming"
              delay={450}
            />
          </ol>
        </CardContent>
      </Card>

      {/* Order summary card */}
      {order && (
        <Card
          className="shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-500"
          style={{ animationDelay: "120ms", animationFillMode: "both" }}
        >
          <CardHeader className="flex flex-row items-center justify-between gap-2 p-5 pb-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base">Your order</CardTitle>
              <CardDescription>
                {totalItems} item{totalItems === 1 ? "" : "s"} •{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(total)}
                </span>{" "}
                paid
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link href={`/dashboard/orders/${order.id}`}>
                Details
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-5 pt-0">
            <ul className="flex flex-col gap-2.5">
              {order.orderItems.slice(0, 3).map((item) => {
                const src = item.product.imageUrls?.[0]
                return (
                  <li key={item.id} className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted/40">
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt={item.product.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
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
                      {formatCurrency(item.priceAtPurchase * item.quantity)}
                    </p>
                  </li>
                )
              })}
              {order.orderItems.length > 3 && (
                <li className="pl-[60px] text-xs text-muted-foreground">
                  + {order.orderItems.length - 3} more item
                  {order.orderItems.length - 3 === 1 ? "" : "s"}
                </li>
              )}
            </ul>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile
                icon={Calendar}
                label="Estimated delivery"
                value={`${formatShortDate(estimated.from)} – ${formatShortDate(estimated.to)}`}
              />
              {order.shippingAddress && (
                <InfoTile
                  icon={MapPin}
                  label="Shipping to"
                  value={`${order.shippingAddress.line1}, ${order.shippingAddress.city}`}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action cards */}
      <div
        className="grid gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-3 duration-500"
        style={{ animationDelay: "200ms", animationFillMode: "both" }}
      >
        <Card className="shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="gap-1 p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted/50 text-foreground">
              <Package className="h-4 w-4" />
            </span>
            <CardTitle className="mt-2 text-base">Track your order</CardTitle>
            <CardDescription>
              Follow real-time updates from your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <Button asChild size="sm" className="group/cta w-full gap-1.5">
              <Link href={order ? `/dashboard/orders/${order.id}` : "/dashboard/orders"}>
                View order
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="gap-1 p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted/50 text-foreground">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <CardTitle className="mt-2 text-base">Keep exploring</CardTitle>
            <CardDescription>
              Discover more handcrafted pieces in the catalog.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <Button asChild variant="outline" size="sm" className="group/cta w-full gap-1.5">
              <Link href="/products">
                Continue shopping
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Inbox reminder */}
      <Card
        className="border-dashed bg-muted/30 shadow-none animate-in fade-in duration-500"
        style={{ animationDelay: "300ms", animationFillMode: "both" }}
      >
        <CardContent className="flex items-start gap-3 p-4 sm:p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
            <Mail className="h-4 w-4" />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-foreground">Check your inbox</p>
            <p className="text-sm text-muted-foreground">
              The receipt is on its way to{" "}
              <span className="font-medium text-foreground">{user.email}</span>. If it doesn’t arrive within a few minutes, peek in your spam folder.
            </p>
          </div>
        </CardContent>
      </Card>

      <p
        className="text-center text-xs text-muted-foreground animate-in fade-in duration-500"
        style={{ animationDelay: "360ms", animationFillMode: "both" }}
      >
        Need help with this order?{" "}
        <Link
          href="/dashboard/support"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Contact support
        </Link>
      </p>
    </main>
  )
}

/* -------------------------------------------------------------- */

function DrawCheck() {
  return (
    <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 animate-in zoom-in-50 duration-300">
      <svg
        viewBox="0 0 24 24"
        width="28"
        height="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="drawCheck"
      >
        <path d="M5 12.5 10 17.5 19 7.5" />
      </svg>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .drawCheck path {
              stroke-dasharray: 28;
              stroke-dashoffset: 28;
              animation: drawCheck 520ms ease-out 220ms forwards;
            }
            @keyframes drawCheck {
              to { stroke-dashoffset: 0; }
            }
          `,
        }}
      />
    </span>
  )
}

function Confetti() {
  // Subtle: a small set of pieces around the hero
  const colors = [
    "#10b981", // emerald
    "#f59e0b", // amber
    "#6366f1", // indigo
    "#ec4899", // pink
    "#0ea5e9", // sky
  ]
  const pieces = Array.from({ length: 18 }).map((_, i) => {
    const angle = (i / 18) * 360
    const distance = 80 + ((i * 23) % 70) // 80-150px
    const tx = Math.cos((angle * Math.PI) / 180) * distance
    const ty = Math.sin((angle * Math.PI) / 180) * distance - 30 // bias upward
    const rotate = (i * 47) % 360
    const color = colors[i % colors.length]
    const size = 6 + ((i * 13) % 5)
    const isRound = i % 2 === 0
    const delay = (i % 6) * 30
    return { tx, ty, rotate, color, size, isRound, delay, i }
  })

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-32 z-10 h-0 w-0 sm:top-36"
    >
      {pieces.map((p) => (
        <span
          key={p.i}
          className="confetti-piece"
          style={
            {
              "--tx": `${p.tx}px`,
              "--ty": `${p.ty}px`,
              "--rotate": `${p.rotate}deg`,
              "--bg": p.color,
              "--size": `${p.size}px`,
              "--delay": `${p.delay}ms`,
              borderRadius: p.isRound ? "9999px" : "2px",
            } as React.CSSProperties
          }
        />
      ))}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .confetti-piece {
              position: absolute;
              top: 0;
              left: 0;
              width: var(--size);
              height: var(--size);
              background: var(--bg);
              opacity: 0;
              transform: translate(0, 0) rotate(0);
              animation: confettiBurst 1600ms cubic-bezier(0.2, 0.7, 0.2, 1) var(--delay) forwards;
            }
            @keyframes confettiBurst {
              0% { transform: translate(0, 0) rotate(0); opacity: 0; }
              15% { opacity: 1; }
              60% { opacity: 1; }
              100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rotate)); opacity: 0; }
            }
          `,
        }}
      />
    </div>
  )
}

function TimelineStep({
  icon: Icon,
  title,
  description,
  status,
  delay,
  dates,
}: {
  icon: typeof Check
  title: string
  description: string
  status: "done" | "active" | "upcoming"
  delay: number
  dates?: string
}) {
  const dot =
    status === "done"
      ? "bg-emerald-500 text-white border-transparent"
      : status === "active"
      ? "bg-foreground text-background border-transparent"
      : "bg-background text-muted-foreground"

  const badge =
    status === "done" ? (
      <Badge className="border-transparent bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
        Done
      </Badge>
    ) : status === "active" ? (
      <Badge variant="secondary" className="gap-1">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/40" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-foreground" />
        </span>
        In progress
      </Badge>
    ) : (
      <Badge variant="outline" className="text-muted-foreground">
        Up next
      </Badge>
    )

  const desc = dates ? description.replace("{dates}", dates) : description

  return (
    <li
      className="flex flex-col gap-2 rounded-lg border bg-background p-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border",
            dot
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        {badge}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs leading-snug text-muted-foreground">{desc}</p>
      </div>
    </li>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex min-w-0 flex-col">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}
