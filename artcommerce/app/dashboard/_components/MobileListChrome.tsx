"use client"

import type { ReactNode } from "react"
import { ArrowDown, ArrowUp, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * The chrome every admin list on a phone wears.
 *
 * The catalogue worked out this arrangement first — a search row, the stat
 * cards spent as a facet strip, and a column header that is also the sort
 * control — and Users, Reviews and Coupons were each about to reinvent it.
 * They share it instead, so the four screens read as one console rather than
 * four takes on the same idea.
 *
 * Three rules hold the whole thing together:
 *
 *   · A count and the route to what it counts are the same control. That is
 *     what makes the facet strip a replacement for a row of stat cards and
 *     not an addition to it.
 *   · Every figure lives in one right-aligned tabular column, under a header
 *     that names it, and that header is how you change what is in it.
 *   · Chrome is flat — hairlines, a wash, no cards and no elevation. The only
 *     raised surface on these screens is a sheet.
 *
 * Labels are Sentence case throughout. They used to be 10px mono capitals at
 * 0.13em: below about 11px capitals have no ascenders or descenders, so every
 * word collapses to the same grey rectangle and has to be spelled out rather
 * than recognised.
 */

/* ------------------------------------------------------------------ shell */

export function MobileListScreen({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("flex flex-col", className)}>{children}</div>
}

/**
 * Sticky under the app bar, which is `sticky top-0` itself — hence the offset
 * by its height plus rule and notch. The column header belongs to this block
 * rather than to the list: left in the flow it scrolled away and took the sort
 * control with it, leaving a column of bare figures with nothing naming them.
 */
export function MobileListHead({
  children,
  pullUp = true,
}: {
  children: ReactNode
  /**
   * Cancels the dashboard layout's 20px top padding. True when this block
   * opens the screen; false when something sits above it — Reviews puts its
   * rating strip first, and the pull would drag the head over it.
   */
  pullUp?: boolean
}) {
  return (
    <div
      className={cn(
        "sticky z-20 -mx-4 border-b bg-background sm:-mx-6",
        pullUp && "-mt-5"
      )}
      style={{ top: "var(--mobile-header-total, 3.5rem)" }}
    >
      {children}
    </div>
  )
}

/** Full-bleed row container. Rows draw their own rules. */
export function MobileListRows({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("-mx-4 sm:-mx-6", className)}>{children}</div>
}

/* ----------------------------------------------------------------- search */

export function MobileSearchRow({
  value,
  onChange,
  placeholder,
  ariaLabel,
  children,
}: {
  value: string
  onChange: (next: string) => void
  placeholder: string
  ariaLabel?: string
  /** Trailing square buttons — filter, add. */
  children?: ReactNode
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 sm:px-6">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
          type="text"
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-9 text-[14.5px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-faint focus:border-foreground focus:shadow-[0_0_0_3px_hsl(var(--foreground)/0.07)]"
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-faint transition-colors active:bg-wash"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

/** The 40pt square beside the search field — filter, or add. */
export function MobileHeadButton({
  onClick,
  label,
  children,
  marked,
}: {
  onClick: () => void
  label: string
  children: ReactNode
  /** Draws the dot that says a filter is currently narrowing the list. */
  marked?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative flex size-10 shrink-0 items-center justify-center rounded-md border border-input text-foreground transition-colors active:bg-wash"
    >
      {children}
      {marked && (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 size-[7px] rounded-full border-[1.5px] border-background bg-foreground"
        />
      )}
    </button>
  )
}

/* ----------------------------------------------------------------- facets */

export interface MobileFacet<T extends string> {
  key: T
  label: string
  count: number
}

/** The stat cards, spent as filters. */
export function MobileFacetStrip<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
}: {
  items: readonly MobileFacet<T>[]
  value: T
  onChange: (key: T) => void
  ariaLabel: string
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="kk-no-scrollbar flex gap-5 overflow-x-auto px-4 sm:px-6"
    >
      {items.map((facet) => {
        const on = facet.key === value
        return (
          <button
            key={facet.key}
            type="button"
            onClick={() => onChange(facet.key)}
            aria-pressed={on}
            className={cn(
              "relative flex shrink-0 items-baseline gap-1.5 whitespace-nowrap pb-2.5 pt-0.5",
              "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-t-full after:bg-foreground after:transition-opacity",
              on ? "after:opacity-100" : "after:opacity-0"
            )}
          >
            <span
              className={cn(
                "font-mono text-[11px] tracking-[0.01em]",
                on ? "text-foreground" : "text-faint"
              )}
            >
              {facet.label}
            </span>
            <span
              className={cn(
                "text-[13px] tabular-nums",
                on
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground"
              )}
            >
              {facet.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ---------------------------------------------------------- column header */

export function MobileColumnHead({
  label,
  sortLabel,
  sortDir,
  onSort,
  trailing,
}: {
  /** Names the left-hand column — "Customer", "Code", "Review". */
  label: string
  /** Names the right-hand figure column, and opens the sort sheet. */
  sortLabel?: string
  sortDir?: "asc" | "desc"
  onSort?: () => void
  /** A third control on the right — usually "Select" / "Done". */
  trailing?: ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 border-t bg-wash px-4 py-2 sm:px-6">
      <span className="min-w-0 flex-1 font-mono text-[10.5px] tracking-[0.01em] text-faint">
        {label}
      </span>
      {sortLabel && (
        <button
          type="button"
          onClick={onSort}
          className="inline-flex items-center gap-1 font-mono text-[10.5px] tracking-[0.01em] text-foreground"
        >
          {sortLabel}
          {sortDir === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )}
        </button>
      )}
      {trailing}
    </div>
  )
}

/** "Select" / "Done" — the third slot in the column header. */
export function MobileColumnAction({
  onClick,
  active,
  children,
}: {
  onClick: () => void
  active?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-l border-input pl-2.5 font-mono text-[10.5px] tracking-[0.01em] transition-colors",
        active ? "text-foreground" : "text-faint"
      )}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------- rows */

/**
 * One row of a list. The rule that separates rows is drawn by the row itself
 * so it can be indented past the leading media, the way a native list does —
 * and, on Coupons, so it can double as a progress meter.
 */
export function MobileRowRule({
  inset = 0,
  className,
  children,
}: {
  /** Where the rule starts, in px from the left edge. */
  inset?: number
  className?: string
  children?: ReactNode
}) {
  return (
    <span
      aria-hidden
      className={cn("absolute bottom-0 right-0 h-px bg-hairline", className)}
      style={{ left: inset }}
    >
      {children}
    </span>
  )
}

/* ---------------------------------------------------------- empty + bulk */

export function MobileListEmpty({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
}: {
  eyebrow: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className="font-mono text-[11px] tracking-[0.01em] text-faint">
        {eyebrow}
      </span>
      <p className="text-[15px] font-semibold text-foreground">{title}</p>
      <p className="max-w-[30ch] text-[13px] text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-1.5 h-9 rounded-md border border-input px-3.5 text-[13px] font-medium transition-colors active:bg-wash"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

/**
 * Always mounted so it can slide both ways; unmounting would give it an
 * entrance and no exit.
 */
export function MobileBulkBar({
  visible,
  label,
  children,
}: {
  visible: boolean
  label: string
  children: ReactNode
}) {
  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-input bg-background pb-safe lg:hidden",
        "transition-transform duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      )}
    >
      <div className="flex items-center gap-2 px-4 py-2.5">
        <span className="flex-1 font-mono text-[11px] tracking-[0.01em] text-faint">
          {label}
        </span>
        {children}
      </div>
    </div>
  )
}

export function MobileBulkButton({
  children,
  onClick,
  disabled,
  destructive,
}: {
  children: ReactNode
  onClick: () => void
  disabled: boolean
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-9 shrink-0 rounded-md border px-3 text-[13px] font-medium transition-colors disabled:opacity-35",
        destructive
          ? "border-destructive/30 text-destructive active:bg-destructive/5"
          : "border-input text-foreground active:bg-wash"
      )}
    >
      {children}
    </button>
  )
}

/* --------------------------------------------------------------- skeleton */

export function MobileListSkeleton({
  facets = 4,
  rows = 9,
  media = true,
  mediaClass = "size-[38px] rounded-sm",
  actions = 2,
}: {
  facets?: number
  rows?: number
  media?: boolean
  /** Matches the real row's leading media — a square thumb, a round avatar. */
  mediaClass?: string
  actions?: number
}) {
  return (
    <div className="flex flex-col">
      <div className="-mx-4 -mt-5 border-b sm:-mx-6">
        <div className="flex items-center gap-2 px-4 py-2.5 sm:px-6">
          <Skeleton className="h-10 flex-1 rounded-md" />
          {Array.from({ length: actions }).map((_, i) => (
            <Skeleton key={i} className="size-10 shrink-0 rounded-md" />
          ))}
        </div>
        <div className="flex gap-5 px-4 pb-2.5 sm:px-6">
          {Array.from({ length: facets }).map((_, i) => (
            <Skeleton key={i} className="h-4" style={{ width: 42 + (i % 2) * 8 }} />
          ))}
        </div>
      </div>

      <div className="-mx-4 flex items-center gap-2.5 border-b bg-wash px-4 py-2 sm:-mx-6 sm:px-6">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="ml-auto h-2.5 w-12" />
      </div>

      <div className="-mx-4 sm:-mx-6">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-[58px] items-center gap-2.5 border-b border-hairline px-4 sm:px-6"
          >
            {media && <Skeleton className={cn("shrink-0", mediaClass)} />}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2.5 w-2/3" />
            </div>
            <Skeleton className="h-3.5 w-7 shrink-0" />
          </div>
        ))}
      </div>

      <div className="h-6" />
    </div>
  )
}
