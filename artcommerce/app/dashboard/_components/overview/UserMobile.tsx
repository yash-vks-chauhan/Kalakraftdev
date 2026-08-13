"use client"

import Link from "next/link"
import { useMemo } from "react"
import { PackageX, ShoppingCart } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { orderStatusDot } from "../OrderStatusBadge"
import { HeroPanel, HeroPanelSkeleton } from "./HeroPanel"
import {
  capitalise,
  formatCompactCurrency,
  formatCount,
  formatCurrency,
  formatShortDate,
} from "./format"
import {
  DockSpacer,
  Group,
  MetricRow,
  MetricRowSkeleton,
  MobileEmpty,
  MobileSection,
  MoreRow,
} from "./primitives"
import { isActiveOrder, type OverviewOrder } from "./types"

/** The stages an order moves through, in the order the stepper draws them. */
const STAGES = [
  { key: "pending", label: "Placed" },
  { key: "accepted", label: "Accepted" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
]

interface CartLine {
  id: number
  quantity: number
  product: { id: number; name: string; price: number; imageUrls: string[] }
}

interface WishlistLine {
  id: number
  product: { id: number; name: string; price: number; imageUrls: string[] }
}

export function UserMobile({
  firstName,
  orders,
  ordersLoading,
  cartItems,
  cartLoading,
  wishlistItems,
  wishlistLoading,
}: {
  firstName: string
  orders: OverviewOrder[]
  ordersLoading: boolean
  cartItems: CartLine[]
  cartLoading: boolean
  wishlistItems: WishlistLine[]
  wishlistLoading: boolean
}) {
  const stats = useMemo(() => {
    const lifetime = orders.reduce(
      (sum, order) => sum + (order.discountedTotal ?? order.totalAmount),
      0
    )
    return {
      count: orders.length,
      lifetime,
      active: orders.filter(isActiveOrder).length,
      average: orders.length > 0 ? lifetime / orders.length : 0,
    }
  }, [orders])

  // The live order is what nine visits in ten are actually here for; the most
  // recent one stands in when nothing is moving, so the fold is never empty.
  const featured = useMemo(
    () => orders.find(isActiveOrder) ?? orders[0] ?? null,
    [orders]
  )

  const cartCount = cartItems.reduce((sum, line) => sum + line.quantity, 0)
  const cartSubtotal = cartItems.reduce(
    (sum, line) => sum + line.quantity * line.product.price,
    0
  )

  return (
    <div className="flex flex-col gap-[26px]">
      <header className="flex flex-col gap-0.5 px-1 pt-0.5">
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.038em] text-foreground">
          Overview
        </h1>
        <p className="text-[13px] text-muted-foreground">
          {firstName}
          {ordersLoading
            ? ""
            : ` · ${stats.count === 0 ? "no orders yet" : `${formatCount(stats.count)} order${stats.count === 1 ? "" : "s"}`}`}
        </p>
      </header>

      {ordersLoading ? (
        <HeroPanelSkeleton />
      ) : featured ? (
        <OrderHero order={featured} />
      ) : (
        <HeroPanel
          label="Welcome"
          value="No orders yet"
          valueClassName="text-[26px] tracking-[-0.03em]"
          caption="Everything you buy will show up here."
          footer={[
            { key: "saved", label: "Saved", value: formatCount(wishlistItems.length) },
            { key: "cart", label: "In cart", value: formatCount(cartCount) },
            { key: "spend", label: "Spent", value: formatCompactCurrency(0) },
          ]}
        />
      )}

      <MobileSection title="Your account">
        <Group>
          {ordersLoading ? (
            Array.from({ length: 4 }).map((_, i) => <MetricRowSkeleton key={i} />)
          ) : (
            <>
              <MetricRow label="Orders placed" value={formatCount(stats.count)} />
              <MetricRow
                label="In progress"
                value={formatCount(stats.active)}
                meta={stats.active > 0 ? "on the way" : undefined}
              />
              <MetricRow
                label="Lifetime spend"
                value={formatCurrency(stats.lifetime)}
                meta={stats.count > 0 ? `${formatCurrency(stats.average)} avg` : undefined}
              />
              <MetricRow
                label="Saved for later"
                value={wishlistLoading ? "—" : formatCount(wishlistItems.length)}
              />
            </>
          )}
        </Group>
      </MobileSection>

      {!cartLoading && cartCount > 0 ? (
        <MobileSection title="Still in your cart">
          <Group>
            <div className="flex flex-col gap-3.5 p-3.5">
              <div className="flex items-center gap-3">
                <span className="flex">
                  {cartItems.slice(0, 3).map((line, index) => (
                    <Thumb
                      key={line.id}
                      src={line.product.imageUrls?.[0]}
                      alt={line.product.name}
                      className={cn(index > 0 && "-ml-3 ring-[2.5px] ring-muted")}
                    />
                  ))}
                </span>
                <span className="flex min-w-0 flex-col gap-px">
                  <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                    {formatCount(cartCount)} item{cartCount === 1 ? "" : "s"} ·{" "}
                    {formatCurrency(cartSubtotal)}
                  </span>
                  <span className="truncate text-[11.5px] text-muted-foreground">
                    Ready whenever you are
                  </span>
                </span>
              </div>
              <Button asChild className="h-[46px] rounded-xl text-[14.5px] font-semibold">
                <Link href="/checkout">
                  <ShoppingCart className="size-[17px]" />
                  Checkout
                </Link>
              </Button>
            </div>
          </Group>
        </MobileSection>
      ) : null}

      <MobileSection title="Past orders">
        <Group>
          {ordersLoading ? (
            Array.from({ length: 2 }).map((_, i) => <PastOrderSkeleton key={i} />)
          ) : orders.length === 0 ? (
            <MobileEmpty>Nothing here yet — your first order will appear on this list.</MobileEmpty>
          ) : (
            orders.slice(0, 3).map((order) => <PastOrderRow key={order.id} order={order} />)
          )}
          <MoreRow href="/dashboard/orders">All orders</MoreRow>
        </Group>
      </MobileSection>

      {!wishlistLoading && wishlistItems.length > 0 ? (
        <MobileSection
          title="Saved for later"
          tail={`${formatCount(wishlistItems.length)} piece${wishlistItems.length === 1 ? "" : "s"}`}
        >
          {/* A swipe reads better than four 70 px thumbnails squeezed across the
              gutter, and it leaves the price legible. */}
          <div className="kk-no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1.5">
            {wishlistItems.slice(0, 8).map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.product.id}`}
                className="flex w-[104px] shrink-0 flex-col gap-1.5"
              >
                <span className="block aspect-square w-full overflow-hidden rounded-[14px] bg-muted">
                  {item.product.imageUrls?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.product.imageUrls[0]}
                      alt={item.product.name}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-muted-foreground">
                      <PackageX className="size-4" />
                    </span>
                  )}
                </span>
                {/* Two lines reserved, so prices align across the rail whether
                    the name wraps or not. */}
                <span className="line-clamp-2 min-h-[30px] text-[11.5px] font-semibold leading-[1.3] tracking-tight text-foreground">
                  {item.product.name}
                </span>
                <span className="text-[11.5px] tabular-nums text-muted-foreground">
                  {formatCurrency(item.product.price)}
                </span>
              </Link>
            ))}
          </div>
        </MobileSection>
      ) : null}

      <DockSpacer />
    </div>
  )
}

/* --------------------------------------------------------------- the hero */

function OrderHero({ order }: { order: OverviewOrder }) {
  const status = order.status.toLowerCase()
  const cancelled = status === "cancelled" || status === "rejected"
  const stageIndex = STAGES.findIndex((stage) => stage.key === status)
  const itemCount = order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  return (
    <HeroPanel
      label={isActiveOrder(order) ? "In progress" : "Latest order"}
      value={capitalise(order.status)}
      valueClassName="text-[26px] tracking-[-0.035em]"
      caption={`#${order.orderNumber} · placed ${formatShortDate(order.createdAt)}`}
      bleed={cancelled ? undefined : <Stepper activeIndex={stageIndex} />}
      footer={[
        { key: "items", label: "Items", value: formatCount(itemCount) },
        {
          key: "total",
          label: "Total",
          value: formatCurrency(order.discountedTotal ?? order.totalAmount),
        },
        { key: "placed", label: "Placed", value: formatShortDate(order.createdAt) },
      ]}
    />
  )
}

/** Four beads and three links; everything up to and including the current stage is lit. */
function Stepper({ activeIndex }: { activeIndex: number }) {
  // An unrecognised status lights only the first bead rather than none, since
  // every order has at least been placed.
  const reached = activeIndex < 0 ? 0 : activeIndex

  return (
    <div className="flex items-start px-[18px] pb-1 pt-2">
      {STAGES.map((stage, index) => {
        const done = index <= reached
        const linkDone = index < reached
        return (
          <div key={stage.key} className="contents">
            <div className="flex w-[26px] shrink-0 flex-col items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "size-[11px] rounded-full",
                  done ? "bg-background" : "bg-background/25",
                  index === reached && "ring-4 ring-background/15"
                )}
              />
              <span
                className={cn(
                  "whitespace-nowrap text-[9.5px]",
                  done ? "font-semibold text-background/90" : "text-background/45"
                )}
              >
                {stage.label}
              </span>
            </div>
            {index < STAGES.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "mx-1 mt-[4.5px] h-0.5 flex-1 rounded-full",
                  linkDone ? "bg-background" : "bg-background/25"
                )}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

/* ---------------------------------------------------------------- helpers */

function Thumb({
  src,
  alt,
  className,
}: {
  src?: string
  alt: string
  className?: string
}) {
  return (
    <span
      className={cn(
        // Background, not muted: these sit inside a muted group and would
        // otherwise vanish into it whenever a product has no image.
        "block size-10 shrink-0 overflow-hidden rounded-[11px] bg-background",
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-muted-foreground">
          <PackageX className="size-4" />
        </span>
      )}
    </span>
  )
}

function PastOrderRow({ order }: { order: OverviewOrder }) {
  const itemCount = order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  const thumb = order.orderItems?.[0]?.product?.imageUrls?.[0]

  return (
    <Link
      href={`/dashboard/orders/${order.id}`}
      className="flex min-h-[60px] items-center gap-3 px-3.5 py-2.5 transition-colors active:bg-secondary"
    >
      <Thumb src={thumb} alt={order.orderItems?.[0]?.product?.name ?? "Order"} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[13.5px] font-semibold tracking-tight text-foreground">
          #{order.orderNumber}
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-muted-foreground">
          <span
            aria-hidden
            className={cn("size-1.5 shrink-0 rounded-full", orderStatusDot(order.status))}
          />
          <span className="truncate">
            {capitalise(order.status)} · {formatCount(itemCount)} item
            {itemCount === 1 ? "" : "s"} · {formatShortDate(order.createdAt)}
          </span>
        </span>
      </span>
      <span className="shrink-0 text-[14.5px] font-semibold tabular-nums tracking-tight text-foreground">
        {formatCurrency(order.discountedTotal ?? order.totalAmount)}
      </span>
    </Link>
  )
}

function PastOrderSkeleton() {
  return (
    <div className="flex min-h-[60px] items-center gap-3 px-3.5 py-2.5">
      <Skeleton className="size-10 rounded-[11px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-2.5 w-36" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  )
}
