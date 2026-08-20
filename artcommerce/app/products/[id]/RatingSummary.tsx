'use client'

import { Rating, type RatingSize } from '@/components/ui/rating'
import { cn } from '@/lib/utils'

interface RatingSummaryProps {
  /** Mean score, 0–5. */
  value: number
  /** How many reviews that mean is drawn from. */
  count: number
  size?: RatingSize
  /** Id of the section to jump to. */
  target?: string
  className?: string
}

/*
 * The one line that says how a piece is regarded, shared by the desktop
 * placard and the phone. It is a control, not a label: the score is the
 * shortest route to the accounts it came from, so tapping it goes there —
 * and it is present even at zero, because "no reviews yet" is itself an
 * answer to the question a shopper is asking.
 */
export default function RatingSummary({
  value,
  count,
  size = 'md',
  target = 'reviews',
  className,
}: RatingSummaryProps) {
  const rated = count > 0
  const reviews = `${count} ${count === 1 ? 'review' : 'reviews'}`

  return (
    <button
      type="button"
      onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })}
      aria-label={
        rated
          ? `Rated ${value.toFixed(1)} out of 5 from ${reviews}. Jump to the reviews.`
          : 'No reviews yet. Jump to the reviews.'
      }
      className={cn(
        'group flex w-fit items-center gap-2.5 rounded-sm outline-none',
        'focus-visible:ring-[3px] focus-visible:ring-ring/40',
        className
      )}
    >
      <Rating value={rated ? value : 0} size={size} aria-hidden="true" />

      {rated ? (
        <span className="flex items-baseline gap-1.5 text-[13px] leading-none text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{value.toFixed(1)}</span>
          <span aria-hidden="true" className="text-rating-track">
            ·
          </span>
          <span className="underline-offset-4 transition-colors group-hover:text-foreground group-hover:underline">
            {reviews}
          </span>
        </span>
      ) : (
        <span className="text-[13px] leading-none text-muted-foreground underline-offset-4 transition-colors group-hover:text-foreground group-hover:underline">
          No reviews yet
        </span>
      )}
    </button>
  )
}
