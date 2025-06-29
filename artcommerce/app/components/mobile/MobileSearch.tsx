'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import styles from './mobile.module.css'
import { Search, X, ArrowLeft, Loader2 } from 'lucide-react'

interface Product {
  id: number
  name: string
  price: number
  currency: string
  imageUrls: string[]
  category: string
}

export default function MobileSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches')
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches))
      } catch (err) {
        console.error('Failed to parse recent searches', err)
      }
    }
    
    // Focus the search input when component mounts
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return
    
    const updatedSearches = [
      term,
      ...recentSearches.filter(s => s !== term)
    ].slice(0, 5) // Keep only the 5 most recent searches
    
    setRecentSearches(updatedSearches)
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches))
  }

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  // Handle search
  const handleSearch = async (searchTerm: string = query) => {
    if (!searchTerm.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`)
      if (!res.ok) {
        throw new Error('Failed to fetch search results')
      }
      
      const data = await res.json()
      setResults(data.products || [])
      
      // Save the search term to recent searches
      if (searchTerm.trim()) {
        saveRecentSearch(searchTerm.trim())
      }
    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to load search results. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  // Clear search
  const clearSearch = () => {
    setQuery('')
    setResults([])
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Handle clicking on a recent search
  const handleRecentSearchClick = (term: string) => {
    setQuery(term)
    handleSearch(term)
  }

  return (
    <div className={styles.mobileSearch}>
      <div className={styles.searchHeader}>
        <button 
          onClick={() => router.back()} 
          className={styles.backButton}
        >
          <ArrowLeft size={20} />
        </button>
        
        <form onSubmit={handleSubmit} className={styles.searchForm}>
          <div className={styles.searchInputContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className={styles.searchInput}
            />
            {query && (
              <button 
                type="button" 
                onClick={clearSearch}
                className={styles.clearButton}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </form>
      </div>

      <div className={styles.searchContent}>
        {loading ? (
          <div className={styles.searchLoading}>
            <Loader2 size={24} className={styles.spinner} />
            <p>Searching...</p>
          </div>
        ) : error ? (
          <div className={styles.searchError}>
            <p>{error}</p>
            <button onClick={() => handleSearch()} className={styles.retryButton}>
              Retry
            </button>
          </div>
        ) : results.length > 0 ? (
          <div className={styles.searchResults}>
            <div className={styles.resultsHeader}>
              <h2>Search Results</h2>
              <span>{results.length} items</span>
            </div>
            
            <div className={styles.resultsList}>
              {results.map((product) => (
                <Link 
                  href={`/products/${product.id}`} 
                  key={product.id}
                  className={styles.resultItem}
                >
                  <div className={styles.resultImage}>
                    {product.imageUrls && product.imageUrls.length > 0 ? (
                      <Image
                        src={product.imageUrls[0]}
                        alt={product.name}
                        width={60}
                        height={60}
                        className={styles.productImage}
                      />
                    ) : (
                      <div className={styles.noImage}></div>
                    )}
                  </div>
                  <div className={styles.resultInfo}>
                    <h3>{product.name}</h3>
                    <div className={styles.resultMeta}>
                      <span className={styles.resultCategory}>{product.category}</span>
                      <span className={styles.resultPrice}>
                        {product.currency} {product.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : query ? (
          <div className={styles.noResults}>
            <div className={styles.noResultsIcon}>
              <Search size={32} />
            </div>
            <h2>No results found</h2>
            <p>Try different keywords or check for typos</p>
          </div>
        ) : (
          <div className={styles.recentSearches}>
            {recentSearches.length > 0 ? (
              <>
                <div className={styles.recentHeader}>
                  <h2>Recent Searches</h2>
                  <button 
                    onClick={clearRecentSearches}
                    className={styles.clearRecentButton}
                  >
                    Clear All
                  </button>
                </div>
                
                <div className={styles.recentList}>
                  {recentSearches.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(term)}
                      className={styles.recentItem}
                    >
                      <Search size={16} className={styles.recentIcon} />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.emptySearch}>
                <div className={styles.emptySearchIcon}>
                  <Search size={32} />
                </div>
                <h2>Search Products</h2>
                <p>Type to search for products by name, category, or description</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 