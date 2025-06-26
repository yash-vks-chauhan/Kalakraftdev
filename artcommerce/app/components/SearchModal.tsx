'use client'

import { useEffect, useState, useRef, FormEvent, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import WishlistButton from './WishlistButton'
import { useNotificationContext } from '../contexts/NotificationContext'
import styles from './SearchModal.module.css'

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

interface ProductImageState {
  [key: number]: number; // productId -> currentImageIndex
}

interface Props {
  open: boolean
  onClose: (instantClose: boolean) => void
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

const QUICK_FILTERS = [
  { id: 'new', name: 'New Arrivals' },
  { id: 'trending', name: 'Trending' },
  { id: 'popular', name: 'Popular' },
  { id: 'sale', name: 'On Sale' },
]

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'rating', label: 'Highest Rated' },
]

// Maximum number of recent searches to store
const MAX_RECENT_SEARCHES = 5

export default function SearchModal({ open, onClose }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSearch = searchParams.get('search') || ''
  const { notifications } = useNotificationContext()

  const [mounted, setMounted] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const closeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const [searchText, setSearchText] = useState<string>('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [loadingResults, setLoadingResults] = useState<boolean>(false)
  const [errorResults, setErrorResults] = useState<string | null>(null)
  const [currentImages, setCurrentImages] = useState<ProductImageState>({})
  const [loadingProductId, setLoadingProductId] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [sortOption, setSortOption] = useState<string>('relevance')
  const [recentSearches, setRecentSearches] = useState<string[]>([])

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
    } else {
      setSearchText('')
      setSelectedCategory(null)
      setActiveFilter(null)
      setSortOption('relevance')
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

  const handleClose = useCallback((instant: boolean) => {
    if (instant) {
      onClose(true)
      return
    }

    setIsClosing(true)
    
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
    }
    
    closeTimeoutRef.current = setTimeout(() => {
      onClose(false)
      setIsClosing(false)
    }, 300) // Reduced from 800ms to 300ms for snappier feel
  }, [onClose])

  // Close on escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose(false)
    }
    if (open) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [open, handleClose])

  // Handle open/close transitions
  useEffect(() => {
    if (open) {
      setIsClosing(false)
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [open])

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
      
      if (activeFilter) {
        params.set('filter', activeFilter)
      }
      
      if (sortOption && sortOption !== 'relevance') {
        params.set('sort', sortOption)
      }

      try {
        const res = await fetch(`/api/products?${params.toString()}`)
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch search results')
        }
        
        let products = Array.isArray(data.products) ? data.products : []
        
        // Client-side sorting if needed
        if (sortOption === 'price_low') {
          products = [...products].sort((a, b) => a.price - b.price)
        } else if (sortOption === 'price_high') {
          products = [...products].sort((a, b) => b.price - a.price)
        }
        
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
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [searchText, selectedCategory, activeFilter, sortOption])

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    const tokens = searchText.trim().toLowerCase().split(/\s+/).map(tok => SYNONYMS[tok] || tok)
    const finalSearch = tokens.join(' ')
    const isCat = KNOWN_CATEGORIES.some(cat => cat.slug === finalSearch)
    const params = new URLSearchParams()
    if (isCat) params.set('category', finalSearch)
    else if (finalSearch) params.set('search', finalSearch)

    if (selectedCategory) params.set('category', selectedCategory)
    
    if (activeFilter) params.set('filter', activeFilter)
    
    if (sortOption && sortOption !== 'relevance') {
      params.set('sort', sortOption)
    }

    const currentCategory = searchParams.get('category') || ''
    if (currentCategory && !params.has('category')) params.set('category', currentCategory)

    if (finalSearch) {
      saveToRecentSearches(finalSearch)
    }
    
    router.replace(`/products?${params.toString()}`)
    handleClose(true)
  }

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category === selectedCategory ? null : category)
  }
  
  const handleFilterSelect = (filter: string | null) => {
    setActiveFilter(filter === activeFilter ? null : filter)
  }
  
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value)
  }
  
  const handleRecentSearchClick = (search: string) => {
    setSearchText(search)
  }

  const handleClearSearch = () => {
    setSearchText('')
    setSearchResults([])
    setErrorResults(null)
    setSelectedCategory(null)
    setActiveFilter(null)
    setSortOption('relevance')
  }

  // Handle image navigation
  const handleNextImage = (productId: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    setCurrentImages((prev: ProductImageState) => {
      const currentIndex = prev[productId] || 0
      const product = searchResults.find((p: Product) => p.id === productId)
      if (!product) return prev
      
      const nextIndex = (currentIndex + 1) % product.imageUrls.length
      return { ...prev, [productId]: nextIndex }
    })
  }

  const handlePrevImage = (productId: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    setCurrentImages((prev: ProductImageState) => {
      const currentIndex = prev[productId] || 0
      const product = searchResults.find((p: Product) => p.id === productId)
      if (!product) return prev
      
      const nextIndex = (currentIndex - 1 + product.imageUrls.length) % product.imageUrls.length
      return { ...prev, [productId]: nextIndex }
    })
  }

  const handleProductClick = async (productId: number, productUrl: string, e: React.MouseEvent) => {
    e.preventDefault()
    setLoadingProductId(productId)
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    router.push(productUrl)
    handleClose(true)
  }

  // Early return after all hooks
  if (!mounted || (!open && !isClosing)) return null

  // Create portal directly in document.body
  const modalContent = (
    <div
      className={`${styles.searchOverlay} ${open ? styles.searchOverlayOpen : ''} ${isClosing ? styles.searchModalClosing : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose(false)
        }
      }}
    >
      <div
        className={styles.searchModal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.searchHeader}>
          <div className={styles.logoContainer}>
            <img 
              src="/images/logo.png" 
              alt="Kalakraft" 
              className={styles.logoImage}
              width={150}
              height={40}
            />
          </div>
          <button
            type="button"
            onClick={() => handleClose(false)}
            className={styles.closeButton}
            aria-label="Close search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.searchContent}>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <div className={styles.searchInputContainer}>
              <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                autoFocus
                type="text"
                placeholder="SEARCH PRODUCTS..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className={styles.searchInput}
                autoComplete="off"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className={styles.clearButton}
                >
                  CLEAR
                </button>
              )}
            </div>
            
            {recentSearches.length > 0 && !searchText && (
              <div className={styles.recentSearches}>
                <p className={styles.recentSearchesTitle}>Recent searches:</p>
                <div className={styles.recentSearchesList}>
                  {recentSearches.map((search, index) => (
                    <button 
                      key={index} 
                      type="button"
                      className={styles.recentSearchItem}
                      onClick={() => handleRecentSearchClick(search)}
                    >
                      <svg className={styles.recentSearchIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 14 4 9 9 4"></polyline>
                        <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                      </svg>
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className={styles.categoriesContainer}>
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
            
            <div className={styles.quickFilters}>
              {QUICK_FILTERS.map(filter => (
                <button 
                  key={filter.id}
                  type="button"
                  className={`${styles.quickFilterButton} ${activeFilter === filter.id ? styles.quickFilterActive : ''}`}
                  onClick={() => handleFilterSelect(filter.id)}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </form>

          {searchText && (
            <div className={styles.sortOptions}>
              <select 
                className={styles.sortSelect}
                value={sortOption}
                onChange={handleSortChange}
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.resultsContainer}>
            {loadingResults ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinnerWrapper}>
                  <div className={styles.loadingSpinner}>
                    <svg className={styles.loadingCircle} viewBox="0 0 50 50">
                      <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
                    </svg>
                  </div>
                </div>
                <div className={styles.emptyResultsText}>
                  {"SEARCHING PRODUCTS".split('').map((letter, index) => (
                    <span key={index} className={styles.letter}>
                      {letter === ' ' ? '\u00A0' : letter}
                    </span>
                  ))}
                  <span className={styles.dots}>
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </div>
              </div>
            ) : errorResults ? (
              <div className={styles.errorContainer}>
                <svg className={styles.errorIcon} xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p className={styles.errorText}>ERROR: {errorResults.toUpperCase()}</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className={styles.resultsGrid}>
                {searchResults.map(prod => {
                  const currentImageIndex = currentImages[prod.id] || 0;
                  const isLoading = loadingProductId === prod.id;
                  const hasMultipleImages = prod.imageUrls.length > 1;
                  
                  return (
                    <div 
                      key={prod.id} 
                      className={`${styles.productCard} ${isLoading ? styles.productCardLoading : ''}`}
                    >
                      <div className={styles.wishlistButtonContainer}>
                        <WishlistButton productId={prod.id} />
                      </div>
                      
                      <a
                        href={`/products/${prod.id}`}
                        className={styles.productLink}
                        onClick={(e) => handleProductClick(prod.id, `/products/${prod.id}`, e)}
                      >
                        <div className={styles.productImageContainer}>
                          {prod.imageUrls[currentImageIndex] ? (
                            <img 
                              src={prod.imageUrls[currentImageIndex]} 
                              alt={prod.name} 
                              className={styles.productImage} 
                            />
                          ) : (
                            <div className={styles.noImagePlaceholder}>NO IMAGE</div>
                          )}
                          
                          {isLoading && (
                            <div className={styles.loadingOverlay}>
                              <div className={styles.loadingSpinnerSmall}>
                                <svg className={styles.loadingCircleSmall} viewBox="0 0 50 50">
                                  <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
                                </svg>
                              </div>
                            </div>
                          )}
                          
                          {hasMultipleImages && !isLoading && (
                            <>
                              <button
                                className={`${styles.imageNav} ${styles.imageNavPrev}`}
                                onClick={(e) => handlePrevImage(prod.id, e)}
                                aria-label="Previous image"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                              </button>
                              <button
                                className={`${styles.imageNav} ${styles.imageNavNext}`}
                                onClick={(e) => handleNextImage(prod.id, e)}
                                aria-label="Next image"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                              </button>
                              <div className={styles.imageCounter}>
                                {currentImageIndex + 1} / {prod.imageUrls.length}
                              </div>
                            </>
                          )}
                          
                          <div className={styles.productInfoOverlay}>
                            <h3 className={styles.productName}>{prod.name}</h3>
                            <p className={styles.productPrice}>
                              {prod.currency} {prod.price.toFixed(2)}
                            </p>
                            {prod.category && (
                              <span className={styles.productCategory}>
                                {prod.category.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : searchText ? (
              <div className={styles.noResultsContainer}>
                <svg className={styles.noResultsIcon} xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
                <p className={styles.noResultsText}>NO PRODUCTS FOUND</p>
                <p className={styles.noResultsSubtext}>Try a different search term or browse categories</p>
              </div>
            ) : (
              <div className={styles.emptyStateContainer}>
                <svg className={styles.emptyStateIcon} xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <div className={styles.emptyResultsText}>
                  {"SEARCH FOR PRODUCTS".split('').map((letter, index) => (
                    <span key={index} className={styles.letter}>
                      {letter === ' ' ? '\u00A0' : letter}
                    </span>
                  ))}
                </div>
                <p className={styles.emptyStateSubtext}>Type in the search box above or select a category</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
