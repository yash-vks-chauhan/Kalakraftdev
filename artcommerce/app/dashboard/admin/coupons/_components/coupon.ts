/**
 * Shared vocabulary for the coupons screens.
 *
 * The desktop page, the mobile list and the form sheet all need to agree on
 * what "expired" means and how an amount reads; keeping that here is what
 * stops the phone and the desk quietly disagreeing about a coupon's status.
 */

export interface Coupon {
  id: number
  code: string
  type: "percentage" | "flat"
  amount: number
  expiresAt: string
  usedCount: number
  usageLimit: number | null
  createdAt?: string
}

export type CouponStatus = "active" | "expired" | "used-up"

export interface FormState {
  code: string
  type: "percentage" | "flat"
  amount: string
  expiresAt: string
  usageLimit: string
}

export const EMPTY_FORM: FormState = {
  code: "",
  type: "percentage",
  amount: "",
  expiresAt: "",
  usageLimit: "",
}

export function getStatus(c: Coupon): CouponStatus {
  if (new Date(c.expiresAt).getTime() < Date.now()) return "expired"
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return "used-up"
  return "active"
}

export function formatAmount(c: Coupon) {
  if (c.type === "percentage") return `${c.amount}% off`
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(c.amount)
}

export function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function daysFromNow(value: string) {
  const ms = new Date(value).getTime() - Date.now()
  const days = Math.round(ms / (1000 * 60 * 60 * 24))
  if (days === 0) return "today"
  if (days > 0) return `in ${days} day${days === 1 ? "" : "s"}`
  return `${Math.abs(days)} day${days === -1 ? "" : "s"} ago`
}

/** The same span, written for a 44pt-wide figure column. */
export function shortExpiry(value: string) {
  const ms = new Date(value).getTime() - Date.now()
  if (Number.isNaN(ms)) return "—"
  const days = Math.round(ms / (1000 * 60 * 60 * 24))
  if (days === 0) return "Today"
  const magnitude = Math.abs(days)
  const span =
    magnitude >= 365
      ? `${Math.round(magnitude / 365)}y`
      : magnitude >= 30
      ? `${Math.round(magnitude / 30)}mo`
      : `${magnitude}d`
  return days > 0 ? `in ${span}` : `${span} ago`
}

export function toDateInputValue(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

/** `expiresAt` for a coupon that should run for `days` from today. */
export function dateInDays(days: number) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** How full the usage meter is, or null when there is no limit to fill. */
export function usageShare(c: Coupon) {
  if (c.usageLimit == null || c.usageLimit <= 0) return null
  return Math.min(100, Math.round((c.usedCount / c.usageLimit) * 100))
}
