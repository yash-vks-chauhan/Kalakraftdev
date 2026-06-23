'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import ProductCard from '../components/ProductCard'
import ProductCardPro from './ProductCardPro'
import VirtualProductGrid from '../components/VirtualProductGrid'
import LoadingSpinner from '../components/LoadingSpinner'
import styles from './products.module.css'
import animationStyles from './products-animations.module.css'
import { FiChevronLeft, FiChevronRight, FiGrid, FiStar, FiPackage, FiTrendingUp, FiX, FiChevronDown } from 'react-icons/fi'
import { PackageSearch, Heart, ShoppingCart, User, ChevronDown, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { getImageUrl } from '../../lib/cloudinaryImages'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

// Radix Select can't use an empty-string value, so 'newest' stands in for
// the default sort and is mapped back to '' when written to the filter.
const SORT_SELECT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
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

// Normalize raw product records (parse imageUrls/usageTags, prefix bare
// filenames). Shared by the network fetch and the synchronous cache seed.
function normalizeProducts(arr: any[]): Product[] {
  return (Array.isArray(arr) ? arr : []).map((p: any) => {
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
      .map((img: string) => (img.startsWith('http') || img.startsWith('/') ? img : `/uploads/${img}`))
    const tagsArr = Array.isArray(p.usageTags)
      ? p.usageTags
      : (() => {
          try {
            const parsed = JSON.parse(p.usageTags || '[]')
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return []
          }
        })()
    return { ...p, imageUrls: imgs, usageTags: tagsArr, avgRating: p.avgRating ?? 0, ratingCount: p.ratingCount ?? 0 }
  })
}

// Synchronously seed from warm cache (memory or sessionStorage) so a return
// visit paints products instantly instead of flashing the skeleton. Only used
// when no filters are active (the cache holds the full, unfiltered catalogue).
function getSeedProducts(searchParams: { get(name: string): string | null }): Product[] {
  if (typeof window === 'undefined') return []
  const filterKeys = ['category', 'usageTag', 'priceMin', 'priceMax', 'sort', 'lowStock', 'inStock', 'ratingMin']
  if (filterKeys.some(k => searchParams.get(k))) return []
  try {
    const cached = DataCache.get('products')
    if (cached && cached.length > 0) return normalizeProducts(cached)
  } catch {
    /* ignore */
  }
  return []
}

export default function ProductsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productGridRef = useRef<HTMLDivElement>(null)

  // Consolidated state management using optimized hooks
  const { filters, updateFilter } = useProductFilters()
  const { isSmallScreen } = useDeviceDetection()
  const { applyCardAnimations } = useScrollCardAnimations()
  // Auth + cart/wishlist drive the new top-bar actions (the global navbar is
  // suppressed on /products, so this shell owns those affordances).
  const { user } = useAuth()
  const { cartItems } = useCart()
  const { wishlistItems } = useWishlist()

  // Remaining component state (reduced from 15+ to 6 variables)
  // Seed synchronously from warm cache so return visits paint products
  // immediately instead of getting stuck on the skeleton while the (sometimes
  // slow) /api/products request is in flight. All three product states are
  // seeded so the first frame is the real grid, not a flash of empty/skeleton.
  const seedRef = useRef<Product[] | null>(null)
  if (seedRef.current === null) seedRef.current = getSeedProducts(searchParams)
  const seeded = seedRef.current
  const [allProducts, setAllProducts] = useState<Product[]>(seeded)
  const [products, setProducts] = useState<Product[]>(seeded)
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>(() => seeded.slice(0, 15))
  const [usageTags, setUsageTags] = useState<string[]>([])
  // Start in the loading state on a cold load (no seed) so the very first
  // frame is the skeleton — never a "No products found" flash.
  const [loading, setLoading] = useState<boolean>(() => seeded.length === 0)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

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

  // Active filter count (drives the badge on the Filters button)
  const pageFilterCount =
    (currentCategory ? 1 : 0) +
    (currentTag ? 1 : 0) +
    (ratingMin ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (lowStockOnly ? 1 : 0)

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
        
        // Normalize imageUrls / usageTags (shared with the synchronous seed)
        let filteredProducts = normalizeProducts(allProducts)

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
    if (!isMobileView && !isMobileFilterOpen) {
      applyCardAnimations(productGridRef)
    }
  }, [isMobileView, isMobileFilterOpen, products.length, currentPage, applyCardAnimations])

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

  // Redesigned persistent filters for the desktop sidebar (shadcn aesthetic).
  // Reuses the same filter state/handlers as the mobile renderFilters above.
  const renderDesktopFilters = () => {
    const radioRow = (selected: boolean, label: React.ReactNode, onClick: () => void) => (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13.5px] transition-colors',
          selected ? 'text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
        )}
      >
        <span
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
            selected ? 'border-zinc-900' : 'border-zinc-300 group-hover:border-zinc-400',
          )}
        >
          {selected && <span className="h-2 w-2 rounded-full bg-zinc-900" />}
        </span>
        <span className="flex-1">{label}</span>
      </button>
    )

    const checkRow = (checked: boolean, label: React.ReactNode, onClick: () => void) => (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13.5px] transition-colors',
          checked ? 'text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
        )}
      >
        <span
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors',
            checked ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 group-hover:border-zinc-400',
          )}
        >
          {checked && <Check className="h-3 w-3" />}
        </span>
        <span className="flex-1">{label}</span>
      </button>
    )

    const Section = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => (
      <div className="border-b border-zinc-100 last:border-0">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          aria-expanded={openSections[id]}
          className="flex w-full items-center justify-between px-2 py-3.5 text-left"
        >
          <span className="text-[12px] font-semibold uppercase tracking-[0.09em] text-zinc-900">{label}</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-zinc-400 transition-transform duration-300',
              openSections[id] && 'rotate-180',
            )}
          />
        </button>
        <div
          className={cn(
            'grid transition-all duration-300 ease-out',
            openSections[id] ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="overflow-hidden">
            <div className="pb-3">{children}</div>
          </div>
        </div>
      </div>
    )

    const setCategory = (slug: string) => {
      const qs = new URLSearchParams(searchParams.toString())
      if (slug === currentCategory) qs.delete('category')
      else qs.set('category', slug)
      router.replace(qs.toString() ? `/products?${qs}` : '/products')
    }
    const setTag = (tag: string) => {
      const qs = new URLSearchParams(searchParams.toString())
      if (tag === currentTag) qs.delete('usageTag')
      else qs.set('usageTag', tag)
      router.replace(qs.toString() ? `/products?${qs}` : '/products')
    }

    return (
      <div className="flex flex-col">
        <Section id="category" label="Category">
          {KNOWN_CATEGORIES.map(cat =>
            <div key={cat.slug}>{radioRow(currentCategory === cat.slug, cat.name, () => setCategory(cat.slug))}</div>,
          )}
        </Section>

        {usageTags.length > 0 && (
          <Section id="mood" label="Purpose / Mood">
            {usageTags.map(tag =>
              <div key={tag}>{radioRow(currentTag === tag, tag, () => setTag(tag))}</div>,
            )}
          </Section>
        )}

        <Section id="rating" label="Rating">
          {[4, 3, 2, 1].map(thr =>
            <div key={thr}>
              {radioRow(
                Number(ratingMin) === thr,
                <span className="flex items-center gap-1">
                  <span className="text-amber-400">{'★'.repeat(thr)}</span>
                  <span className="text-zinc-400">&amp; up</span>
                </span>,
                () => updateFilter('ratingMin', Number(ratingMin) === thr ? '' : String(thr)),
              )}
            </div>,
          )}
        </Section>

        <Section id="stock" label="Availability">
          {checkRow(inStockOnly, 'In stock only', () => updateFilter('inStockOnly', !inStockOnly))}
          {checkRow(lowStockOnly, 'Low stock', () => updateFilter('lowStockOnly', !lowStockOnly))}
        </Section>
      </div>
    )
  }

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
          <div className="flex w-full bg-white">
            {/* ── Persistent filter sidebar ─────────────────────── */}
            <aside className="sticky top-0 z-40 hidden h-screen w-[280px] shrink-0 flex-col border-r border-zinc-200/80 bg-white/85 backdrop-blur-xl lg:flex">
              {/* Brand header — aligns with the top bar to form one frame */}
              <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-zinc-200/70 px-5">
                <Link href="/" className="flex items-center gap-2.5 outline-none">
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-zinc-900/[0.06]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getImageUrl('logo.png')} alt="" className="h-6 w-6 object-contain" />
                  </span>
                  <span className="flex flex-col leading-none">
                    <span className="text-[14px] font-semibold tracking-tight text-zinc-900">Kalakraft</span>
                    <span className="mt-1 text-[9.5px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                      Handcrafted
                    </span>
                  </span>
                </Link>
              </div>

              {/* Filters */}
              <div className="flex-1 overflow-y-auto px-5 py-5">
                {renderDesktopFilters()}
              </div>

              {/* Footer */}
              <div className="shrink-0 border-t border-zinc-200/70 px-5 py-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 transition-colors hover:text-zinc-700"
                >
                  <FiChevronLeft size={14} /> Back to home
                </Link>
              </div>
            </aside>

            {/* ── Main column ───────────────────────────────────── */}
            <div className="flex min-h-screen min-w-0 flex-1 flex-col">
              {/* Top bar attached to the sidebar */}
              <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-zinc-200/80 bg-white/70 px-6 backdrop-blur-xl xl:px-10">
                <div className="flex items-baseline gap-3">
                  <h1 className="text-[15px] font-semibold tracking-tight text-zinc-900">
                    {currentCategory
                      ? KNOWN_CATEGORIES.find(c => c.slug === currentCategory)?.name || 'Products'
                      : currentTag || 'All Products'}
                  </h1>
                  <span className="hidden text-[13px] text-zinc-400 sm:inline">
                    {displayedProducts.length} of {allProducts.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Select
                    value={sortOrder && sortOrder !== '' ? sortOrder : 'newest'}
                    onValueChange={(v) => updateFilter('sortOrder', v === 'newest' ? '' : v)}
                  >
                    <SelectTrigger
                      size="sm"
                      className="h-9 gap-2 rounded-full border-zinc-200/80 bg-white/70 px-4 text-[13px] font-medium text-zinc-800 hover:bg-white"
                    >
                      <span className="text-zinc-400">Sort</span>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end" className="rounded-xl border-zinc-200/80 bg-white/95 backdrop-blur-xl">
                      {SORT_SELECT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="rounded-lg text-[13px]">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="mx-1.5 h-5 w-px bg-zinc-200" />

                  <Link
                    href={user ? '/dashboard/wishlist' : '/auth/login'}
                    aria-label="Wishlist"
                    className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    <Heart className="h-[18px] w-[18px]" />
                    {user && wishlistItems.length > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[9.5px] font-semibold leading-none text-white">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Link>

                  <Link
                    href={user ? '/dashboard/cart' : '/auth/login'}
                    aria-label="Cart"
                    className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    <ShoppingCart className="h-[18px] w-[18px]" />
                    {user && cartItems.length > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[9.5px] font-semibold leading-none text-white">
                        {cartItems.length}
                      </span>
                    )}
                  </Link>

                  <Link
                    href={user ? '/dashboard/profile' : '/auth/login'}
                    aria-label="Account"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    <User className="h-[18px] w-[18px]" />
                  </Link>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-9 xl:px-10">
                {/* Editorial intro */}
                <header className="mb-8">
                  <span className="mb-2 inline-block text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    The Collection
                  </span>
                  <h2 className="text-[30px] font-semibold leading-[1.1] tracking-tight text-zinc-900 lg:text-[38px]">
                    {currentCategory
                      ? KNOWN_CATEGORIES.find(c => c.slug === currentCategory)?.name || 'Discover Our Collection'
                      : 'Discover Our Collection'}
                  </h2>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-zinc-500">
                    Handcrafted pieces, curated with care — each one made to be lived with.
                  </p>
                </header>

                {/* Active filter chips */}
                {pageFilterCount > 0 && (
                  <div className="mb-7 flex flex-wrap items-center gap-2">
                    {currentCategory && (
                      <button
                        onClick={() => {
                          const qs = new URLSearchParams(searchParams.toString())
                          qs.delete('category')
                          router.replace(qs.toString() ? `/products?${qs}` : '/products')
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                      >
                        {KNOWN_CATEGORIES.find(c => c.slug === currentCategory)?.name || currentCategory}
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    {currentTag && (
                      <button
                        onClick={() => {
                          const qs = new URLSearchParams(searchParams.toString())
                          qs.delete('usageTag')
                          router.replace(qs.toString() ? `/products?${qs}` : '/products')
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                      >
                        {currentTag}
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    {ratingMin && (
                      <button
                        onClick={() => updateFilter('ratingMin', '')}
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                      >
                        {ratingMin}+ ★
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    {inStockOnly && (
                      <button
                        onClick={() => updateFilter('inStockOnly', false)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                      >
                        In stock
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    {lowStockOnly && (
                      <button
                        onClick={() => updateFilter('lowStockOnly', false)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                      >
                        Low stock
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => router.replace('/products')}
                      className="ml-1 text-[12.5px] font-medium text-zinc-400 underline underline-offset-2 transition-colors hover:text-zinc-700"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                {showInitialLoading ? (
                  <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-14 2xl:grid-cols-4">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="flex flex-col">
                        <div className="aspect-[4/5] w-full animate-pulse rounded-[20px] bg-zinc-100" />
                        <div className="mt-3.5 space-y-2.5">
                          <div className="h-2.5 w-14 animate-pulse rounded bg-zinc-100" />
                          <div className="h-3.5 w-3/4 animate-pulse rounded bg-zinc-100" />
                          <div className="h-3.5 w-1/3 animate-pulse rounded bg-zinc-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50">
                      <PackageSearch className="h-7 w-7 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-[17px] font-semibold text-zinc-900">No products found</p>
                      <p className="mt-1 text-[14px] text-zinc-500">Try adjusting or clearing your filters.</p>
                    </div>
                  </div>
                ) : products.length > 50 ? (
                  <VirtualProductGrid products={displayedProducts} className={styles.productGrid} />
                ) : (
                  <>
                    <div
                      ref={productGridRef}
                      className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-14 2xl:grid-cols-4"
                    >
                      {displayedProducts.map((prod, index) => (
                        <ProductCardPro key={prod.id} product={prod} index={index} />
                      ))}
                    </div>

                    {displayedProducts.length < allProducts.length && (
                      <div
                        ref={loadMoreTriggerRef}
                        className="flex min-h-[140px] w-full items-center justify-center pt-10"
                      >
                        {loadingMore && (
                          <LoadingSpinner size="medium" message="Loading more products..." />
                        )}
                      </div>
                    )}

                    {displayedProducts.length >= allProducts.length && allProducts.length > 15 && (
                      <div className="relative mt-24 -mx-6 overflow-hidden bg-zinc-950 px-10 py-28 lg:py-40 xl:-mx-10">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.10),transparent_60%)]" />
                        <p
                          className="relative text-center text-[13vw] italic leading-none text-white lg:text-[92px]"
                          style={{
                            fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
                            fontWeight: 300,
                            letterSpacing: '0.12em',
                            textTransform: 'lowercase',
                            textShadow: '0 0 40px rgba(255,255,255,0.12)',
                          }}
                        >
                          coming soon
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
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
