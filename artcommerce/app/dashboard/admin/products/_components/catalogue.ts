/**
 * Shared vocabulary for the admin catalogue screens.
 *
 * The desktop table and the mobile list read the same rows, so the threshold
 * that decides what "low" means, and the words used to say it, live here
 * rather than being spelled twice and drifting apart.
 */

export interface Product {
  id: number
  name: string
  slug: string
  price: number
  currency: string
  stockQuantity: number
  isActive: boolean
  categoryId: number | null
  totalSold: number
  imageUrls?: string[]
  shortDesc?: string
}

export interface Category {
  id: number
  name: string
}

/**
 * Note: /api/admin/metrics counts five or fewer as low for the dashboard's
 * attention queue. This page has always used ten, and the mobile filter now
 * prints the number beside the option so the two can no longer be confused.
 */
export const LOW_STOCK_THRESHOLD = 10

export function formatPrice(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(0)}`
  }
}

export function stockTone(qty: number) {
  if (qty === 0) return 'text-destructive'
  if (qty <= LOW_STOCK_THRESHOLD) return 'text-amber-600 dark:text-amber-500'
  return 'text-foreground'
}

export function stockLabel(qty: number) {
  if (qty === 0) return 'Out of stock'
  if (qty <= LOW_STOCK_THRESHOLD) return `${qty} left — low`
  return `${qty} in stock`
}

/** The phone has less room, so the same three states get shorter words. */
export function stockLabelShort(qty: number) {
  if (qty === 0) return 'Out of stock'
  if (qty <= LOW_STOCK_THRESHOLD) return `${qty} left`
  return `${qty} in stock`
}

export function stockDot(qty: number) {
  if (qty === 0) return 'bg-destructive'
  if (qty <= LOW_STOCK_THRESHOLD) return 'bg-amber-500'
  return 'bg-emerald-500'
}
