"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { LifeBuoy, PackagePlus, Star, Tag, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { orderStatusDot } from "../OrderStatusBadge"
import { HeroPanel, HeroPanelSkeleton, InkPlaceholder } from "./HeroPanel"
import { PipelineBar } from "./PipelineBar"
import { RevenueSparkline, type SparkPoint } from "./RevenueSparkline"
import {
  bucketRevenue,
  periodCaptions,
  periodChipLabels,
  periodLabels,
  type Period,
} from "./buckets"
import {
  capitalise,
  formatCompactCurrency,
  formatCount,
  formatCurrency,
  formatDelta,
  formatRelative,
} from "./format"
import {
  DockSpacer,
  Group,
  MetricRow,
  MetricRowSkeleton,
  MobileEmpty,
  MobileSection,
  MoreRow,
  QueueRow,
  QueueRowSkeleton,
  type QueueSeverity,
} from "./primitives"
import type { AdminMetrics, OverviewOrder } from "./types"

const SHORTCUTS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard/admin/products/new", label: "New product", icon: PackagePlus },
  { href: "/dashboard/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/dashboard/admin/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/admin/support", label: "Support", icon: LifeBuoy },
]

export function AdminMobile({
  period,
  onPeriodChange,
  metrics,
  metricsLoading,
  orders,
  ordersLoading,
}: {
  period: Period
  onPeriodChange: (period: Period) => void
  metrics: AdminMetrics | null
  metricsLoading: boolean
  orders: OverviewOrder[]
  ordersLoading: boolean
}) {
  // The point under the finger while the sparkline is being dragged. It replaces
  // the headline and caption, because a phone has no hover to hang a tooltip on.
  const [scrubbed, setScrubbed] = useState<SparkPoint | null>(null)

  const series = useMemo(() => bucketRevenue(orders, period), [orders, period])

  const revenue = metrics?.revenue ?? 0
  const orderCount = metrics?.totalOrders ?? 0
  const averageOrder = orderCount > 0 ? revenue / orderCount : 0

  return (
    <div className="flex flex-col gap-[26px]">
      <header className="flex flex-col gap-0.5 px-1 pt-0.5">
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.038em] text-foreground">
          Overview
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Your store · {periodLabels[period].toLowerCase()}
        </p>
      </header>

      <PeriodChips period={period} onChange={onPeriodChange} />

      {metricsLoading ? (
        <HeroPanelSkeleton />
      ) : (
        <HeroPanel
          label="Revenue"
          value={formatCompactCurrency(scrubbed ? scrubbed.value : revenue)}
          delta={metrics?.deltas?.revenue}
          captionEmphasis={scrubbed !== null}
          caption={
            scrubbed
              ? `${scrubbed.label} · ${formatCurrency(scrubbed.value)}`
              : `${periodCaptions[period]} · ${formatCurrency(revenue)}`
          }
          bleed={
            ordersLoading ? (
              <InkPlaceholder className="h-[108px] w-full rounded-none bg-background/10" />
            ) : (
              <RevenueSparkline data={series} onScrub={setScrubbed} />
            )
          }
          footer={[
            { key: "orders", label: "Orders", value: formatCount(orderCount) },
            { key: "avg", label: "Avg order", value: formatCurrency(averageOrder) },
            { key: "units", label: "Units", value: formatCount(metrics?.units ?? 0) },
          ]}
        />
      )}

      <NeedsYou metrics={metrics} loading={metricsLoading} />

      <MetricLedger
        metrics={metrics}
        loading={metricsLoading}
        period={period}
        averageOrder={averageOrder}
      />

      <MobileSection
        title="Order pipeline"
        tail={metricsLoading ? undefined : `${formatCount(orderCount)} orders`}
      >
        <Group>
          {metricsLoading ? (
            <div className="px-3.5 pb-3.5 pt-[15px]">
              <Skeleton className="h-2.5 w-full rounded-full" />
              <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <PipelineBar statusCounts={metrics?.statusCounts ?? []} />
          )}
        </Group>
      </MobileSection>

      <MobileSection title="Recent orders">
        <Group>
          {ordersLoading ? (
            Array.from({ length: 3 }).map((_, i) => <OrderRowSkeleton key={i} />)
          ) : orders.length === 0 ? (
            <MobileEmpty>No orders yet. They will appear here as customers buy.</MobileEmpty>
          ) : (
            orders.slice(0, 3).map((order) => <OrderRow key={order.id} order={order} />)
          )}
          <MoreRow href="/dashboard/admin/orders">All orders</MoreRow>
        </Group>
      </MobileSection>

      <MobileSection title="Shortcuts">
        <div className="grid grid-cols-4 gap-2">
          {SHORTCUTS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-2xl bg-muted px-1 py-2.5 text-center transition-colors active:bg-secondary"
            >
              <Icon className="size-[19px] text-foreground" />
              <span className="text-[10.5px] font-semibold leading-tight tracking-tight text-foreground">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </MobileSection>

      <DockSpacer />
    </div>
  )
}

