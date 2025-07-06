'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './productsMobile.module.css'
import WishlistButton from '../components/WishlistButton'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiFilter, FiX, FiChevronRight, FiStar, FiPackage, FiTrendingUp, FiGrid } from 'react-icons/fi'

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

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const res = await fetch('/api/products')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch products')
        // Normalize image URLs
        const normalized = (Array.isArray(data.products) ? data.products : []).map((p) => {
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
        setProducts(normalized)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()

    // Fetch usage tags
    async function fetchUsageTags() {
      try {
        const res = await fetch('/api/products/usage-tags')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch usage tags')
        setUsageTags(data.tags || [])
      } catch (err) {
        console.error('Error fetching usage tags:', err)
      }
    }
    fetchUsageTags()
  }, [])

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
  const renderFilters = () => (
    <>
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
          className={styles.mobileFilterOverlay} 
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

      <div className={styles.list}>
        {products.map((prod) => (
          <div key={prod.id} className={styles.cardWrapper}>
            <Link href={`/products/${prod.id}`} className={styles.card}>
              <div className={styles.imageContainer}>
                {prod.imageUrls[0] ? (
                  <img 
                    src={prod.imageUrls[0]} 
                    alt={prod.name} 
                    className={styles.image}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.noImage}>No image</div>
                )}
                {prod.isNew && <span className={styles.badge}>New</span>}
                {prod.stockQuantity === 0 && <div className={styles.outOfStock}>Out of Stock</div>}
                {prod.stockQuantity > 0 && prod.stockQuantity <= 5 && (
                  <div className={styles.lowStock}>Only {prod.stockQuantity} left</div>
                )}
                <div className={styles.overlay}>
                  <span className={styles.viewDetails}>View Details</span>
                </div>
              </div>
              <div className={styles.info}>
                {prod.category && (
                  <div className={styles.categoryTag}>
                    {prod.category.name}
                  </div>
                )}
                <h3 className={styles.name}>{prod.name}</h3>
                {prod.shortDesc && (
                  <p className={styles.shortDesc}>{prod.shortDesc.substring(0, 60)}{prod.shortDesc.length > 60 ? '...' : ''}</p>
                )}
                <div className={styles.priceRow}>
                  <p className={styles.price}>{formatPrice(prod.price)}</p>
                  {prod.avgRating > 0 && (
                    <p className={styles.productRating}>
                      <span className={styles.starFilled}>★</span> 
                      <span className={styles.ratingValue}>{prod.avgRating.toFixed(1)}</span>
                    </p>
                  )}
                </div>
              </div>
            </Link>
            <div className={styles.wishlistContainer} onClick={handleWishlistClick}>
              <WishlistButton 
                productId={prod.id} 
                className={styles.wishlistButton}
                preventNavigation={true}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 