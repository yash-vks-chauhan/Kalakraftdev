'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import styles from './productsMobile.module.css'
import WishlistButton from '../components/WishlistButton'
import MobileFilterSortBar from '../components/MobileFilterSortBar'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiFilter, FiX, FiChevronRight, FiStar, FiPackage, FiTrendingUp, FiGrid, FiHeart, FiChevronLeft } from 'react-icons/fi'
import { useProductFilters } from '../hooks/useProductFilters'
import { useImagePreload } from '../hooks/useImagePreload'

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
const ProductCard = ({ product, formatPrice }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [showHints, setShowHints] = useState(true);
  const imageContainerRef = useRef(null);
  const containerWidth = useRef(0);
  
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
    <div className={styles.cardWrapper}>
      <Link href={`/products/${product.id}`} className={styles.card}>
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
              {product.category.name}
            </div>
          )}
          <h3 className={styles.name}>{product.name}</h3>
          
          
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
      </Link>
      
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

export default function ProductsMobileClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
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
  const [openSections, setOpenSections] = useState({
    category: true,
    rating: true,
    stock: true,
    sort: true
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 12
  
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
  
  // Get current category name for display
  const getCurrentCategoryName = () => {
    if (!currentCategory) return 'All Products';
    const category = KNOWN_CATEGORIES.find(cat => cat.slug === currentCategory);
    return category ? category.name : 'Products';
  };

  // Get current sort display name
  const getCurrentSortName = () => {
    switch (sortOrder) {
      case 'oldest': return 'Oldest';
      case 'price_asc': return 'Price: Low to High';
      case 'price_desc': return 'Price: High to Low';
      case 'rating-desc': return 'Rating: High to Low';
      default: return 'Recommended';
    }
  };

  // Pagination calculations
  const totalProducts = allProducts.length
  const totalPages = Math.ceil(totalProducts / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const paginatedProducts = allProducts.slice(startIndex, endIndex)

  // Update products when pagination changes
  useEffect(() => {
    setProducts(paginatedProducts)
  }, [allProducts, currentPage, productsPerPage])

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      // Scroll to top of products list
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      // Scroll to top of products list
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePageSelect = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      // Scroll to top of products list
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
      <div className={styles.pageHeader}>
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
        <div className={styles.list}>
          {[...Array(6)].map((_, index) => (
            <div key={index} className={styles.cardWrapper}>
              <div className={styles.productCardSkeleton}>
                <div className={styles.skeletonImageContainer}>
                  <div className={styles.skeletonImage}></div>
                  <div className={styles.skeletonIndicators}>
                    <div className={styles.skeletonIndicator}></div>
                    <div className={styles.skeletonIndicator}></div>
                    <div className={styles.skeletonIndicator}></div>
                  </div>
                </div>
                
                <div className={styles.skeletonInfo}>
                  <div className={styles.skeletonCategory}></div>
                  <div className={styles.skeletonName}></div>
                  <div className={styles.skeletonPriceRow}>
                    <div className={styles.skeletonPrice}></div>
                    <div className={styles.skeletonRating}></div>
                  </div>
                </div>
              </div>
              
              <div className={styles.skeletonWishlistContainer}>
                <div className={styles.skeletonWishlistButton}></div>
              </div>
            </div>
          ))}
        </div>
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
        <>
          <div className={styles.list}>
            {products.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                formatPrice={formatPrice}
              />
            ))}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <div className={styles.paginationInfo}>
                <div className={styles.paginationInfoText}>
                  Showing {startIndex + 1} to {Math.min(endIndex, totalProducts)} of {totalProducts} products
                </div>
                <div className={styles.paginationInfoText}>
                  Page {currentPage} of {totalPages}
                </div>
              </div>
              
              <div className={styles.paginationControls}>
                {/* Previous Button */}
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={styles.paginationButton}
                >
                  <FiChevronLeft size={16} />
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className={styles.paginationNumbers}>
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => handlePageSelect(1)}
                        className={styles.pageNumber}
                      >
                        1
                      </button>
                      {currentPage > 4 && <span className={styles.paginationDots}>...</span>}
                    </>
                  )}
                  
                  {/* Current page and nearby pages */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageStart = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
                    const page = pageStart + i
                    if (page > totalPages) return null
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageSelect(page)}
                        className={`${styles.pageNumber} ${page === currentPage ? styles.pageNumberActive : ''}`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  
                  {/* Last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className={styles.paginationDots}>...</span>}
                      <button
                        onClick={() => handlePageSelect(totalPages)}
                        className={styles.pageNumber}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                {/* Next Button */}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={styles.paginationButton}
                >
                  Next
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Mobile Filter Drawer */}
      <div 
        className={`${styles.mobileFilterOverlay} ${isMobileFilterOpen ? styles.mobileFilterOverlayVisible : ''}`}
        onClick={() => setIsMobileFilterOpen(false)}
      />
      <div 
        className={`${styles.mobileFilterDrawer} ${isMobileFilterOpen ? styles.mobileFilterDrawerOpen : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {isMobileFilterOpen && (
          <>
            <div className={styles.mobileFilterHeader}>
              <h2>Filter Products</h2>
              <button 
                className={styles.mobileFilterCloseButton}
                onClick={() => setIsMobileFilterOpen(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            <div className={styles.mobileFilterContent}>
              {loading ? (
                <div className={styles.filterSkeletonContainer}>
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className={styles.filterSectionSkeleton}>
                      <div className={styles.filterHeaderSkeleton}>
                        <div className={styles.filterTitleSkeleton}></div>
                        <div className={styles.filterArrowSkeleton}></div>
                      </div>
                      <div className={styles.filterOptionsSkeleton}>
                        {[...Array(4)].map((_, optIndex) => (
                          <div key={optIndex} className={styles.filterOptionSkeleton}>
                            <div className={styles.filterCheckboxSkeleton}></div>
                            <div className={styles.filterLabelSkeleton}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                renderFilters()
              )}
            </div>
            <div className={styles.mobileFilterActions}>
              {loading ? (
                <>
                  <div className={styles.filterButtonSkeleton}></div>
                  <div className={styles.filterButtonSkeleton}></div>
                </>
              ) : (
                <>
                  <button 
                    className={styles.clearFilterButton}
                    onClick={clearAllFilters}
                  >
                    Clear All
                  </button>
                  <button 
                    className={styles.applyFilterButton}
                    onClick={applyFilters}
                  >
                    Apply
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Sort Bottom Sheet */}
      <div 
        className={`${styles.sortOverlay} ${isSortOpen ? styles.sortOverlayVisible : ''}`}
        onClick={() => setIsSortOpen(false)}
      />
      <div className={`${styles.sortModal} ${isSortOpen ? styles.sortModalVisible : ''}`}>
        <div className={styles.sortHeader}>
          <h3>SORT BY</h3>
        </div>
        <div className={styles.sortOptions}>
          <button 
            className={`${styles.sortOption} ${(sortOrder === '' || sortOrder === 'newest') ? styles.active : ''}`}
            onClick={() => handleSortSelect('')}
          >
            <div className={`${styles.sortRadio} ${(sortOrder === '' || sortOrder === 'newest') ? styles.active : ''}`}></div>
            <span className={styles.sortOptionText}>Recommended</span>
          </button>
          <button 
            className={`${styles.sortOption} ${sortOrder === 'oldest' ? styles.active : ''}`}
            onClick={() => handleSortSelect('oldest')}
          >
            <div className={`${styles.sortRadio} ${sortOrder === 'oldest' ? styles.active : ''}`}></div>
            <span className={styles.sortOptionText}>Oldest</span>
          </button>
          <button 
            className={`${styles.sortOption} ${sortOrder === 'price_desc' ? styles.active : ''}`}
            onClick={() => handleSortSelect('price_desc')}
          >
            <div className={`${styles.sortRadio} ${sortOrder === 'price_desc' ? styles.active : ''}`}></div>
            <span className={styles.sortOptionText}>Price High to Low</span>
          </button>
          <button 
            className={`${styles.sortOption} ${sortOrder === 'price_asc' ? styles.active : ''}`}
            onClick={() => handleSortSelect('price_asc')}
          >
            <div className={`${styles.sortRadio} ${sortOrder === 'price_asc' ? styles.active : ''}`}></div>
            <span className={styles.sortOptionText}>Price Low to High</span>
          </button>
        </div>
      </div>
      
      {/* Floating Close Button for Sort Modal */}
      <button 
        onClick={() => setIsSortOpen(false)} 
        className={`${styles.closeSortButton} ${isSortOpen ? styles.visible : ''}`}
      >
        <FiX size={24} />
      </button>
    </div>
  );
} 