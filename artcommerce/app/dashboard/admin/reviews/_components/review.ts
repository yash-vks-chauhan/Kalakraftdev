import { Heart, Smile, Sparkles, ThumbsUp, type LucideIcon } from "lucide-react"

export interface RatedProduct {
  id: number
  name: string
  avgRating: number
  reviewCount: number
}

export interface Review {
  id: number
  rating: number
  comment?: string | null
  createdAt: string
  adminReply?: string | null
  adminReaction?: string | null
  product: { id: number; name: string } | null
  user: { id: string; fullName: string }
}

export const QUICK_REACTIONS: {
  value: string
  icon: LucideIcon
  label: string
}[] = [
  { value: "👍", icon: ThumbsUp, label: "Thanks" },
  { value: "😊", icon: Smile, label: "Smile" },
  { value: "❤️", icon: Heart, label: "Loved" },
  { value: "✨", icon: Sparkles, label: "Wow" },
]

/** Ratings at or below this are what you open the page on a phone to find. */
export const LOW_RATING = 2

export function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo ago`
  return new Date(value).toLocaleDateString()
}

/** The same span with the "ago" dropped — for a 40pt figure column. */
export function shortAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 60) return `${Math.max(1, minutes)}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo`
  return `${Math.round(months / 12)}y`
}

export function initials(name: string) {
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  )
}

export interface ReviewStats {
  total: number
  pending: number
  replied: number
  low: number
  avg: number
  replyRate: number
}

export function summarise(reviews: Review[]): ReviewStats {
  let pending = 0
  let replied = 0
  let low = 0
  let sum = 0
  for (const r of reviews) {
    sum += r.rating
    if (r.adminReply) replied++
    else pending++
    if (r.rating <= LOW_RATING) low++
  }
  const total = reviews.length
  return {
    total,
    pending,
    replied,
    low,
    avg: total > 0 ? sum / total : 0,
    replyRate: total > 0 ? Math.round((replied / total) * 100) : 0,
  }
}

/** Counts per star, 5 down to 1, with each bar's share of the total. */
export function distributionOf(reviews: Review[]) {
  const counts = [0, 0, 0, 0, 0]
  for (const r of reviews) {
    const idx = Math.max(1, Math.min(5, Math.round(r.rating))) - 1
    counts[idx]++
  }
  const total = reviews.length || 1
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts[stars - 1],
    pct: Math.round((counts[stars - 1] / total) * 100),
  }))
}
