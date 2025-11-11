'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import WishlistButton from '../components/WishlistButton'
import ProductCard from '../components/ProductCard'
import VirtualProductGrid from '../components/VirtualProductGrid'
import LazyComponents from '../components/LazyComponents'
import LoadingSpinner from '../components/LoadingSpinner'
import styles from './products.module.css'
import animationStyles from './products-animations.module.css'
import { FiChevronLeft, FiChevronRight, FiFilter, FiGrid, FiStar, FiPackage, FiTrendingUp, FiX } from 'react-icons/fi'
import { DataCache } from '../../lib/dataCache'
import { useDeviceDetection } from '../hooks/useDeviceDetection'
import { useProductFilters } from '../hooks/useProductFilters'
import { useIntersectionImagePreload } from '../hooks/useImagePreload'
import { useScrollCardAnimations } from '../hooks/useOptimizedScroll'

const LOW_STOCK_THRESHOLD = 5 // Products with stock <= 5 will show low stock warning

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
  usageTags?: string[]
  avgRating?: number
  ratingCount?: number
}

export default function ProductsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productGridRef = useRef<HTMLDivElement>(null)

  // Consolidated state management using optimized hooks
  const { filters, updateFilter, clearAllFilters } = useProductFilters()
  const { isSmallScreen } = useDeviceDetection()
  const { applyCardAnimations } = useScrollCardAnimations()
  
  // Remaining component state (reduced from 15+ to 6 variables)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [usageTags, setUsageTags] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 15

  const isMobileView = isSmallScreen
  
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
      productGridRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      productGridRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handlePageSelect = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      productGridRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Reset sidebar state when switching between views
  useEffect(() => {
    if (!isMobileView && !isSidebarOpen) {
      setIsSidebarOpen(true)
    }
  }, [isMobileView, isSidebarOpen])
  
  // Ensure sidebar toggle button position updates correctly
  useEffect(() => {
    // This empty effect ensures the toggle button position is updated when sidebar state changes
    // The state change triggers a re-render with the updated style
  }, [isSidebarOpen])

  function handleCategoryClick(slug: string) {
    // Use exact slug from database, no transformations needed
    router.replace(slug === currentCategory ? '/products' : `/products?category=${encodeURIComponent(slug)}`)
  }

  // Fetch list of available usage tags once
  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await fetch('/api/products/usage-tags')
        const data = await res.json()
        if (Array.isArray(data.tags)) setUsageTags(data.tags)
      } catch (err) {
        console.error('Failed to fetch usage tags', err)
      }
    }
    fetchTags()
  }, [])

  // fetch products from cache or API (with category and tag filter)
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      setError(null)
      
      try {
        let allProducts = []
        
        // Try to get from cache first if no specific filters
        if (!currentCategory && !currentTag && !priceMin && !priceMax && !sortOrder && !lowStockOnly && !inStockOnly && !ratingMin) {
          const cachedProducts = await DataCache.getProducts()
          if (cachedProducts && cachedProducts.length > 0) {
            allProducts = cachedProducts
          }
        }
        
        // If no cached data or filters applied, fetch from API
        if (allProducts.length === 0) {
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
          
          const res = await fetch(`/api/products?${params.toString()}`)
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Failed to fetch products')
          allProducts = data.products || []
        }
        
        // Normalize imageUrls and prefix any bare filename with '/uploads/'
        let filteredProducts = (Array.isArray(allProducts) ? allProducts : []).map((p: any) => {
          let rawImgs: string[] = []
          if (Array.isArray(p.imageUrls)) {
            rawImgs = p.imageUrls
          } else {
            try {
              const parsed = JSON.parse(p.imageUrls || '[]')
              rawImgs = Array.isArray(parsed) ? parsed : []
            } catch {
              rawImgs = []
            }
          }
          const imgs = rawImgs
            .filter((img: string | null): img is string => typeof img === 'string' && img.length > 0)
            .map((img: string) => {
              // If already a URL or absolute path, leave it, otherwise prefix uploads
              return img.startsWith('http') || img.startsWith('/')
                ? img
                : `/uploads/${img}`
            })
          const tagsArr = Array.isArray(p.usageTags) ? p.usageTags : (() => {
            try {
              const parsed = JSON.parse(p.usageTags || '[]')
              return Array.isArray(parsed) ? parsed : []
            } catch {
              return []
            }
          })()
          return { ...p, imageUrls: imgs, usageTags: tagsArr, avgRating: p.avgRating ?? 0, ratingCount: p.ratingCount ?? 0 }
        })
        
        // Client-side category filtering as backup
        if (currentCategory && filteredProducts.length > 0) {
          filteredProducts = filteredProducts.filter((product: Product) => {
            const categorySlug = product.category?.slug || ''
            return categorySlug === currentCategory
          })
        }
        
        // Client-side tag filtering as backup
        if (currentTag && filteredProducts.length > 0) {
          filteredProducts = filteredProducts.filter((product: Product) => {
            return Array.isArray(product.usageTags) && product.usageTags.includes(currentTag)
          })
        }
        
        setAllProducts(filteredProducts)
        setCurrentPage(1) // Reset to first page when filters change
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [currentCategory, currentTag, priceMin, priceMax, sortOrder, lowStockOnly, inStockOnly, ratingMin])

  // Apply scroll-based card animations (optimized)
  useEffect(() => {
    if (!isMobileView) {
      applyCardAnimations(productGridRef)
    }
  })

  // Close mobile filter drawer when switching to desktop view
  useEffect(() => {
    if (!isMobileView) {
      setIsMobileFilterOpen(false)
    }
  }, [isMobileView])

  if (loading) return (
    <LoadingSpinner 
      size="large" 
      overlay={true}
      message="Loading products..."
    />
  )
  if (error) return <p className={styles.errorMessage}>Error: {error}</p>

  // Render the filter sidebar/drawer
  const renderFilters = () => (
    <>
      <h2 className={styles.filterTitle}>
        <FiFilter style={{ marginRight: '8px', opacity: 0.8 }} />
        Filters
      </h2>
      
      {/* Category filter */}
      <details className={styles.filterSection}>
        <summary className={styles.filterHeader}>
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
                  if (isMobileView) setIsMobileFilterOpen(false)
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

      {/* Mood Tags */}
      {usageTags.length > 0 && (
        <details className={styles.filterSection}>
          <summary className={styles.filterHeader}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <FiTrendingUp style={{ marginRight: '8px' }} />
              Purpose / Mood
            </span>
            <FiChevronRight className={styles.arrow} />
          </summary>
          <div className={styles.filterContent}>
            {usageTags.map(tag => (
              <label key={tag} className={styles.filterOption}>
                <input
                  type="radio"
                  name="tagFilter"
                  checked={currentTag === tag}
                  onChange={() => {
                    const qs = new URLSearchParams(searchParams.toString())
                    if (tag === currentTag) qs.delete('usageTag')
                    else qs.set('usageTag', tag)
                    router.replace(qs.toString() ? `/products?${qs}` : '/products')
                    if (isMobileView) setIsMobileFilterOpen(false)
                  }}
                />
                {tag}
              </label>
            ))}
            {currentTag && (
              <button className={styles.clearButton} onClick={() => {
                const qs = new URLSearchParams(searchParams.toString());
                qs.delete('usageTag');
                router.replace(qs.toString() ? `/products?${qs}` : '/products')
              }}>Clear</button>
            )}
          </div>
        </details>
      )}

      {/* Rating */}
      <details className={styles.filterSection}>
        <summary className={styles.filterHeader}>
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
                  const newValue = Number(ratingMin) === thr ? '' : String(thr)
                  updateFilter('ratingMin', newValue)
                  if (isMobileView) setIsMobileFilterOpen(false)
                }}
              />
              {thr}+ stars
            </label>
          ))}
          {ratingMin && (
            <button className={styles.clearButton} onClick={() => {
              updateFilter('ratingMin', '')
            }}>Clear</button>
          )}
        </div>
      </details>

      {/* Stock */}
      <details className={styles.filterSection}>
        <summary className={styles.filterHeader}>
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
                updateFilter('lowStockOnly', e.target.checked)
                if (isMobileView) setIsMobileFilterOpen(false)
              }}
            />
            Only low stock
          </label>
          <label className={styles.filterOption}>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={e=>{
                updateFilter('inStockOnly', e.target.checked)
                if (isMobileView) setIsMobileFilterOpen(false)
              }}
            />
            In stock only
          </label>
        </div>
      </details>

      {/* Sort */}
      <details className={styles.filterSection}>
        <summary className={styles.filterHeader}>
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
                updateFilter('sortOrder', '')
                if (isMobileView) setIsMobileFilterOpen(false)
              }}
            /> Newest
          </label>
          <label className={styles.filterOption}>
            <input
              type="radio"
              name="sortoption"
              checked={sortOrder === 'oldest'}
              onChange={() => {
                updateFilter('sortOrder', 'oldest')
                if (isMobileView) setIsMobileFilterOpen(false)
              }}
            /> Oldest
          </label>
          <label className={styles.filterOption}>
            <input
              type="radio"
              name="sortoption"
              checked={sortOrder === 'price_asc'}
              onChange={() => {
                updateFilter('sortOrder', 'price_asc')
                if (isMobileView) setIsMobileFilterOpen(false)
              }}
            /> Low to High
          </label>
          <label className={styles.filterOption}>
            <input
              type="radio"
              name="sortoption"
              checked={sortOrder === 'price_desc'}
              onChange={() => {
                updateFilter('sortOrder', 'price_desc')
                if (isMobileView) setIsMobileFilterOpen(false)
              }}
            /> High to Low
          </label>
          {sortOrder && sortOrder !== '' && (
            <button className={styles.clearButton} onClick={() => {
              updateFilter('sortOrder', '')
            }}>Clear</button>
          )}
        </div>
      </details>
    </>
  )

  return (
    <div style={{ display: 'flex', position: 'relative' }} className={isMobileView ? styles.mobilePageWrapper : ''}>
      {/* Desktop Sidebar - REMOVED FOR REBUILD */}

      {/* Mobile Filter Drawer */}
      {isMobileView && (
        <div className={`${animationStyles.mobileFilterDrawer || styles.mobileFilterDrawer} ${isMobileFilterOpen ? animationStyles.mobileFilterDrawerOpen || styles.mobileFilterDrawerOpen : ''}`}>
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
      )}

      {/* Mobile Filter Overlay */}
      {isMobileView && (
        <div 
          className={`${animationStyles.mobileFilterOverlay || styles.mobileFilterOverlay} ${isMobileFilterOpen ? animationStyles.mobileFilterOverlayVisible : ''}`}
          onClick={() => setIsMobileFilterOpen(false)}
        />
      )}

      <main className={`
        ${styles.productsContainer} 
        ${isMobileView ? styles.mobileProductsContainer : ''}
      `}>
        <h1 className={styles.title}>Discover Our Collection</h1>

        {/* Desktop Top Filter Bar */}
        {!isMobileView && (
          <div className={styles.topBar}>
            <div className={styles.topBarInner}>
              {/* Left: Filter Chips */}
              <div className={styles.filterChipsContainer}>
                {/* Filter Button - Always visible */}
                <button 
                  className={styles.filterDrawerButton}
                  onClick={() => setIsDesktopFilterOpen(!isDesktopFilterOpen)}
                >
                  <FiFilter size={14} />
                  Filters
                </button>

                {currentCategory && (
                  <div className={styles.filterChip}>
                    {KNOWN_CATEGORIES.find(cat => cat.slug === currentCategory)?.name || currentCategory}
                    <button 
                      className={styles.filterChipRemove}
                      onClick={() => {
                        const qs = new URLSearchParams(searchParams.toString())
                        qs.delete('category')
                        router.replace(qs.toString() ? `/products?${qs}` : '/products')
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                {currentTag && (
                  <div className={styles.filterChip}>
                    {currentTag}
                    <button 
                      className={styles.filterChipRemove}
                      onClick={() => {
                        const qs = new URLSearchParams(searchParams.toString())
                        qs.delete('usageTag')
                        router.replace(qs.toString() ? `/products?${qs}` : '/products')
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                {ratingMin && (
                  <div className={styles.filterChip}>
                    {ratingMin}+ ★
                    <button 
                      className={styles.filterChipRemove}
                      onClick={() => updateFilter('ratingMin', '')}
                    >
                      ×
                    </button>
                  </div>
                )}
                {lowStockOnly && (
                  <div className={styles.filterChip}>
                    Low Stock
                    <button 
                      className={styles.filterChipRemove}
                      onClick={() => updateFilter('lowStockOnly', false)}
                    >
                      ×
                    </button>
                  </div>
                )}
                {inStockOnly && (
                  <div className={styles.filterChip}>
                    In Stock
                    <button 
                      className={styles.filterChipRemove}
                      onClick={() => updateFilter('inStockOnly', false)}
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {/* Clear all filters */}
                {(currentCategory || currentTag || ratingMin || lowStockOnly || inStockOnly) && (
                  <button 
                    className={styles.clearAllFilters}
                    onClick={() => {
                      clearAllFilters()
                      router.replace('/products')
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Center: Results Count */}
              <div className={styles.resultsCount}>
                {products.length} {products.length === 1 ? 'product' : 'products'}
              </div>

              {/* Right: Controls */}
              <div className={styles.topBarControls}>
                {/* Sort Dropdown */}
                <div className={styles.sortContainer}>
                  <label className={styles.sortLabel}>Sort:</label>
                  <select 
                    className={styles.sortSelect}
                    value={sortOrder}
                    onChange={(e) => updateFilter('sortOrder', e.target.value)}
                  >
                    <option value="">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Filter Drawer */}
        {!isMobileView && isDesktopFilterOpen && (
          <>
            <div 
              className={styles.mobileFilterOverlay}
              style={{ opacity: 1, visibility: 'visible' }}
              onClick={() => setIsDesktopFilterOpen(false)}
            />
            <div 
              className={styles.mobileFilterDrawer}
              style={{ transform: 'translateX(0)' }}
            >
              <div className={styles.mobileFilterHeader}>
                <h2>Filters</h2>
                <button 
                  className={styles.mobileFilterCloseButton}
                  onClick={() => setIsDesktopFilterOpen(false)}
                  aria-label="Close filters"
                >
                  <FiX size={24} />
                </button>
              </div>
              <div className={styles.mobileFilterContent}>
                {renderFilters()}
              </div>
            </div>
          </>
        )}

        {/* Results count for mobile */}
        {isMobileView && (
          <p className={styles.mobileResultsCount}>
            {products.length} products found
          </p>
        )}

        {/* Active filters display for mobile */}
        {isMobileView && (currentCategory || currentTag || ratingMin || lowStockOnly || inStockOnly || sortOrder) && (
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
                {ratingMin}+ ★
                <button onClick={() => {
                  updateFilter('ratingMin', '')
                }}>×</button>
              </div>
            )}
            {lowStockOnly && (
              <div className={styles.mobileFilterTag}>
                Low Stock
                <button onClick={() => {
                  updateFilter('lowStockOnly', false)
                }}>×</button>
              </div>
            )}
            {inStockOnly && (
              <div className={styles.mobileFilterTag}>
                In Stock
                <button onClick={() => {
                  updateFilter('inStockOnly', false)
                }}>×</button>
              </div>
            )}
            {sortOrder && (
              <div className={styles.mobileFilterTag}>
                {sortOrder === 'oldest' ? 'Oldest' : 
                 sortOrder === 'price_asc' ? 'Price: Low-High' : 
                 sortOrder === 'price_desc' ? 'Price: High-Low' : 'Newest'}
                <button onClick={() => {
                  updateFilter('sortOrder', '')
                }}>×</button>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {(products.length === 0) ? (
          <p className={styles.emptyProducts}>No products found.</p>
        ) : products.length > 50 ? (
          // Use virtual scrolling for large product lists (>50 items)
          <VirtualProductGrid
            products={products}
            className={`${styles.productGrid} ${isMobileView ? styles.mobileProductGrid : ''}`}
          />
        ) : (
          // Regular grid for smaller lists
          <div className={`${styles.productGrid} ${isMobileView ? styles.mobileProductGrid : ''}`} ref={productGridRef}>
            {products.map((prod, index) => (
              <ProductCard 
                key={prod.id}
                product={prod}
                index={index}
                className={animationStyles.productCard}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className={styles.paginationContainer}>
            <div className={styles.paginationInfo}>
              <span className={styles.paginationInfoText}>
                Showing {startIndex + 1} to {Math.min(endIndex, totalProducts)} of {totalProducts} products
              </span>
              <span className={styles.paginationInfoText}>
                Page {currentPage} of {totalPages}
              </span>
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
      </main>
    </div>
  )
} 