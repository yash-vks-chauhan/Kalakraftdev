'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import styles from './productsMobile.module.css'
import WishlistButton from '../components/WishlistButton'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiFilter, FiX, FiChevronRight, FiStar, FiPackage, FiTrendingUp, FiGrid, FiHeart } from 'react-icons/fi'

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
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [swipeVelocity, setSwipeVelocity] = useState(0);
  const [lastTouchTimestamp, setLastTouchTimestamp] = useState(0);
  const [showHints, setShowHints] = useState(true);
  const imageContainerRef = useRef(null);
  
  // Hide hints after first interaction or after timeout
  useEffect(() => {
    const timer = setTimeout(() => setShowHints(false), 4000);
    return () => clearTimeout(timer);
  }, []);
  
  // Direct touch event handlers for better reliability
  const handleTouchStart = (e) => {
    if (product.imageUrls.length <= 1) return;
    
    // Hide hints on first interaction
    setShowHints(false);
    
    // Cancel any ongoing animations
    if (animating) {
      setAnimating(false);
      setSwipeOffset(0);
    }
    
    setTouchStart(e.targetTouches[0].clientX);
    setLastTouchTimestamp(Date.now());
    setIsSwiping(true);
    setSwipeOffset(0);
    setSwipeVelocity(0);
  };
  
  const handleTouchMove = (e) => {
    if (!isSwiping || product.imageUrls.length <= 1) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const currentTime = Date.now();
    const timeDelta = currentTime - lastTouchTimestamp;
    
    // Calculate velocity (pixels per millisecond)
    if (timeDelta > 0) {
      const instantVelocity = (currentTouch - touchEnd) / timeDelta;
      // Smooth velocity with exponential moving average
      setSwipeVelocity(prev => prev * 0.7 + instantVelocity * 0.3);
    }
    
    setTouchEnd(currentTouch);
    setLastTouchTimestamp(currentTime);
    
    const currentOffset = currentTouch - touchStart;
    const containerWidth = imageContainerRef.current?.offsetWidth || 0;
    
    // Add progressive resistance at edges for better feel
    if ((currentImageIndex === 0 && currentOffset > 0) || 
        (currentImageIndex === product.imageUrls.length - 1 && currentOffset < 0)) {
      // Cubic resistance curve for more natural feel at edges
      const resistanceFactor = 1 - Math.min(Math.abs(currentOffset) / containerWidth, 0.5);
      setSwipeOffset(currentOffset * Math.pow(resistanceFactor, 2));
    } else {
      setSwipeOffset(currentOffset);
    }
  };
  
  const handleTouchEnd = () => {
    if (!isSwiping || product.imageUrls.length <= 1) return;
    
    setIsSwiping(false);
    
    if (!touchStart || !touchEnd) {
      setSwipeOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const containerWidth = imageContainerRef.current?.offsetWidth || 0;
    const absDistance = Math.abs(distance);
    const absVelocity = Math.abs(swipeVelocity);
    
    // Determine if swipe should trigger image change based on distance OR velocity
    const isSignificantSwipe = 
      absDistance > minSwipeDistance || 
      (absDistance > minSwipeDistance / 2 && absVelocity > minSwipeVelocity);
    
    const isLeftSwipe = distance > 0;
    const isRightSwipe = distance < 0;
    
    setAnimating(true);
    
    if (isSignificantSwipe) {
      if (isLeftSwipe && currentImageIndex < product.imageUrls.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
      } else if (isRightSwipe && currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1);
      } else {
        // If at edge, animate back with spring effect
        setSwipeOffset(0);
      }
    } else {
      // Not a significant swipe, animate back to current position
      setSwipeOffset(0);
    }
    
    // Reset values
    setTouchStart(0);
    setTouchEnd(0);
    setSwipeVelocity(0);
    
    // End animation after transition completes
    setTimeout(() => {
      setAnimating(false);
      setSwipeOffset(0);
    }, 300);
  };
  
  // Improved swipe sensitivity and threshold
  const minSwipeDistance = 20; // Reduced threshold for easier swiping
  const minSwipeVelocity = 0.2; // Minimum velocity to trigger swipe
  
  // Handle manual image navigation with tap
  const handleImageTap = (e) => {
    if (product.imageUrls.length <= 1 || animating) return;
    
    const containerWidth = imageContainerRef.current?.offsetWidth || 0;
    const tapX = e.nativeEvent.offsetX;
    
    // Tap on right third of image - go next
    if (tapX > containerWidth * 0.7 && currentImageIndex < product.imageUrls.length - 1) {
      setAnimating(true);
      setCurrentImageIndex(currentImageIndex + 1);
      setTimeout(() => setAnimating(false), 300);
    }
    // Tap on left third of image - go previous
    else if (tapX < containerWidth * 0.3 && currentImageIndex > 0) {
      setAnimating(true);
      setCurrentImageIndex(currentImageIndex - 1);
      setTimeout(() => setAnimating(false), 300);
    }
  };
  
  // Handle wishlist button click to prevent navigation
  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Calculate transform style for smooth swiping with improved transitions
  const getImageTransform = () => {
    if (!isSwiping && swipeOffset === 0) {
      return { 
        transform: `translateX(${-100 * currentImageIndex}%)`,
        transition: animating ? 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
      };
    }
    
    // Calculate percentage offset for smooth tracking during swipe
    const containerWidth = imageContainerRef.current?.offsetWidth || 0;
    const offsetPercentage = containerWidth ? (swipeOffset / containerWidth) * 100 : 0;
    
    return {
      transform: `translateX(calc(${-100 * currentImageIndex}% + ${offsetPercentage}%))`,
      transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
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
          <div className={styles.imageSlider} style={getImageTransform()}>
            {product.imageUrls.map((url, index) => (
              <div key={index} className={styles.imageSlide}>
                <img 
                  src={url}
                  alt={`${product.name} - Image ${index + 1}`}
                  className={styles.image}
                  loading="lazy"
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
  const currentCategory = searchParams.get('category') || ''
  const currentTag = searchParams.get('usageTag') || ''
  const priceMinParam = searchParams.get('priceMin') || ''
  const priceMaxParam = searchParams.get('priceMax') || ''
  const sortParam = searchParams.get('sort') || ''
  const ratingMinParam = searchParams.get('ratingMin') || ''
  const lowStockParam = searchParams.get('lowStock') === 'true'
  const inStockOnlyParam = searchParams.get('inStock') === 'true'

  const [products, setProducts] = useState([])
  const [usageTags, setUsageTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [priceMin, setPriceMin] = useState(priceMinParam)
  const [priceMax, setPriceMax] = useState(priceMaxParam)
  const [sortOrder, setSortOrder] = useState(sortParam)
  const [lowStockOnly, setLowStockOnly] = useState(lowStockParam)
  const [inStockOnly, setInStockOnly] = useState(inStockOnlyParam)
  const [ratingMin, setRatingMin] = useState(ratingMinParam)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [openSections, setOpenSections] = useState({
    category: true,
    rating: true,
    stock: true,
    sort: true
  });
  
  // Toggle filter sections
  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
        
        setProducts(filteredProducts)
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
                  checked={currentCategory === cat.slug}
                  onChange={() => {
                    const qs = new URLSearchParams(searchParams.toString())
                    if (cat.slug === currentCategory) qs.delete('category')
                    else qs.set('category', cat.slug)
                    router.replace(qs.toString() ? `/products?${qs}` : '/products')
                    setIsMobileFilterOpen(false)
                  }}
                />
                {cat.name}
              </label>
            ))}
            {currentCategory && (
              <button className={styles.clearButton} onClick={() => {
                const qs = new URLSearchParams(searchParams.toString())
                qs.delete('category');
                router.replace(qs.toString() ? `/products?${qs}` : '/products')
              }}>Clear</button>
            )}
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
                  checked={Number(ratingMin) === thr}
                  onChange={() => {
                    const qs = new URLSearchParams(searchParams.toString())
                    if (Number(ratingMin) === thr) {
                      setRatingMin('')
                      qs.delete('ratingMin')
                    } else {
                      setRatingMin(String(thr))
                      qs.set('ratingMin', String(thr))
                    }
                    router.replace(qs.toString()?`/products?${qs}`:'/products')
                    setIsMobileFilterOpen(false)
                  }}
                />
                {thr}+ stars
              </label>
            ))}
            {ratingMin && (
              <button className={styles.clearButton} onClick={() => {
                setRatingMin('')
                const qs = new URLSearchParams(searchParams.toString())
                qs.delete('ratingMin')
                router.replace(qs.toString()?`/products?${qs}`:'/products')
              }}>Clear</button>
            )}
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
                checked={lowStockOnly}
                onChange={e => {
                  setLowStockOnly(e.target.checked)
                  const qs = new URLSearchParams(searchParams.toString())
                  if (e.target.checked) qs.set('lowStock','true')
                  else qs.delete('lowStock')
                  if (inStockOnly) qs.set('inStock','true')
                  router.replace(qs.toString()?`/products?${qs}`:'/products')
                  setIsMobileFilterOpen(false)
                }}
              />
              Only low stock
            </label>
            <label className={styles.filterOption}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e=>{
                  setInStockOnly(e.target.checked)
                  const qs=new URLSearchParams(searchParams.toString())
                  if(e.target.checked) qs.set('inStock','true'); else qs.delete('inStock')
                  router.replace(qs.toString()?`/products?${qs}`:'/products')
                  setIsMobileFilterOpen(false)
                }}
              />
              In stock only
            </label>
          </div>
        </details>

        {/* Sort */}
        <details open={openSections.sort} className={styles.filterSection}>
          <summary 
            className={styles.filterHeader}
            onClick={(e) => {
              e.preventDefault();
              toggleSection('sort');
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <FiTrendingUp style={{ marginRight: '8px' }} />
              Sort
            </span>
            <FiChevronRight className={styles.arrow} />
          </summary>
          <div className={styles.filterContent}>
            <label className={styles.filterOption}>
              <input
                type="radio"
                name="sortoption"
                checked={sortOrder === '' || sortOrder === 'newest'}
                onChange={() => {
                  setSortOrder('')
                  const qs = new URLSearchParams(searchParams.toString())
                  qs.delete('sort')
                  router.replace(qs.toString()?`/products?${qs}`:'/products')
                  setIsMobileFilterOpen(false)
                }}
              /> Newest
            </label>
            <label className={styles.filterOption}>
              <input
                type="radio"
                name="sortoption"
                checked={sortOrder === 'oldest'}
                onChange={() => {
                  setSortOrder('oldest')
                  const qs = new URLSearchParams(searchParams.toString())
                  qs.set('sort','oldest')
                  router.replace(`/products?${qs}`)
                  setIsMobileFilterOpen(false)
                }}
              /> Oldest
            </label>
            <label className={styles.filterOption}>
              <input
                type="radio"
                name="sortoption"
                checked={sortOrder === 'price_asc'}
                onChange={() => {
                  setSortOrder('price_asc')
                  const qs = new URLSearchParams(searchParams.toString())
                  qs.set('sort','price_asc')
                  router.replace(`/products?${qs}`)
                  setIsMobileFilterOpen(false)
                }}
              /> Price: Low to High
            </label>
            <label className={styles.filterOption}>
              <input
                type="radio"
                name="sortoption"
                checked={sortOrder === 'price_desc'}
                onChange={() => {
                  setSortOrder('price_desc')
                  const qs = new URLSearchParams(searchParams.toString())
                  qs.set('sort','price_desc')
                  router.replace(`/products?${qs}`)
                  setIsMobileFilterOpen(false)
                }}
              /> Price: High to Low
            </label>
          </div>
        </details>
      </>
    );
  };

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.loadingSpinner}></div>
      <span>Loading products...</span>
    </div>
  );
  
  if (error) return <div className={styles.error}>Error: {error}</div>

  return (
    <div className={styles.container}>
      {/* Mobile Filter Button */}
      <button 
        className={styles.mobileFilterButton}
        onClick={() => setIsMobileFilterOpen(true)}
        aria-label="Open filters"
      >
        <FiFilter size={16} /> Filter
      </button>

      {/* Mobile Filter Drawer */}
      <div className={`${styles.mobileFilterDrawer} ${isMobileFilterOpen ? styles.mobileFilterDrawerOpen : ''}`}>
        <div className={styles.mobileFilterHeader}>
          <h2>Filters</h2>
          <button 
            className={styles.mobileFilterCloseButton}
            onClick={() => setIsMobileFilterOpen(false)}
            aria-label="Close filters"
          >
            <FiX size={24} />
          </button>
        </div>
        <div className={styles.mobileFilterContent}>
          {renderFilters()}
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {isMobileFilterOpen && (
        <div 
          className={`${styles.mobileFilterOverlay} ${isMobileFilterOpen ? styles.mobileFilterOverlayVisible : ''}`}
          onClick={() => setIsMobileFilterOpen(false)}
        />
      )}

      {/* Active filters display */}
      {(currentCategory || currentTag || ratingMin || lowStockOnly || inStockOnly || sortOrder) && (
        <div className={styles.mobileActiveFilters}>
          {currentCategory && (
            <div className={styles.mobileFilterTag}>
              {KNOWN_CATEGORIES.find(cat => cat.slug === currentCategory)?.name || currentCategory}
              <button onClick={() => {
                const qs = new URLSearchParams(searchParams.toString())
                qs.delete('category')
                router.replace(qs.toString() ? `/products?${qs}` : '/products')
              }}>×</button>
            </div>
          )}
          {currentTag && (
            <div className={styles.mobileFilterTag}>
              {currentTag}
              <button onClick={() => {
                const qs = new URLSearchParams(searchParams.toString())
                qs.delete('usageTag')
                router.replace(qs.toString() ? `/products?${qs}` : '/products')
              }}>×</button>
            </div>
          )}
          {ratingMin && (
            <div className={styles.mobileFilterTag}>
              {ratingMin}+ stars
              <button onClick={() => {
                setRatingMin('')
                const qs = new URLSearchParams(searchParams.toString())
                qs.delete('ratingMin')
                router.replace(qs.toString() ? `/products?${qs}` : '/products')
              }}>×</button>
            </div>
          )}
          {lowStockOnly && (
            <div className={styles.mobileFilterTag}>
              Low stock only
              <button onClick={() => {
                setLowStockOnly(false)
                const qs = new URLSearchParams(searchParams.toString())
                qs.delete('lowStock')
                router.replace(qs.toString() ? `/products?${qs}` : '/products')
              }}>×</button>
            </div>
          )}
          {inStockOnly && (
            <div className={styles.mobileFilterTag}>
              In stock only
              <button onClick={() => {
                setInStockOnly(false)
                const qs = new URLSearchParams(searchParams.toString())
                qs.delete('inStock')
                router.replace(qs.toString() ? `/products?${qs}` : '/products')
              }}>×</button>
            </div>
          )}
          {sortOrder && (
            <div className={styles.mobileFilterTag}>
              {sortOrder === 'price_asc' ? 'Price: Low to High' : 
               sortOrder === 'price_desc' ? 'Price: High to Low' : 
               sortOrder === 'oldest' ? 'Oldest' : 'Newest'}
              <button onClick={() => {
                setSortOrder('')
                const qs = new URLSearchParams(searchParams.toString())
                qs.delete('sort')
                router.replace(qs.toString() ? `/products?${qs}` : '/products')
              }}>×</button>
            </div>
          )}
        </div>
      )}

      <div className={styles.list} style={{ marginLeft: -1, marginRight: -1, width: 'calc(100% + 2px)' }}>
        {products.map((prod) => (
          <ProductCard 
            key={prod.id} 
            product={prod} 
            formatPrice={formatPrice} 
          />
        ))}
      </div>
    </div>
  )
} 