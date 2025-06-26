// File: app/products/page.tsx

'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import WishlistButton from '../components/WishlistButton'
import styles from './products.module.css'
import { FiChevronLeft, FiChevronRight, FiFilter, FiGrid, FiStar, FiPackage, FiTrendingUp } from 'react-icons/fi'

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

export default function ProductsPage() {
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
        
        // Normalize imageUrls for each product (handle possible stringified JSON)
        let filteredProducts = (Array.isArray(data.products) ? data.products : []).map((p: any) => {
          const imgs = Array.isArray(p.imageUrls)
            ? p.imageUrls
            : (() => {
                try {
                  const parsed = JSON.parse(p.imageUrls || '[]')
                  return Array.isArray(parsed) ? parsed : []
                } catch {
                  return []
                }
              })()
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
    if (!productGridRef.current) return

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
  }, [scrollY, products])

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

  return (
    <div style={{ display: 'flex', position: 'relative' }}>
      {/* Sidebar Toggle Button */}
      <button 
        className={styles.sidebarToggle}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label={isSidebarOpen ? "Close filters" : "Open filters"}
        style={{ left: isSidebarOpen ? '280px' : '0' }}
      >
        {isSidebarOpen ? <FiChevronLeft size={18} /> : <FiChevronRight size={18} />}
      </button>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarClosed : ''}`}>
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
      </aside>

      <main className={`${styles.productsContainer} ${isSidebarOpen ? styles.mainContent : styles.mainContentCollapsed}`} style={{ flex: 1 }}>
        <h1 className={styles.title}>Discover Our Collection</h1>

        {/* Results */}
        {(products.length === 0) ? (
          <p className={styles.emptyProducts}>No products found.</p>
        ) : (
          <div className={styles.productGrid} ref={productGridRef}>
            {(products).map((prod, index) => (
              <div 
                key={prod.id} 
                className={styles.productCard}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {prod.stockQuantity <= 0 ? (
                  <span className={styles.outOfStockBadge}>
                    Out of stock
                  </span>
                ) : prod.stockQuantity <= LOW_STOCK_THRESHOLD && (
                  <span className={styles.lowStockBadge}>
                    Low stock
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
                  <div className={styles.productImageOverlay}>
                    <WishlistButton 
                      productId={prod.id} 
                      className={styles.wishlistButton}
                      preventNavigation={true}
                    />
                  </div>
                </div>
                <div className={styles.productInfo}>
                  {prod.category && (
                    <span className={styles.productCategory}>{prod.category.name}</span>
                  )}
                  <h3 className={styles.productName}>{prod.name}</h3>
                  <p className={styles.productPrice}>{prod.currency} {prod.price.toFixed(2)}</p>
                  {prod.avgRating !== undefined && (
                    <p style={{ fontSize: '0.85rem', margin: '2px 0' }}>
                      {[1,2,3,4,5].map(i=>i<=Math.round(prod.avgRating!)?'★':'☆').join('')} ({prod.ratingCount})
                    </p>
                  )}
                  <p className={styles.productShortDesc}>{prod.shortDesc}</p>
                  <Link href={`/products/${prod.id}`} className={styles.viewDetailsButton}>
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