/* ------------------------------------------------------------ period rail */

/**
 * Five chips in a scroll rail, replacing the desktop `Select`. It is the most
 * used control on the screen: a select costs a tap, a sheet and a second tap,
 * and never shows the active window at rest.
 */
function PeriodChips({
  period,
  onChange,
}: {
  period: Period
  onChange: (period: Period) => void
}) {
  return (
    <div
      role="group"
      aria-label="Reporting period"
      className="kk-no-scrollbar -mx-4 -my-1 flex gap-1.5 overflow-x-auto px-4 py-1"
    >
      {(Object.keys(periodChipLabels) as Period[]).map((key) => {
        const active = key === period
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={active}
            className={cn(
              "h-9 shrink-0 whitespace-nowrap rounded-[10px] px-3.5 text-[12.5px] font-semibold tracking-tight transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground active:bg-secondary"
            )}
          >
            {periodChipLabels[key]}
          </button>
        )
      })}
    </div>
  )
}

/* --------------------------------------------------------------- needs you */

/**
 * The reason to open the dashboard on a phone. An admin here is rarely
 * browsing — they are checking whether anything is on fire — so the four alert
 * sources are merged into one ranked list with the count set large enough to
 * read before the label does.
 */
function NeedsYou({
  metrics,
  loading,
}: {
  metrics: AdminMetrics | null
  loading: boolean
}) {
  const attention = metrics?.attention

  const rows: {
    key: string
    href: string
    title: string
    detail: string
    count: number
    severity: QueueSeverity
  }[] = [
    {
      key: "orders",
      href: "/dashboard/admin/orders",
      title: "Orders awaiting acceptance",
      detail: "Still pending a decision",
      count: attention?.pendingOrders ?? 0,
      severity: "critical",
    },
    {
      key: "stock",
      href: "/dashboard/admin/products/low-stock",
      title: "Products low on stock",
      detail: "At or under 5 units",
      count: attention?.lowStock ?? 0,
      severity: "warning",
    },
    {
      key: "tickets",
      href: "/dashboard/admin/support",
      title: "Open support tickets",
      detail: "Waiting on a reply",
      count: attention?.openTickets ?? 0,
      severity: "warning",
    },
    {
      key: "reviews",
      href: "/dashboard/admin/reviews",
      title: "Reviews awaiting a reply",
      detail: "No response posted yet",
      count: attention?.unansweredReviews ?? 0,
      severity: "calm",
    },
  ]

  const open = rows.filter((row) => row.count > 0)
  const total = open.reduce((sum, row) => sum + row.count, 0)

  return (
    <MobileSection title="Needs you" tail={loading ? undefined : `${total} open`}>
      <Group>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <QueueRowSkeleton key={i} />)
        ) : open.length === 0 ? (
          <MobileEmpty>Nothing needs you right now.</MobileEmpty>
        ) : (
          open.map((row) => (
            <QueueRow
              key={row.key}
              href={row.href}
              title={row.title}
              detail={row.detail}
              count={row.count}
              severity={row.severity}
            />
          ))
        )}
      </Group>
    </MobileSection>
  )
}

/* ----------------------------------------------------------- metric ledger */

/**
 * Thirteen figures in three tabs. A row costs 48 px against a stat tile's 78 px,
 * which is the whole reason the full set fits in less space than four tiles did.
 */
