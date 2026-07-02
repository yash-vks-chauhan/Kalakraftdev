"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShoppingCart,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  Loader2,
  Tag,
  X,
  ArrowRight,
  ReceiptText,
  PackageX,
  ShieldCheck,
} from "lucide-react"

import { useAuth } from "../../contexts/AuthContext"
import { useCart, type CartItem } from "../../contexts/CartContext"
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
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

const TAX_RATE = 0.18

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

export default function DashboardCartPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const {
    cartItems,
    updateCartItem,
    removeFromCart,
    cartLoading,
  } = useCart()

  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const [promoCode, setPromoCode] = useState("")
  const [appliedCode, setAppliedCode] = useState<string | null>(null)
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<"percentage" | "flat" | null>(null)
  const [applyingPromo, setApplyingPromo] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0),
    [cartItems]
  )
  const discountAmount = useMemo(() => {
    if (!discountType) return 0
    if (discountType === "percentage") return (subtotal * discount) / 100
    return Math.min(subtotal, discount)
  }, [discount, discountType, subtotal])
  const taxes = useMemo(
    () => Math.max(0, (subtotal - discountAmount) * TAX_RATE),
    [subtotal, discountAmount]
  )
  const total = useMemo(
    () => Math.max(0, subtotal - discountAmount + taxes),
    [subtotal, discountAmount, taxes]
  )
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const hasOutOfStock = cartItems.some(
    (i) => typeof i.product.stockQuantity === "number" && i.product.stockQuantity <= 0
  )

  const redirectedRef = useRef(false)
  useEffect(() => {
    if (!authLoading && !user && !redirectedRef.current) {
      redirectedRef.current = true
      router.replace("/auth/login")
    }
  }, [authLoading, user, router])

  async function handleQty(item: CartItem, next: number) {
    const max = item.product.stockQuantity
    const clamped = Math.max(1, typeof max === "number" && max > 0 ? Math.min(max, next) : next)
    if (clamped === item.quantity) return
    setUpdatingId(item.id)
    try {
      const ok = await updateCartItem(item.id, clamped)
      if (!ok) router.refresh()
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleRemove(item: CartItem) {
    setRemovingId(item.id)
    try {
      await removeFromCart(item.id)
    } finally {
      setRemovingId(null)
    }
  }

  async function handleApplyPromo() {
    if (!promoCode.trim()) return
    setApplyingPromo(true)
    setPromoError(null)
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPromoError(data?.error || "Invalid code")
        return
      }
      setDiscount(data.amount)
      setDiscountType(data.type)
      setAppliedCode(promoCode.trim().toUpperCase())
    } catch {
      setPromoError("Could not validate code")
    } finally {
      setApplyingPromo(false)
    }
  }

  function handleRemovePromo() {
    setDiscount(0)
    setDiscountType(null)
    setAppliedCode(null)
    setPromoCode("")
    setPromoError(null)
  }

  if (!user || authLoading || cartLoading) {
    return <CartSkeleton />
  }

  if (cartItems.length === 0) {
    return (
      <main className="flex flex-col gap-6">
        <CartHeader itemCount={0} />
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center sm:p-16">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ShoppingCart className="h-6 w-6" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium text-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">
                Browse our collection and add pieces you love to your cart.
              </p>
            </div>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/products">
                <ShoppingBag className="h-4 w-4" />
                Browse products
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex flex-col gap-6">
      <CartHeader itemCount={itemCount} />

      {/* Summary stat strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={ShoppingBag} label="Items" value={itemCount.toString()} />
        <StatTile icon={ReceiptText} label="Subtotal" value={formatCurrency(subtotal)} />
        <StatTile
          icon={Tag}
          label="Discount"
          value={discountAmount > 0 ? `−${formatCurrency(discountAmount)}` : "—"}
          tone={discountAmount > 0 ? "success" : "muted"}
        />
        <StatTile
          icon={ShieldCheck}
          label="Estimated total"
          value={formatCurrency(total)}
          tone="primary"
        />
      </div>

      {/* Main grid: items + summary */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Items list */}
        <Card className="shadow-sm">
          <CardHeader className="gap-1 p-4 sm:p-6">
            <CardTitle>Your items</CardTitle>
            <CardDescription>
              Review pieces in your cart before checkout. Stock is updated in real time.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <ul className="divide-y border-t">
              {cartItems.map((item) => {
                const isUpdating = updatingId === item.id
                const isRemoving = removingId === item.id
                const stock = item.product.stockQuantity
                const hasStock = typeof stock === "number"
                const isOut = hasStock && (stock as number) <= 0
                const max = hasStock && (stock as number) > 0 ? (stock as number) : undefined
                const lineTotal = item.quantity * item.product.price
                const imageUrl = Array.isArray(item.product.imageUrls)
                  ? item.product.imageUrls[0]
                  : undefined

                return (
                  <li
                    key={item.id}
                    className={cn(
                      "group/item flex gap-3 p-3 transition-[opacity,transform,background-color] duration-200 ease-out sm:gap-4 sm:p-4 lg:p-6",
                      "hover:bg-muted/30",
                      isRemoving && "pointer-events-none scale-[0.99] opacity-50"
                    )}
                  >
                    <Link
                      href={`/products/${item.product.id}`}
                      className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted/40 transition-shadow duration-200 hover:shadow-sm sm:h-24 sm:w-24 lg:h-28 lg:w-28"
                    >
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={item.product.name}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <PackageX className="h-6 w-6" />
                        </div>
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-3">
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <Link
                            href={`/products/${item.product.id}`}
                            className="line-clamp-2 text-sm font-medium text-foreground hover:underline sm:text-base"
                          >
                            {item.product.name}
                          </Link>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            <span className="tabular-nums">{formatCurrency(item.product.price)}</span>
                            <span className="text-border">•</span>
                            <StockBadge isOut={isOut} stock={stock} />
                          </div>
                        </div>
                        <div className="shrink-0 text-right text-sm font-semibold tabular-nums text-foreground transition-colors sm:text-base">
                          {formatCurrency(lineTotal)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <QuantityStepper
                          value={item.quantity}
                          max={max}
                          disabled={isOut || isRemoving}
                          updating={isUpdating}
                          onChange={(next) => handleQty(item, next)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(item)}
                          disabled={isRemoving}
                          aria-label="Remove item"
                          className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          {isRemoving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          <span className="hidden sm:inline">Remove</span>
                        </Button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Order summary */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="shadow-sm">
            <CardHeader className="gap-1 p-4 sm:p-6">
              <CardTitle>Order summary</CardTitle>
              <CardDescription>Final amount calculated at checkout.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4 pt-0 sm:p-6 sm:pt-0">
              <dl className="flex flex-col gap-2 text-sm">
                <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
                {discountAmount > 0 && (
                  <SummaryRow
                    label={
                      <span className="flex items-center gap-1.5">
                        Discount
                        {appliedCode && (
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {appliedCode}
                          </Badge>
                        )}
                      </span>
                    }
                    value={`−${formatCurrency(discountAmount)}`}
                    valueClassName="text-emerald-600 dark:text-emerald-400"
                  />
                )}
                <SummaryRow
                  label="Shipping"
                  value={<span className="text-muted-foreground">Calculated next</span>}
                />
                <SummaryRow label={`Taxes (${Math.round(TAX_RATE * 100)}%)`} value={formatCurrency(taxes)} />
              </dl>

              <Separator />

              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-foreground">Estimated total</span>
                <span
                  aria-live="polite"
                  className="text-lg font-semibold tabular-nums tracking-tight text-foreground transition-colors"
                >
                  {formatCurrency(total)}
                </span>
              </div>

              {hasOutOfStock && (
                <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  One or more items are out of stock. Remove them to proceed.
                </p>
              )}

              <Button
                asChild
                size="lg"
                className="w-full gap-1.5"
                disabled={hasOutOfStock}
              >
                <Link
                  href={
                    appliedCode && discount > 0
                      ? `/checkout?coupon=${encodeURIComponent(appliedCode)}&discountType=${discountType}&discountAmount=${discount}`
                      : "/checkout"
                  }
                  aria-disabled={hasOutOfStock}
                >
                  Proceed to checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Promo card */}
          <Card className="shadow-sm">
            <CardHeader className="gap-1 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Promo code
              </CardTitle>
              <CardDescription>Apply a code to receive an instant discount.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
              {appliedCode ? (
                <div className="flex items-center justify-between gap-2 rounded-md border bg-secondary/40 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      {appliedCode}
                    </Badge>
                    <span className="truncate text-xs text-muted-foreground">
                      Saving {formatCurrency(discountAmount)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleRemovePromo}
                    aria-label="Remove promo code"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleApplyPromo()
                  }}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase())
                      if (promoError) setPromoError(null)
                    }}
                    placeholder="Promo code"
                    aria-label="Promo code"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    disabled={!promoCode.trim() || applyingPromo}
                  >
                    {applyingPromo && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Apply
                  </Button>
                </form>
              )}
              {promoError && (
                <p className="text-xs text-destructive">{promoError}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

function CartHeader({ itemCount, loading }: { itemCount: number; loading?: boolean }) {
  return (
    <header className="flex items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-xs text-muted-foreground sm:text-sm">Shopping</p>
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Your cart
          {!loading && itemCount > 0 && (
            <Badge variant="secondary" className="rounded-full">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </Badge>
          )}
        </h1>
        <p className="text-sm text-muted-foreground">
          Review your selection, apply a promo, and continue to checkout.
        </p>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5"
      >
        <Link href="/products" aria-label="Continue shopping">
          <ShoppingBag className="h-4 w-4" />
          <span className="hidden sm:inline">Continue shopping</span>
        </Link>
      </Button>
    </header>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof ShoppingBag
  label: string
  value: string
  tone?: "default" | "primary" | "success" | "muted"
}) {
  const toneStyles =
    tone === "primary"
      ? "bg-foreground/5 text-foreground border"
      : tone === "success"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : tone === "muted"
      ? "bg-muted text-muted-foreground"
      : "bg-muted/50 text-foreground border"

  return (
    <Card className="shadow-sm transition-shadow duration-200 hover:shadow-md">
      <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors duration-200 sm:h-10 sm:w-10",
            toneStyles
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            {label}
          </span>
          <span className="truncate text-base font-semibold tabular-nums tracking-tight text-foreground transition-colors sm:text-lg">
            {value}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function StockBadge({ isOut, stock }: { isOut: boolean; stock?: number }) {
  if (isOut) {
    return (
      <Badge className="gap-1 bg-destructive/10 text-destructive hover:bg-destructive/15 dark:bg-destructive/20">
        Out of stock
      </Badge>
    )
  }
  if (typeof stock === "number" && stock > 0 && stock <= 5) {
    return (
      <Badge className="gap-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/15 dark:text-amber-500">
        Only {stock} left
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="gap-1">
      In stock
    </Badge>
  )
}

function QuantityStepper({
  value,
  max,
  disabled,
  updating,
  onChange,
}: {
  value: number
  max?: number
  disabled?: boolean
  updating?: boolean
  onChange: (next: number) => void
}) {
  const canDecrease = !disabled && value > 1
  const canIncrease = !disabled && (max === undefined || value < max)

  return (
    <div
      className={cn(
        "inline-flex h-9 items-center overflow-hidden rounded-md border bg-background shadow-xs transition-[opacity,box-shadow] duration-200",
        disabled && "opacity-50"
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => canDecrease && onChange(value - 1)}
        disabled={!canDecrease}
        className="flex h-full w-9 items-center justify-center text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground active:scale-95 focus-visible:bg-accent focus-visible:text-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <div className="flex h-full w-12 items-center justify-center border-x text-sm font-medium tabular-nums" aria-live="polite">
        {updating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        ) : (
          value
        )}
      </div>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => canIncrease && onChange(value + 1)}
        disabled={!canIncrease}
        className="flex h-full w-9 items-center justify-center text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground active:scale-95 focus-visible:bg-accent focus-visible:text-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
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
      <dd className={cn("font-medium tabular-nums text-foreground", valueClassName)}>{value}</dd>
    </div>
  )
}

function CartSkeleton() {
  return (
    <main className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-8 w-28" />
      </header>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main grid: items list + summary */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="shadow-sm">
          <CardHeader className="gap-1 p-4 sm:p-6">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-lg border bg-card p-4"
              >
                <Skeleton className="h-20 w-20 shrink-0 rounded-md" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-8 w-28 rounded-md" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="shadow-sm">
            <CardHeader className="gap-1 p-4 sm:p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-44" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
              ))}
              <Separator className="my-1" />
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="mt-2 h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
