'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import ProductCard from '../components/ProductCard'
import ProductCardPro from './ProductCardPro'
import VirtualProductGrid from '../components/VirtualProductGrid'
import LoadingSpinner from '../components/LoadingSpinner'
import styles from './products.module.css'
import animationStyles from './products-animations.module.css'
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'
import { AlertCircle, ArrowUp, ArrowUpDown, PackageSearch, Heart, ShoppingCart, User, ChevronDown, Check, X, Star, RotateCcw, SlidersHorizontal, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
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

// localStorage stale-while-revalidate cache for the full catalogue. Survives a
// hard reload / direct deep-link (which never trigger the home splash preload),
// so the grid paints instantly from the last-known products instead of the
// skeleton, then revalidates in the background.
const PRODUCTS_LS_KEY = 'kk_products_v1'
const PRODUCTS_LS_TTL = 24 * 60 * 60 * 1000 // 1 day

function persistProducts(raw: any[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PRODUCTS_LS_KEY, JSON.stringify({ products: raw, ts: Date.now() }))
  } catch {
    /* quota / private mode — ignore */
  }
}

// Read the full, unfiltered catalogue from the warm caches (session cache
// first, then localStorage). Returns [] when nothing usable is cached.
function readCachedCatalogue(): Product[] {
  if (typeof window === 'undefined') return []
  // 1) In-memory / session cache (warm within an app session)
  try {
    const cached = DataCache.get('products')
    if (cached && cached.length > 0) return normalizeProducts(cached)
  } catch {
    /* ignore */
  }
  // 2) localStorage cache (survives reloads / deep-links across sessions)
  try {
    const raw = localStorage.getItem(PRODUCTS_LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (
        parsed &&
        Array.isArray(parsed.products) &&
        parsed.products.length > 0 &&
        Date.now() - (parsed.ts || 0) < PRODUCTS_LS_TTL
      ) {
        return normalizeProducts(parsed.products)
      }
    }
  } catch {
    /* ignore */
  }
  return []
}

// Synchronously seed from warm cache so a return visit paints products instantly
// instead of flashing the skeleton. Only used when no filters are active (the
// cache holds the full, unfiltered catalogue).
function getSeedProducts(searchParams: { get(name: string): string | null }): Product[] {
  if (typeof window === 'undefined') return []
  const filterKeys = ['category', 'usageTag', 'priceMin', 'priceMax', 'sort', 'lowStock', 'inStock', 'ratingMin']
  if (filterKeys.some(k => searchParams.get(k))) return []
  return readCachedCatalogue()
}

