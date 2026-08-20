"use client"

import { TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * The one dark object on the screen.
 *
 * In a monochrome theme near-black *is* the accent, so it is spent exactly once:
 * on this panel. Everything below it stays on quiet filled surfaces, which is
 * what gives the screen a centre of gravity — the previous version felt flat
 * because all eight cards carried identical weight.
 *
 * It inverts the theme deliberately (`bg-foreground text-background`), so it
 * follows the tokens rather than hard-coding black.
 */
export function HeroPanel({
  label,
  value,
  valueClassName,
  delta,
  caption,
  captionEmphasis = false,
  bleed,
  footer,
}: {
  label: string
  value: React.ReactNode
  valueClassName?: string
  /** Percent change against the previous window. `null` means there isn't one. */
  delta?: number | null
  caption: React.ReactNode
  /** Lifts the caption while a value is being scrubbed. */
  captionEmphasis?: boolean
  /** Chart or stepper — rendered edge to edge, so it manages its own inset. */
  bleed?: React.ReactNode
  /** Up to three supporting figures, divided by hairlines inside the panel. */
  footer?: { key: string; label: string; value: string }[]
}) {
  return (
    <div className="overflow-hidden rounded-[22px] bg-foreground px-[18px] pt-[18px] text-background">
      <span className="text-[11px] font-semibold tracking-[0.01em] text-background/50">
        {label}
      </span>

      <div className="mt-1 flex items-end gap-3">
        <span
          className={cn(
            "text-[40px] font-bold leading-none tracking-[-0.045em] tabular-nums",
            valueClassName
          )}
        >
          {value}
        </span>
        {delta !== undefined && delta !== null ? (
          <span
            className={cn(
              "mb-1 inline-flex items-center gap-1 rounded-full bg-background/10 py-1 pl-1.5 pr-2 text-[12.5px] font-semibold tabular-nums transition-opacity",
              delta < 0 ? "text-red-300" : "text-background/90",
              // The delta describes the whole window, so it would contradict a
              // scrubbed point. It fades rather than unmounting, to hold layout.
              captionEmphasis && "opacity-0"
            )}
          >
            <TrendingUp className={cn("size-[13px]", delta < 0 && "-scale-y-100")} />
            {delta > 0 ? "+" : delta < 0 ? "−" : ""}
            {Math.abs(delta)}%
          </span>
        ) : null}
      </div>

      <p
        className={cn(
          "mt-1.5 min-h-[18px] text-[12.5px] tabular-nums transition-colors",
          captionEmphasis ? "text-background/85" : "text-background/55"
        )}
      >
        {caption}
      </p>

      {bleed ? <div className="-mx-[18px] mt-2">{bleed}</div> : null}

      {footer?.length ? (
        <div className="-mx-[18px] flex">
          {footer.map((item, index) => (
            <div
              key={item.key}
              className={cn(
                "flex flex-1 flex-col gap-0.5 border-t border-background/10 px-1.5 pb-[15px] pt-[13px] text-center",
                index > 0 && "border-l"
              )}
            >
              <span className="text-[10.5px] font-semibold tracking-[0.01em] text-background/45">
                {item.label}
              </span>
              <span className="truncate text-base font-semibold tracking-[-0.025em] tabular-nums">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[18px]" />
      )}
    </div>
  )
}

/**
 * Deliberately not the shared `Skeleton`: `.skeleton-shimmer` sets its
 * background in plain CSS declared after Tailwind's utilities, so it outranks
 * any `bg-*` class passed in and would paint light grey blocks on this panel.
 */
export function InkPlaceholder({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-md bg-background/15 motion-reduce:animate-none",
        className
      )}
    />
  )
}

export function HeroPanelSkeleton({ columns = 3 }: { columns?: number }) {
  return (
    <div className="overflow-hidden rounded-[22px] bg-foreground px-[18px] pb-[18px] pt-[18px]">
      <InkPlaceholder className="h-2.5 w-16" />
      <InkPlaceholder className="mt-3 h-9 w-40" />
      <InkPlaceholder className="mt-3 h-3 w-52" />
      <InkPlaceholder className="mt-4 h-[108px] w-full bg-background/10" />
      <div className="mt-4 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <InkPlaceholder key={i} className="h-8 flex-1" />
        ))}
      </div>
    </div>
  )
}
