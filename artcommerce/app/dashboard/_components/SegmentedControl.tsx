"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export type SegmentedControlItem<T extends string> = {
  key: T
  label: string
  icon?: LucideIcon
  count?: number
}

interface SegmentedControlProps<T extends string> {
  items: readonly SegmentedControlItem<T>[]
  value: T
  onChange: (key: T) => void
  ariaLabel?: string
  className?: string
}

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonsRef = useRef<Map<T, HTMLButtonElement | null>>(new Map())
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null)

  const measure = () => {
    const node = buttonsRef.current.get(value)
    if (!node) return
    setThumb({ left: node.offsetLeft, width: node.offsetWidth })
  }

  useLayoutEffect(() => {
    measure()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, items])

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => measure())
    observer.observe(container)
    buttonsRef.current.forEach((node) => {
      if (node) observer.observe(node)
    })
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex w-full items-stretch gap-1 overflow-x-auto rounded-md border bg-muted/40 p-1 lg:w-auto",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute bottom-1 top-1 left-0 rounded bg-background shadow-sm ring-1 ring-black/5",
          "transition-[transform,width,opacity] duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform",
          thumb ? "opacity-100" : "opacity-0"
        )}
        style={{
          transform: thumb ? `translate3d(${thumb.left}px, 0, 0)` : undefined,
          width: thumb ? thumb.width : undefined,
        }}
      />

      {items.map((item) => {
        const isActive = item.key === value
        const Icon = item.icon
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            ref={(el) => {
              buttonsRef.current.set(item.key, el)
            }}
            onClick={() => onChange(item.key)}
            className={cn(
              "relative z-[1] inline-flex flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-out lg:flex-none",
              "active:scale-[0.97] transition-transform",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{item.label}</span>
            {typeof item.count === "number" && (
              <Badge
                variant="secondary"
                className={cn(
                  "h-5 px-1.5 text-[11px] transition-colors duration-150",
                  isActive ? "bg-secondary/80" : "bg-muted"
                )}
              >
                {item.count}
              </Badge>
            )}
          </button>
        )
      })}
    </div>
  )
}
