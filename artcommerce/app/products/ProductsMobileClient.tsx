'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './productsMobile.module.css'
import WishlistButton from '../components/WishlistButton'
import MobileFilterSortBar from '../components/MobileFilterSortBar'
import { useRouter, useSearchParams } from 'next/navigation'
import MobileProductsSkeleton from './MobileProductsSkeleton'
import { FiFilter, FiX, FiChevronRight, FiStar, FiPackage, FiTrendingUp, FiGrid, FiHeart, FiChevronLeft, FiClock, FiZap } from 'react-icons/fi'
import { useProductFilters } from '../hooks/useProductFilters'
import { useImagePreload } from '../hooks/useImagePreload'
import OptimizedProductTransition from '../components/OptimizedProductTransition'
import { usePerformanceOptimization, createAnimationDebouncer } from '../../lib/performanceUtils'

// Elegant and smooth animation variants for premium feel
const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 40,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      duration: 0.8,
      bounce: 0.1,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
      duration: 0.4
    }
  },
  tap: {
    scale: 0.96,
    y: 2,
    transition: {
      type: "spring" as const,
      stiffness: 600,
      damping: 30,
      duration: 0.3
    }
  }
}

// Elegant product opening animation with smooth scaling
const productOpenVariants = {
  initial: {
    scale: 1,
    opacity: 1,
    rotateY: 0
  },
  animate: {
    scale: 1.08,
    opacity: 0.7,
    rotateY: 2,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
}

// Elegant staggered animation for product list with slower, more luxurious timing
const listVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // Increased for more elegant staggering
      delayChildren: 0.15,   // Increased delay for smoother start
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
}

// Define known categories similar to desktop version
const KNOWN_CATEGORIES = [
  { slug: 'clocks', name: 'Clocks' },
  { slug: 'pots', name: 'Pots' },
  { slug: 'tray', name: 'Trays' },
  { slug: 'Tray', name: 'Jewelry Trays' },
  { slug: 'rangoli', name: 'Rangoli' },
  { slug: 'decor', name: 'Wall Decor' },
  { slug: 'matt rangoli', name: 'Matt Rangoli' },
  { slug: 'mirror work', name: 'Mirror Work' }
]

