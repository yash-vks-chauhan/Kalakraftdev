/**
 * Custom hook to consolidate product filtering state management
 * Fixes performance issue: Excessive State Management (15+ state variables)
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export interface ProductFilter {
  category: string
  usageTag: string
  priceMin: string
  priceMax: string
  sortOrder: string
  ratingMin: string
  lowStockOnly: boolean
  inStockOnly: boolean
}

export interface ProductFiltersState {
  // Current active filters
  filters: ProductFilter
  
  // Temporary filters (for mobile apply/cancel functionality)
  tempFilters: ProductFilter
  
  // Filter actions
  updateFilter: (key: keyof ProductFilter, value: string | boolean) => void
  updateTempFilter: (key: keyof ProductFilter, value: string | boolean) => void
  applyTempFilters: () => void
  resetTempFilters: () => void
  clearAllFilters: () => void
  
  // URL sync
  syncWithURL: () => void
}

export function useProductFilters(): ProductFiltersState {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize filters from URL params
  const initializeFilters = useCallback((): ProductFilter => ({
    category: searchParams.get('category') || '',
    usageTag: searchParams.get('usageTag') || '',
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    sortOrder: searchParams.get('sort') || '',
    ratingMin: searchParams.get('ratingMin') || '',
    lowStockOnly: searchParams.get('lowStock') === 'true',
    inStockOnly: searchParams.get('inStock') === 'true'
  }), [searchParams])
  
  // Current active filters
  const [filters, setFilters] = useState<ProductFilter>(initializeFilters)
  
  // Temporary filters for mobile workflows
  const [tempFilters, setTempFilters] = useState<ProductFilter>(initializeFilters)
  
  // Sync filters with URL changes
  useEffect(() => {
    const newFilters = initializeFilters()
    setFilters(newFilters)
    setTempFilters(newFilters)
  }, [initializeFilters])
  
  // Update a single filter and sync to URL
  const updateFilter = useCallback((key: keyof ProductFilter, value: string | boolean) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    syncFiltersToURL(newFilters)
  }, [filters])
  
  // Update temporary filter (no URL sync)
  const updateTempFilter = useCallback((key: keyof ProductFilter, value: string | boolean) => {
    setTempFilters(prev => ({ ...prev, [key]: value }))
  }, [])
  
  // Apply temporary filters to active filters and URL
  const applyTempFilters = useCallback(() => {
    setFilters(tempFilters)
    syncFiltersToURL(tempFilters)
  }, [tempFilters])
  
  // Reset temporary filters to match active filters
  const resetTempFilters = useCallback(() => {
    setTempFilters(filters)
  }, [filters])
  
  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const emptyFilters: ProductFilter = {
      category: '',
      usageTag: '',
      priceMin: '',
      priceMax: '',
      sortOrder: '',
      ratingMin: '',
      lowStockOnly: false,
      inStockOnly: false
    }
    setFilters(emptyFilters)
    setTempFilters(emptyFilters)
    router.replace('/products')
  }, [router])
  
  // Sync filters to URL
  const syncFiltersToURL = useCallback((filtersToSync: ProductFilter) => {
    const params = new URLSearchParams()
    
    // Only add non-empty/non-false values to URL
    Object.entries(filtersToSync).forEach(([key, value]) => {
      if (value && value !== '' && value !== false) {
        if (typeof value === 'boolean') {
          params.set(key === 'lowStockOnly' ? 'lowStock' : 
                    key === 'inStockOnly' ? 'inStock' : key, 'true')
        } else {
          params.set(key === 'usageTag' ? 'usageTag' : 
                    key === 'sortOrder' ? 'sort' : key, value as string)
        }
      }
    })
    
    const newURL = params.toString() ? `/products?${params}` : '/products'
    router.replace(newURL)
  }, [router])
  
  // Manual sync with URL (for external URL changes)
  const syncWithURL = useCallback(() => {
    const newFilters = initializeFilters()
    setFilters(newFilters)
    setTempFilters(newFilters)
  }, [initializeFilters])
  
  return {
    filters,
    tempFilters,
    updateFilter,
    updateTempFilter,
    applyTempFilters,
    resetTempFilters,
    clearAllFilters,
    syncWithURL
  }
}