// Single grid card placeholder — shared by the initial load and the
// infinite-scroll "load more" state so both read as the same skeleton.
function GridCardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="aspect-[4/5] w-full animate-pulse rounded-xl bg-[#f0f0f0]" />
      <div className="mt-4 space-y-2.5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-[#f0f0f0]" />
        <div className="h-3.5 w-1/3 animate-pulse rounded bg-[#f0f0f0]" />
      </div>
    </div>
  )
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
  // Full, unfiltered catalogue — drives the per-category counts in the
  // sidebar even while a filter narrows allProducts. Seeded from cache so
  // counts survive deep links, refreshed by every unfiltered fetch.
  const [fullCatalogue, setFullCatalogue] = useState<Product[]>(readCachedCatalogue)
  // Start in the loading state on a cold load (no seed) so the very first
  // frame is the skeleton — never a "No products found" flash.
  const [loading, setLoading] = useState<boolean>(() => seeded.length === 0)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  // Bumped by the error state's Retry button to re-run the products fetch.
  const [retryTick, setRetryTick] = useState(0)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Client-side text search over the already-loaded catalogue, wired to the
  // top-bar search box. An empty query falls through to the full list, so the
  // existing fetch / infinite-scroll pipeline is unaffected when not searching.
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isMac] = useState(
    () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform),
  )

  // Desktop inset shell scrolls inside the content card, not the window.
  // isScrolled drives the top bar's hairline/shadow elevation; showBackTop
  // reveals the back-to-top button after a deep scroll.
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showBackTop, setShowBackTop] = useState(false)
  const visibleProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return allProducts
    return allProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.category?.name?.toLowerCase().includes(q) ?? false) ||
      (p.shortDesc?.toLowerCase().includes(q) ?? false),
    )
  }, [allProducts, searchQuery])

  // Filter sections default open — visible filters get used, hidden ones
  // don't. Sections stay collapsible for lists that grow long.
  const [openSections, setOpenSections] = useState<{[key: string]: boolean}>({
    category: true,
    mood: true,
    rating: true,
    stock: true,
    sort: true
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
  const paginatedProducts = useMemo(
    () => allProducts.slice(startIndex, endIndex),
    [allProducts, startIndex, endIndex],
  )

  // Update products based on view type
  useEffect(() => {
    if (isMobileView) {
      // Mobile: use pagination
      setProducts(paginatedProducts)
    } else {
      // Desktop: use the (optionally search-filtered) list for infinite scroll
      setProducts(visibleProducts)
      setDisplayedProducts(visibleProducts.slice(0, displayCount))
    }
  }, [paginatedProducts, visibleProducts, isMobileView, displayCount])

  // Infinite scroll observer for desktop
  useEffect(() => {
    const trigger = loadMoreTriggerRef.current
    if (isMobileView || !trigger) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && displayedProducts.length < visibleProducts.length && !loadingMore) {
          // Load more products
          setLoadingMore(true)
          setTimeout(() => {
            const newCount = Math.min(displayCount + 15, visibleProducts.length)
            setDisplayCount(newCount)
            setDisplayedProducts(visibleProducts.slice(0, newCount))
            setLoadingMore(false)
          }, 300) // Small delay for smooth UX
        }
      },
      {
        // Desktop scrolls inside the inset card, so observe against that
        // scroller (falls back to the viewport if it isn't mounted).
        root: scrollerRef.current,
        rootMargin: '200px', // Start loading 200px before reaching the trigger
        threshold: 0.1
      }
    )

    observer.observe(trigger)

    return () => {
      observer.unobserve(trigger)
    }
  }, [isMobileView, displayedProducts.length, visibleProducts, displayCount, loadingMore])

  // Reset display count and return to the top when filters or the search
  // query change, so new result sets always start from their first items.
  useEffect(() => {
    setDisplayCount(15)
    scrollerRef.current?.scrollTo({ top: 0 })
  }, [currentCategory, currentTag, priceMin, priceMax, sortOrder, lowStockOnly, inStockOnly, ratingMin, searchQuery])

  // ⌘K / Ctrl+K focuses the catalogue search (desktop shell only)
  useEffect(() => {
    if (isMobileView) return
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMobileView])

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

  // Per-category product counts from the full catalogue (empty map until a
  // full catalogue is known — the sidebar hides counts in that case).
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of fullCatalogue) {
      const slug = p.category?.slug
      if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1)
    }
    return counts
  }, [fullCatalogue])

  // Active filter count (drives the badge on the Filters button)
  const pageFilterCount =
    (currentCategory ? 1 : 0) +
    (currentTag ? 1 : 0) +
    (ratingMin ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (lowStockOnly ? 1 : 0)

  // Active filter chips shown in the desktop top bar — one place to define
  // label + clear behaviour for every removable filter.
  const clearQueryParam = (key: string) => {
    const qs = new URLSearchParams(searchParams.toString())
    qs.delete(key)
    router.replace(qs.toString() ? `/products?${qs}` : '/products')
  }
  const activeFilterChips: { key: string; label: string; onClear: () => void }[] = [
    ...(currentCategory
      ? [{
          key: 'category',
          label: KNOWN_CATEGORIES.find(c => c.slug === currentCategory)?.name || currentCategory,
          onClear: () => clearQueryParam('category'),
        }]
      : []),
    ...(currentTag
      ? [{ key: 'usageTag', label: currentTag, onClear: () => clearQueryParam('usageTag') }]
      : []),
    ...(ratingMin
      ? [{ key: 'ratingMin', label: `${ratingMin}+ ★`, onClear: () => updateFilter('ratingMin', '') }]
      : []),
    ...(inStockOnly
      ? [{ key: 'inStock', label: 'In stock', onClear: () => updateFilter('inStockOnly', false) }]
      : []),
    ...(lowStockOnly
      ? [{ key: 'lowStock', label: 'Low stock', onClear: () => updateFilter('lowStockOnly', false) }]
      : []),
  ]

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

        // Persist the full, unfiltered catalogue so the next hard reload /
        // deep-link paints instantly from localStorage instead of the skeleton,
        // and keep the sidebar's category counts in sync with it.
        if (!currentCategory && !currentTag && !priceMin && !priceMax && !sortOrder && !lowStockOnly && !inStockOnly && !ratingMin) {
          persistProducts(allProducts)
          setFullCatalogue(filteredProducts)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [currentCategory, currentTag, priceMin, priceMax, sortOrder, lowStockOnly, inStockOnly, ratingMin, retryTick])

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

  // Loading state: only true initially when there's no data to show.
  // Once products are loaded, subsequent fetches keep the layout visible
  // and surface a subtle inline spinner inside the grid area instead.
  const showInitialLoading = loading && allProducts.length === 0

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Unified filter panel — used by the desktop sidebar (on the muted canvas)
  // and the narrow-window drawer (on a white card). One interaction model:
  // click a row to select it, click again to deselect. No form controls —
  // selection reads as a lifted pill plus a right-aligned check.
  const renderFilterPanel = (opts?: { surface?: 'canvas' | 'card'; includeSort?: boolean }) => {
    const { surface = 'canvas', includeSort = false } = opts ?? {}
    const onCanvas = surface === 'canvas'

    // Row states: rest → hover tint → darker while pressed (instant feedback
    // while the URL round-trip settles) → pill when selected. The pill is
    // white on the muted canvas, muted on the white drawer.
    const rowClass = (active: boolean) =>
      cn(
        'group flex w-full items-center gap-2 rounded-lg px-2.5 py-[7px] text-left text-[13px]',
        'outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-zinc-900/20',
        active
          ? onCanvas
            ? 'bg-white font-medium text-zinc-900 ring-1 ring-zinc-900/[0.08] hover:bg-zinc-50 active:bg-zinc-100'
            : 'bg-zinc-100 font-medium text-zinc-900 active:bg-zinc-200/70'
          : onCanvas
            ? 'text-zinc-600 hover:bg-zinc-200/45 hover:text-zinc-900 active:bg-zinc-300/50'
            : 'text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 active:bg-zinc-200/60',
      )

    const row = (
      selected: boolean,
      label: React.ReactNode,
      onClick: () => void,
      trailing?: React.ReactNode,
    ) => (
      <button type="button" onClick={onClick} aria-pressed={selected} className={rowClass(selected)}>
        <span className="flex min-w-0 flex-1 items-center gap-1.5">{label}</span>
        {trailing}
        <Check
          strokeWidth={2.5}
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-opacity duration-150',
            selected ? 'opacity-100' : 'opacity-0',
          )}
        />
      </button>
    )

    const Section = ({ id, label, count = 0, children }: { id: string; label: string; count?: number; children: React.ReactNode }) => (
      <div>
        <button
          type="button"
          onClick={() => toggleSection(id)}
          aria-expanded={openSections[id]}
          className="group flex w-full items-center justify-between rounded-lg px-2.5 py-2.5 text-left outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <span className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-zinc-500 transition-colors group-hover:text-zinc-900">{label}</span>
            {count > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[9.5px] font-semibold leading-none text-white">
                {count}
              </span>
            )}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-zinc-400 transition-[transform,color] duration-300 group-hover:text-zinc-700',
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
            <div className="space-y-0.5 pb-3">{children}</div>
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
      <div className="flex flex-col gap-0.5">
        <Section id="category" label="Category" count={currentCategory ? 1 : 0}>
          {/* Once the full catalogue is known, empty categories are hidden and
              each row shows how many pieces it filters down to. */}
          {(fullCatalogue.length > 0
            ? KNOWN_CATEGORIES.filter(cat => (categoryCounts.get(cat.slug) ?? 0) > 0)
            : KNOWN_CATEGORIES
          ).map(cat =>
            <div key={cat.slug}>
              {row(
                currentCategory === cat.slug,
                <span className="truncate">{cat.name}</span>,
                () => setCategory(cat.slug),
                fullCatalogue.length > 0 ? (
                  <span className="text-[11px] font-normal tabular-nums text-zinc-400">
                    {categoryCounts.get(cat.slug)}
                  </span>
                ) : undefined,
              )}
            </div>,
          )}
        </Section>

        {usageTags.length > 0 && (
          <Section id="mood" label="Purpose / Mood" count={currentTag ? 1 : 0}>
            {usageTags.map(tag =>
              <div key={tag}>{row(currentTag === tag, <span className="truncate">{tag}</span>, () => setTag(tag))}</div>,
            )}
          </Section>
        )}

        <Section id="rating" label="Rating" count={ratingMin ? 1 : 0}>
          {[4, 3, 2, 1].map(thr =>
            <div key={thr}>
              {row(
                Number(ratingMin) === thr,
                <>
                  <Star className="h-3.5 w-3.5 shrink-0 fill-current" />
                  <span>{`${thr} & up`}</span>
                </>,
                () => updateFilter('ratingMin', Number(ratingMin) === thr ? '' : String(thr)),
              )}
            </div>,
          )}
        </Section>

        <Section id="stock" label="Availability" count={(inStockOnly ? 1 : 0) + (lowStockOnly ? 1 : 0)}>
          {row(inStockOnly, 'In stock only', () => updateFilter('inStockOnly', !inStockOnly))}
          {row(lowStockOnly, 'Low stock', () => updateFilter('lowStockOnly', !lowStockOnly))}
        </Section>

        {includeSort && (
          <Section id="sort" label="Sort" count={sortOrder && sortOrder !== '' ? 1 : 0}>
            {PAGE_SORT_OPTIONS.map(opt =>
              <div key={opt.value || 'default'}>
                {row(
                  sortOrder === opt.value || (opt.value === '' && sortOrder === 'newest'),
                  <span className="truncate">{opt.label}</span>,
                  () => updateFilter('sortOrder', opt.value),
                )}
              </div>,
            )}
          </Section>
        )}
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
                {renderFilterPanel({ surface: 'card', includeSort: true })}
              </div>

              {/* Sticky footer — close the drawer and see the filtered grid */}
              <div className="sticky bottom-0 border-t border-zinc-200/80 bg-white p-3">
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-[13.5px] font-medium text-white transition-colors hover:bg-zinc-800 active:bg-zinc-950"
                >
                  View {products.length} result{products.length === 1 ? '' : 's'}
                </button>
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

        {/* Results toolbar — count + filter drawer trigger */}
        {isMobileView && (
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-zinc-500">
              {products.length} product{products.length === 1 ? '' : 's'} found
            </p>
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:text-zinc-900 active:bg-zinc-50"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" />
              Filters
              {pageFilterCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[9.5px] font-semibold leading-none text-white">
                  {pageFilterCount}
                </span>
              )}
            </button>
          </div>
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

        {/* Desktop: inset shell (shadcn "inset" sidebar layout) — a naked
            sidebar on a muted canvas, with all content in a floating rounded
            card that scrolls internally so the chrome never moves.
            Mobile: standard layout. */}
        {!isMobileView ? (
          <div className="flex h-screen w-full overflow-hidden bg-zinc-100/80">
            {/* ── Filter sidebar — sits directly on the canvas ──── */}
            <aside className="hidden h-full w-[276px] shrink-0 flex-col lg:flex">
              {/* Brand */}
              <div className="flex h-16 shrink-0 items-center px-6">
                <Link href="/" className="group flex items-center gap-2.5 outline-none">
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-200/80 transition-shadow group-hover:shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getImageUrl('logo.png')} alt="" className="h-5 w-5 object-contain" />
                  </span>
                  <span className="flex flex-col leading-none">
                    <span className="text-[15px] font-semibold tracking-tight text-zinc-900">Kalakraft</span>
                    <span className="mt-[3px] text-[9px] font-medium uppercase tracking-[0.22em] text-zinc-400">
                      Handcrafted Living
                    </span>
                  </span>
                </Link>
              </div>

              {/* Filters */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 [scrollbar-width:thin] [scrollbar-color:#d4d4d8_transparent]">
                <div className="mb-2 flex items-center justify-between px-2.5">
                  <span className="flex items-center gap-2 text-[12.5px] font-semibold tracking-tight text-zinc-900">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" />
                    Filters
                  </span>
                  {pageFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={() => router.replace('/products')}
                      className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11.5px] font-medium text-zinc-400 transition-colors hover:bg-zinc-200/45 hover:text-zinc-900"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </button>
                  )}
                </div>
                {renderFilterPanel()}
              </div>

              {/* Footer */}
              <div className="shrink-0 px-6 py-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 transition-colors hover:text-zinc-700"
                >
                  <FiChevronLeft size={14} /> Back to home
                </Link>
              </div>
            </aside>

            {/* ── Inset content card ────────────────────────────── */}
            <div className="flex h-full min-w-0 flex-1 flex-col p-3 lg:pl-0">
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.08)] ring-1 ring-zinc-200/70">
                {/* Top bar — hairline + shadow appear once the card scrolls */}
                <div
                  className={cn(
                    'shrink-0 border-b transition-[border-color,box-shadow] duration-300',
                    isScrolled
                      ? 'border-zinc-200/70 shadow-[0_4px_12px_-8px_rgba(0,0,0,0.08)]'
                      : 'border-transparent',
                  )}
                >
                  <div className="flex h-16 items-center justify-between gap-4 px-6 xl:px-8">
                    {/* Search — client-side filter over the loaded catalogue.
                        Anchors the bar's left side; the editorial header below
                        owns the page title. */}
                    <div className="relative min-w-0 max-w-md flex-1">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setSearchQuery('')
                            e.currentTarget.blur()
                          }
                        }}
                        placeholder="Search products…"
                        className="h-9 w-full rounded-full border border-transparent bg-zinc-100/70 pl-10 pr-14 text-[13px] text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 hover:bg-zinc-100 focus:border-zinc-300 focus:bg-white focus:ring-4 focus:ring-zinc-900/[0.04]"
                      />
                      {searchQuery ? (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          aria-label="Clear search"
                          className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200/70 hover:text-zinc-700"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-medium text-zinc-400 lg:flex">
                          {isMac ? '⌘K' : 'Ctrl K'}
                        </kbd>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Select
                        value={sortOrder && sortOrder !== '' ? sortOrder : 'newest'}
                        onValueChange={(v) => updateFilter('sortOrder', v === 'newest' ? '' : v)}
                      >
                        <SelectTrigger
                          size="sm"
                          aria-label="Sort products"
                          className="h-9 gap-2 rounded-full border-zinc-200/80 bg-white px-4 text-[13px] font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
                        >
                          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
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

                  {/* Active filter chips — live with the chrome, not the content */}
                  {activeFilterChips.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 px-6 pb-3 xl:px-8">
                      {activeFilterChips.map(chip => (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={chip.onClear}
                          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[12px] font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-100"
                        >
                          {chip.label}
                          <X className="h-3 w-3" />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => router.replace('/products')}
                        className="ml-1 text-[12px] font-medium text-zinc-400 underline underline-offset-2 transition-colors hover:text-zinc-700"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>

                {/* Content — the card's internal scroller */}
                <div
                  ref={scrollerRef}
                  onScroll={(e) => {
                    const top = e.currentTarget.scrollTop
                    setIsScrolled(top > 8)
                    setShowBackTop(top > 900)
                  }}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:#d4d4d8_transparent]"
                >
                  <div className="px-6 py-9 xl:px-10">
                    {/* Editorial intro — the page's one true heading */}
                    <header className="mb-9">
                      <span className="inline-block text-[11px] font-medium uppercase tracking-[0.3em] text-[#999]">
                        The Collection
                        {/* Count only once real results are in — a "0" during
                            loading or an error would just be noise. */}
                        {!showInitialLoading && !error && (
                          <>
                            <span className="mx-1.5 text-[#d0d0d0]">·</span>
                            <span className="tabular-nums">
                              {visibleProducts.length} {visibleProducts.length === 1 ? 'piece' : 'pieces'}
                            </span>
                          </>
                        )}
                      </span>
                      {/* Copper hairline — the same rule that opens every
                          section on the homepage and the detail page */}
                      <span
                        aria-hidden="true"
                        className="mt-2.5 block h-px w-10 bg-gradient-to-r from-[#d4a373] to-transparent"
                      />
                      <h1 className="mt-3 font-serif text-4xl font-medium leading-[1.1] text-[#1a1a1a] xl:text-5xl">
                        {currentCategory
                          ? KNOWN_CATEGORIES.find(c => c.slug === currentCategory)?.name || 'Discover Our Collection'
                          : currentTag || 'Discover Our Collection'}
                      </h1>
                      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#666]">
                        Handcrafted pieces, curated with care — each one made to be lived with.
                      </p>
                    </header>

                    {showInitialLoading ? (
                      <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-14 2xl:grid-cols-4">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <GridCardSkeleton key={i} />
                        ))}
                      </div>
                    ) : error && products.length === 0 ? (
                      <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50">
                          <AlertCircle className="h-7 w-7 text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-[17px] font-semibold text-zinc-900">Something went wrong</p>
                          <p className="mt-1 text-[14px] text-zinc-500">
                            We couldn&rsquo;t load the catalogue. Check your connection and try again.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRetryTick(t => t + 1)}
                          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Try again
                        </button>
                      </div>
                    ) : products.length === 0 ? (
                      <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50">
                          <PackageSearch className="h-7 w-7 text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-[17px] font-semibold text-zinc-900">No products found</p>
                          <p className="mt-1 text-[14px] text-zinc-500">
                            {searchQuery
                              ? <>Nothing matches &ldquo;{searchQuery}&rdquo;.</>
                              : 'Try adjusting or clearing your filters.'}
                          </p>
                        </div>
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
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

                        {displayedProducts.length < visibleProducts.length && (
                          <div
                            ref={loadMoreTriggerRef}
                            className="min-h-[140px] w-full pt-10"
                          >
                            {loadingMore && (
                              <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-14 2xl:grid-cols-4">
                                {Array.from({
                                  length: Math.min(3, visibleProducts.length - displayedProducts.length),
                                }).map((_, i) => (
                                  <GridCardSkeleton key={i} />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {displayedProducts.length >= visibleProducts.length && visibleProducts.length > 15 && (
                          <div className="relative mt-24 -mx-6 -mb-9 overflow-hidden bg-zinc-950 px-10 py-28 lg:py-40 xl:-mx-10">
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

                {/* Back to top — floats in the card's corner after deep scroll */}
                <button
                  type="button"
                  onClick={() => scrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                  aria-label="Back to top"
                  tabIndex={showBackTop ? 0 : -1}
                  className={cn(
                    'absolute bottom-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full',
                    'bg-white text-zinc-600 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] ring-1 ring-zinc-200/80',
                    'transition-all duration-300 hover:text-zinc-900 active:scale-95',
                    showBackTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
                  )}
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {showInitialLoading ? (
              <div className={styles.gridLoadingContainer}>
                <LoadingSpinner size="large" message="Loading products..." />
              </div>
            ) : error && products.length === 0 ? (
              <p className={styles.errorMessage}>Error: {error}</p>
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
