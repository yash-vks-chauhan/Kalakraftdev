"use client"

import { useCallback, useRef, useState } from "react"

export interface SparkPoint {
  label: string
  value: number
}

const HEIGHT = 108
const TOP_PAD = 12
const BOTTOM_PAD = 18

/**
 * A drag-to-read revenue trace for the hero panel.
 *
 * Hand-drawn rather than recharts, which the desktop keeps: this one has to
 * bleed to the panel's edges, drop every axis, and respond to a *touch* drag —
 * and recharts' touch handling for an active index is not dependable enough to
 * hang the headline figure off. The geometry here is a normalised 0–100 box, so
 * the same coordinates position both the SVG path and the HTML markers, and the
 * markers stay circular at any width (a stretched viewBox would oval them).
 *
 * A phone has no hover, so there is no tooltip. Dragging replaces the panel's
 * headline and caption instead, and releasing restores them.
 */
export function RevenueSparkline({
  data,
  onScrub,
}: {
  data: SparkPoint[]
  /** Called with the point under the finger, then `null` on release. */
  onScrub: (point: SparkPoint | null) => void
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const values = data.map((d) => d.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = Math.max(max - min, 1)

  const xAt = useCallback(
    (index: number) => (index / Math.max(data.length - 1, 1)) * 100,
    [data.length]
  )
  const yAt = useCallback(
    (value: number) => {
      const usable = 100 - ((TOP_PAD + BOTTOM_PAD) / HEIGHT) * 100
      return (TOP_PAD / HEIGHT) * 100 + (1 - (value - min) / span) * usable
    },
    [min, span]
  )

  const readPointer = useCallback(
    (clientX: number) => {
      const rect = wrapRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0) return
      const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
      const index = Math.round(ratio * (data.length - 1))
      setActiveIndex(index)
      onScrub(data[index])
    },
    [data, onScrub]
  )

  const endScrub = useCallback(() => {
    setActiveIndex(null)
    onScrub(null)
  }, [onScrub])

  if (data.length < 2) {
    return (
      <div className="flex h-[108px] items-center justify-center text-[12px] text-background/45">
        Not enough data to plot yet
      </div>
    )
  }

  // A monotone-ish smoothing: control points sit halfway between neighbours, so
  // the curve never overshoots into a false peak the numbers do not support.
  let line = `M0 ${yAt(values[0]).toFixed(2)}`
  for (let i = 1; i < data.length; i++) {
    const x = xAt(i)
    const y = yAt(values[i])
    const prevX = xAt(i - 1)
    const prevY = yAt(values[i - 1])
    const midX = (prevX + x) / 2
    line += ` C${midX.toFixed(2)} ${prevY.toFixed(2)} ${midX.toFixed(2)} ${y.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`
  }
  const area = `${line} L100 100 L0 100 Z`

  const endX = xAt(data.length - 1)
  const endY = yAt(values[values.length - 1])
  const scrubbing = activeIndex !== null
  const markerX = scrubbing ? xAt(activeIndex) : endX
  const markerY = scrubbing ? yAt(values[activeIndex]) : endY

  return (
    <div
      ref={wrapRef}
      // `touch-pan-y` keeps a vertical page scroll working while a horizontal
      // drag is captured for scrubbing.
      className="relative touch-pan-y select-none"
      style={{ height: HEIGHT }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        readPointer(event.clientX)
      }}
      onPointerMove={(event) => {
        if (activeIndex !== null) readPointer(event.clientX)
      }}
      onPointerUp={endScrub}
      onPointerCancel={endScrub}
      onLostPointerCapture={endScrub}
      role="img"
      aria-label={`Revenue trend across ${data.length} points. Highest ${max}, lowest ${min}.`}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="block size-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="kk-spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.26} />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#kk-spark-fill)" />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {scrubbing ? (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1 w-px bg-current opacity-45"
          style={{ left: `${markerX}%`, bottom: 0 }}
        />
      ) : null}

      <span
        aria-hidden
        className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current"
        style={{
          left: `${markerX}%`,
          top: `${markerY}%`,
          // The endpoint marker sits on the panel edge; nudge it back inside.
          marginLeft: scrubbing ? 0 : -4,
        }}
      />
    </div>
  )
}
