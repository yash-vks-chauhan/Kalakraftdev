/**
 * Optimized Search Input Component
 * Features debouncing, instant client-side filtering, and search suggestions
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FiSearch, FiX, FiClock, FiTrendingUp } from 'react-icons/fi'
import { useOptimizedSearch } from '../hooks/useOptimizedSearch'
import styles from './OptimizedSearch.module.css'

interface SearchSuggestion {
  query: string
  type: 'recent' | 'popular' | 'suggestion'
  count?: number
}

interface OptimizedSearchProps {
  placeholder?: string
  onResultsChange?: (results: any[]) => void
  searchFunction?: (query: string) => Promise<any[]>
  allItems?: any[]
  suggestions?: SearchSuggestion[]
  className?: string
  showMetrics?: boolean
}

export default function OptimizedSearch({
  placeholder = 'Search products...',
  onResultsChange,
  searchFunction,
  allItems = [],
  suggestions = [],
  className,
  showMetrics = false
}: OptimizedSearchProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  
  // Use optimized search hook
  const {
    searchQuery,
    searchResults,
    isSearching,
    hasResults,
    setSearchQuery,
    clearSearch,
    searchMetrics
  } = useOptimizedSearch(
    searchFunction || (async (query) => {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      return data.products || []
    }),
    allItems,
    // Custom filter function for products
    (items, query) => {
      const lowercaseQuery = query.toLowerCase()
      return items.filter((item: any) => {
        const searchText = [
          item.name,
          item.shortDesc,
          item.category?.name,
          ...(item.usageTags || [])
        ].filter(Boolean).join(' ').toLowerCase()
        
        return searchText.includes(lowercaseQuery)
      })
    },
    {
      debounceMs: 250,
      minLength: 2,
      enableCache: true,
      enableClientFilter: true
    }
  )
  
  // Notify parent of results changes
  useEffect(() => {
    if (onResultsChange) {
      onResultsChange(searchResults)
    }
  }, [searchResults, onResultsChange])
  
  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true)
    if (searchQuery.length === 0 && suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }
  
  // Handle input blur
  const handleBlur = (e: React.FocusEvent) => {
    // Don't hide suggestions if clicking on them
    if (suggestionsRef.current && suggestionsRef.current.contains(e.relatedTarget as Node)) {
      return
    }
    setIsFocused(false)
    setShowSuggestions(false)
  }
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    if (value.length === 0) {
      setShowSuggestions(suggestions.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.query)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }
  
  // Handle clear
  const handleClear = () => {
    clearSearch()
    setShowSuggestions(suggestions.length > 0 && isFocused)
    inputRef.current?.focus()
  }
  
  // Handle escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showSuggestions) {
        setShowSuggestions(false)
      } else if (searchQuery) {
        handleClear()
      } else {
        inputRef.current?.blur()
      }
    }
  }
  
  // Filter suggestions based on current query
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.query.toLowerCase().includes(searchQuery.toLowerCase()) &&
    suggestion.query !== searchQuery
  ).slice(0, 6)
  
  return (
    <div className={`${styles.searchContainer} ${className || ''}`}>
      <div className={`${styles.searchInputContainer} ${isFocused ? styles.focused : ''} ${isSearching ? styles.searching : ''}`}>
        <FiSearch className={styles.searchIcon} />
        
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={styles.searchInput}
          autoComplete="off"
          spellCheck="false"
        />
        
        {isSearching && (
          <div className={styles.searchingIndicator}>
            <div className={styles.spinner}></div>
          </div>
        )}
        
        {searchQuery && !isSearching && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearButton}
            aria-label="Clear search"
          >
            <FiX />
          </button>
        )}
      </div>
      
      {/* Search suggestions */}
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className={styles.suggestionsContainer}
          onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking
        >
          {filteredSuggestions.length > 0 ? (
            <>
              <div className={styles.suggestionsHeader}>
                <span>Suggestions</span>
              </div>
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={styles.suggestionItem}
                >
                  <div className={styles.suggestionIcon}>
                    {suggestion.type === 'recent' && <FiClock />}
                    {suggestion.type === 'popular' && <FiTrendingUp />}
                    {suggestion.type === 'suggestion' && <FiSearch />}
                  </div>
                  <div className={styles.suggestionContent}>
                    <span className={styles.suggestionQuery}>{suggestion.query}</span>
                    {suggestion.count && (
                      <span className={styles.suggestionCount}>
                        {suggestion.count} results
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </>
          ) : suggestions.length > 0 ? (
            <>
              <div className={styles.suggestionsHeader}>
                <span>Popular Searches</span>
              </div>
              {suggestions.slice(0, 6).map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={styles.suggestionItem}
                >
                  <div className={styles.suggestionIcon}>
                    {suggestion.type === 'recent' && <FiClock />}
                    {suggestion.type === 'popular' && <FiTrendingUp />}
                    {suggestion.type === 'suggestion' && <FiSearch />}
                  </div>
                  <div className={styles.suggestionContent}>
                    <span className={styles.suggestionQuery}>{suggestion.query}</span>
                    {suggestion.count && (
                      <span className={styles.suggestionCount}>
                        {suggestion.count} results
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </>
          ) : null}
        </div>
      )}
      
      {/* Search results info */}
      {searchQuery && (
        <div className={styles.searchInfo}>
          {hasResults && (
            <span className={styles.resultsCount}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
            </span>
          )}
          
          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <span className={styles.searchHint}>
              Type at least 2 characters to search
            </span>
          )}
          
          {searchQuery.length >= 2 && !hasResults && !isSearching && (
            <span className={styles.noResults}>
              No results found for &quot;{searchQuery}&quot;
            </span>
          )}
        </div>
      )}
      
      {/* Performance metrics (development only) */}
      {showMetrics && process.env.NODE_ENV === 'development' && (
        <div className={styles.metricsContainer}>
          <div className={styles.metric}>
            <span>Last search: {searchMetrics.lastSearchTime}ms</span>
          </div>
          <div className={styles.metric}>
            <span>Avg: {Math.round(searchMetrics.avgSearchTime)}ms</span>
          </div>
          <div className={styles.metric}>
            <span>Cache hits: {searchMetrics.cacheHits}/{searchMetrics.totalSearches}</span>
          </div>
        </div>
      )}
    </div>
  )
}
