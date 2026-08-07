/** The shape both /api/products and /api/products/best-sellers return. */
export interface MobileProduct {
  id: number
  name: string
  slug: string
  price: number
  imageUrls: unknown
  stockQuantity: number
  avgRating?: number
  ratingCount?: number
  category?: { name: string; slug?: string } | null
}

/** imageUrls is a Json column, so it arrives as an array or a JSON string. */
export function firstImage(value: unknown): string | null {
  let list: unknown = value
  if (typeof value === "string") {
    try {
      list = JSON.parse(value)
    } catch {
      return null
    }
  }
  if (!Array.isArray(list) || list.length === 0) return null
  const first = list[0]
  if (typeof first === "string") return first
  if (first && typeof first === "object" && "url" in (first as any)) {
    const url = (first as any).url
    return typeof url === "string" ? url : null
  }
  return null
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(price)
}

/** Matches LOW_STOCK_THRESHOLD in the products API. */
export const LOW_STOCK = 5
