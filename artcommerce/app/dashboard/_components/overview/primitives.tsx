"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

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
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
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
 * Label, value, change. 48 px against a stat tile's 78 px, which is the whole
 * reason seventeen numbers fit where four used to.
 *
 * `tone="bad"` is the only colour this row can take, and it is reserved for a
 * state that needs acting on — stock you cannot sell. It deliberately does not
 * mark merely unwelcome numbers like cancellations, which are always non-zero
 * and would leave the ledger permanently red. Colour marks the exception.
 */
export function MetricRow({
  label,
  value,
  meta,
  tone = "neutral",
}: {
  label: string
  value: string
  meta?: string
  tone?: "neutral" | "bad"
}) {
  return (
    <div className="flex min-h-12 items-center gap-3 px-3.5 py-2.5">
      <span className="text-[13.5px] leading-tight text-muted-foreground">{label}</span>
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
            "min-w-[46px] whitespace-nowrap text-right text-[11.5px] font-semibold tabular-nums",
            tone === "bad" ? "text-destructive" : "text-muted-foreground/80"
          )}
        >
          {meta}
        </span>
      </span>
    </div>
  )
}

export function MetricRowSkeleton() {
  return (
    <div className="flex min-h-12 items-center gap-3 px-3.5 py-2.5">
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
