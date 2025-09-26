/**
 * Format price in Indian Rupees
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(price)
}

/**
 * Get fallback image URL
 */
export const getFallbackImageUrl = (width = 300, height = 300): string => {
  return `https://placehold.co/${width}x${height}/f0f0f0/888?text=No+Image`
}

/**
 * Handle image error with fallback
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.src = getFallbackImageUrl()
}
