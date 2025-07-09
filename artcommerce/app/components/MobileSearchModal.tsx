'use client'

import { useEffect, useState, useRef, FormEvent, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { X, Search, ArrowLeft } from 'lucide-react'
import WishlistButton from './WishlistButton'
import styles from './MobileSearchModal.module.css'
import Fuse from 'fuse.js'

// helper to highlight matched substrings
const getHighlightedText = (text: string, indices: number[][]) => {
  let lastIndex = 0;
  const elements: ReactNode[] = [];
  indices.forEach(([start, end], idx) => {
    if (lastIndex < start) elements.push(text.slice(lastIndex, start));
    elements.push(<mark key={idx}>{text.slice(start, end + 1)}</mark>);
    lastIndex = end + 1;
  });
  if (lastIndex < text.length) elements.push(text.slice(lastIndex));
  return elements;
}

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
  _matches?: Array<{ key: string; indices: number[][] }>;
  avgRating?: number
  ratingCount?: number
  isNew?: boolean
  createdAt?: string
}

// Product Card with Swipeable Images component
const ProductCard = ({ product, handleProductClick }) => {
  const nameMatch = product._matches?.find(m => m.key === 'name')
  const catMatch = product._matches?.find(m => m.key === 'category.name')
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [showHints, setShowHints] = useState(true);
  const imageContainerRef = useRef(null);
  const containerWidth = useRef(0);
  
  // Hide hints after first interaction or after timeout
  useEffect(() => {
    const timer = setTimeout(() => setShowHints(false), 4000);
    return () => clearTimeout(timer);
  }, []);
  
  // Preload images for smoother transitions
  useEffect(() => {
    if (!product.imageUrls || product.imageUrls.length <= 1) return;
    
    // Preload all images
    product.imageUrls.forEach(url => {
      const img = new window.Image();
      img.src = url;
    });
  }, [product.imageUrls]);
  
  // Direct touch event handlers for better reliability
  const handleTouchStart = (e) => {
    if (product.imageUrls.length <= 1) return;
    
    // Prevent default to avoid any browser behaviors
    e.preventDefault();
    
    // Hide hints on first interaction
    setShowHints(false);
    
    // Store container width for calculations
    containerWidth.current = imageContainerRef.current?.offsetWidth || 0;
    
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(e.targetTouches[0].clientX);
    setIsSwiping(true);
    setSwipeDistance(0);
  };
  
  const handleTouchMove = (e) => {
    if (!isSwiping || product.imageUrls.length <= 1) return;
    
    // Prevent default to avoid page scrolling while swiping
    e.preventDefault();
    
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    // Calculate how far the user has swiped
    const distance = currentTouch - touchStart;
    
    // Apply resistance at the edges
    let finalDistance = distance;
    if ((currentImageIndex === 0 && distance > 0) || 
        (currentImageIndex === product.imageUrls.length - 1 && distance < 0)) {
      // Apply resistance at edges - finger moves 3x more than image
      finalDistance = distance / 3;
    }
    
    setSwipeDistance(finalDistance);
  };
  
  const handleTouchEnd = () => {
    if (!isSwiping || product.imageUrls.length <= 1) return;
    
    setIsSwiping(false);
    
    if (!touchStart || !touchEnd) {
      setSwipeDistance(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = containerWidth.current * 0.2; // 20% of container width
    
    if (Math.abs(distance) < minSwipeDistance) {
      // Not swiped far enough, snap back
      setSwipeDistance(0);
      return;
    }
    
    if (distance > 0 && currentImageIndex < product.imageUrls.length - 1) {
      // Swiped left, go to next image
      setCurrentImageIndex(prevIndex => prevIndex + 1);
    } else if (distance < 0 && currentImageIndex > 0) {
      // Swiped right, go to previous image
      setCurrentImageIndex(prevIndex => prevIndex - 1);
    }
    
    // Reset values
    setTouchStart(0);
    setTouchEnd(0);
    setSwipeDistance(0);
  };
  
  // Handle manual image navigation with tap
  const handleImageTap = (e) => {
    if (product.imageUrls.length <= 1) return;
    
    // Prevent default to avoid any browser behaviors
    e.preventDefault();
    
    const containerWidth = imageContainerRef.current?.offsetWidth || 0;
    const tapX = e.nativeEvent.offsetX;
    
    // Tap on right third of image - go next
    if (tapX > containerWidth * 0.7 && currentImageIndex < product.imageUrls.length - 1) {
      setCurrentImageIndex(prevIndex => prevIndex + 1);
    }
    // Tap on left third of image - go previous
    else if (tapX < containerWidth * 0.3 && currentImageIndex > 0) {
      setCurrentImageIndex(prevIndex => prevIndex - 1);
    }
  };
  
  // Handle wishlist button click to prevent navigation
  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Calculate transform style for real-time finger tracking
  const getImageTransform = () => {
    if (isSwiping) {
      // During swipe, follow finger exactly with hardware acceleration
      const percentageOffset = containerWidth.current ? (swipeDistance / containerWidth.current) * 100 : 0;
      return {
        transform: `translate3d(calc(-${currentImageIndex * 100}% + ${percentageOffset}%), 0, 0)`,
        transition: 'none'
      };
    }
    
    // When not swiping, use smooth transition with hardware acceleration
    return {
      transform: `translate3d(-${currentImageIndex * 100}%, 0, 0)`,
      transition: 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)'
    };
  };
  
  // Format short description
  const getShortDescription = () => {
    if (!product.shortDesc) return null;
    return product.shortDesc.length > 60 
      ? `${product.shortDesc.substring(0, 60)}...` 
      : product.shortDesc;
  };
  
  // Format price with commas for thousands
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(price);
  };
  
  return (
    <div className={styles.cardWrapper}>
      <div 
        className={styles.card}
        onClick={() => handleProductClick(product.id)}
      >
        <div 
          className={styles.imageContainer}
          ref={imageContainerRef}
          onClick={handleImageTap}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className={styles.imageSlider} 
            style={getImageTransform()}
          >
            {product.imageUrls.map((url, index) => (
              <div key={index} className={styles.imageSlide}>
                <img 
                  src={url}
                  alt={`${product.name} - Image ${index + 1}`}
                  className={styles.image}
                  loading={index === 0 || index === 1 ? "eager" : "lazy"}
                  draggable="false"
                />
              </div>
            ))}
          </div>
          
          {product.imageUrls.length === 0 && (
            <div className={styles.noImage}>No image</div>
          )}
          
          {product.isNew && <span className={styles.badge}>New</span>}
          {product.stockQuantity === 0 && <div className={styles.outOfStock}>Out of Stock</div>}
          {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
            <div className={styles.lowStock}>Only {product.stockQuantity} left</div>
          )}
          
          {/* Image indicators */}
          {product.imageUrls.length > 1 && (
            <div className={styles.imageIndicators}>
              {product.imageUrls.map((_, index) => (
                <div 
                  key={index} 
                  className={`${styles.indicator} ${index === currentImageIndex ? styles.activeIndicator : ''}`}
                />
              ))}
            </div>
          )}
          
          {/* Swipe hints - only show if multiple images and on first render */}
          {showHints && product.imageUrls.length > 1 && (
            <>
              {currentImageIndex > 0 && (
                <div className={styles.swipeRightHint}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </div>
              )}
              {currentImageIndex < product.imageUrls.length - 1 && (
                <div className={styles.swipeLeftHint}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className={styles.info}>
          {product.category && (
            <div className={styles.categoryTag}>
              {catMatch ? getHighlightedText(product.category.name, catMatch.indices) : product.category.name}
            </div>
          )}
          <h3 className={styles.name}>{nameMatch ? getHighlightedText(product.name, nameMatch.indices) : product.name}</h3>
          
          {/* Short description - only show if there's space */}
          {product.shortDesc && !product.avgRating && (
            <p className={styles.shortDesc}>{getShortDescription()}</p>
          )}
          
          <div className={styles.priceRow}>
            <p className={styles.price}>{formatPrice(product.price)}</p>
            {product.avgRating > 0 && (
              <p className={styles.productRating}>
                <span className={styles.starFilled}>★</span> 
                <span className={styles.ratingValue}>{product.avgRating.toFixed(1)}</span>
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className={styles.wishlistContainer} onClick={handleWishlistClick}>
        <WishlistButton 
          productId={product.id} 
          className={`${styles.wishlistButton} ${styles.blackWishlist}`}
          preventNavigation={true}
        />
      </div>
    </div>
  );
};

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
// Helper to escape regex special chars in synonyms
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Normalize search text by replacing multi-word synonyms before search
function normalizeSearch(input: string): string {
  let result = input.trim().toLowerCase();
  Object.entries(SYNONYMS).forEach(([key, val]) => {
    const pattern = new RegExp(`\\b${escapeRegex(key)}\\b`, 'gi');
    result = result.replace(pattern, val);
  });
  return result;
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
      const normalized = normalizeSearch(searchText)
      // If finalSearch matches a category slug and no category filter set, use category filter
      if (!selectedCategory && KNOWN_CATEGORIES.some(cat => cat.slug === normalized)) {
        params.set('category', normalized)
      } else if (normalized) {
        params.set('search', normalized)
      }

      if (selectedCategory) {
        params.set('category', selectedCategory)
      }

      try {
        const res = await fetch(`/api/products?${params.toString()}`)
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch search results')
        }
        
        let products = (Array.isArray(data.products) ? data.products : []).map((p) => {
          let urls = []
          try {
            urls = Array.isArray(p.imageUrls) ? p.imageUrls : JSON.parse(p.imageUrls || '[]')
          } catch {
            urls = []
          }
          // Check if product is new (less than 14 days old)
          const isNew = p.createdAt && new Date(p.createdAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
          return { ...p, imageUrls: urls, isNew }
        })
        // If normalized term matches a category slug and no category filter is set, skip fuzzy filtering
        const isCategorySearch = !selectedCategory && KNOWN_CATEGORIES.some(cat => cat.slug === normalized)
        if (isCategorySearch) {
          products = products.map(p => ({ ...p, _matches: [] }))
        } else {
          // Apply weighted fuzzy matching with match data
          const fuse = new Fuse(products, {
            keys: [
              { name: 'name', weight: 0.7 },
              { name: 'shortDesc', weight: 0.2 },
              { name: 'category.name', weight: 0.1 },
            ],
            threshold: 0.3,
            includeMatches: true,
          })
          const fuseResults = fuse.search(normalized)
          products = fuseResults.map((r: any) => ({ ...r.item, _matches: r.matches }))
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
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [searchText, selectedCategory])

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    const finalSearch = normalizeSearch(searchText)
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
            <div className={styles.list}>
              {searchResults.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  handleProductClick={handleProductClick}
                />
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