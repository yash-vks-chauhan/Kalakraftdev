'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './productsMobile.module.css'
import { Heart, SortAsc, Filter, ArrowLeft, Search, ShoppingBag, Star, Package, TrendingUp, X, ChevronRight } from 'lucide-react'
import WishlistButton from '../components/WishlistButton'

const LOW_STOCK_THRESHOLD = 5

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

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState([])
  const [usageTags, setUsageTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [priceMin, setPriceMin] = useState(priceMinParam)
  const [priceMax, setPriceMax] = useState(priceMaxParam)
  const [sortOrder, setSortOrder] = useState(sortParam)
  const [lowStockOnly, setLowStockOnly] = useState(lowStockParam)
  const [inStockOnly, setInStockOnly] = useState(inStockOnlyParam)
  const [ratingMin, setRatingMin] = useState(ratingMinParam)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [isSortDrawerOpen, setIsSortDrawerOpen] = useState(false)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch categories')
        setCategories(data.categories || [])
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }
    fetchCategories()
  }, [])

  // Fetch list of available usage tags
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
        
        // Normalize image URLs
        const normalized = (Array.isArray(data.products) ? data.products : []).map((p) => {
          let urls = []
          try {
            urls = Array.isArray(p.imageUrls) ? p.imageUrls : JSON.parse(p.imageUrls || '[]')
          } catch {
            urls = []
          }

          const tagsArr = Array.isArray(p.usageTags) ? p.usageTags : (() => {
            try {
              const parsed = JSON.parse(p.usageTags || '[]')
              return Array.isArray(parsed) ? parsed : []
            } catch {
              return []
            }
          })()

          return { 
            ...p, 
            imageUrls: urls, 
            usageTags: tagsArr, 
            avgRating: p.avgRating ?? 0, 
            ratingCount: p.ratingCount ?? 0 
          }
        })
        setProducts(normalized)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [currentCategory, currentTag, priceMin, priceMax, sortOrder, lowStockOnly, inStockOnly, ratingMin])

  const handleCategoryChange = (categorySlug) => {
    const qs = new URLSearchParams(searchParams.toString())
    if (categorySlug === currentCategory) {
      qs.delete('category')
    } else {
      qs.set('category', categorySlug)
    }
    router.replace(qs.toString() ? `/products?${qs}` : '/products')
  }

  const handleSortChange = (sortValue) => {
    setSortOrder(sortValue)
    const qs = new URLSearchParams(searchParams.toString())
    if (!sortValue) {
      qs.delete('sort')
    } else {
      qs.set('sort', sortValue)
    }
    router.replace(qs.toString() ? `/products?${qs}` : '/products')
    setIsSortDrawerOpen(false)
  }

  const clearFilter = (filterName) => {
    const qs = new URLSearchParams(searchParams.toString())
    
    if (filterName === 'category') {
      qs.delete('category')
    } else if (filterName === 'usageTag') {
      qs.delete('usageTag')
    } else if (filterName === 'rating') {
      setRatingMin('')
      qs.delete('ratingMin')
    } else if (filterName === 'lowStock') {
      setLowStockOnly(false)
      qs.delete('lowStock')
    } else if (filterName === 'inStock') {
      setInStockOnly(false)
      qs.delete('inStock')
    } else if (filterName === 'sort') {
      setSortOrder('')
      qs.delete('sort')
    } else if (filterName === 'all') {
      // Clear all filters
      qs.delete('category')
      qs.delete('usageTag')
      qs.delete('ratingMin')
      qs.delete('lowStock')
      qs.delete('inStock')
      qs.delete('sort')
      qs.delete('priceMin')
      qs.delete('priceMax')
      setRatingMin('')
      setLowStockOnly(false)
      setInStockOnly(false)
      setSortOrder('')
      setPriceMin('')
      setPriceMax('')
    }
    
    router.replace(qs.toString() ? `/products?${qs}` : '/products')
  }

  const hasActiveFilters = currentCategory || currentTag || ratingMin || lowStockOnly || inStockOnly || priceMin || priceMax

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner}></div>
      <p>Loading products...</p>
    </div>
  )
  
  if (error) return <div className={styles.error}>Error: {error}</div>

  // Find active category name
  const activeCategoryName = currentCategory 
    ? (KNOWN_CATEGORIES.find(c => c.slug === currentCategory)?.name || currentCategory)
    : 'All Products';

  // Render filter drawer content
  const renderFilterDrawer = () => (
    <div className={`${styles.filterDrawer} ${isFilterDrawerOpen ? styles.filterDrawerOpen : ''}`}>
      <div className={styles.filterDrawerHeader}>
        <h2>Filters</h2>
        <button 
          className={styles.closeButton}
          onClick={() => setIsFilterDrawerOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      <div className={styles.filterDrawerContent}>
        {/* Category filter */}
        <div className={styles.filterSection}>
          <div className={styles.filterHeader}>
            <span className={styles.filterTitle}>
              <Filter size={16} style={{ marginRight: '8px' }} />
              Category
            </span>
            <ChevronRight size={16} />
          </div>
          <div className={styles.filterOptions}>
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
                    setIsFilterDrawerOpen(false)
                  }}
                />
                {cat.name}
              </label>
            ))}
          </div>
        </div>

        {/* Mood Tags */}
        {usageTags.length > 0 && (
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <span className={styles.filterTitle}>
                <TrendingUp size={16} style={{ marginRight: '8px' }} />
                Purpose / Mood
              </span>
              <ChevronRight size={16} />
            </div>
            <div className={styles.filterOptions}>
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
                      setIsFilterDrawerOpen(false)
                    }}
                  />
                  {tag}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Rating */}
        <div className={styles.filterSection}>
          <div className={styles.filterHeader}>
            <span className={styles.filterTitle}>
              <Star size={16} style={{ marginRight: '8px' }} />
              Rating
            </span>
            <ChevronRight size={16} />
          </div>
          <div className={styles.filterOptions}>
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
                    router.replace(qs.toString() ? `/products?${qs}` : '/products')
                    setIsFilterDrawerOpen(false)
                  }}
                />
                {thr}+ stars
              </label>
            ))}
          </div>
        </div>

        {/* Stock */}
        <div className={styles.filterSection}>
          <div className={styles.filterHeader}>
            <span className={styles.filterTitle}>
              <Package size={16} style={{ marginRight: '8px' }} />
              Stock
            </span>
            <ChevronRight size={16} />
          </div>
          <div className={styles.filterOptions}>
            <label className={styles.filterOption}>
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={e => {
                  setLowStockOnly(e.target.checked)
                  const qs = new URLSearchParams(searchParams.toString())
                  if (e.target.checked) qs.set('lowStock','true')
                  else qs.delete('lowStock')
                  router.replace(qs.toString() ? `/products?${qs}` : '/products')
                }}
              />
              Only low stock
            </label>
            <label className={styles.filterOption}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => {
                  setInStockOnly(e.target.checked)
                  const qs = new URLSearchParams(searchParams.toString())
                  if (e.target.checked) qs.set('inStock','true')
                  else qs.delete('inStock')
                  router.replace(qs.toString() ? `/products?${qs}` : '/products')
                }}
              />
              In stock only
            </label>
          </div>
        </div>

        <div className={styles.filterActions}>
          <button 
            className={styles.clearAllButton}
            onClick={() => clearFilter('all')}
          >
            Clear All
          </button>
          <button 
            className={styles.applyButton}
            onClick={() => setIsFilterDrawerOpen(false)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )

  // Render sort drawer content
  const renderSortDrawer = () => (
    <div className={`${styles.sortDrawer} ${isSortDrawerOpen ? styles.sortDrawerOpen : ''}`}>
      <div className={styles.sortDrawerHeader}>
        <h2>Sort By</h2>
        <button 
          className={styles.closeButton}
          onClick={() => setIsSortDrawerOpen(false)}
        >
          <X size={20} />
        </button>
      </div>
      <div className={styles.sortOptions}>
        <label className={styles.sortOption}>
          <input
            type="radio"
            name="sortOption"
            checked={sortOrder === '' || sortOrder === 'newest'}
            onChange={() => handleSortChange('')}
          />
          <span>Newest First</span>
        </label>
        <label className={styles.sortOption}>
          <input
            type="radio"
            name="sortOption"
            checked={sortOrder === 'oldest'}
            onChange={() => handleSortChange('oldest')}
          />
          <span>Oldest First</span>
        </label>
        <label className={styles.sortOption}>
          <input
            type="radio"
            name="sortOption"
            checked={sortOrder === 'price_asc'}
            onChange={() => handleSortChange('price_asc')}
          />
          <span>Price: Low to High</span>
        </label>
        <label className={styles.sortOption}>
          <input
            type="radio"
            name="sortOption"
            checked={sortOrder === 'price_desc'}
            onChange={() => handleSortChange('price_desc')}
          />
          <span>Price: High to Low</span>
        </label>
      </div>
    </div>
  )

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button className={styles.backButton} onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </button>
          <div className={styles.headerTitle}>
            <div className={styles.brandLogo}>
              <span className={styles.brandLogoText}>A</span>
            </div>
            <div className={styles.titleContainer}>
              <h1 className={styles.title}>{activeCategoryName.toUpperCase()}</h1>
              <p className={styles.itemCount}>{products.length} Items</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.actionButton} onClick={() => router.push('/search')}>
              <Search size={20} />
            </button>
            <button className={styles.actionButton} onClick={() => router.push('/dashboard/wishlist')}>
              <Heart size={20} />
            </button>
            <button className={styles.actionButton} onClick={() => router.push('/dashboard/cart')}>
              <div className={styles.bagContainer}>
                <ShoppingBag size={20} />
                <span className={styles.bagCount}>2</span>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Active Filters */}
      {hasActiveFilters && (
        <div className={styles.activeFilters}>
          {currentCategory && (
            <div className={styles.filterTag}>
              {KNOWN_CATEGORIES.find(c => c.slug === currentCategory)?.name || currentCategory}
              <button onClick={() => clearFilter('category')}>×</button>
            </div>
          )}
          {currentTag && (
            <div className={styles.filterTag}>
              {currentTag}
              <button onClick={() => clearFilter('usageTag')}>×</button>
            </div>
          )}
          {ratingMin && (
            <div className={styles.filterTag}>
              {ratingMin}+ ★
              <button onClick={() => clearFilter('rating')}>×</button>
            </div>
          )}
          {lowStockOnly && (
            <div className={styles.filterTag}>
              Low Stock
              <button onClick={() => clearFilter('lowStock')}>×</button>
            </div>
          )}
          {inStockOnly && (
            <div className={styles.filterTag}>
              In Stock
              <button onClick={() => clearFilter('inStock')}>×</button>
            </div>
          )}
          {sortOrder && (
            <div className={styles.filterTag}>
              {sortOrder === 'oldest' ? 'Oldest' : 
              sortOrder === 'price_asc' ? 'Price: Low-High' : 
              sortOrder === 'price_desc' ? 'Price: High-Low' : 'Newest'}
              <button onClick={() => clearFilter('sort')}>×</button>
            </div>
          )}
        </div>
      )}
      
      {/* Category Pills */}
      <div className={styles.categoryScroll}>
        <button 
          className={`${styles.categoryButton} ${!currentCategory ? styles.activeCategory : ''}`}
          onClick={() => handleCategoryChange('')}
        >
          All
        </button>
        {KNOWN_CATEGORIES.map((category) => (
          <button 
            key={category.slug}
            className={`${styles.categoryButton} ${currentCategory === category.slug ? styles.activeCategory : ''}`}
            onClick={() => handleCategoryChange(category.slug)}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      {/* Product Grid */}
      <div className={styles.list}>
        {products.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No products found</p>
            <button 
              className={styles.clearAllButton} 
              onClick={() => clearFilter('all')}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          products.map((prod) => (
            <div key={prod.id} className={styles.card}>
              <Link href={`/products/${prod.id}`} className={styles.cardLink}>
                <div className={styles.imageContainer}>
                  {prod.imageUrls[0] ? (
                    <img src={prod.imageUrls[0]} alt={prod.name} className={styles.image} />
                  ) : (
                    <div className={styles.noImage}>No image</div>
                  )}
                  {prod.stockQuantity <= 0 ? (
                    <div className={styles.soldOutBadge}>Sold Out</div>
                  ) : prod.stockQuantity <= LOW_STOCK_THRESHOLD && (
                    <div className={styles.lowStockBadge}>Low Stock</div>
                  )}
                </div>
                <div className={styles.info}>
                  <h3 className={styles.brand}>{prod.category?.name || 'Art'}</h3>
                  <p className={styles.name}>{prod.name}</p>
                  <div className={styles.priceContainer}>
                    <span className={styles.price}>₹{Math.floor(prod.price).toLocaleString()}</span>
                    <span className={styles.originalPrice}>₹{Math.floor(prod.price * 1.5).toLocaleString()}</span>
                    <span className={styles.discount}>50% OFF!</span>
                  </div>
                  {prod.avgRating > 0 && (
                    <div className={styles.ratingPill}>
                      <span className={styles.ratingValue}>{prod.avgRating.toFixed(1)}</span>
                      <span className={styles.ratingCount}>({prod.ratingCount})</span>
                    </div>
                  )}
                  <p className={styles.delivery}>2 Day Delivery</p>
                </div>
              </Link>
              <div className={styles.wishlistButtonContainer} onClick={(e) => e.stopPropagation()}>
                <WishlistButton 
                  productId={prod.id} 
                  className={styles.wishlistButton}
                  preventNavigation={true}
                />
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Bottom Action Bar */}
      <div className={styles.bottomBar}>
        <button 
          className={styles.bottomBarButton}
          onClick={() => setIsSortDrawerOpen(true)}
        >
          <SortAsc size={18} />
          <span>SORT</span>
        </button>
        <div className={styles.bottomBarDivider}></div>
        <button 
          className={styles.bottomBarButton}
          onClick={() => setIsFilterDrawerOpen(true)}
        >
          <Filter size={18} />
          <span>FILTER</span>
        </button>
      </div>

      {/* Filter Drawer */}
      {renderFilterDrawer()}
      
      {/* Sort Drawer */}
      {renderSortDrawer()}
      
      {/* Overlay */}
      {(isFilterDrawerOpen || isSortDrawerOpen) && (
        <div 
          className={styles.overlay} 
          onClick={() => {
            setIsFilterDrawerOpen(false)
            setIsSortDrawerOpen(false)
          }}
        />
      )}
    </div>
  )
} 