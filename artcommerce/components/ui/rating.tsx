"use client"

import * as React from "react"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

/*
 * Sizes are pixel values rather than utility classes because a fractional
 * star is drawn as two identical rows, one clipped over the other. They have
 * to measure the same to the pixel or a 4.3 lands somewhere other than 4.3.
 */
const SIZES = {
  xs: { star: 11, gap: 2 },
  sm: { star: 13, gap: 2 },
  md: { star: 15, gap: 2.5 },
  lg: { star: 18, gap: 3 },
} as const

export type RatingSize = keyof typeof SIZES

const MAX = 5
const STARS = [0, 1, 2, 3, 4]

function StarRow({ size, filled }: { size: RatingSize; filled: boolean }) {
  const { star, gap } = SIZES[size]
  return (
    <span className="flex w-max" style={{ gap }}>
      {STARS.map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          strokeWidth={1.25}
          style={{ width: star, height: star }}
          className={
            filled ? "fill-rating text-rating" : "fill-rating-track text-rating-track"
          }
        />
      ))}
    </span>
  )
}

export interface RatingProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** 0–5. Fractions render a partially filled star. */
  value: number
  size?: RatingSize
  /** Overrides the generated `aria-label` — pass one when the row already
   *  sits next to text that says the same thing. */
  label?: string
}

/** A read-only star row that tells the truth about halves. */
function Rating({ value, size = "md", label, className, ...props }: RatingProps) {
  const score = Math.min(MAX, Math.max(0, Number.isFinite(value) ? value : 0))

  return (
    <span
      data-slot="rating"
      data-size={size}
      role="img"
      aria-label={label ?? `${score.toFixed(1)} out of ${MAX} stars`}
      className={cn("relative inline-flex shrink-0 align-middle", className)}
      {...props}
    >
      <StarRow size={size} filled={false} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${(score / MAX) * 100}%` }}
      >
        <StarRow size={size} filled />
      </span>
    </span>
  )
}

export interface RatingInputProps
  extends Omit<React.ComponentProps<"div">, "onChange" | "defaultValue"> {
  /** The chosen score, 0 for "nothing picked yet". */
  value: number
  onChange: (value: number) => void
  size?: RatingSize
  disabled?: boolean
}

/** The same row, as a control: hover and keyboard focus both preview. */
function RatingInput({
  value,
  onChange,
  size = "lg",
  disabled = false,
  className,
  ...props
}: RatingInputProps) {
  const [preview, setPreview] = React.useState(0)
  const { star } = SIZES[size]
  const shown = preview || value

  return (
    <div
      data-slot="rating-input"
      role="radiogroup"
      aria-label="Your rating"
      onMouseLeave={() => setPreview(0)}
      className={cn(
        "inline-flex items-center",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      {...props}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          disabled={disabled}
          onClick={() => onChange(n)}
          onMouseEnter={() => setPreview(n)}
          onFocus={() => setPreview(n)}
          onBlur={() => setPreview(0)}
          className={cn(
            "rounded-sm p-1 outline-none transition-transform duration-200",
            "hover:scale-110 focus-visible:ring-[3px] focus-visible:ring-ring/40"
          )}
        >
          <Star
            strokeWidth={1.25}
            style={{ width: star, height: star }}
            className={cn(
              "transition-colors duration-200",
              n <= shown
                ? "fill-rating text-rating"
                : "fill-rating-track text-rating-track"
            )}
          />
        </button>
      ))}
    </div>
  )
}

export { Rating, RatingInput }
