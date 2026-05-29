"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import confetti from "canvas-confetti"
import { useReducedMotion } from "framer-motion"
import {
  ArrowRight,
  Check,
  CircleCheck,
  Copy,
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
  const reducedMotion = useReducedMotion()
  const firedConfettiRef = useRef(false)

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
  }, [user, authLoading, router])

  // Fire celebratory confetti once we know the order is loaded.
  useEffect(() => {
    if (firedConfettiRef.current) return
    if (!orderNumber) return
    if (reducedMotion) {
      firedConfettiRef.current = true
      return
    }
    firedConfettiRef.current = true
    fireCelebration()
  }, [orderNumber, reducedMotion])

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
      <main className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center gap-3 px-4 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Preparing your confirmation…
      </main>
    )
  }

  const firstName = user.fullName?.split(" ")[0] || "friend"
  const total = order?.discountedTotal ?? order?.totalAmount ?? 0
  const totalItems = order?.orderItems.reduce((s, i) => s + i.quantity, 0) ?? 0
  const deliveryWindow = `${formatShortDate(estimated.from)} – ${formatShortDate(estimated.to)}`

  return (
    <main className="relative mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <Card
        className="overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-500"
        style={{ animationFillMode: "both" }}
      >
        <div className="relative flex flex-col items-center gap-5 px-6 pb-6 pt-12 text-center sm:px-10 sm:pt-14">
          <Halo />
          <DrawCheck />

          <div className="flex max-w-md flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Thank you, {firstName}!
            </h1>
            <p className="text-sm text-muted-foreground">
              Your order is placed and we&rsquo;re already on it.
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
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </span>
          </button>
          <span aria-live="polite" className="sr-only">
            {copied ? "Order number copied" : ""}
          </span>

          {/* Inline summary chips */}
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/30 px-2.5 py-1">
              <Mail className="h-3 w-3" />
              Receipt sent to{" "}
              <span className="font-medium text-foreground">{user.email}</span>
            </span>
            {order && (
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/30 px-2.5 py-1">
                <Truck className="h-3 w-3" />
                Arrives <span className="font-medium text-foreground">{deliveryWindow}</span>
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* ── What happens next ───────────────────────────────── */}
      <Card
        className="shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-500"
        style={{ animationDelay: "100ms", animationFillMode: "both" }}
      >
        <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
          <CardTitle className="text-base">What happens next</CardTitle>
          <CardDescription>
            We&rsquo;ll keep you posted at each step.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-2 sm:p-6 sm:pt-2">
          <Timeline>
            <TimelineStep
              icon={CircleCheck}
              title="Confirmed"
              description="We've received your order and locked it in."
              status="done"
              delay={120}
            />
            <TimelineStep
              icon={Package}
              title="Preparing"
              description="Carefully packing your pieces with care."
              status="active"
              delay={200}
            />
            <TimelineStep
              icon={Truck}
              title="Shipped"
              description="A tracking link will land in your inbox."
              status="upcoming"
              delay={280}
            />
            <TimelineStep
              icon={Sparkles}
              title="Delivered"
              description="Arrives between"
              note={deliveryWindow}
              status="upcoming"
              delay={360}
              isLast
            />
          </Timeline>
        </CardContent>
      </Card>

      {/* ── Order summary ──────────────────────────────────── */}
      {order && (
        <Card
          className="shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-500"
          style={{ animationDelay: "200ms", animationFillMode: "both" }}
        >
          <CardHeader className="flex flex-row items-center justify-between gap-2 p-5 pb-3 sm:p-6 sm:pb-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base">Your order</CardTitle>
              <CardDescription>
                {totalItems} item{totalItems === 1 ? "" : "s"} ·{" "}
                <span className="font-medium text-foreground">
                  <CountUp value={total} />
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
          <CardContent className="flex flex-col gap-4 p-5 pt-0 sm:p-6 sm:pt-0">
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

            {order.shippingAddress && (
              <>
                <Separator />
                <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Shipping to{" "}
                    <span className="font-medium text-foreground">
                      {order.shippingAddress.line1}, {order.shippingAddress.city}
                    </span>
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Actions ─────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-3 duration-500 sm:flex-row sm:items-center sm:justify-between"
        style={{ animationDelay: "280ms", animationFillMode: "both" }}
      >
        <Button asChild size="lg" className="group/cta gap-2">
          <Link href={order ? `/dashboard/orders/${order.id}` : "/dashboard/orders"}>
            <Package className="h-4 w-4" />
            Track your order
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
          </Link>
        </Button>
        <Button asChild variant="ghost" className="group/cta gap-1.5 text-muted-foreground">
          <Link href="/products">
            <ShoppingBag className="h-4 w-4" />
            Continue shopping
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
          </Link>
        </Button>
      </div>

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

/* ─── Confetti orchestration ─────────────────────────────── */

function fireCelebration() {
  const palette = [
    "#10b981",
    "#34d399",
    "#fbbf24",
    "#f97316",
    "#a855f7",
    "#3b82f6",
    "#ec4899",
  ]
  // Top-center burst above the hero check.
  confetti({
    particleCount: 160,
    spread: 95,
    startVelocity: 55,
    origin: { x: 0.5, y: 0.25 },
    colors: palette,
    scalar: 1.05,
    ticks: 280,
    zIndex: 9999,
  })
  // Side cannons aimed inward.
  confetti({
    particleCount: 80,
    angle: 60,
    spread: 75,
    startVelocity: 55,
    origin: { x: 0.1, y: 0.4 },
    colors: palette.slice(0, 4),
    zIndex: 9999,
  })
  confetti({
    particleCount: 80,
    angle: 120,
    spread: 75,
    startVelocity: 55,
    origin: { x: 0.9, y: 0.4 },
    colors: palette.slice(3),
    zIndex: 9999,
  })
  // Delayed drift for a lasting moment.
  window.setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 130,
      startVelocity: 28,
      gravity: 0.7,
      decay: 0.94,
      origin: { x: 0.5, y: 0.3 },
      colors: palette,
      scalar: 1.1,
      ticks: 340,
      zIndex: 9999,
    })
  }, 250)
}

/* ─── Helpers ────────────────────────────────────────────── */

function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0)
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    if (reducedMotion) {
      setN(value)
      return
    }
    const start = performance.now()
    let raf = 0
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setN(value * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, reducedMotion])
  return <>{formatCurrency(n)}</>
}

