"use client"

import { CircleDot, Clock, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export type SupportStatus = "open" | "pending" | "closed" | string

/**
 * A single source of truth for how a ticket's status is presented across the
 * customer and admin support surfaces. Keeps the colour language identical
 * everywhere: open = needs us, pending = waiting on the customer, closed = done.
 */
export function SupportStatusBadge({
  status,
  className,
}: {
  status: SupportStatus
  className?: string
}) {
  const normalized = (status || "").toLowerCase()

  if (normalized === "open") {
    return (
      <Badge
        className={cn(
          "gap-1 bg-destructive/10 text-destructive hover:bg-destructive/15 dark:bg-destructive/20",
          className
        )}
      >
        <CircleDot className="h-3 w-3" />
        Open
      </Badge>
    )
  }

  if (normalized === "pending") {
    return (
      <Badge
        className={cn(
          "gap-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/15 dark:text-amber-500",
          className
        )}
      >
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    )
  }

  if (normalized === "closed") {
    return (
      <Badge variant="secondary" className={cn("gap-1", className)}>
        <CheckCircle2 className="h-3 w-3" />
        Closed
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={className}>
      {status}
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
  const tone =
    normalized === "open"
      ? "bg-destructive"
      : normalized === "pending"
      ? "bg-amber-500"
      : "bg-muted-foreground/40"

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", tone)} />
      <span className="capitalize">{normalized || "unknown"}</span>
    </span>
  )
}
