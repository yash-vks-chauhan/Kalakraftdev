"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export type SupportStatus = "open" | "pending" | "closed" | string

/**
 * A single source of truth for how a ticket's status is presented across the
 * customer and admin support surfaces: open = needs us, pending = waiting on
 * the customer, closed = done. Neutral outline badge with a semantic dot —
 * open is amber (needs attention), not red (nothing is wrong).
 */
function statusDot(status: SupportStatus): string {
  switch ((status || "").toLowerCase()) {
    case "open":
      return "bg-amber-500"
    case "pending":
      return "bg-sky-500"
    case "closed":
      return "bg-emerald-500"
    default:
      return "bg-muted-foreground/40"
  }
}

export function SupportStatusBadge({
  status,
  className,
}: {
  status: SupportStatus
  className?: string
}) {
  const normalized = (status || "").toLowerCase()
  const label = normalized
    ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
    : String(status)

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-normal text-foreground", className)}
    >
      <span
        aria-hidden
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDot(status))}
      />
      {label}
    </Badge>
  )
}

/** A tiny coloured dot + label, for compact spots like list rows. */
export function SupportStatusDot({
  status,
  className,
}: {
  status: SupportStatus
  className?: string
}) {
  const normalized = (status || "").toLowerCase()

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", statusDot(status))} />
      <span className="capitalize">{normalized || "unknown"}</span>
    </span>
  )
}
