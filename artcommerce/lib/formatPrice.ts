// "INR 1250" → "₹1,250": currency symbol + Indian digit grouping, decimals
// only when the price actually has them. Shared by every surface that prices
// a piece so the same product never reads two different ways.
export function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  } catch {
    return `${currency} ${price.toFixed(2)}`
  }
}
