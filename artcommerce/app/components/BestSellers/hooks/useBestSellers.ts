import { useState, useEffect, useCallback } from 'react'

export interface Product {
  id: string
  name: string
  price: number
  imageUrls: string[]
  category?: { name: string }
  stockQuantity?: number
}

interface UseBestSellersReturn {
  products: Product[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export const useBestSellers = (limit = 4): UseBestSellersReturn => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBestSellers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/products/best-sellers?limit=${limit}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch best sellers')
      }
      
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products)
      } else {
        setProducts([])
      }
    } catch (err) {
      console.error('Error fetching best sellers:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchBestSellers()
  }, [fetchBestSellers])

  return {
    products,
    loading,
    error,
    refetch: fetchBestSellers
  }
}
