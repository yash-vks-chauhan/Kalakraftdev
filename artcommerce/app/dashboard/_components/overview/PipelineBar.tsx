"use client"

import { cn } from "@/lib/utils"
import { orderStatusDot } from "../OrderStatusBadge"
import { capitalise, formatCount } from "./format"

/**
 * The five order states as one segmented bar plus a two-column legend.
 *
 * The desktop stacks five labelled progress rows — around 180 px of scroll on a
 * phone. This says the same thing in a third of the height, and proportions
 * compare far better when they sit on a single line.
 *
 * Colour comes from `orderStatusDot`, the dashboard's single source of truth for
 * status presentation, so a status reads the same here as it does on the order
 * rows directly below.
 */

const PIPELINE_ORDER = ["pending", "accepted", "shipped", "delivered", "cancelled", "rejected"]

export interface StatusCount {
  status: string
  _count: { status: number }
}

function sortByPipeline(a: StatusCount, b: StatusCount) {
  const ai = PIPELINE_ORDER.indexOf(a.status.toLowerCase())
  const bi = PIPELINE_ORDER.indexOf(b.status.toLowerCase())
  // Anything unrecognised sorts to the end rather than to the front.
  return (ai === -1 ? PIPELINE_ORDER.length : ai) - (bi === -1 ? PIPELINE_ORDER.length : bi)
}

export function PipelineBar({ statusCounts }: { statusCounts: StatusCount[] }) {
  const ordered = [...statusCounts].sort(sortByPipeline)
  const total = ordered.reduce((sum, entry) => sum + entry._count.status, 0)

  if (total === 0) {
    return (
      <div className="px-3.5 py-6 text-center text-[13px] text-muted-foreground">
        No orders in this period.
      </div>
    )
  }

  const segments = ordered.filter((entry) => entry._count.status > 0)

  return (
    <div className="px-3.5 pb-3.5 pt-[15px]">
      <div className="flex h-2.5 gap-0.5">
        {segments.map((entry, index) => (
          <span
            key={entry.status}
            className={cn(
              "block rounded-sm",
              orderStatusDot(entry.status),
              index === 0 && "rounded-l-full",
              index === segments.length - 1 && "rounded-r-full"
            )}
            style={{ flex: entry._count.status }}
          />
        ))}
      </div>

      <ul className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {ordered.map((entry) => (
          <li key={entry.status} className="flex items-center gap-2 text-[12.5px]">
            <span
              aria-hidden
              className={cn("size-2 shrink-0 rounded-sm", orderStatusDot(entry.status))}
            />
            <span className="truncate text-muted-foreground">{capitalise(entry.status)}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">
              {formatCount(entry._count.status)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
