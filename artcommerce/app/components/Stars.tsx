'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarsProps {
  /** 0–5, fractional values render a partially-filled star. */
  value: number
  size?: number
  gap?: number
  className?: string
}

// A rating row that tells the truth about halves: an empty row in hairline
// grey with a clipped copper row laid over it.
export default function Stars({ value, size = 14, gap = 2, className }: StarsProps) {
  const pct = Math.max(0, Math.min(5, value)) / 5
  const row = (filled: boolean) => (
    <span className="flex w-max" style={{ gap }}>
      {[0, 1, 2, 3, 4].map(i => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          strokeWidth={1.25}
          className={filled ? 'fill-[#d4a373] text-[#d4a373]' : 'fill-[#ededed] text-[#ededed]'}
        />
      ))}
    </span>
  )

  return (
    <span
      className={cn('relative inline-flex shrink-0', className)}
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      {row(false)}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${pct * 100}%` }}
      >
        {row(true)}
      </span>
    </span>
  )
}