function MetricLedger({
  metrics,
  loading,
  period,
  averageOrder,
}: {
  metrics: AdminMetrics | null
  loading: boolean
  period: Period
  averageOrder: number
}) {
  const previous = metrics?.previous
  const previousAverage =
    previous && previous.orders > 0 ? previous.revenue / previous.orders : null
  const averageDelta =
    previousAverage && previousAverage > 0
      ? Math.round(((averageOrder - previousAverage) / previousAverage) * 100)
      : null

  const orderCount = metrics?.totalOrders ?? 0
  const itemsPerOrder = orderCount > 0 ? (metrics?.units ?? 0) / orderCount : 0
  const catalogue = metrics?.catalogue
  const cancelled = metrics?.cancelledCount ?? 0

  return (
    <MobileSection title="Metrics" tail={periodLabels[period]}>
      <Tabs defaultValue="sales" className="gap-2.5">
        <TabsList className="h-[36px] w-full">
          <TabsTrigger value="sales" className="text-[12.5px]">
            Sales
          </TabsTrigger>
          <TabsTrigger value="customers" className="text-[12.5px]">
            Customers
          </TabsTrigger>
          <TabsTrigger value="catalogue" className="text-[12.5px]">
            Catalogue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Group>
            {loading ? (
              <LedgerSkeleton rows={5} />
            ) : (
              <>
                <MetricRow
                  label="Orders"
                  value={formatCount(orderCount)}
                  meta={formatDelta(metrics?.deltas?.orders)}
                />
                <MetricRow
                  label="Average order"
                  value={formatCurrency(averageOrder)}
                  meta={formatDelta(averageDelta)}
                />
                <MetricRow
                  label="Units sold"
                  value={formatCount(metrics?.units ?? 0)}
                  meta={formatDelta(metrics?.deltas?.units)}
                />
                <MetricRow
                  label="Discounts given"
                  value={formatCurrency(metrics?.discounts ?? 0)}
                  meta={formatDelta(metrics?.deltas?.discounts)}
                />
                <MetricRow
                  label="Cancelled"
                  value={formatCount(cancelled)}
                  meta={
                    cancelled > 0
                      ? formatCompactCurrency(metrics?.cancelledValue ?? 0)
                      : undefined
                  }
                />
              </>
            )}
          </Group>
        </TabsContent>

        <TabsContent value="customers">
          <Group>
            {loading ? (
              <LedgerSkeleton rows={4} />
            ) : (
              <>
                <MetricRow
                  label="New customers"
                  value={formatCount(metrics?.newCustomers ?? 0)}
                  meta={formatDelta(metrics?.deltas?.newCustomers)}
                />
                <MetricRow
                  label="Returning buyers"
                  value={
                    metrics?.returningCustomers === null ||
                    metrics?.returningCustomers === undefined
                      ? "—"
                      : formatCount(metrics.returningCustomers)
                  }
                  meta={`of ${formatCount(metrics?.buyers ?? 0)}`}
                />
                <MetricRow
                  label="Items per order"
                  value={orderCount > 0 ? itemsPerOrder.toFixed(1) : "—"}
                />
                <MetricRow
                  label="Abandoned carts"
                  value={formatCount(metrics?.abandonedCarts ?? 0)}
                  meta="right now"
                />
              </>
            )}
          </Group>
        </TabsContent>

        <TabsContent value="catalogue">
          <Group>
            {loading ? (
              <LedgerSkeleton rows={4} />
            ) : (
              <>
                <MetricRow label="Products live" value={formatCount(catalogue?.live ?? 0)} />
                <MetricRow
                  label="Low on stock"
                  value={formatCount(catalogue?.lowStock ?? 0)}
                  tone={(catalogue?.lowStock ?? 0) > 0 ? "bad" : "neutral"}
                />
                <MetricRow
                  label="Out of stock"
                  value={formatCount(catalogue?.outOfStock ?? 0)}
                  tone={(catalogue?.outOfStock ?? 0) > 0 ? "bad" : "neutral"}
                />
                <MetricRow
                  label="Average rating"
                  value={
                    catalogue?.averageRating ? catalogue.averageRating.toFixed(1) : "—"
                  }
                />
              </>
            )}
          </Group>
        </TabsContent>
      </Tabs>
    </MobileSection>
  )
}

function LedgerSkeleton({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <MetricRowSkeleton key={i} />
      ))}
    </>
  )
}

/* ------------------------------------------------------------- order rows */

function OrderRow({ order }: { order: OverviewOrder }) {
  return (
    <Link
      href={`/dashboard/orders/${order.id}`}
      className="flex min-h-[60px] items-center gap-3 px-3.5 py-2.5 transition-colors active:bg-secondary"
    >
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
            {capitalise(order.status)} · {order.user?.fullName ?? "Customer"} ·{" "}
            {formatRelative(order.createdAt)}
          </span>
        </span>
      </span>
      <span className="shrink-0 text-[14.5px] font-semibold tabular-nums tracking-tight text-foreground">
        {formatCurrency(order.discountedTotal ?? order.totalAmount)}
      </span>
    </Link>
  )
}

function OrderRowSkeleton() {
  return (
    <div className="flex min-h-[60px] items-center gap-3 px-3.5 py-2.5">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-2.5 w-40" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  )
}
