"use client"

import Link from "next/link"
import { ChevronRight, MoveDownRight, MoveUpRight, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * The vocabulary the mobile Overview is built from.
 *
 * The governing rule: no outlined cards. Every list is one filled surface with
 * hairline rules inside it, because a column of eight bordered rectangles is
 * what made the previous screen read as noise rather than as one instrument.
 */

/* ---------------------------------------------------------------- section */

export function MobileSection({
  title,
  tail,
  children,
  className,
}: {
  title: string
  tail?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex items-baseline gap-2 px-1">
        <h2 className="text-[12px] font-semibold tracking-[0.01em] text-muted-foreground">
          {title}
        </h2>
        {tail ? (
          <span className="ml-auto text-xs font-semibold tabular-nums text-muted-foreground">
            {tail}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/* ------------------------------------------------------------------ group */

/** One filled surface; children are separated by hairlines, never boxed. */
export function Group({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "divide-y divide-border/60 overflow-hidden rounded-2xl bg-muted",
        className
      )}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------- metric row */

/**
 * Icon, label, value, change. 48 px against a stat tile's 78 px, which is the
 * whole reason fifteen numbers fit where four used to.
 *
 * `tone="bad"` is the only colour this row can take, and it is reserved for a
 * state that needs acting on — stock you cannot sell. It deliberately does not
 * mark merely unwelcome numbers like cancellations, which are always non-zero
 * and would leave the ledger permanently red. Colour marks the exception.
 */
export function MetricRow({
  icon: Icon,
  label,
  value,
  meta,
  trend,
  tone = "neutral",
}: {
  /** A quiet leading marker, so a row can be found by shape instead of read. */
  icon?: LucideIcon
  label: string
  value: string
  /** Static context — "of 63 buyers". Mutually exclusive with `trend`. */
  meta?: string
  /**
   * Percent change against the previous window, drawn with a direction arrow.
   * `null` renders "—" (no comparable window); omit the prop entirely for a
   * figure that has no meaningful previous value at all.
   */
  trend?: number | null
  tone?: "neutral" | "bad"
}) {
  return (
    <div className="flex min-h-12 items-center gap-3 px-3.5 py-2.5">
      {Icon ? (
        <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground/60" />
      ) : null}
      <span className="min-w-0 truncate text-[13.5px] leading-tight text-muted-foreground">
        {label}
      </span>
      <span className="ml-auto flex items-baseline gap-2.5">
        <span
          className={cn(
            "text-[15.5px] font-semibold tabular-nums tracking-tight",
            tone === "bad" ? "text-destructive" : "text-foreground"
          )}
        >
          {value}
        </span>
        {/* Always rendered, even when empty: the column is what keeps every
            value in the group aligned on the same right edge. */}
        <span
          className={cn(
            "flex min-w-[52px] items-center justify-end gap-0.5 whitespace-nowrap text-[11.5px] font-semibold tabular-nums",
            tone === "bad" ? "text-destructive" : "text-muted-foreground/80"
          )}
        >
          {trend !== undefined ? <TrendMeta percent={trend} /> : meta}
        </span>
      </span>
    </div>
  )
}

/**
 * Direction is carried by an arrow, not by colour: a rise is not always good
 * (discounts, cancellations), so tinting every increase green would assert
 * something the number does not support.
 */
function TrendMeta({ percent }: { percent: number | null }) {
  if (percent === null || percent === undefined) return <>—</>
  if (percent === 0) return <>0%</>

  const Arrow = percent > 0 ? MoveUpRight : MoveDownRight
  return (
    <>
      <Arrow aria-hidden className="size-3 shrink-0" />
      {Math.abs(percent)}%
    </>
  )
}

export function MetricRowSkeleton() {
  return (
    <div className="flex min-h-12 items-center gap-3 px-3.5 py-2.5">
      <Skeleton className="size-4 shrink-0 rounded" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="ml-auto h-4 w-16" />
    </div>
  )
}

/* ------------------------------------------------------------- queue row */

export type QueueSeverity = "critical" | "warning" | "calm"

const SEVERITY_DOT: Record<QueueSeverity, string> = {
  critical: "bg-destructive",
  warning: "bg-amber-500",
  calm: "bg-muted-foreground/50",
}

/**
 * Severity is a 7 px dot, not a stripe and not a filled badge. On a screen this
 * small a coloured block shouts; a dot is enough to rank four rows.
 */
export function QueueRow({
  href,
  title,
  detail,
  count,
  severity,
}: {
  href: string
  title: string
  detail: string
  count: number
  severity: QueueSeverity
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[58px] items-center gap-3 px-3.5 py-2.5 transition-colors active:bg-secondary"
    >
      <span
        aria-hidden
        className={cn("size-[7px] shrink-0 rounded-full", SEVERITY_DOT[severity])}
      />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </span>
        <span className="truncate text-[11.5px] text-muted-foreground">{detail}</span>
      </span>
      <span className="ml-auto text-[17px] font-semibold tabular-nums tracking-tight text-foreground">
        {count}
      </span>
      <ChevronRight className="size-[15px] shrink-0 text-muted-foreground" />
    </Link>
  )
}

export function QueueRowSkeleton() {
  return (
    <div className="flex min-h-[58px] items-center gap-3 px-3.5 py-2.5">
      <Skeleton className="size-[7px] rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-2.5 w-28" />
      </div>
      <Skeleton className="h-5 w-6" />
    </div>
  )
}

/* -------------------------------------------------------------- more row */

/** Closes a list from inside it, so the thumb never reaches up to a header link. */
export function MoreRow({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center justify-center gap-1 text-[13px] font-semibold tracking-tight text-foreground transition-colors active:bg-secondary"
    >
      {children}
      <ChevronRight className="size-3.5" />
    </Link>
  )
}

/* ------------------------------------------------------------ empty state */

export function MobileEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3.5 py-6 text-center text-[13px] text-muted-foreground">
      {children}
    </div>
  )
}

/* --------------------------------------------------------------- spacing */

/**
 * The layout's `pb-tabbar` reserves exactly the dock's own height, which leaves
 * the last row touching it. This adds the breathing room on top.
 */
export function DockSpacer() {
  return <div aria-hidden className="h-6" />
}
