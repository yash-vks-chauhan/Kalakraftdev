"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * The mobile half of every admin list.
 *
 * Each admin page previously rendered a 5–7 column <Table> inside an
 * overflow-x-auto wrapper, which on a 390px screen meant scrolling sideways
 * inside a page that also scrolled vertically. These primitives render the
 * same rows as a stacked card list below `md`, while the table stays for
 * `md` and up via <DesktopTableFrame>.
 *
 * Structure is intentionally fixed (media / title+badge / meta / value /
 * actions) so all five lists read as one system rather than five designs.
 */

export function DataCardList({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <ul className={cn("divide-y border-t md:hidden", className)}>{children}</ul>
  )
}

/** Wraps the desktop <Table> so it disappears below `md`. */
export function DesktopTableFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("hidden border-t md:block", className)}>{children}</div>
  )
}

interface DataCardProps {
  /** Makes the card body a link. Mutually useful with `onOpenActions`. */
  href?: string
  media?: ReactNode
  title: ReactNode
  /** Status chip rendered beside the title. */
  badge?: ReactNode
  /** Primary secondary line. */
  meta?: ReactNode
  /** Optional third line for lower-priority detail. */
  submeta?: ReactNode
  /** Right-aligned emphasis (usually an amount). */
  value?: ReactNode
  valueLabel?: ReactNode
  /** Opens the row's action sheet; renders a ⋯ button. */
  onOpenActions?: () => void
  actionsLabel?: string
  /** Extra content below the main row — chips, inline controls. */
  footer?: ReactNode
  /** Applied to the <li>. Callers must not wrap this in a <div>: the parent
   *  is a <ul>, which may only contain <li> children. */
  className?: string
}

export function DataCard({
  href,
  media,
  title,
  badge,
  meta,
  submeta,
  value,
  valueLabel,
  onOpenActions,
  actionsLabel = "More actions",
  footer,
  className,
}: DataCardProps) {
  const body = (
    <>
      {media && <div className="shrink-0">{media}</div>}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">
            {title}
          </span>
          {badge && <span className="shrink-0">{badge}</span>}
        </div>
        {meta && (
          <span className="truncate text-[13px] text-muted-foreground">
            {meta}
          </span>
        )}
        {submeta && (
          <span className="truncate text-[13px] text-muted-foreground">
            {submeta}
          </span>
        )}
      </div>

      {value !== undefined && value !== null && (
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-[15px] font-semibold tabular-nums text-foreground">
            {value}
          </span>
          {valueLabel && (
            <span className="text-[11px] text-muted-foreground">
              {valueLabel}
            </span>
          )}
        </div>
      )}

      {href && !onOpenActions && (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </>
  )

  return (
    <li className={cn("relative", className)}>
      <div className="flex items-stretch">
        {href ? (
          <Link
            href={href}
            className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 transition-colors active:bg-secondary/60"
          >
            {body}
          </Link>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5">
            {body}
          </div>
        )}

        {onOpenActions && (
          <button
            type="button"
            onClick={onOpenActions}
            aria-label={actionsLabel}
            className="flex w-12 shrink-0 items-center justify-center border-l text-muted-foreground transition-colors active:bg-secondary/70"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        )}
      </div>

      {footer && <div className="px-4 pb-3.5">{footer}</div>}
    </li>
  )
}

/** Square thumbnail with a graceful icon fallback. */
export function DataCardThumb({
  src,
  alt,
  fallback,
}: {
  src?: string
  alt: string
  fallback: ReactNode
}) {
  return (
    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-muted-foreground">{fallback}</span>
      )}
    </div>
  )
}

/** Empty state sized for a phone rather than a table cell. */
export function DataCardEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <li className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <p className="text-[15px] font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-[36ch] text-[13px] text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="pt-1">{action}</div>}
    </li>
  )
}

export function DataCardSkeleton({ media = true }: { media?: boolean }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      {media && <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <Skeleton className="h-4 w-14 shrink-0" />
    </li>
  )
}
