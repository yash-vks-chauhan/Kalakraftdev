'use client'

import { useEffect, useState, useRef, FormEvent, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { X, Search, ArrowLeft } from 'lucide-react'
import styles from './MobileSearchModal.module.css'

interface Product {
  id: number
  name: string
  slug: string
  shortDesc: string
  description?: string
  price: number
  currency: string
  imageUrls: string[]
  stockQuantity: number
  category: { id: number; name: string; slug: string } | null
}

// Client-side synonyms mapping (English + Hindi)
const SYNONYMS: Record<string, string> = {
  plate: 'tray', platter: 'tray', watches: 'clocks', watch: 'clocks', timepiece: 'clocks',
  'घड़ी': 'clocks', ghadi: 'clocks', gaadi: 'clocks', ghadiyan: 'clocks', ghadiyaan: 'clocks',
  wallclock: 'clocks', diwargadi: 'clocks', deewarghadi: 'clocks',
  tray: 'tray', thali: 'tray', fruittray: 'tray', jewelertray: 'tray', jewelrytray: 'tray', thalee: 'tray', 'थाली': 'tray',
  pots: 'pots', vase: 'pots', plantpot: 'pots', flowerpot: 'pots', 'पॉट': 'pots', paat: 'pots', phooldaan: 'pots', 'फूलदान': 'pots', guldaan: 'pots', 'गुलदान': 'pots',
  rangoli: 'rangoli', rangolee: 'rangoli', floorart: 'rangoli', 'रंगोली': 'rangoli',
  decor: 'decor', decoration: 'decor', shringar: 'decor', alankar: 'decor', 'सजावट': 'decor', sajavat: 'decor', diwar: 'decor', diwaar: 'decor',
  'matt rangoli': 'matt rangoli', mattrangoli: 'matt rangoli', 'मैट रंगोली': 'मैट रंगोली',
  'mirror work': 'mirror work', mirrorwork: 'mirror work', shishakala: 'mirror work', 'शीशा कला': 'mirror work', 'shisha kala': 'mirror work',
}

const KNOWN_CATEGORIES = [
  { slug: 'clocks', name: 'Clock' },
  { slug: 'pots', name: 'Pots' },
  { slug: 'tray', name: 'Trays' },
  { slug: 'Tray', name: 'Jewelery Trays' },
  { slug: 'rangoli', name: 'Rangoli' },
  { slug: 'decor', name: 'Wall decor' },
  { slug: 'matt rangoli', name: 'Matt Rangoli' },
  { slug: 'mirror work', name: 'Mirror Work' },
]

// Maximum number of recent searches to store
const MAX_RECENT_SEARCHES = 5

interface Props {
  open: boolean
  onClose: () => void
}

export default function MobileSearchModal({ open, onClose }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSearch = searchParams.get('search') || ''
  
  const [mounted, setMounted] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const closeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const [searchText, setSearchText] = useState<string>('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [loadingResults, setLoadingResults] = useState<boolean>(false)
  const [errorResults, setErrorResults] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent searches from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSearches = localStorage.getItem('recentSearches')
      if (savedSearches) {
        try {
          setRecentSearches(JSON.parse(savedSearches))
        } catch (e) {
          setRecentSearches([])
        }
      }
    }
  }, [])

  // Initialize searchText when modal opens or currentSearch changes
  useEffect(() => {
    if (open) {
      setSearchText(currentSearch)
      // Focus the input when modal opens
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      setSearchText('')
      setSelectedCategory(null)
    }
  }, [open, currentSearch])

  // Handle mounting for SSR
  useEffect(() => {
    setMounted(true)
    return () => {
      setMounted(false)
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
    }
    
    closeTimeoutRef.current = setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }, [onClose])

  // Close on escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    if (open) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [open, handleClose])

  // Save search to recent searches
  const saveToRecentSearches = (search: string) => {
    if (!search.trim()) return
    
    setRecentSearches(prev => {
      const newSearches = prev.filter(s => s.toLowerCase() !== search.toLowerCase())
      const updated = [search, ...newSearches].slice(0, MAX_RECENT_SEARCHES)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('recentSearches', JSON.stringify(updated))
      }
      
      return updated
    })
  }

  // Fetch products based on search text
  useEffect(() => {
    // Immediately set loading state based on searchText presence
    if (searchText) {
      setLoadingResults(true)
    } else {
      setLoadingResults(false)
      setSearchResults([])
      setErrorResults(null)
      return
    }

    const fetchSearchResults = async () => {
      setErrorResults(null)
      const params = new URLSearchParams()
      const tokens = searchText.trim().toLowerCase().split(/\s+/).map(tok => SYNONYMS[tok] || tok)
      const finalSearch = tokens.join(' ')
      params.set('search', finalSearch)

      if (selectedCategory) {
        params.set('category', selectedCategory)
      }

      try {
        const res = await fetch(`/api/products?${params.toString()}`)
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch search results')
        }
        
        let products = Array.isArray(data.products) ? data.products : []
        setSearchResults(products)
      } catch (err: any) {
        setErrorResults(err.message)
        setSearchResults([])
      } finally {
        setLoadingResults(false)
      }
    }

    const handler = setTimeout(() => {
      fetchSearchResults()
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [searchText, selectedCategory])

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    const tokens = searchText.trim().toLowerCase().split(/\s+/).map(tok => SYNONYMS[tok] || tok)
    const finalSearch = tokens.join(' ')
    const isCat = KNOWN_CATEGORIES.some(cat => cat.slug === finalSearch)
    const params = new URLSearchParams()
    if (isCat) params.set('category', finalSearch)
    else if (finalSearch) params.set('search', finalSearch)

    if (selectedCategory) params.set('category', selectedCategory)
    
    const currentCategory = searchParams.get('category') || ''
    if (currentCategory && !params.has('category')) params.set('category', currentCategory)

    if (finalSearch) {
      saveToRecentSearches(finalSearch)
    }
    
    router.push(`/products?${params.toString()}`)
    handleClose()
  }

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category === selectedCategory ? null : category)
  }
  
  const handleRecentSearchClick = (search: string) => {
    setSearchText(search)
  }

  const handleClearSearch = () => {
    setSearchText('')
    setSearchResults([])
    setErrorResults(null)
    setSelectedCategory(null)
    // Focus the input after clearing
    inputRef.current?.focus()
  }

  const handleProductClick = (productId: number) => {
    router.push(`/products/${productId}`)
    handleClose()
  }

  // Early return after all hooks
  if (!mounted || (!open && !isClosing)) return null

  // Create portal directly in document.body
  const modalContent = (
    <div
      className={`${styles.mobileSearchOverlay} ${open ? styles.searchOverlayOpen : ''} ${isClosing ? styles.searchOverlayClosing : ''}`}
    >
      <div className={styles.mobileSearchHeader}>
        <button 
          onClick={handleClose}
          className={styles.backButton}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className={styles.logoContainer}>
          <img 
            src="/images/logo.png" 
            alt="Kalakraft" 
            className={styles.logoImage}
            width={100}
            height={32}
          />
        </div>
        
        <button
          type="button"
          onClick={handleClearSearch}
          className={styles.clearButton}
          aria-label="Clear search"
        >
          <X size={18} />
        </button>
      </div>

      <div className={styles.mobileSearchContent}>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <div className={styles.searchInputContainer}>
            <Search className={styles.searchIcon} size={18} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search products..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className={styles.searchInput}
              autoComplete="off"
            />
          </div>
        </form>

        <div className={styles.categoriesScroll}>
          {KNOWN_CATEGORIES.map(category => (
            <button 
              key={category.slug}
              type="button"
              className={`${styles.categoryPill} ${selectedCategory === category.slug ? styles.categoryPillActive : ''}`}
              onClick={() => handleCategorySelect(category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className={styles.resultsContainer}>
          {loadingResults ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>Searching...</p>
            </div>
          ) : errorResults ? (
            <div className={styles.errorContainer}>
              <p className={styles.errorText}>Error: {errorResults}</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className={styles.productResults}>
              {searchResults.map(product => (
                <div 
                  key={product.id} 
                  className={styles.productCard}
                  onClick={() => handleProductClick(product.id)}
                >
                  <div className={styles.productImageContainer}>
                    {product.imageUrls[0] ? (
                      <img 
                        src={product.imageUrls[0]} 
                        alt={product.name} 
                        className={styles.productImage} 
                      />
                    ) : (
                      <div className={styles.noImagePlaceholder}>No Image</div>
                    )}
                  </div>
                  <div className={styles.productInfo}>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <p className={styles.productPrice}>
                      {product.currency} {product.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : searchText ? (
            <div className={styles.noResultsContainer}>
              <p className={styles.noResultsText}>No products found</p>
              <p className={styles.noResultsSubtext}>Try a different search term or browse categories</p>
            </div>
          ) : recentSearches.length > 0 ? (
            <div className={styles.recentSearches}>
              <h3 className={styles.recentSearchesTitle}>Recent Searches</h3>
              {recentSearches.map((search, index) => (
                <button 
                  key={index}
                  className={styles.recentSearchItem}
                  onClick={() => handleRecentSearchClick(search)}
                >
                  <span className={styles.recentSearchText}>{search}</span>
                  <ArrowLeft size={16} className={styles.recentSearchIcon} />
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.emptyStateContainer}>
              <Search size={40} className={styles.emptyStateIcon} />
              <p className={styles.emptyStateText}>Search for products</p>
              <p className={styles.emptyStateSubtext}>Type in the search box above or select a category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
} 