function Halo() {
  return (
    <>
      <span
        aria-hidden
        className="absolute left-1/2 top-12 -z-10 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/15 blur-2xl"
      />
      <span
        aria-hidden
        className="absolute left-1/2 top-12 -z-10 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-3xl"
      />
    </>
  )
}

function DrawCheck() {
  return (
    <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 animate-in zoom-in-50 duration-300">
      <svg
        viewBox="0 0 24 24"
        width="32"
        height="32"
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

/* ─── Timeline ───────────────────────────────────────────── */

function Timeline({ children }: { children: React.ReactNode }) {
  return <ol className="relative flex flex-col gap-0">{children}</ol>
}

function TimelineStep({
  icon: Icon,
  title,
  description,
  note,
  status,
  delay,
  isLast,
}: {
  icon: typeof Check
  title: string
  description: string
  note?: string
  status: "done" | "active" | "upcoming"
  delay: number
  isLast?: boolean
}) {
  const dotClass =
    status === "done"
      ? "bg-emerald-500 text-white border-transparent"
      : status === "active"
      ? "bg-foreground text-background border-transparent"
      : "bg-background text-muted-foreground border-border"

  const connectorClass =
    status === "done" || status === "active"
      ? "bg-gradient-to-b from-emerald-500/60 to-border"
      : "bg-border"

  return (
    <li
      className="relative flex gap-4 pb-5 last:pb-0 animate-in fade-in slide-in-from-bottom-2 duration-500"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {!isLast && (
        <span
          aria-hidden
          className={cn("absolute left-4 top-9 -translate-x-1/2 w-px", connectorClass)}
          style={{ height: "calc(100% - 16px)" }}
        />
      )}

      <span
        className={cn(
          "relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
          dotClass
        )}
      >
        <Icon className="h-4 w-4" />
        {status === "active" && (
          <>
            <span
              aria-hidden
              className="absolute inset-0 rounded-full ring-2 ring-foreground/15"
            />
            <span
              aria-hidden
              className="absolute -inset-1 rounded-full bg-foreground/10 motion-safe:animate-ping"
            />
          </>
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <StatusPill status={status} />
        </div>
        <p className="text-xs leading-snug text-muted-foreground">
          {description}
          {note && (
            <>
              {" "}
              <span className="font-medium text-foreground">{note}</span>.
            </>
          )}
        </p>
      </div>
    </li>
  )
}

function StatusPill({ status }: { status: "done" | "active" | "upcoming" }) {
  if (status === "done") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300"
      >
        <Check className="h-3 w-3" />
        Done
      </Badge>
    )
  }
  if (status === "active") {
    return (
      <Badge variant="secondary" className="gap-1 text-[10px]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/40" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-foreground" />
        </span>
        In progress
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-[10px] text-muted-foreground">
      Up next
    </Badge>
  )
}
