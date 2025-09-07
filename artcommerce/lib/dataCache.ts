// Global data cache utility for preloaded data
export interface CachedData {
  products: any[] | null
  categories: any[] | null
  tags: any[] | null
  featuredProducts: any[] | null
  loaded: boolean
  timestamp?: number
}

// Global cache instance
let globalCache: CachedData = {
  products: null,
  categories: null,
  tags: null,
  featuredProducts: null,
  loaded: false
}

export const DataCache = {
  // Get cached data
  get: (key: keyof CachedData) => {
    // First try memory cache
    if (globalCache[key] !== null && globalCache[key] !== false) {
      return globalCache[key]
    }

    // Fall back to sessionStorage
    try {
      const cached = sessionStorage.getItem('preloadedData')
      if (cached) {
        const parsedCache = JSON.parse(cached)
        const isRecent = Date.now() - parsedCache.timestamp < 30 * 60 * 1000 // 30 minutes
        
        if (isRecent && parsedCache[key]) {
          globalCache[key] = parsedCache[key]
          return parsedCache[key]
        }
      }
    } catch (error) {
      console.error('Error accessing cached data:', error)
    }

    return null
  },

  // Set cached data
  set: (key: keyof CachedData, value: any) => {
    globalCache[key] = value
  },

  // Get all cached data
  getAll: () => globalCache,

  // Check if data is loaded
  isLoaded: () => globalCache.loaded,

  // Mark as loaded
  setLoaded: (loaded: boolean) => {
    globalCache.loaded = loaded
  },

  // Clear cache
  clear: () => {
    globalCache = {
      products: null,
      categories: null,
      tags: null,
      featuredProducts: null,
      loaded: false
    }
    try {
      sessionStorage.removeItem('preloadedData')
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  },

  // Get products with instant fallback
  getProducts: async () => {
    const cached = DataCache.get('products')
    if (cached) return cached

    // If not cached, fetch immediately
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      if (data.products) {
        DataCache.set('products', data.products)
        return data.products
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
    
    return []
  },

  // Get categories with instant fallback
  getCategories: async () => {
    const cached = DataCache.get('categories')
    if (cached) return cached

    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (data.categories) {
        DataCache.set('categories', data.categories)
        return data.categories
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
    
    return []
  },

  // Get featured products with instant fallback
  getFeaturedProducts: async () => {
    const cached = DataCache.get('featuredProducts')
    if (cached) return cached

    // Generate from products if available
    const products = await DataCache.getProducts()
    if (products.length > 0) {
      const featured = products
        .filter((p: any) => p.isActive && p.imageUrls && p.imageUrls.length > 0)
        .map((p: any) => ({
          ...p,
          imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : JSON.parse(p.imageUrls || '[]')
        }))
        .sort(() => Math.random() - 0.5)
        .slice(0, 8)
      
      DataCache.set('featuredProducts', featured)
      return featured
    }
    
    return []
  }
}
