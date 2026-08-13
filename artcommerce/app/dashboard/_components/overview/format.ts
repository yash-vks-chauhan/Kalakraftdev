/** Shared number formatting for the Overview. Indian digit grouping throughout. */

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "₹0"
  return `₹${Math.round(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

/**
 * The headline figure has to survive a 390 pt screen, so it switches to lakh
 * and crore rather than wrapping or truncating a full-length rupee amount.
 */
export function formatCompactCurrency(value: number): string {
  if (!Number.isFinite(value)) return "₹0"
  const n = Math.round(value)
  if (n >= 10000000) return `₹${trimZero((n / 10000000).toFixed(2))}Cr`
  if (n >= 100000) return `₹${trimZero((n / 100000).toFixed(2))}L`
  if (n >= 1000) return `₹${trimZero((n / 1000).toFixed(1))}k`
  return `₹${n}`
}

function trimZero(value: string): string {
  return value.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1")
}

/** Tolerates a missing figure, so a stale API shape renders "0" rather than throwing. */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "0"
  return value.toLocaleString("en-IN")
}

export function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

/** "2h ago" reads better than a date on a row that is minutes old. */
export function formatRelative(value: string): string {
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return ""

  const minutes = Math.round((Date.now() - then) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`

  return formatShortDate(value)
}

export function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}
