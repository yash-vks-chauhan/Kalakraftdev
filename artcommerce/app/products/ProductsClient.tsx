'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import WishlistButton from '../components/WishlistButton'
import styles from './products.module.css'
import { FiChevronLeft, FiChevronRight, FiFilter, FiGrid, FiStar, FiPackage, FiTrendingUp, FiX } from 'react-icons/fi'

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
  const currentCategory = searchParams.get('category') || ''
  const currentTag = searchParams.get('usageTag') || ''
  const priceMinParam = searchParams.get('priceMin') || ''
  const priceMaxParam = searchParams.get('priceMax') || ''
  const sortParam = searchParams.get('sort') || ''
  const ratingMinParam = searchParams.get('ratingMin') || ''
  const lowStockParam = searchParams.get('lowStock') === 'true'
  const productGridRef = useRef<HTMLDivElement>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [usageTags, setUsageTags] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [scrollY, setScrollY] = useState(0)
  const [priceMin, setPriceMin] = useState(priceMinParam)
  const [priceMax, setPriceMax] = useState(priceMaxParam)
  const [sortOrder, setSortOrder] = useState(sortParam)
  const [lowStockOnly, setLowStockOnly] = useState(lowStockParam)
  const inStockOnlyParam = searchParams.get('inStock') === 'true'
  const [inStockOnly, setInStockOnly] = useState(inStockOnlyParam)
  const [ratingMin, setRatingMin] = useState(ratingMinParam)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)

  // Check if we're in mobile view
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768
      setIsMobileView(isMobile)
      
      // Reset sidebar state when switching between views
      if (!isMobile && !isSidebarOpen) {
        setIsSidebarOpen(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
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

  // fetch products from API (with category and tag filter)
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
        
        // Normalize imageUrls and prefix any bare filename with '/uploads/'
        let filteredProducts = (Array.isArray(data.products) ? data.products : []).map((p: any) => {
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
        
        setProducts(filteredProducts)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [currentCategory, currentTag, priceMin, priceMax, sortOrder, lowStockOnly, inStockOnly, ratingMin])

  // Handle scroll animations
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Apply scroll-based transformations to products
  useEffect(() => {
    if (!productGridRef.current || isMobileView) return;

    const cards = productGridRef.current.querySelectorAll(`.${styles.productCard}`)
    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect()
      const centerY = rect.top + rect.height / 2
      const distanceFromCenter = Math.abs(window.innerHeight / 2 - centerY)
      const scale = Math.max(0.9, 1 - distanceFromCenter / 1000)
      const opacity = Math.max(0.6, 1 - distanceFromCenter / 800)
      const translateY = distanceFromCenter * 0.05
      
      ;(card as HTMLElement).style.transform = `scale(${scale}) translateY(${translateY}px)`
      ;(card as HTMLElement).style.opacity = opacity.toString()
    })
  }, [scrollY, products, isMobileView])

  // Close mobile filter drawer when switching to desktop view
  useEffect(() => {
    if (!isMobileView) {
      setIsMobileFilterOpen(false)
    }
  }, [isMobileView])

  if (loading) return (
    <div className={styles.loadingContainer}>
      <Image
        src="/images/loading.png"
        alt="Loading..."
        width={50}
        height={50}
        className={styles.loadingSpinner}
      />
    </div>
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
      <details open className={styles.filterSection}>
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
        <details open className={styles.filterSection}>
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
      <details open className={styles.filterSection}>
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
                  const qs = new URLSearchParams(searchParams.toString())
                  if (Number(ratingMin) === thr) {
                    setRatingMin('')
                    qs.delete('ratingMin')
                  } else {
                    setRatingMin(String(thr))
                    qs.set('ratingMin', String(thr))
                  }
                  router.replace(qs.toString()?`/products?${qs}`:'/products')
                  if (isMobileView) setIsMobileFilterOpen(false)
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
      <details open className={styles.filterSection}>
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
                setLowStockOnly(e.target.checked)
                const qs = new URLSearchParams(searchParams.toString())
                if (e.target.checked) qs.set('lowStock','true')
                else qs.delete('lowStock')
                if (inStockOnly) qs.set('inStock','true')
                router.replace(qs.toString()?`/products?${qs}`:'/products')
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
                setInStockOnly(e.target.checked)
                const qs=new URLSearchParams(searchParams.toString())
                if(e.target.checked) qs.set('inStock','true'); else qs.delete('inStock')
                router.replace(qs.toString()?`/products?${qs}`:'/products')
                if (isMobileView) setIsMobileFilterOpen(false)
              }}
            />
            In stock only
          </label>
        </div>
      </details>

      {/* Sort */}
      <details open className={styles.filterSection}>
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
                setSortOrder('')
                const qs = new URLSearchParams(searchParams.toString())
                qs.delete('sort')
                router.replace(qs.toString()?`/products?${qs}`:'/products')
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
                setSortOrder('oldest')
                const qs = new URLSearchParams(searchParams.toString())
                qs.set('sort','oldest')
                router.replace(`/products?${qs}`)
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
                setSortOrder('price_asc')
                const qs = new URLSearchParams(searchParams.toString())
                qs.set('sort','price_asc')
                router.replace(`/products?${qs}`)
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
                setSortOrder('price_desc')
                const qs = new URLSearchParams(searchParams.toString())
                qs.set('sort','price_desc')
                router.replace(`/products?${qs}`)
                if (isMobileView) setIsMobileFilterOpen(false)
              }}
            /> High to Low
          </label>
          {sortOrder && sortOrder !== '' && (
            <button className={styles.clearButton} onClick={() => {
              setSortOrder('')
              const qs = new URLSearchParams(searchParams.toString())
              qs.delete('sort')
              router.replace(qs.toString()?`/products?${qs}`:'/products')
            }}>Clear</button>
          )}
        </div>
      </details>
    </>
  )

  return (
    <div style={{ display: 'flex', position: 'relative' }} className={isMobileView ? styles.mobilePageWrapper : ''}>
      {/* Desktop Sidebar Toggle Button */}
      {!isMobileView && (
        <button 
          className={styles.sidebarToggle}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? "Close filters" : "Open filters"}
          style={{ left: isSidebarOpen ? '280px' : '0' }}
        >
          {isSidebarOpen ? <FiChevronLeft size={18} /> : <FiChevronRight size={18} />}  
        </button>
      )}

      {/* Desktop Sidebar */}
      {!isMobileView && (
        <aside className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarClosed : ''}`}>
          {renderFilters()}
        </aside>
      )}

      {/* Mobile Filter Button */}
      {isMobileView && (
        <button 
          className={styles.mobileFilterButton}
          onClick={() => setIsMobileFilterOpen(true)}
          aria-label="Open filters"
        >
          <FiFilter size={16} /> Filter
        </button>
      )}

      {/* Mobile Filter Drawer */}
      {isMobileView && (
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
      )}

      {/* Mobile Filter Overlay */}
      {isMobileView && isMobileFilterOpen && (
        <div 
          className={styles.mobileFilterOverlay} 
          onClick={() => setIsMobileFilterOpen(false)}
        />
      )}

      <main className={`
        ${styles.productsContainer} 
        ${!isMobileView && isSidebarOpen ? styles.mainContent : styles.mainContentCollapsed}
        ${isMobileView ? styles.mobileProductsContainer : ''}
      `} style={{ width: isMobileView ? '100%' : 'auto' }}>
        <h1 className={styles.title}>Discover Our Collection</h1>

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
                  setRatingMin('')
                  const qs = new URLSearchParams(searchParams.toString())
                  qs.delete('ratingMin')
                  router.replace(qs.toString() ? `/products?${qs}` : '/products')
                }}>×</button>
              </div>
            )}
            {lowStockOnly && (
              <div className={styles.mobileFilterTag}>
                Low Stock
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
                In Stock
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
                {sortOrder === 'oldest' ? 'Oldest' : 
                 sortOrder === 'price_asc' ? 'Price: Low-High' : 
                 sortOrder === 'price_desc' ? 'Price: High-Low' : 'Newest'}
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

        {/* Results */}
        {(products.length === 0) ? (
          <p className={styles.emptyProducts}>No products found.</p>
        ) : (
          <div className={`${styles.productGrid} ${isMobileView ? styles.mobileProductGrid : ''}`} ref={productGridRef}>
            {(products).map((prod, index) => (
              <Link 
                href={`/products/${prod.id}`} 
                key={prod.id}
                className={styles.productCard}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {prod.stockQuantity <= 0 ? (
                  <span className={styles.outOfStockBadge}>
                    OUT OF STOCK
                  </span>
                ) : prod.stockQuantity <= LOW_STOCK_THRESHOLD && (
                  <span className={styles.lowStockBadge}>
                    LOW STOCK
                  </span>
                )}
                <div className={styles.productImageContainer}>
                  {prod.imageUrls[0] ? (
                    <img 
                      src={prod.imageUrls[0]} 
                      alt={prod.name} 
                      className={styles.productImage}
                      loading="lazy"
                    />
                  ) : (
                    <div className={`${styles.productImage} ${styles.noImage}`}>  
                      <span className={styles.noImageText}>No image</span>
                    </div>
                  )}
                  {!isMobileView && (
                    <div className={styles.productImageOverlay}>
                      <WishlistButton 
                        productId={prod.id} 
                        className={styles.wishlistButton}
                        productImageUrl={prod.imageUrls[0] || ''}
                        preventNavigation={true}
                      />
                    </div>
                  )}
                </div>
                {isMobileView && (
                  <div className={styles.mobileWishlistContainer} onClick={(e) => e.preventDefault()}>
                    <WishlistButton 
                      productId={prod.id} 
                      className={styles.mobileWishlistButton}
                      productImageUrl={prod.imageUrls[0] || ''}
                      preventNavigation={true}
                    />
                  </div>
                )}
                <div className={styles.productInfo}>
                  {prod.category && (
                    <span className={styles.productCategory}>{prod.category.name}</span>
                  )}
                  <h3 className={styles.productName}>{prod.name}</h3>
                  <div className={styles.productPriceContainer}>
                    <p className={styles.productPrice}>{isMobileView ? prod.price.toFixed(2) : `${prod.currency} ${prod.price.toFixed(2)}`}</p>
                    {isMobileView && prod.avgRating !== undefined && prod.avgRating > 0 && (
                      <p className={styles.productRating}>
                        <span className={styles.starFilled}>★</span> 
                        <span className={styles.ratingValue}>{prod.avgRating.toFixed(1)}</span>
                      </p>
                    )}
                  </div>
                  {!isMobileView && prod.avgRating !== undefined && (
                    <p className={styles.productRating}>
                      {[1,2,3,4,5].map((i, idx) => (
                        <span key={idx} className={i <= Math.round(prod.avgRating!) ? styles.starFilled : styles.starEmpty}>
                          ★
                        </span>
                      ))} 
                      <span className={styles.ratingCount}>({prod.ratingCount})</span>
                    </p>
                  )}
                  {!isMobileView && <p className={styles.productShortDesc}>{prod.shortDesc}</p>}
                  {!isMobileView && (
                    <span className={styles.viewDetailsButton}>
                      View Details
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
} 