import { cn } from "@/lib/utils"

import styles from "./pour.module.css"

/**
 * Four blurred colour fields drifting on a slow loop — the product's own
 * process as the page's only ambient motion. It appears behind the hero and
 * behind the footer and nowhere else; that restraint is the point.
 */
export function Pour({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn(styles.pour, className)}>
      <span />
      <span />
      <span />
      <span />
    </div>
  )
}

/** Noise texture for any surface carrying colour. */
export const grain = styles.grain
