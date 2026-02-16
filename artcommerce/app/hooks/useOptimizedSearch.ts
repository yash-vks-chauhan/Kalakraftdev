/**
 * Custom hook for optimized search with debouncing, caching, and intelligent filtering
 * Fixes performance issue: Excessive API calls from search input
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

interface SearchOptions {
  // Debounce delay in milliseconds
  debounceMs?: number
  // Minimum characters before triggering search
  minLength?: number
  // Enable search result caching
  enableCache?: boolean
  // Maximum cache size (number of queries to cache)
  maxCacheSize?: number
  // Cache TTL in milliseconds
  cacheTTL?: number
  // Enable client-side filtering for fast results
  enableClientFilter?: boolean
}

interface SearchResult<T> {
  items: T[]
  query: string
  totalCount: number
  isFromCache: boolean
  timestamp: number
}

interface SearchCache<T> {
  [query: string]: {
    result: SearchResult<T>
    timestamp: number
  }
}

interface OptimizedSearchHook<T> {
  // Current search state
  searchQuery: string
  searchResults: T[]
  isSearching: boolean
  hasResults: boolean
  
  // Search actions
  setSearchQuery: (query: string) => void
  clearSearch: () => void
  
  // Cache management
  clearCache: () => void
  getCacheStats: () => {
    size: number
    hitRate: number
    totalQueries: number
  }
  
  // Performance metrics
  searchMetrics: {
    lastSearchTime: number
    avgSearchTime: number
    cacheHits: number
    totalSearches: number
  }
}

export function useOptimizedSearch<T>(
  searchFunction: (query: string) => Promise<T[]>,
  allItems: T[] = [],
  clientFilterFunction?: (items: T[], query: string) => T[],
  options: SearchOptions = {}
): OptimizedSearchHook<T> {
  const {
    debounceMs = 300,
    minLength = 2,
    enableCache = true,
    maxCacheSize = 50,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    enableClientFilter = true
  } = options
  
  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<T[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Refs for performance tracking and caching
  const searchCache = useRef<SearchCache<T>>({})
  const debounceTimeout = useRef<NodeJS.Timeout>()
  const searchMetrics = useRef({
    lastSearchTime: 0,
    avgSearchTime: 0,
    cacheHits: 0,
    totalSearches: 0,
    searchTimes: [] as number[]
  })
  const abortController = useRef<AbortController>()
  
  // Cleanup function for cache
  const cleanupCache = useCallback(() => {
    if (!enableCache) return
    
    const now = Date.now()
    const cache = searchCache.current
    
    Object.keys(cache).forEach(query => {
      if (now - cache[query].timestamp > cacheTTL) {
        delete cache[query]
      }
    })
    
    // Limit cache size
    const cacheKeys = Object.keys(cache)
    if (cacheKeys.length > maxCacheSize) {
      // Remove oldest entries
      const sortedKeys = cacheKeys.sort((a, b) => 
        cache[a].timestamp - cache[b].timestamp
      )
      const keysToRemove = sortedKeys.slice(0, cacheKeys.length - maxCacheSize)
      keysToRemove.forEach(key => delete cache[key])
    }
  }, [enableCache, cacheTTL, maxCacheSize])
  
  // Get cached result
  const getCachedResult = useCallback((query: string): T[] | null => {
    if (!enableCache) return null
    
    const cached = searchCache.current[query]
    if (!cached) return null
    
    const now = Date.now()
    if (now - cached.timestamp > cacheTTL) {
      delete searchCache.current[query]
      return null
    }
    
    searchMetrics.current.cacheHits++
    return cached.result.items
  }, [enableCache, cacheTTL])
  
  // Cache search result
  const cacheResult = useCallback((query: string, items: T[]) => {
    if (!enableCache) return
    
    searchCache.current[query] = {
      result: {
        items,
        query,
        totalCount: items.length,
        isFromCache: false,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    }
    
    cleanupCache()
  }, [enableCache, cleanupCache])
  
  // Client-side filtering for instant results
  const getClientFilteredResults = useCallback((query: string): T[] | null => {
    if (!enableClientFilter || !allItems.length) return null
    
    if (clientFilterFunction) {
      return clientFilterFunction(allItems, query)
    }
    
    // Default client-side filtering (works for objects with string properties)
    const lowercaseQuery = query.toLowerCase()
    return allItems.filter(item => {
      const searchableText = Object.values(item as any)
        .filter(value => typeof value === 'string')
        .join(' ')
        .toLowerCase()
      
      return searchableText.includes(lowercaseQuery)
    })
  }, [enableClientFilter, allItems, clientFilterFunction])
  
  // Perform search with performance tracking
  const performSearch = useCallback(async (query: string) => {
    if (query.length < minLength) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    
    // Cancel previous search
    if (abortController.current) {
      abortController.current.abort()
    }
    
    setIsSearching(true)
    const startTime = Date.now()
    
    try {
      // Check cache first
      const cachedResults = getCachedResult(query)
      if (cachedResults) {
        setSearchResults(cachedResults)
        setIsSearching(false)
        return
      }
      
      // Try client-side filtering for instant results
      const clientResults = getClientFilteredResults(query)
      if (clientResults && clientResults.length > 0) {
        setSearchResults(clientResults)
        // Don't set isSearching to false yet, API search still running
      }
      
      // Create abort controller for this search
      abortController.current = new AbortController()
      
      // Perform API search
      const apiResults = await searchFunction(query)
      
      // Update results and cache
      setSearchResults(apiResults)
      cacheResult(query, apiResults)
      
      // Update performance metrics
      const searchTime = Date.now() - startTime
      const metrics = searchMetrics.current
      metrics.lastSearchTime = searchTime
      metrics.totalSearches++
      metrics.searchTimes.push(searchTime)
      
      // Keep only last 10 search times for average calculation
      if (metrics.searchTimes.length > 10) {
        metrics.searchTimes = metrics.searchTimes.slice(-10)
      }
      
      metrics.avgSearchTime = metrics.searchTimes.reduce((a, b) => a + b, 0) / metrics.searchTimes.length
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error)
        // Keep client results if API fails
        const clientResults = getClientFilteredResults(query)
        if (clientResults) {
          setSearchResults(clientResults)
        } else {
          setSearchResults([])
        }
      }
    } finally {
      setIsSearching(false)
    }
  }, [minLength, getCachedResult, getClientFilteredResults, searchFunction, cacheResult])
  
  // Debounced search effect
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }
    
    if (searchQuery.trim() === '') {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    
    debounceTimeout.current = setTimeout(() => {
      performSearch(searchQuery.trim())
    }, debounceMs)
    
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [searchQuery, debounceMs, performSearch])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [])
  
  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }
    if (abortController.current) {
      abortController.current.abort()
    }
  }, [])
  
  // Clear cache
  const clearCache = useCallback(() => {
    searchCache.current = {}
    searchMetrics.current.cacheHits = 0
  }, [])
  
  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const metrics = searchMetrics.current
    return {
      size: Object.keys(searchCache.current).length,
      hitRate: metrics.totalSearches > 0 ? metrics.cacheHits / metrics.totalSearches : 0,
      totalQueries: metrics.totalSearches
    }
  }, [])
  
  // Memoized computed properties
  const hasResults = useMemo(() => searchResults.length > 0, [searchResults])
  
  return {
    searchQuery,
    searchResults,
    isSearching,
    hasResults,
    setSearchQuery,
    clearSearch,
    clearCache,
    getCacheStats,
    searchMetrics: {
      lastSearchTime: searchMetrics.current.lastSearchTime,
      avgSearchTime: searchMetrics.current.avgSearchTime,
      cacheHits: searchMetrics.current.cacheHits,
      totalSearches: searchMetrics.current.totalSearches
    }
  }
}

// Specialized hook for product search
export function useProductSearch(
  allProducts: any[] = [],
  searchAPI?: (query: string) => Promise<any[]>
) {
  const productFilter = useCallback((products: any[], query: string) => {
    const lowercaseQuery = query.toLowerCase()
    
    return products.filter(product => {
      // Search in name, short description, and category
      const searchFields = [
        product.name,
        product.shortDesc,
        product.category?.name,
        ...(product.usageTags || [])
      ].filter(Boolean)
      
      return searchFields.some(field => 
        field.toLowerCase().includes(lowercaseQuery)
      )
    })
  }, [])
  
  const defaultSearchAPI = useCallback(async (query: string) => {
    // Fallback API search if none provided
    const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`)
    const data = await response.json()
    return data.products || []
  }, [])
  
  return useOptimizedSearch(
    searchAPI || defaultSearchAPI,
    allProducts,
    productFilter,
    {
      debounceMs: 300,
      minLength: 2,
      enableCache: true,
      maxCacheSize: 30,
      cacheTTL: 5 * 60 * 1000,
      enableClientFilter: true
    }
  )
}
