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
      const img = new Image();
      img.src = url;
    });
  }, [product.imageUrls]);
  
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
  
  // Get current category name for display
  const getCurrentCategoryName = () => {
    if (!currentCategory) return 'All Products';
    const category = KNOWN_CATEGORIES.find(cat => cat.slug === currentCategory);
    return category ? category.name : 'Products';
  };

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

  return (
    <div className={styles.container}>
      {/* Page header with title */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{getCurrentCategoryName()}</h1>
        {products.length > 0 && (
          <p className={styles.resultCount}>{products.length} products</p>
        )}
      </div>
      
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
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading products...</p>
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
        <div className={styles.list}>
          {products.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              formatPrice={formatPrice}
            />
          ))}
        </div>
      )}
      
      {/* Filter button */}
      <button 
        className={styles.mobileFilterButton}
        onClick={() => setIsMobileFilterOpen(true)}
      >
        <FiFilter size={16} />
        <span>Filter</span>
      </button>
      
      {/* Mobile Filter Drawer */}
      <div className={`${styles.mobileFilterDrawer} ${isMobileFilterOpen ? styles.mobileFilterDrawerOpen : ''}`}>
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
    </div>
  );
} 