// Product Card with Swipeable Images component
const ProductCard = ({ product, formatPrice, onParticleTransition }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [showHints, setShowHints] = useState(true);
  const [isPressed, setIsPressed] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const imageContainerRef = useRef(null);
  const containerWidth = useRef(0);
  const router = useRouter();
  
  // Optimized image preloading
  const { isImageLoaded, preloadImage } = useImagePreload(product.imageUrls, {
    priorityCount: 1, // Only preload first image immediately
    maxConcurrentPreloads: 2,
    enableLazyLoading: true
  });
  
  // Hide hints after first interaction or after timeout
  useEffect(() => {
    const timer = setTimeout(() => setShowHints(false), 4000);
    return () => clearTimeout(timer);
  }, []);
  
  // Preload next/previous images on swipe
  useEffect(() => {
    if (product.imageUrls.length <= 1) return;
    
    // Preload adjacent images when current changes
    const nextIndex = currentImageIndex + 1;
    const prevIndex = currentImageIndex - 1;
    
    if (nextIndex < product.imageUrls.length) {
      preloadImage(product.imageUrls[nextIndex]);
    }
    if (prevIndex >= 0) {
      preloadImage(product.imageUrls[prevIndex]);
    }
  }, [currentImageIndex, product.imageUrls, preloadImage]);

  // Handle product card click with particle transition
  const handleProductClick = useCallback((e) => {
    e.preventDefault();
    setIsOpening(true);
    
    // Trigger particle transition
    if (onParticleTransition) {
      onParticleTransition(() => {
        router.push(`/products/${product.id}`);
      });
    } else {
      // Fallback without particles
      setTimeout(() => {
        router.push(`/products/${product.id}`);
      }, 200);
    }
  }, [product.id, router, onParticleTransition]);
  
  // Direct touch event handlers for better reliability
  const handleTouchStart = (e) => {
    if (product.imageUrls.length <= 1) return;
    
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
      // During swipe, follow finger exactly
      const percentageOffset = containerWidth.current ? (swipeDistance / containerWidth.current) * 100 : 0;
      return {
        transform: `translateX(calc(-${currentImageIndex * 100}% + ${percentageOffset}%))`,
        transition: 'none'
      };
    }
    
    // When not swiping, use smooth transition
    return {
      transform: `translateX(-${currentImageIndex * 100}%)`,
      transition: 'transform 0.3s ease'
    };
  };
  
  // Format short description
  const getShortDescription = () => {
    if (!product.shortDesc) return null;
    return product.shortDesc.length > 60 
      ? `${product.shortDesc.substring(0, 60)}...` 
      : product.shortDesc;
  };
  
  return (
    <motion.div 
      className={styles.cardWrapper}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      exit="exit"
      layout
      style={{ perspective: 1000 }}
    >
      <motion.div
        className={styles.card}
        onClick={handleProductClick}
        variants={isOpening ? productOpenVariants : {}}
        initial="initial"
        animate={isOpening ? "animate" : "initial"}
        exit="exit"
        style={{ cursor: 'pointer' }}
      >
        <motion.div 
          className={styles.imageContainer}
          ref={imageContainerRef}
          onClick={handleImageTap}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <motion.div 
            className={styles.imageSlider} 
            style={getImageTransform()}
            animate={{ opacity: isOpening ? 0.8 : 1 }}
            transition={{ duration: 0.3 }}
          >
            {product.imageUrls.map((url, index) => (
              <div key={index} className={styles.imageSlide}>
                <motion.img 
                  src={url}
                  alt={`${product.name} - Image ${index + 1}`}
                  className={styles.image}
                  loading={index === 0 || index === 1 ? "eager" : "lazy"}
                  draggable="false"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              </div>
            ))}
          </motion.div>
          
          {product.imageUrls.length === 0 && (
            <div className={styles.noImage}>No image</div>
          )}
          
          {product.isNew && (
            <motion.span 
              className={styles.badge}
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 500 }}
            >
              New
            </motion.span>
          )}
          {product.stockQuantity === 0 && (
            <motion.div 
              className={styles.outOfStock}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Out of Stock
            </motion.div>
          )}
          {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
            <motion.div 
              className={styles.lowStock}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
            >
              Only {product.stockQuantity} left
            </motion.div>
          )}
          
          {/* Image indicators */}
          {product.imageUrls.length > 1 && (
            <motion.div 
              className={styles.imageIndicators}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {product.imageUrls.map((_, index) => (
                <motion.div 
                  key={index} 
                  className={`${styles.indicator} ${index === currentImageIndex ? styles.activeIndicator : ''}`}
                  whileHover={{ scale: 1.2 }}
                  animate={{ 
                    width: index === currentImageIndex ? 20 : 16,
                    backgroundColor: index === currentImageIndex ? '#000' : 'rgba(0, 0, 0, 0.3)'
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              ))}
            </motion.div>
          )}
          
          {/* Swipe hints - only show if multiple images and on first render */}
          <AnimatePresence>
            {showHints && product.imageUrls.length > 1 && (
              <>
                {currentImageIndex > 0 && (
                  <motion.div 
                    className={styles.swipeRightHint}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 0.7, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: 1, duration: 0.5 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </motion.div>
                )}
                {currentImageIndex < product.imageUrls.length - 1 && (
                  <motion.div 
                    className={styles.swipeLeftHint}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 0.7, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: 1, duration: 0.5 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </motion.div>
        
        <motion.div 
          className={styles.info}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {product.category && (
            <motion.div 
              className={styles.categoryTag}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {product.category.name}
            </motion.div>
          )}
          <motion.h3 
            className={styles.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {product.name}
          </motion.h3>
          
          <motion.div 
            className={styles.priceRow}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className={styles.price}>{formatPrice(product.price)}</p>
            {product.avgRating > 0 && (
              <motion.p 
                className={styles.productRating}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 400 }}
              >
                <span className={styles.starFilled}>★</span> 
                <span className={styles.ratingValue}>{product.avgRating.toFixed(1)}</span>
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className={styles.wishlistContainer} 
        onClick={handleWishlistClick}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 500 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <WishlistButton 
          productId={product.id} 
          className={`${styles.wishlistButton} ${styles.blackWishlist}`}
          preventNavigation={true}
        />
      </motion.div>
    </motion.div>
  );
};

// Enhanced Pagination Skeleton Loading Component with smart loading states
const PaginationSkeleton = ({ isTransitioning = false }) => {
  return (
    <div className={`${styles.paginationSkeleton} ${isTransitioning ? styles.transitioning : ''}`}>
      <div className={styles.skeletonPrevNext}></div>
      {[...Array(5)].map((_, index) => (
        <div key={index} className={`${styles.skeletonButton} ${index === 2 ? styles.skeletonActive : ''}`}>
          <div className={styles.skeletonShimmer}></div>
        </div>
      ))}
      <div className={styles.skeletonPrevNext}></div>
    </div>
  )
}

// Progress Bar Component
const PaginationProgress = ({ current, total, isLoading }) => {
  const progressPercentage = total > 0 ? (current / total) * 100 : 0
  
  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressBar}>
        <div 
          className={`${styles.progressFill} ${isLoading ? styles.progressLoading : ''}`}
          style={{ width: `${progressPercentage}%` }}
        >
          <div className={styles.progressGlow}></div>
        </div>
      </div>
      <div className={styles.progressText}>
        <span className={styles.progressCurrent}>{current}</span>
        <span className={styles.progressSeparator}>of</span>
        <span className={styles.progressTotal}>{total}</span>
      </div>
    </div>
  )
}

export default function ProductsMobileClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Performance optimization hook
  const { config: perfConfig, trackAnimation } = usePerformanceOptimization()
  
  // Create debounced animation trigger
  const debouncedParticleTransition = useMemo(() => createAnimationDebouncer(200), [])
  
  // Consolidated state management using optimized hooks
  const { 
    filters, 
    tempFilters, 
    updateTempFilter, 
    applyTempFilters, 
    resetTempFilters 
  } = useProductFilters()
  
  // Remaining component state (reduced from 15+ to 7 variables)
  const [allProducts, setAllProducts] = useState([])
  const [products, setProducts] = useState([])
  const [usageTags, setUsageTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [isParticleTransitionActive, setIsParticleTransitionActive] = useState(false)
  const [isPageChanging, setIsPageChanging] = useState(false) // Add pagination loading state
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useState(true) // New: keyboard shortcuts state
  const [lastPageChangeTime, setLastPageChangeTime] = useState(0) // New: for rate limiting
  const [pageChangeDirection, setPageChangeDirection] = useState('') // New: track direction for animations
  const [openSections, setOpenSections] = useState({
    category: true,
    rating: true,
    stock: true,
    sort: true
  });

  // Pagination state with URL sync
  const [currentPage, setCurrentPage] = useState(() => {
    // Initialize from URL params if available
    const urlPage = searchParams.get('page')
    return urlPage ? Math.max(1, parseInt(urlPage, 10)) : 1
  })
  const productsPerPage = 16 // Optimized for 2x8 mobile grid layout
  
  // Extract individual filter values for easier use
  const {
    category: currentCategory,
    usageTag: currentTag,
    priceMin,
    priceMax,
    sortOrder,
    ratingMin,
    lowStockOnly,
    inStockOnly
  } = filters
  
  // Get current category name for display with context-aware labels
  const getCurrentCategoryName = () => {
    if (!currentCategory) return 'All Products';
    const category = KNOWN_CATEGORIES.find(cat => cat.slug === currentCategory);
    const count = allProducts.length
    const name = category ? category.name : 'Products'
    return count > 0 ? `${name} (${count})` : name;
  };

  // Get current sort display name with context-aware labels
  const getCurrentSortName = () => {
    const count = allProducts.length
    switch (sortOrder) {
      case 'oldest': return `Oldest First • ${count} items`;
      case 'price_asc': return `Price: Low to High • ${count} items`;
      case 'price_desc': return `Price: High to Low • ${count} items`;
      case 'rating-desc': return `Top Rated • ${count} items`;
      default: return `Recommended • ${count} items`;
    }
  };

  // Pagination calculations with safety checks
  const totalProducts = allProducts.length
  const safeProductsPerPage = Math.max(productsPerPage, 1) // Prevent division by zero
  const totalPages = Math.ceil(totalProducts / safeProductsPerPage)
  const startIndex = (currentPage - 1) * safeProductsPerPage
  const endIndex = startIndex + safeProductsPerPage
  const paginatedProducts = allProducts.slice(startIndex, endIndex)

  // Update products when pagination changes
  useEffect(() => {
    const newPaginatedProducts = allProducts.slice(startIndex, endIndex)
    setProducts(newPaginatedProducts)
  }, [allProducts, startIndex, endIndex])

  // Validate and adjust currentPage when totalPages changes
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      // If current page exceeds total pages, reset to last valid page
      const lastValidPage = Math.max(1, totalPages)
      setCurrentPage(lastValidPage)
      updatePageInURL(lastValidPage)
    }
  }, [totalPages, currentPage])

  // Keyboard shortcuts for pagination (1-9 for pages)
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle if shortcuts are enabled and we're not in an input field
      if (!keyboardShortcutsEnabled || 
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) ||
          event.target.contentEditable === 'true') {
        return
      }

      // Rate limiting - prevent rapid key presses
      const now = Date.now()
      if (now - lastPageChangeTime < 300) {
        return
      }

      const key = event.key
      
      // Handle number keys 1-9 for direct page navigation
      if (/^[1-9]$/.test(key)) {
        event.preventDefault()
        const targetPage = parseInt(key, 10)
        if (targetPage <= totalPages) {
          setLastPageChangeTime(now)
          handlePageSelect(targetPage, 'direct')
        }
        return
      }

      // Handle arrow keys and other shortcuts
      switch (key) {
        case 'ArrowLeft':
        case 'h': // Vim-style navigation
          event.preventDefault()
          if (currentPage > 1) {
            setLastPageChangeTime(now)
            handlePreviousPage()
          }
          break
        case 'ArrowRight':
        case 'l': // Vim-style navigation
          event.preventDefault()
          if (currentPage < totalPages) {
            setLastPageChangeTime(now)
            handleNextPage()
          }
          break
        case 'Home':
        case 'g': // Go to first page
          event.preventDefault()
          if (currentPage !== 1) {
            setLastPageChangeTime(now)
            handlePageSelect(1, 'first')
          }
          break
        case 'End':
        case 'G': // Go to last page (shift+g)
          event.preventDefault()
          if (currentPage !== totalPages) {
            setLastPageChangeTime(now)
            handlePageSelect(totalPages, 'last')
          }
          break
        case 'Escape':
          // Disable keyboard shortcuts temporarily
          setKeyboardShortcutsEnabled(false)
          setTimeout(() => setKeyboardShortcutsEnabled(true), 2000)
          break
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentPage, totalPages, keyboardShortcutsEnabled, lastPageChangeTime])

  // Show keyboard shortcuts hint on first visit
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('pagination-keyboard-hint-seen')
    if (!hasSeenHint && totalPages > 1) {
      setTimeout(() => {
        // Show toast or hint - you can implement this
        console.log('Tip: Use number keys 1-9 to jump to pages, arrow keys to navigate!')
        localStorage.setItem('pagination-keyboard-hint-seen', 'true')
      }, 2000)
    }
  }, [totalPages])

  // Pagination handlers with better scroll positioning
  const scrollToProductsTop = () => {
    // Use setTimeout to ensure state updates are complete
    setTimeout(() => {
      // Find the products list container and scroll to it
      const productsContainer = document.querySelector('.products-container')
      if (productsContainer) {
        // Calculate position to scroll a bit above the products container
        const containerRect = productsContainer.getBoundingClientRect()
        const scrollY = window.pageYOffset + containerRect.top - 80 // 80px above the container
        window.scrollTo({ 
          top: scrollY, 
          behavior: 'smooth' 
        })
      } else {
        // Fallback to page header if products container not found
        const pageHeader = document.querySelector('.page-header')
        if (pageHeader) {
          const headerRect = pageHeader.getBoundingClientRect()
          const scrollY = window.pageYOffset + headerRect.top - 40 // 40px above the header
          window.scrollTo({ 
            top: scrollY, 
            behavior: 'smooth' 
          })
        } else {
          // Final fallback to top of page with some offset
          window.scrollTo({ top: 60, behavior: 'smooth' }) // 60px from very top
        }
      }
    }, 100) // Small delay to ensure DOM updates
  }

  const updatePageInURL = (page: number) => {
    const qs = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      qs.delete('page') // Remove page param for page 1 to keep URL clean
    } else {
      qs.set('page', page.toString())
    }
    const newURL = qs.toString() ? `/products?${qs}` : '/products'
    router.replace(newURL, { scroll: false }) // Don't auto-scroll, we handle it manually
  }

  const handlePreviousPage = () => {
    if (currentPage > 1 && !isPageChanging) {
      setIsPageChanging(true)
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      updatePageInURL(newPage)
      scrollToProductsTop()
      // Reset loading state after scroll completes with better timing
      setTimeout(() => setIsPageChanging(false), 300)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages && !isPageChanging) {
      setIsPageChanging(true)
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      updatePageInURL(newPage)
      scrollToProductsTop()
      // Reset loading state after scroll completes with better timing
      setTimeout(() => setIsPageChanging(false), 300)
    }
  }

  const handlePageSelect = (page: number, direction?: string) => {
    if (page !== currentPage && page >= 1 && page <= totalPages && !isPageChanging) {
      setIsPageChanging(true)
      setPageChangeDirection(direction || '')
      setCurrentPage(page)
      updatePageInURL(page)
      scrollToProductsTop()
      // Reset loading state after scroll completes with better timing
      setTimeout(() => {
        setIsPageChanging(false)
        setPageChangeDirection('')
      }, 300)
    }
  }

  // Handle sort selection
  const handleSortSelect = (sortValue: string) => {
    const qs = new URLSearchParams(searchParams.toString());
    if (sortValue === '' || sortValue === 'newest') {
      qs.delete('sort');
    } else {
      qs.set('sort', sortValue);
    }
    router.replace(qs.toString() ? `/products?${qs}` : '/products');
    setIsSortOpen(false);
  };

  // Toggle filter sections
  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Apply filters
  const applyFilters = () => {
    const qs = new URLSearchParams();
    
    if (tempFilters.category) qs.set('category', tempFilters.category);
    if (tempFilters.usageTag) qs.set('usageTag', tempFilters.usageTag);
    if (tempFilters.priceMin) qs.set('priceMin', tempFilters.priceMin);
    if (tempFilters.priceMax) qs.set('priceMax', tempFilters.priceMax);
    if (tempFilters.ratingMin) qs.set('ratingMin', tempFilters.ratingMin);
    if (tempFilters.lowStockOnly) qs.set('lowStock', 'true');
    if (tempFilters.inStockOnly) qs.set('inStock', 'true');
    
    router.replace(qs.toString() ? `/products?${qs}` : '/products');
    setIsMobileFilterOpen(false);
  };

  // Clear all filters
  const clearAllFilters = () => {
    router.replace('/products');
    setIsMobileFilterOpen(false);
  };

  // Reset temp filters when opening filter drawer
  const handleFilterOpen = () => {
    resetTempFilters();
    setIsMobileFilterOpen(true);
  };

  // Fetch list of available usage tags once
  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await fetch('/api/products/usage-tags')
        const data = await res.json()
        if (Array.isArray(data.tags)) setUsageTags(data.tags)
      } catch (err) {
        console.error('Failed to fetch usage tags:', err)
      }
    }
    fetchTags()
  }, [])

  // fetch products from API with filters
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (currentCategory) {
        params.set('category', currentCategory)
      }
      if (currentTag) {
        params.set('usageTag', currentTag)
      }
      if (priceMin) params.set('priceMin', priceMin)
      if (priceMax) params.set('priceMax', priceMax)
      if (sortOrder) params.set('sort', sortOrder)
      if (lowStockOnly) params.set('lowStock', 'true')
      if (inStockOnly) params.set('inStock', 'true')
      if (ratingMin) params.set('ratingMin', ratingMin)
      
      try {
        const res = await fetch(`/api/products?${params.toString()}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch products')
        
        // Normalize imageUrls
        let filteredProducts = (Array.isArray(data.products) ? data.products : []).map((p) => {
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
        
        // Client-side category filtering as backup
        if (currentCategory && filteredProducts.length > 0) {
          filteredProducts = filteredProducts.filter((product) => {
            const categorySlug = product.category?.slug || ''
            return categorySlug === currentCategory
          })
        }
        
        // Client-side tag filtering as backup
        if (currentTag && filteredProducts.length > 0) {
          filteredProducts = filteredProducts.filter((product) => {
            return Array.isArray(product.usageTags) && product.usageTags.includes(currentTag)
          })
        }
        
        setAllProducts(filteredProducts)
        setCurrentPage(1) // Reset to first page when filters change
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [currentCategory, currentTag, priceMin, priceMax, sortOrder, lowStockOnly, inStockOnly, ratingMin])

  // Handle wishlist button click to prevent navigation
  const handleWishlistClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // Format price with commas for thousands
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(price);
  };

  // Handle particle transition with performance optimization
  const handleParticleTransition = useCallback((onComplete) => {
    debouncedParticleTransition(() => {
      const startTime = performance.now()
      setIsParticleTransitionActive(true)
      
      // Track animation performance
      const originalOnComplete = onComplete
      const trackedOnComplete = () => {
        const endTime = performance.now()
        trackAnimation('particle-transition', startTime, endTime)
        if (originalOnComplete) originalOnComplete()
      }
      
      // Use performance-optimized duration
      setTimeout(trackedOnComplete, perfConfig.animationDuration || 600)
    })
  }, [debouncedParticleTransition, trackAnimation, perfConfig.animationDuration]);

  // Render filters similar to desktop sidebar
  const renderFilters = () => {
    return (
      <>
        {/* Category filter */}
        <details open={openSections.category} className={styles.filterSection}>
          <summary 
            className={styles.filterHeader}
            onClick={(e) => {
              e.preventDefault();
              toggleSection('category');
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <FiGrid style={{ marginRight: '8px' }} />
              Category
            </span>
            <FiChevronRight className={styles.arrow} />
          </summary>
          <div className={styles.filterContent}>
            {KNOWN_CATEGORIES.map(cat => (
              <label key={cat.slug} className={styles.filterOption}>
                <input
                  type="radio"
                  name="categoryFilter"
                  checked={tempFilters.category === cat.slug}
                  onChange={() => {
                    updateTempFilter('category', 
                      tempFilters.category === cat.slug ? '' : cat.slug
                    )
                  }}
                />
                {cat.name}
              </label>
            ))}
          </div>
        </details>

        {/* Rating */}
        <details open={openSections.rating} className={styles.filterSection}>
          <summary 
            className={styles.filterHeader}
            onClick={(e) => {
              e.preventDefault();
              toggleSection('rating');
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <FiStar style={{ marginRight: '8px' }} />
              Rating
            </span>
            <FiChevronRight className={styles.arrow} />
          </summary>
          <div className={styles.filterContent}>
            {[4,3,2,1].map(thr => (
              <label key={thr} className={styles.filterOption}>
                <input
                  type="radio"
                  name="ratingFilter"
                  checked={Number(tempFilters.ratingMin) === thr}
                  onChange={() => {
                    updateTempFilter('ratingMin', 
                      Number(tempFilters.ratingMin) === thr ? '' : String(thr)
                    )
                  }}
                />
                {thr}+ stars
              </label>
            ))}
          </div>
        </details>

        {/* Stock */}
        <details open={openSections.stock} className={styles.filterSection}>
          <summary 
            className={styles.filterHeader}
            onClick={(e) => {
              e.preventDefault();
              toggleSection('stock');
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <FiPackage style={{ marginRight: '8px' }} />
              Stock
            </span>
            <FiChevronRight className={styles.arrow} />
          </summary>
          <div className={styles.filterContent}>
            <label className={styles.filterOption}>
              <input
                type="checkbox"
                checked={tempFilters.lowStockOnly}
                onChange={e => {
                  updateTempFilter('lowStockOnly', e.target.checked)
                }}
              />
              Only low stock
            </label>
            <label className={styles.filterOption}>
              <input
                type="checkbox"
                checked={tempFilters.inStockOnly}
                onChange={e => {
                  updateTempFilter('inStockOnly', e.target.checked)
                }}
              />
              In stock only
            </label>
          </div>
        </details>

      </>
    );
  };

  return (
    <div className={styles.container}>
      {/* Page header with title */}
      <div className={`${styles.pageHeader} page-header`}>
        <h1 className={styles.pageTitle}>{getCurrentCategoryName()}</h1>
        {products.length > 0 && (
          <p className={styles.resultCount}>{products.length} products</p>
        )}
      </div>

      {/* Sticky Filter/Sort Bar */}
      <MobileFilterSortBar
        onFilterClick={handleFilterOpen}
        onSortClick={() => setIsSortOpen(true)}
        currentSort={getCurrentSortName()}
      />
      
      {/* Active filters display */}
      {(currentCategory || currentTag || priceMin || priceMax || sortOrder || lowStockOnly || inStockOnly || ratingMin) && (
        <div className={styles.mobileActiveFilters}>
          {currentCategory && (
            <div className={styles.mobileFilterTag}>
              Category: {KNOWN_CATEGORIES.find(c => c.slug === currentCategory)?.name || currentCategory}
              <button onClick={() => {
                const qs = new URLSearchParams(searchParams.toString())
                qs.delete('category')
                router.replace(qs.toString() ? `/products?${qs}` : '/products')
              }}>×</button>
            </div>
          )}
          {currentTag && (
            <div className={styles.mobileFilterTag}>
              Tag: {currentTag}
              <button onClick={() => {
                const qs = new URLSearchParams(searchParams.toString())
                qs.delete('usageTag')
                router.replace(qs.toString() ? `/products?${qs}` : '/products')
              }}>×</button>
            </div>
          )}
          {inStockOnly && (
            <div className={styles.mobileFilterTag}>
              In Stock Only
              <button onClick={() => {
                const qs = new URLSearchParams(searchParams.toString())
                qs.delete('inStock')
                router.replace(qs.toString() ? `/products?${qs}` : '/products')
              }}>×</button>
            </div>
          )}
          {sortOrder && (
            <div className={styles.mobileFilterTag}>
              Sort: {sortOrder.replace('_', ' ')}
              <button onClick={() => {
                const qs = new URLSearchParams(searchParams.toString())
                qs.delete('sort')
                router.replace(qs.toString() ? `/products?${qs}` : '/products')
              }}>×</button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <MobileProductsSkeleton />
      ) : error ? (
        <div className={styles.error}>
          <p>Error: {error}</p>
          <button 
            onClick={() => router.refresh()}
            className={styles.clearButton}
          >
            Try Again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className={styles.error}>
          <p>No products found</p>
          <button 
            onClick={() => {
              router.replace('/products')
            }}
            className={styles.clearButton}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className={styles.mainContent}>
          <motion.div 
            className={`${styles.list} products-container`}
            variants={listVariants}
            initial="hidden"
            animate="visible"
            // Removed key={currentPage} to prevent unmounting
          >
            {isPageChanging ? (
              // Show skeleton during page transitions
              <div className={styles.skeletonContainer}>
                {[...Array(16)].map((_, index) => (
                  <div key={`skeleton-${index}`} className={styles.skeletonCard}>
                    <div className={styles.skeletonImage}></div>
                    <div className={styles.skeletonContent}>
                      <div className={styles.skeletonTitle}></div>
                      <div className={styles.skeletonPrice}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    formatPrice={formatPrice}
                    onParticleTransition={handleParticleTransition}
                  />
                ))}
              </AnimatePresence>
            )}
          </motion.div>

          {/* Enhanced Pagination Controls */}
          {totalPages > 1 && (
            <motion.div 
              className={`${styles.paginationContainer} ${isPageChanging ? styles.loading : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {/* Progress indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <PaginationProgress 
                  current={currentPage} 
                  total={totalPages} 
                  isLoading={isPageChanging} 
                />
              </motion.div>
              
              <motion.div 
                className={styles.paginationInfo}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className={styles.paginationInfoText}>
                  <FiZap className={styles.paginationIcon} />
                  Page {currentPage} of {totalPages} • {startIndex + 1}-{Math.min(endIndex, totalProducts)} of {totalProducts} items
                  {keyboardShortcutsEnabled && totalPages <= 9 && (
                    <span className={styles.keyboardHint}>
                      <FiClock size={10} /> Press {currentPage === totalPages ? '1' : (currentPage + 1)} for next
                    </span>
                  )}
                </span>
              </motion.div>
              
              {isPageChanging ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <PaginationSkeleton isTransitioning={true} />
                </motion.div>
              ) : (
                <motion.div 
                  className={styles.paginationControls}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {/* Previous Button */}
                  <motion.button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || isPageChanging}
                    className={styles.paginationPrevNext}
                    aria-label="Previous page"
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <FiChevronLeft size={16} />
                  </motion.button>
                  
                  {/* Page Numbers - Enhanced smart display logic */}
                  <div className={styles.paginationNumbers}>
                    {(() => {
                      const pages = []
                      
                      // For 5 or fewer pages, show all
                      if (totalPages <= 5) {
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(
                            <motion.button
                              key={i}
                              onClick={() => handlePageSelect(i)}
                              disabled={isPageChanging}
                              className={`${styles.pageNumber} ${i === currentPage ? styles.pageNumberActive : ''}`}
                              aria-label={`Page ${i}`}
                              aria-current={i === currentPage ? 'page' : undefined}
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ 
                                opacity: 1, 
                                scale: i === currentPage ? 1.1 : 1,
                                y: i === currentPage ? -2 : 0
                              }}
                              transition={{ 
                                type: "spring", 
                                stiffness: 400, 
                                damping: 25,
                                delay: i * 0.05
                              }}
                            >
                              {i}
                            </motion.button>
                          )
                        }
                      } else {
                        // For more than 5 pages, show smart pagination
                        
                        // Always show first page
                        pages.push(
                          <motion.button
                            key={1}
                            onClick={() => handlePageSelect(1)}
                            disabled={isPageChanging}
                            className={`${styles.pageNumber} ${1 === currentPage ? styles.pageNumberActive : ''}`}
                            aria-label="Page 1"
                            aria-current={1 === currentPage ? 'page' : undefined}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ 
                              opacity: 1, 
                              scale: 1 === currentPage ? 1.1 : 1,
                              y: 1 === currentPage ? -2 : 0
                            }}
                            transition={{ 
                              type: "spring", 
                              stiffness: 400, 
                              damping: 25
                            }}
                          >
                            1
                          </motion.button>
                        )
                        
                        // Show dots if there's a gap between 1 and the current range
                        if (currentPage > 3) {
                          pages.push(
                            <motion.span 
                              key="dots1" 
                              className={styles.paginationDots}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1 }}
                            >
                              …
                            </motion.span>
                          )
                        }
                        
                        // Show current page and neighbors (excluding first and last which are handled separately)
                        const start = Math.max(2, currentPage - 1)
                        const end = Math.min(totalPages - 1, currentPage + 1)
                        
                        for (let i = start; i <= end; i++) {
                          // Skip first and last page as they're handled separately
                          if (i !== 1 && i !== totalPages) {
                            pages.push(
                              <motion.button
                                key={i}
                                onClick={() => handlePageSelect(i)}
                                disabled={isPageChanging}
                                className={`${styles.pageNumber} ${i === currentPage ? styles.pageNumberActive : ''}`}
                                aria-label={`Page ${i}`}
                                aria-current={i === currentPage ? 'page' : undefined}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ 
                                  opacity: 1, 
                                  scale: i === currentPage ? 1.1 : 1,
                                  y: i === currentPage ? -2 : 0
                                }}
                                transition={{ 
                                  type: "spring", 
                                  stiffness: 400, 
                                  damping: 25,
                                  delay: (i - start) * 0.05
                                }}
                              >
                                {i}
                              </motion.button>
                            )
                          }
                        }
                        
                        // Show dots if there's a gap between current range and last page
                        if (currentPage < totalPages - 2) {
                          pages.push(
                            <motion.span 
                              key="dots2" 
                              className={styles.paginationDots}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              …
                            </motion.span>
                          )
                        }
                        
                        // Always show last page (if it's different from first page)
                        if (totalPages > 1) {
                          pages.push(
                            <motion.button
                              key={totalPages}
                              onClick={() => handlePageSelect(totalPages)}
                              disabled={isPageChanging}
                              className={`${styles.pageNumber} ${totalPages === currentPage ? styles.pageNumberActive : ''}`}
                              aria-label={`Page ${totalPages}`}
                              aria-current={totalPages === currentPage ? 'page' : undefined}
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ 
                                opacity: 1, 
                                scale: totalPages === currentPage ? 1.1 : 1,
                                y: totalPages === currentPage ? -2 : 0
                              }}
                              transition={{ 
                                type: "spring", 
                                stiffness: 400, 
                                damping: 25,
                                delay: 0.3
                              }}
                            >
                              {totalPages}
                            </motion.button>
                          )
                        }
                      }
                      
                      return pages
                    })()}
                  </div>
                  
                  {/* Next Button */}
                  <motion.button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || isPageChanging}
                    className={styles.paginationPrevNext}
                    aria-label="Next page"
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <FiChevronRight size={16} />
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <motion.div 
            className={styles.mobileFilterOverlay}
            onClick={() => setIsMobileFilterOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
      
      <motion.div 
        className={`${styles.mobileFilterDrawer} ${isMobileFilterOpen ? styles.mobileFilterDrawerOpen : ''}`}
        onClick={(e) => e.stopPropagation()}
        initial={{ x: "100%" }}
        animate={{ x: isMobileFilterOpen ? "0%" : "100%" }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          mass: 0.8
        }}
      >
        <AnimatePresence>
          {isMobileFilterOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <motion.div 
                className={styles.mobileFilterHeader}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2>Filter Products</h2>
                <motion.button 
                  className={styles.mobileFilterCloseButton}
                  onClick={() => setIsMobileFilterOpen(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <FiX size={20} />
                </motion.button>
              </motion.div>
              
              <motion.div 
                className={styles.mobileFilterContent}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {loading ? (
                  <div className={styles.filterSkeletonContainer}>
                    {[...Array(3)].map((_, index) => (
                      <motion.div 
                        key={index} 
                        className={styles.filterSectionSkeleton}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={styles.filterHeaderSkeleton}>
                          <div className={styles.filterTitleSkeleton}></div>
                          <div className={styles.filterArrowSkeleton}></div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {renderFilters()}
                  </motion.div>
                )}
              </motion.div>
              
              <motion.div 
                className={styles.mobileFilterActions}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {loading ? (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {[80, 100].map((width, index) => (
                      <motion.div 
                        key={index}
                        style={{
                          height: '40px',
                          width: `${width}px`,
                          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 2s infinite',
                          borderRadius: '6px'
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    <motion.button 
                      className={styles.clearFilterButton}
                      onClick={clearAllFilters}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      Clear All
                    </motion.button>
                    <motion.button 
                      className={styles.applyFilterButton}
                      onClick={applyFilters}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      Apply
                    </motion.button>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Sort Bottom Sheet */}
      <AnimatePresence>
        {isSortOpen && (
          <motion.div 
            className={styles.sortOverlay}
            onClick={() => setIsSortOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
      
      <motion.div 
        className={`${styles.sortModal} ${isSortOpen ? styles.sortModalVisible : ''}`}
        initial={{ y: "100%" }}
        animate={{ y: isSortOpen ? "0%" : "100%" }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          mass: 0.8
        }}
      >
        <AnimatePresence>
          {isSortOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <motion.div 
                className={styles.sortHeader}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3>SORT BY</h3>
              </motion.div>
              
              <motion.div 
                className={styles.sortOptions}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {[
                  { value: '', label: 'Recommended', active: sortOrder === '' || sortOrder === 'newest' },
                  { value: 'oldest', label: 'Oldest', active: sortOrder === 'oldest' },
                  { value: 'price_desc', label: 'Price High to Low', active: sortOrder === 'price_desc' },
                  { value: 'price_asc', label: 'Price Low to High', active: sortOrder === 'price_asc' }
                ].map((option, index) => (
                  <motion.button 
                    key={option.value}
                    className={`${styles.sortOption} ${option.active ? styles.active : ''}`}
                    onClick={() => handleSortSelect(option.value)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (index * 0.05) }}
                    whileHover={{ backgroundColor: '#f8f8f8', x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div 
                      className={`${styles.sortRadio} ${option.active ? styles.active : ''}`}
                      whileHover={{ scale: 1.1 }}
                      animate={{ 
                        borderColor: option.active ? '#000' : '#ddd',
                        scale: option.active ? 1.1 : 1
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                    <span className={styles.sortOptionText}>{option.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Floating Close Button for Sort Modal */}
      <AnimatePresence>
        {isSortOpen && (
          <motion.button 
            onClick={() => setIsSortOpen(false)} 
            className={styles.closeSortButton}
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 25,
              delay: 0.2
            }}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiX size={24} />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Optimized Particle Transition Overlay */}
      <OptimizedProductTransition 
        isActive={isParticleTransitionActive}
        onComplete={() => setIsParticleTransitionActive(false)}
      />
    </div>
  );
} 