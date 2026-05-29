'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ProductCard from '../components/ProductCard'
import VirtualProductGrid from '../components/VirtualProductGrid'
import LoadingSpinner from '../components/LoadingSpinner'
import styles from './products.module.css'
import animationStyles from './products-animations.module.css'
import { FiChevronLeft, FiChevronRight, FiFilter, FiGrid, FiStar, FiPackage, FiTrendingUp, FiX, FiChevronDown } from 'react-icons/fi'
import { DataCache } from '../../lib/dataCache'
import { useDeviceDetection } from '../hooks/useDeviceDetection'
import { useProductFilters } from '../hooks/useProductFilters'
import { useScrollCardAnimations } from '../hooks/useOptimizedScroll'

// Single easing curve used across every motion on this page — matches
// the navbar's morph curve so the whole experience feels like one motion.
const SMOOTH_EASE = [0.32, 0.72, 0, 1] as [number, number, number, number]

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

const PAGE_SORT_OPTIONS = [
  { value: '', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
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
  const { filters, updateFilter } = useProductFilters()
  const { isSmallScreen } = useDeviceDetection()
  const { applyCardAnimations } = useScrollCardAnimations()
  
  // Remaining component state (reduced from 15+ to 6 variables)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([])
  const [usageTags, setUsageTags] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(false)
  // Mirror the navbar's minimize threshold so the on-page toolbar
  // fades out exactly when the navbar morphs and picks up the controls.
  const [isPageScrolled, setIsPageScrolled] = useState(false)

  // State for accordion open/close
  const [openSections, setOpenSections] = useState<{[key: string]: boolean}>({
    category: true,
    mood: false,
    rating: false,
    stock: false,
    sort: false
  })

  // Infinite scroll state (desktop only)
  const [displayCount, setDisplayCount] = useState(15)
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null)

  // In-page sort dropdown state (only used at top of page on desktop)
  const [pageSortOpen, setPageSortOpen] = useState(false)
  const pageSortRef = useRef<HTMLDivElement>(null)

  // Pagination state (mobile only)
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

  // Pagination calculations (mobile only)
  const totalProducts = allProducts.length
  const totalPages = Math.ceil(totalProducts / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const paginatedProducts = allProducts.slice(startIndex, endIndex)

  // Update products based on view type
  useEffect(() => {
    if (isMobileView) {
      // Mobile: use pagination
      setProducts(paginatedProducts)
    } else {
      // Desktop: use all products for infinite scroll
      setProducts(allProducts)
      setDisplayedProducts(allProducts.slice(0, displayCount))
    }
  }, [allProducts, currentPage, productsPerPage, isMobileView, displayCount])

  // Infinite scroll observer for desktop
  useEffect(() => {
    const trigger = loadMoreTriggerRef.current
    if (isMobileView || !trigger) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && displayedProducts.length < allProducts.length && !loadingMore) {
          // Load more products
          setLoadingMore(true)
          setTimeout(() => {
            const newCount = Math.min(displayCount + 15, allProducts.length)
            setDisplayCount(newCount)
            setDisplayedProducts(allProducts.slice(0, newCount))
            setLoadingMore(false)
          }, 300) // Small delay for smooth UX
        }
      },
      {
        root: null,
        rootMargin: '200px', // Start loading 200px before reaching the trigger
        threshold: 0.1
      }
    )

    observer.observe(trigger)

    return () => {
      observer.unobserve(trigger)
    }
  }, [isMobileView, displayedProducts.length, allProducts.length, displayCount, loadingMore])

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(15)
  }, [currentCategory, currentTag, priceMin, priceMax, sortOrder, lowStockOnly, inStockOnly, ratingMin])

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

  // Listen for navbar-dispatched filter toggle (Filters button lives in the morph navbar)
  useEffect(() => {
    if (isMobileView) return
    const handler = () => setIsDesktopFilterOpen(prev => !prev)
    window.addEventListener('toggle-product-filter', handler)
    return () => window.removeEventListener('toggle-product-filter', handler)
  }, [isMobileView])

  // Track scroll position so we can hide the in-page toolbar
  // when the navbar morphs and takes over Filter + Sort.
  useEffect(() => {
    if (isMobileView) return
    const onScroll = () => setIsPageScrolled(window.scrollY > 100)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isMobileView])

  // Close in-page Sort dropdown on outside click
  useEffect(() => {
    if (!pageSortOpen) return
    const onDown = (e: MouseEvent) => {
      if (pageSortRef.current && !pageSortRef.current.contains(e.target as Node)) {
        setPageSortOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [pageSortOpen])

  // Active filter count (drives the badge on the Filters button)
  const pageFilterCount =
    (currentCategory ? 1 : 0) +
    (currentTag ? 1 : 0) +
    (ratingMin ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (lowStockOnly ? 1 : 0)

  const currentPageSortLabel =
    PAGE_SORT_OPTIONS.find(o => o.value === sortOrder)?.label || 'Newest'

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
  // Pause animations while any filter drawer is open to avoid visual size shifts
  useEffect(() => {
    if (!isMobileView && !isDesktopFilterOpen && !isMobileFilterOpen) {
      applyCardAnimations(productGridRef)
    }
  }, [isMobileView, isDesktopFilterOpen, isMobileFilterOpen, products.length, currentPage, applyCardAnimations])

  // Close mobile filter drawer when switching to desktop view
  useEffect(() => {
    if (!isMobileView) {
      setIsMobileFilterOpen(false)
    }
  }, [isMobileView])

  if (error) return <p className={styles.errorMessage}>Error: {error}</p>

  // Loading state: only true initially when there's no data to show.
  // Once products are loaded, subsequent fetches keep the layout visible
  // and surface a subtle inline spinner inside the grid area instead.
  const showInitialLoading = loading && allProducts.length === 0

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Accordion content animation — single source of truth so every
  // section opens/closes with the same feel.
  const accordionMotion = {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto' as const, opacity: 1 },
    exit:    { height: 0, opacity: 0 },
    transition: { duration: 0.32, ease: SMOOTH_EASE },
    style: { overflow: 'hidden' as const },
  }

  // Chevron rotation — one shared transition.
  const chevronTransition = { duration: 0.28, ease: SMOOTH_EASE }

  // Render the filter sidebar/drawer
  const renderFilters = () => (
    <>
      {/* Category filter */}
      <div className={styles.filterSection}>
        <div className={styles.filterHeader} onClick={() => toggleSection('category')}>
          <span><FiGrid />Category</span>
          <motion.div animate={{ rotate: openSections.category ? 180 : 0 }} transition={chevronTransition}>
            <FiChevronDown className={styles.arrow} />
          </motion.div>
        </div>
        <AnimatePresence initial={false}>
          {openSections.category && (
            <motion.div className={styles.filterContent} {...accordionMotion}>
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
                  <span>{cat.name}</span>
                </label>
              ))}
              {currentCategory && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => {
                    const qs = new URLSearchParams(searchParams.toString())
                    qs.delete('category')
                    router.replace(qs.toString() ? `/products?${qs}` : '/products')
                  }}
                >
                  Clear
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mood Tags */}
      {usageTags.length > 0 && (
        <div className={styles.filterSection}>
          <div className={styles.filterHeader} onClick={() => toggleSection('mood')}>
            <span><FiTrendingUp />Purpose / Mood</span>
            <motion.div animate={{ rotate: openSections.mood ? 180 : 0 }} transition={chevronTransition}>
              <FiChevronDown className={styles.arrow} />
            </motion.div>
          </div>
          <AnimatePresence initial={false}>
            {openSections.mood && (
              <motion.div className={styles.filterContent} {...accordionMotion}>
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
                    <span>{tag}</span>
                  </label>
                ))}
                {currentTag && (
                  <button
                    type="button"
                    className={styles.clearButton}
                    onClick={() => {
                      const qs = new URLSearchParams(searchParams.toString())
                      qs.delete('usageTag')
                      router.replace(qs.toString() ? `/products?${qs}` : '/products')
                    }}
                  >
                    Clear
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Rating */}
      <div className={styles.filterSection}>
        <div className={styles.filterHeader} onClick={() => toggleSection('rating')}>
          <span><FiStar />Rating</span>
          <motion.div animate={{ rotate: openSections.rating ? 180 : 0 }} transition={chevronTransition}>
            <FiChevronDown className={styles.arrow} />
          </motion.div>
        </div>
        <AnimatePresence initial={false}>
          {openSections.rating && (
            <motion.div className={styles.filterContent} {...accordionMotion}>
              {[4, 3, 2, 1].map(thr => (
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
                  <span>{thr}+ stars</span>
                </label>
              ))}
              {ratingMin && (
                <button type="button" className={styles.clearButton} onClick={() => updateFilter('ratingMin', '')}>
                  Clear
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stock */}
      <div className={styles.filterSection}>
        <div className={styles.filterHeader} onClick={() => toggleSection('stock')}>
          <span><FiPackage />Stock</span>
          <motion.div animate={{ rotate: openSections.stock ? 180 : 0 }} transition={chevronTransition}>
            <FiChevronDown className={styles.arrow} />
          </motion.div>
        </div>
        <AnimatePresence initial={false}>
          {openSections.stock && (
            <motion.div className={styles.filterContent} {...accordionMotion}>
              <label className={styles.filterOption}>
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={e => {
                    updateFilter('lowStockOnly', e.target.checked)
                    if (isMobileView) setIsMobileFilterOpen(false)
                  }}
                />
                <span>Only low stock</span>
              </label>
              <label className={styles.filterOption}>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={e => {
                    updateFilter('inStockOnly', e.target.checked)
                    if (isMobileView) setIsMobileFilterOpen(false)
                  }}
                />
                <span>In stock only</span>
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sort */}
      <div className={styles.filterSection}>
        <div className={styles.filterHeader} onClick={() => toggleSection('sort')}>
          <span><FiTrendingUp />Sort</span>
          <motion.div animate={{ rotate: openSections.sort ? 180 : 0 }} transition={chevronTransition}>
            <FiChevronDown className={styles.arrow} />
          </motion.div>
        </div>
        <AnimatePresence initial={false}>
          {openSections.sort && (
            <motion.div className={styles.filterContent} {...accordionMotion}>
              {PAGE_SORT_OPTIONS.map(opt => (
                <label key={opt.value || 'default'} className={styles.filterOption}>
                  <input
                    type="radio"
                    name="sortoption"
                    checked={sortOrder === opt.value || (opt.value === '' && sortOrder === 'newest')}
                    onChange={() => {
                      updateFilter('sortOrder', opt.value)
                      if (isMobileView) setIsMobileFilterOpen(false)
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
              {sortOrder && sortOrder !== '' && (
                <button type="button" className={styles.clearButton} onClick={() => updateFilter('sortOrder', '')}>
                  Clear
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', position: 'relative' }} className={isMobileView ? styles.mobilePageWrapper : ''}>
      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isMobileView && isMobileFilterOpen && (
          <>
            <motion.div
              className={styles.mobileFilterDrawer}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.46, ease: SMOOTH_EASE }}
            >
              <div className={styles.mobileFilterHeader}>
                <h2>Filters</h2>
                <motion.button
                  type="button"
                  className={styles.mobileFilterCloseButton}
                  onClick={() => setIsMobileFilterOpen(false)}
                  aria-label="Close filters"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ duration: 0.26, ease: SMOOTH_EASE }}
                >
                  <FiX size={22} />
                </motion.button>
              </div>
              <div className={styles.mobileFilterContent}>
                {renderFilters()}
              </div>
            </motion.div>

            {/* Mobile Filter Overlay */}
            <motion.div
              className={styles.mobileFilterOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: SMOOTH_EASE }}
              onClick={() => setIsMobileFilterOpen(false)}
            />
          </>
        )}
      </AnimatePresence>

      <main className={`
        ${styles.productsContainer}
        ${isMobileView ? styles.mobileProductsContainer : ''}
      `}>
        {isMobileView && (
          <h1 className={styles.title}>Discover Our Collection</h1>
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

        {/* Desktop: left sidebar that pushes content; Mobile: standard layout */}
        {!isMobileView ? (
          <div className={styles.desktopWrap}>
            <AnimatePresence>
              {isDesktopFilterOpen && (
                <motion.aside
                  className={styles.desktopSidebar}
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.46, ease: SMOOTH_EASE }}
                >
                  <div className={styles.mobileFilterHeader}>
                    <h2>Filters</h2>
                    <motion.button
                      type="button"
                      className={styles.mobileFilterCloseButton}
                      onClick={() => setIsDesktopFilterOpen(false)}
                      aria-label="Close filters"
                      whileHover={{ rotate: 90 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ duration: 0.26, ease: SMOOTH_EASE }}
                    >
                      <FiX size={22} />
                    </motion.button>
                  </div>
                  <div className={styles.mobileFilterContent}>
                    {renderFilters()}
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
            <motion.div
              className={styles.desktopMain}
              animate={{
                marginLeft: isDesktopFilterOpen ? 'var(--sidebar-width)' : 0,
              }}
              transition={{ duration: 0.46, ease: SMOOTH_EASE }}
            >
              <h1 className={styles.title}>Discover Our Collection</h1>

              {/* In-page Filter + Sort toolbar (top of page only; hands off
                  to the morph navbar once isPageScrolled flips). */}
              <div
                className={`${styles.pageToolbar} ${isPageScrolled ? styles.pageToolbarHidden : ''}`}
                aria-hidden={isPageScrolled}
              >
                <button
                  type="button"
                  className={styles.pageToolBtn}
                  onClick={() => setIsDesktopFilterOpen(prev => !prev)}
                  aria-expanded={isDesktopFilterOpen}
                  aria-label="Toggle filters"
                  tabIndex={isPageScrolled ? -1 : 0}
                >
                  <FiFilter size={14} />
                  <span>Filters</span>
                  {pageFilterCount > 0 && (
                    <span className={styles.pageToolBadge}>{pageFilterCount}</span>
                  )}
                </button>

                <div className={styles.pageSortWrap} ref={pageSortRef}>
                  <button
                    type="button"
                    className={styles.pageToolBtn}
                    onClick={() => setPageSortOpen(o => !o)}
                    aria-expanded={pageSortOpen}
                    aria-haspopup="listbox"
                    tabIndex={isPageScrolled ? -1 : 0}
                  >
                    <span className={styles.pageToolMuted}>Sort:</span>
                    <span>{currentPageSortLabel}</span>
                    <FiChevronDown
                      size={14}
                      className={`${styles.pageToolChevron} ${pageSortOpen ? styles.pageToolChevronOpen : ''}`}
                    />
                  </button>
                  <div
                    className={`${styles.pageSortMenu} ${pageSortOpen ? styles.pageSortMenuOpen : ''}`}
                    role="listbox"
                    aria-hidden={!pageSortOpen}
                  >
                    {PAGE_SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value || 'default'}
                        type="button"
                        role="option"
                        aria-selected={sortOrder === opt.value}
                        onClick={() => {
                          updateFilter('sortOrder', opt.value)
                          setPageSortOpen(false)
                        }}
                        className={`${styles.pageSortOption} ${sortOrder === opt.value ? styles.pageSortOptionActive : ''}`}
                        tabIndex={pageSortOpen ? 0 : -1}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {showInitialLoading ? (
                <div className={styles.gridLoadingContainer}>
                  <LoadingSpinner size="large" message="Loading products..." />
                </div>
              ) : products.length === 0 ? (
                <p className={styles.emptyProducts}>No products found.</p>
              ) : products.length > 50 ? (
                <VirtualProductGrid
                  products={displayedProducts}
                  className={styles.productGrid}
                />
              ) : (
                <>
                  <div className={styles.productGrid} ref={productGridRef}>
                    {displayedProducts.map((prod, index) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        index={index}
                        className={animationStyles.productCard}
                      />
                    ))}
                  </div>

                  {/* Infinite Scroll Trigger for Desktop */}
                  {displayedProducts.length < allProducts.length && (
                    <div ref={loadMoreTriggerRef} className={styles.loadMoreTrigger}>
                      {loadingMore && (
                        <div className={styles.loadingMoreContainer}>
                          <LoadingSpinner size="medium" message="Loading more products..." />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show elegant footer when all products loaded */}
                  {displayedProducts.length >= allProducts.length && allProducts.length > 15 && (
                    <div className={styles.allLoadedMessage}>
                      <p>Coming Soon</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        ) : (
          <>
            {showInitialLoading ? (
              <div className={styles.gridLoadingContainer}>
                <LoadingSpinner size="large" message="Loading products..." />
              </div>
            ) : products.length === 0 ? (
              <p className={styles.emptyProducts}>No products found.</p>
            ) : products.length > 50 ? (
              <VirtualProductGrid
                products={products}
                className={`${styles.productGrid} ${styles.mobileProductGrid}`}
              />
            ) : (
              <div className={`${styles.productGrid} ${styles.mobileProductGrid}`} ref={productGridRef}>
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
                  <button onClick={handlePreviousPage} disabled={currentPage === 1} className={styles.paginationButton}>
                    <FiChevronLeft size={16} />
                    Previous
                  </button>
                  <div className={styles.paginationNumbers}>
                    {currentPage > 3 && (
                      <>
                        <button onClick={() => handlePageSelect(1)} className={styles.pageNumber}>1</button>
                        {currentPage > 4 && <span className={styles.paginationDots}>...</span>}
                      </>
                    )}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageStart = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
                      const page = pageStart + i
                      if (page > totalPages) return null
                      return (
                        <button key={page} onClick={() => handlePageSelect(page)} className={`${styles.pageNumber} ${page === currentPage ? styles.pageNumberActive : ''}`}>
                          {page}
                        </button>
                      )
                    })}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && <span className={styles.paginationDots}>...</span>}
                        <button onClick={() => handlePageSelect(totalPages)} className={styles.pageNumber}>{totalPages}</button>
                      </>
                    )}
                  </div>
                  <button onClick={handleNextPage} disabled={currentPage === totalPages} className={styles.paginationButton}>
                    Next
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
} 
