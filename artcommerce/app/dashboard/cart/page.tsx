"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
  ChevronUp,
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

function formatCurrency(value: number, opts?: { compact?: boolean }) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: opts?.compact ? 0 : 2,
    minimumFractionDigits: opts?.compact ? 0 : 2,
  }).format(value)
}

/**
 * Below lg the paise are dropped: at 375px those two extra glyphs cost more
 * width than they tell you, and every line here is already an estimate.
 */
function Money({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("tabular-nums", className)}>
      <span className="lg:hidden">{formatCurrency(value, { compact: true })}</span>
      <span className="hidden lg:inline">{formatCurrency(value)}</span>
    </span>
  )
}

export default function DashboardCartPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const {
    cartItems,
    addToCart,
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

  const checkoutHref =
    appliedCode && discount > 0
      ? `/checkout?coupon=${encodeURIComponent(appliedCode)}&discountType=${discountType}&discountAmount=${discount}`
      : "/checkout"

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

  /**
   * Removal is silent at the context level and confirmed here instead, because
   * this page needs the toast to carry an Undo — a bare "Removed from cart"
   * only narrates what you just watched happen.
   */
  async function handleRemove(item: CartItem) {
    setRemovingId(item.id)
    try {
      await removeFromCart(item.id, { silent: true })
      toast.success(`${item.product.name} removed`, {
        action: {
          label: "Undo",
          onClick: async () => {
            const ok = await addToCart(item.productId, item.quantity, { silent: true })
            if (!ok) toast.error(`Could not put ${item.product.name} back`)
          },
        },
      })
    } catch {
      toast.error("Could not remove that item")
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
        <Card className="border-0 shadow-none sm:border sm:shadow-sm">
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
    <main className="flex flex-col gap-4 pb-checkout sm:gap-6 lg:pb-0">
      <CartHeader itemCount={itemCount} />

      {/* Summary stat strip */}
      <div className="hidden grid-cols-2 gap-3 md:grid lg:grid-cols-4">
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
        {/*
         * The card wrapper — its border, shadow, radius and header — costs a
         * band of vertical space and ~34px of row width at 375px, and gives
         * nothing back on a screen it already spans edge to edge. Below sm the
         * list is hairline-divided rows on the page itself; the card returns
         * at sm and up, where there is room around it.
         */}
        <div className="sm:rounded-xl sm:border sm:bg-card sm:shadow-sm">
          <CardHeader className="hidden gap-1 p-4 sm:flex sm:p-6">
            <CardTitle>Your items</CardTitle>
            <CardDescription className="hidden md:block">
              Review pieces in your cart before checkout. Stock is updated in real time.
            </CardDescription>
          </CardHeader>

          <ul className="-mx-4 divide-y border-y sm:mx-0 sm:border-x-0 sm:border-b-0">
            {cartItems.map((item) => (
              <CartRow
                key={item.id}
                item={item}
                updating={updatingId === item.id}
                removing={removingId === item.id}
                onQty={(next) => handleQty(item, next)}
                onRemove={() => handleRemove(item)}
              />
            ))}
          </ul>
        </div>

        {/* Order summary — desktop rail. Below lg this lives in the sticky
            checkout card instead, so it is never a scroll away. */}
        <div className="hidden flex-col gap-4 lg:sticky lg:top-6 lg:flex lg:self-start">
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

              {/*
               * `disabled` on <Button asChild> is forwarded onto the <a> by
               * Radix Slot, where it means nothing — the link stayed tappable
               * with a sold-out item in the cart. A blocked cart gets a real
               * disabled button instead.
               */}
              {hasOutOfStock ? (
                <Button size="lg" className="w-full gap-1.5" disabled>
                  Proceed to checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button asChild size="lg" className="w-full gap-1.5">
                  <Link href={checkoutHref}>
                    Proceed to checkout
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
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

      <MobileCheckoutCard
        subtotal={subtotal}
        discountAmount={discountAmount}
        appliedCode={appliedCode}
        taxes={taxes}
        total={total}
        itemCount={itemCount}
        blocked={hasOutOfStock}
        href={checkoutHref}
        promoCode={promoCode}
        setPromoCode={setPromoCode}
        applyingPromo={applyingPromo}
        promoError={promoError}
        setPromoError={setPromoError}
        onApplyPromo={handleApplyPromo}
        onRemovePromo={handleRemovePromo}
      />
    </main>
  )
}

/* -------------------------------------------------------------- */
/* ROW                                                             */
/* -------------------------------------------------------------- */

function CartRow({
  item,
  updating,
  removing,
  onQty,
  onRemove,
}: {
  item: CartItem
  updating: boolean
  removing: boolean
  onQty: (next: number) => void
  onRemove: () => void
}) {
  const stock = item.product.stockQuantity
  const hasStock = typeof stock === "number"
  const isOut = hasStock && (stock as number) <= 0
  const isLow = hasStock && (stock as number) > 0 && (stock as number) <= 5
  const max = hasStock && (stock as number) > 0 ? (stock as number) : undefined
  const lineTotal = item.quantity * item.product.price
  const imageUrl = Array.isArray(item.product.imageUrls) ? item.product.imageUrls[0] : undefined

  return (
    <li
      className={cn(
        "group/item flex gap-3.5 px-4 py-4 transition-[opacity,transform] duration-200 ease-out",
        "sm:gap-4 sm:p-4 lg:p-6 lg:hover:bg-muted/30",
        removing && "pointer-events-none scale-[0.99] opacity-50"
      )}
    >
      <Link
        href={`/products/${item.product.id}`}
        className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-[10px] border bg-muted/40 transition-shadow duration-200 hover:shadow-sm lg:h-28 lg:w-28 lg:rounded-md"
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={item.product.name}
            className={cn(
              "h-full w-full object-cover transition-transform duration-200 group-hover:scale-105",
              // A sold-out piece reads as unavailable before you get to the words.
              isOut && "grayscale lg:grayscale-0"
            )}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <PackageX className="h-6 w-6" />
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3.5 lg:gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col">
            <Link
              href={`/products/${item.product.id}`}
              className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:underline sm:text-base lg:leading-normal"
            >
              {item.product.name}
            </Link>

            {/*
             * Below lg stock only speaks when it is news. A badge reading
             * "In stock" on every row is chrome, not information — so the
             * healthy case says nothing at all.
             */}
            {(isOut || isLow) && (
              <p
                className={cn(
                  "mt-1 text-xs lg:hidden",
                  isOut ? "text-destructive" : "text-amber-600 dark:text-amber-500"
                )}
              >
                {isOut ? "Sold out" : `Only ${stock} left`}
              </p>
            )}

            <div className="mt-1 hidden flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground lg:flex">
              <span className="tabular-nums">{formatCurrency(item.product.price)}</span>
              <span className="text-border">•</span>
              <StockBadge isOut={isOut} stock={stock} />
            </div>
          </div>

          {/* The money column. The unit price is only worth printing when
              quantity makes it differ from the line total. */}
          <div className="shrink-0 text-right">
            <div
              className={cn(
                "text-sm font-semibold tabular-nums text-foreground sm:text-base",
                isOut && "font-medium text-muted-foreground"
              )}
            >
              <Money value={lineTotal} />
            </div>
            {item.quantity > 1 && (
              <div className="mt-0.5 text-[11px] text-muted-foreground lg:hidden">
                <Money value={item.product.price} /> each
              </div>
            )}
          </div>
        </div>

        {/* Controls — below lg */}
        <div className="flex items-center lg:hidden">
          {isOut ? (
            <Button
              type="button"
              size="lg"
              variant="secondary"
              className="rounded-full px-5"
              onClick={onRemove}
              disabled={removing}
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
            </Button>
          ) : (
            <QuantityStepper
              tone="soft"
              value={item.quantity}
              max={max}
              disabled={removing}
              updating={updating}
              onChange={onQty}
              onRemove={onRemove}
              removeLabel={`Remove ${item.product.name}`}
            />
          )}
        </div>

        {/* Controls — lg and up, unchanged */}
        <div className="hidden items-center justify-between gap-2 lg:flex">
          <QuantityStepper
            value={item.quantity}
            max={max}
            disabled={isOut || removing}
            updating={updating}
            onChange={onQty}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={removing}
            aria-label="Remove item"
            className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            {removing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Remove
          </Button>
        </div>
      </div>
    </li>
  )
}

/* -------------------------------------------------------------- */
/* MOBILE CHECKOUT CARD                                            */
/* -------------------------------------------------------------- */

/**
 * The summary and the promo field used to render below every line item, so on
 * a full cart both were a screen or more away. They live here instead, opening
 * upward over the list.
 *
 * It is pinned to --mobile-dock-total, not --mobile-tabbar-total: the dock is
 * a floating pill 70px off the bottom, not a 56px tab bar, and the old value
 * put this card's lower 14px behind it. It also borrows the dock's own
 * language — inset, rounded, blurred — so the two read as one stack rather
 * than a square bar wedged under a pill.
 */
function MobileCheckoutCard({
  subtotal,
  discountAmount,
  appliedCode,
  taxes,
  total,
  itemCount,
  blocked,
  href,
  promoCode,
  setPromoCode,
  applyingPromo,
  promoError,
  setPromoError,
  onApplyPromo,
  onRemovePromo,
}: {
  subtotal: number
  discountAmount: number
  appliedCode: string | null
  taxes: number
  total: number
  itemCount: number
  blocked: boolean
  href: string
  promoCode: string
  setPromoCode: (v: string) => void
  applyingPromo: boolean
  promoError: string | null
  setPromoError: (v: string | null) => void
  onApplyPromo: () => void
  onRemovePromo: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="fixed inset-x-0 z-30 lg:hidden"
      style={{ bottom: "var(--mobile-dock-total, 4.375rem)" }}
    >
      <div
        className={cn(
          "mx-3 mb-2.5 overflow-hidden rounded-[18px] border bg-background/95 shadow-lg",
          "backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/90"
        )}
      >
        <div id="cart-breakdown" hidden={!open} className="border-b">
          <dl className="flex flex-col gap-2 px-4 pb-1 pt-3 text-[13px]">
            <SummaryRow label="Subtotal" value={formatCurrency(subtotal, { compact: true })} />
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
                value={`−${formatCurrency(discountAmount, { compact: true })}`}
                valueClassName="text-emerald-600 dark:text-emerald-400"
              />
            )}
            <SummaryRow
              label="Shipping"
              value={<span className="text-muted-foreground">Calculated next</span>}
            />
            <SummaryRow
              label={`GST (${Math.round(TAX_RATE * 100)}%)`}
              value={formatCurrency(taxes, { compact: true })}
            />
          </dl>

          {appliedCode ? (
            <div className="mx-4 mb-3 mt-2 flex items-center justify-between gap-2 rounded-md border bg-secondary/40 px-3 py-2">
              <span className="truncate text-xs text-muted-foreground">
                Saving {formatCurrency(discountAmount, { compact: true })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onRemovePromo}
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
                onApplyPromo()
              }}
              className="flex items-center gap-2 px-4 pb-3 pt-2"
            >
              <Input
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase())
                  if (promoError) setPromoError(null)
                }}
                placeholder="Have a promo code?"
                aria-label="Promo code"
                className="rounded-[10px]"
              />
              <Button type="submit" variant="outline" disabled={!promoCode.trim() || applyingPromo}>
                {applyingPromo && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Apply
              </Button>
            </form>
          )}
          {promoError && <p className="px-4 pb-3 text-xs text-destructive">{promoError}</p>}
        </div>

        <div className="flex items-center gap-2.5 p-2.5 pl-4">
          {/* The whole total is the target, not just the label — a 43×17 chevron
              is not a thumb-sized control, and tapping the amount to see what
              makes it up is the obvious gesture anyway. */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="cart-breakdown"
            className="-my-1 flex min-w-0 flex-col items-start rounded py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
              {open ? "Hide breakdown" : "Total"}
              <ChevronUp
                className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")}
              />
            </span>
            <span
              aria-live="polite"
              className="text-[19px] font-semibold leading-tight tabular-nums tracking-tight text-foreground"
            >
              {formatCurrency(total, { compact: true })}
            </span>
          </button>

          {/* A real disabled button when the cart cannot check out. The sold-out
              row carries the reason and the one-tap fix, so this stays short. */}
          {blocked ? (
            <Button size="lg" disabled className="ml-auto min-w-[8.25rem] rounded-full">
              Checkout
            </Button>
          ) : (
            <Button asChild size="lg" className="ml-auto min-w-[8.25rem] gap-1.5 rounded-full">
              <Link href={href}>
                Checkout · {itemCount}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- */
/* PIECES                                                          */
/* -------------------------------------------------------------- */

function CartHeader({ itemCount, loading }: { itemCount: number; loading?: boolean }) {
  return (
    <header className="flex items-end justify-between gap-3">
      <div className="hidden min-w-0 flex-col gap-1 md:flex">
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

      {/*
       * Below md the title block was hidden and this row rendered a single
       * right-aligned outline button in empty space. The app bar already says
       * "Cart" and the sticky card owns the money, so one quiet line of state
       * is all this needs — and navigation belongs to the dock.
       */}
      <p className="text-sm text-muted-foreground md:hidden">
        {itemCount} item{itemCount === 1 ? "" : "s"}
      </p>

      <Button asChild variant="outline" size="sm" className="hidden shrink-0 gap-1.5 md:inline-flex">
        <Link href="/products" aria-label="Continue shopping">
          <ShoppingBag className="h-4 w-4" />
          Continue<span className="hidden sm:inline">&nbsp;shopping</span>
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
      <CardContent className="flex items-center gap-2.5 p-2.5 sm:gap-4 sm:p-4">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors duration-200 sm:h-10 sm:w-10",
            toneStyles
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-[11px] font-medium leading-tight text-muted-foreground sm:truncate sm:text-xs">
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

/**
 * `tone="soft"` is the below-lg treatment: borderless on a light fill, 44px
 * targets (the shared 44px rule in globals.css keys off [data-slot="button"],
 * which these raw buttons are not, so they carry their own size).
 *
 * With `onRemove`, a quantity of one turns the minus into the remove control.
 * A disabled minus is dead weight, and a separate trash on every row is a
 * second control doing a job the first one could — this is one per row.
 */
function QuantityStepper({
  value,
  max,
  disabled,
  updating,
  onChange,
  onRemove,
  removeLabel,
  tone = "outline",
}: {
  value: number
  max?: number
  disabled?: boolean
  updating?: boolean
  onChange: (next: number) => void
  onRemove?: () => void
  removeLabel?: string
  tone?: "outline" | "soft"
}) {
  const soft = tone === "soft"
  const atOne = !disabled && value <= 1 && !!onRemove
  const canDecrease = !disabled && value > 1
  const canIncrease = !disabled && (max === undefined || value < max)

  const buttonBase = soft
    ? "flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors duration-150 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:text-muted-foreground/40 disabled:hover:bg-transparent"
    : "flex h-full w-9 items-center justify-center text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground active:scale-95 focus-visible:bg-accent focus-visible:text-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"

  return (
    <div
      className={cn(
        soft
          ? "inline-flex h-11 items-center rounded-full bg-secondary"
          : "inline-flex h-9 items-center overflow-hidden rounded-md border bg-background shadow-xs",
        "transition-[opacity,box-shadow] duration-200",
        disabled && "opacity-50"
      )}
    >
      {atOne ? (
        <button
          type="button"
          aria-label={removeLabel ?? "Remove item"}
          onClick={onRemove}
          className={cn(buttonBase, "text-muted-foreground hover:bg-destructive/10 hover:text-destructive")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => canDecrease && onChange(value - 1)}
          disabled={!canDecrease}
          className={buttonBase}
        >
          <Minus className={soft ? "h-4 w-4" : "h-3.5 w-3.5"} />
        </button>
      )}

      <div
        className={cn(
          "flex h-full items-center justify-center font-medium tabular-nums",
          soft ? "min-w-[1.875rem] text-sm font-semibold" : "w-12 border-x text-sm"
        )}
        aria-live="polite"
      >
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
        className={buttonBase}
      >
        <Plus className={soft ? "h-4 w-4" : "h-3.5 w-3.5"} />
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
    <main className="flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <header className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <Skeleton className="hidden h-3 w-20 md:block" />
          <Skeleton className="h-4 w-16 md:h-8 md:w-40" />
          <Skeleton className="hidden h-4 w-72 md:block" />
        </div>
        <Skeleton className="hidden h-8 w-28 md:block" />
      </header>

      {/* Stat tiles */}
      <div className="hidden grid-cols-2 gap-3 md:grid lg:grid-cols-4">
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
        <div className="sm:rounded-xl sm:border sm:bg-card sm:shadow-sm">
          <CardHeader className="hidden gap-1 p-4 sm:flex sm:p-6">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <ul className="-mx-4 divide-y border-y sm:mx-0 sm:border-x-0 sm:border-b-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3.5 px-4 py-4 sm:p-4 lg:p-6">
                <Skeleton className="h-24 w-24 shrink-0 rounded-[10px] lg:h-28 lg:w-28" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="mt-2 h-11 w-32 rounded-full lg:h-9 lg:w-28 lg:rounded-md" />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden flex-col gap-4 lg:sticky lg:top-6 lg:flex lg:self-start">
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
