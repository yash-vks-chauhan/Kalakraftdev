import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

/**
 * Single source of truth for order-status presentation across the dashboard.
 * Neutral outline badge with a small semantic dot — colour carries meaning
 * without breaking the monochrome surface.
 */
export function orderStatusDot(status: string): string {
  switch (status.toLowerCase()) {
    case "delivered":
      return "bg-emerald-500"
    case "shipped":
      return "bg-sky-500"
    case "accepted":
      return "bg-indigo-500"
    case "cancelled":
    case "rejected":
      return "bg-destructive"
    default:
      return "bg-amber-500"
  }
}

export function OrderStatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const label =
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-normal text-foreground", className)}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          orderStatusDot(status)
        )}
      />
      {label}
    </Badge>
  )
}
