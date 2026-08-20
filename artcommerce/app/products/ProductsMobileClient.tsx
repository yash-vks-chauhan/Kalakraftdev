'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Check,
  ChevronDown,
  Heart,
  Maximize2,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useProductFilters } from '../hooks/useProductFilters'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'

/* -------------------------------------------------------------- */
/* TYPES                                                           */
/* -------------------------------------------------------------- */

interface Category {
  id: number
  name: string
  slug: string
}

interface Product {
  id: number
  name: string
  price: number
  currency?: string
  imageUrls: string[]
  stockQuantity: number
  shortDesc?: string | null
  specifications?: string | null
  category?: { id: number; name: string; slug: string } | null
  avgRating?: number
  isNew?: boolean
}

const SORTS = [
  { value: '', label: 'Recommended' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
] as const

const PRICE_BANDS = [
  { key: 'under2000', label: 'Under ₹2,000', min: '', max: '1999' },
  { key: '2000to5000', label: '₹2,000 – ₹5,000', min: '2000', max: '5000' },
  { key: 'over5000', label: 'Over ₹5,000', min: '5001', max: '' },
] as const

const PAGE_SIZE = 12

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value)
}

/** Pulls the first "Key: value" pairs out of the specifications blob. */
function firstSpecs(spec: string | null | undefined, count: number) {
  if (!spec) return [] as string[]
  return spec
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes(':'))
    .slice(0, count)
    .map((line) => line.split(':').slice(1).join(':').trim())
    .filter(Boolean)
}

/* -------------------------------------------------------------- */
/* PAGE                                                            */
/* -------------------------------------------------------------- */

export default function ProductsMobileClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist()

  const { filters } = useProductFilters()
  const {
    category: currentCategory,
    priceMin,
    priceMax,
    sortOrder,
    ratingMin,
    lowStockOnly,
    inStockOnly,
    usageTag: currentTag,
  } = filters

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [catsLoading, setCatsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shown, setShown] = useState(PAGE_SIZE)

  const [sortOpen, setSortOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [peekId, setPeekId] = useState<number | null>(null)
  const [addingId, setAddingId] = useState<number | null>(null)

  const [stuck, setStuck] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const railRef = useRef<HTMLDivElement | null>(null)

  /* ── data ─────────────────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const res = await fetch('/api/categories')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && Array.isArray(data.categories)) setCategories(data.categories)
      } catch {
        /* the rail falls back to "All" alone; the page still works */
      } finally {
        if (!cancelled) setCatsLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (currentCategory) params.set('category', currentCategory)
      if (currentTag) params.set('usageTag', currentTag)
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
        const list: Product[] = (Array.isArray(data.products) ? data.products : []).map(
          (p: any) => {
            let urls: string[] = []
            try {
              urls = Array.isArray(p.imageUrls) ? p.imageUrls : JSON.parse(p.imageUrls || '[]')
            } catch {
              urls = []
            }
            const isNew =
              p.createdAt && new Date(p.createdAt) > new Date(Date.now() - 14 * 864e5)
            return { ...p, imageUrls: urls, isNew }
          }
        )
        if (cancelled) return
        setProducts(list)
        setShown(PAGE_SIZE)
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [currentCategory, currentTag, priceMin, priceMax, sortOrder, ratingMin, lowStockOnly, inStockOnly])

  /*
   * The bar pins below the fixed header. An IntersectionObserver on a
   * one-pixel sentinel above it tells us when to lift the shadow, which is
   * cheaper than reading scroll position on every frame.
   *
   * The margin is read back off the bar's own resolved `top` rather than
   * recomputed from the token, so the two can never drift apart — the token
   * is a calc() with an env() in it and only the browser knows the answer.
   */
  useEffect(() => {
    const el = sentinelRef.current
    const bar = barRef.current
    if (!el || !bar) return
    const offset = parseFloat(getComputedStyle(bar).top) || 57
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      threshold: 0,
      rootMargin: `-${Math.round(offset)}px 0px 0px 0px`,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /*
   * A rail wide enough to scroll can hide the selection — on load from a deep
   * link, and after a tap near either end. Pull it back into view whenever the
   * category changes or the rail is (re)populated.
   */
  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const active = rail.querySelector<HTMLElement>('[data-active]')
    if (!active) return
    if (rail.scrollWidth <= rail.clientWidth) return
    active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [currentCategory, categories])

  /* Left/Right walk the rail, the way a tab list is expected to behave. */
  const onRailKeys = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const rail = e.currentTarget
    const tabs = Array.from(rail.querySelectorAll<HTMLButtonElement>('button'))
    const at = tabs.indexOf(document.activeElement as HTMLButtonElement)
    if (at === -1) return
    e.preventDefault()
    const next = e.key === 'ArrowRight' ? (at + 1) % tabs.length : (at - 1 + tabs.length) % tabs.length
    tabs[next].focus()
    tabs[next].scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [])

  /* ── derived ──────────────────────────────────────────────── */

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === currentCategory) ?? null,
    [categories, currentCategory]
  )

  const priceBand = useMemo(
    () => PRICE_BANDS.find((b) => b.min === priceMin && b.max === priceMax) ?? null,
    [priceMin, priceMax]
  )

  const activeFilters = useMemo(() => {
    const out: { key: string; label: string }[] = []
    if (inStockOnly) out.push({ key: 'inStock', label: 'In stock' })
    if (priceBand) out.push({ key: 'price', label: priceBand.label })
    if (ratingMin) out.push({ key: 'ratingMin', label: `${ratingMin}+ stars` })
    if (currentTag) out.push({ key: 'usageTag', label: currentTag })
    return out
  }, [inStockOnly, priceBand, ratingMin, currentTag])

  const sortLabel = SORTS.find((s) => s.value === sortOrder)?.label ?? 'Recommended'
  const visible = products.slice(0, shown)
  const peeked = peekId ? products.find((p) => p.id === peekId) ?? null : null

  /* ── url helpers ──────────────────────────────────────────── */

  const push = useCallback(
    (mutate: (qs: URLSearchParams) => void) => {
      const qs = new URLSearchParams(searchParams.toString())
      mutate(qs)
      qs.delete('page')
      router.replace(qs.toString() ? `/products?${qs}` : '/products', { scroll: false })
    },
    [router, searchParams]
  )

  const selectCategory = (slug: string | null) =>
    push((qs) => (slug ? qs.set('category', slug) : qs.delete('category')))

  const selectSort = (value: string) => {
    push((qs) => (value ? qs.set('sort', value) : qs.delete('sort')))
    setSortOpen(false)
  }

  const clearFilter = (key: string) =>
    push((qs) => {
      if (key === 'inStock') qs.delete('inStock')
      else if (key === 'price') {
        qs.delete('priceMin')
        qs.delete('priceMax')
      } else qs.delete(key)
    })

  /* ── actions ──────────────────────────────────────────────── */

  const savedIds = useMemo(
    () => new Set(wishlistItems.map((w) => w.productId)),
    [wishlistItems]
  )

  async function toggleSave(product: Product) {
    if (!user) {
      router.push('/auth/login')
      return
    }
    try {
      if (savedIds.has(product.id)) await removeFromWishlist(product.id)
      else await addToWishlist(product.id)
    } catch {
      toast.error('Could not update your saved items')
    }
  }

  async function addPeeked(product: Product) {
    if (!user) {
      router.push('/auth/login')
      return
    }
    setAddingId(product.id)
    try {
      const ok = await addToCart(product.id, 1)
      if (ok) setPeekId(null)
    } finally {
      setAddingId(null)
    }
  }

  /* ── render ───────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-background pb-tabbar">
      {/*
       * The rail below is the heading — it names the slice of the catalogue
       * you are looking at. A visible <h1> above it only repeated the selected
       * category word for word, so it is kept for the document outline and
       * for screen readers, and nothing else.
       */}
      <h1 className="sr-only">
        {activeCategory ? activeCategory.name : 'All pieces'}
      </h1>

      <div ref={sentinelRef} aria-hidden className="h-px" />

      {/*
       * Sticks below the app header, not at the top of the viewport — that
       * header is fixed at z-1001, so `top: 0` parked the category rail
       * behind it and clipped the controls in half.
       */}
      {/*
       * Opaque, not frosted. A translucent bar over a grid of colourful work
       * smears whatever is passing underneath it, and the labels lose their
       * edges. The dock can be glass because it floats over content; a
       * full-width bar the eye reads as a surface should behave like one.
       */}
      <div
        ref={barRef}
        className={cn(
          'sticky z-30 bg-background transition-shadow duration-200',
          stuck && 'shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
        )}
        style={{ top: 'var(--mobile-header-total, 3.5rem)' }}
      >
        {/*
         * Navigation. The rule is the rail's own baseline rather than a stuck
         * state, so it is always drawn and the selected tab's underline lands
         * on it — that overlap is the whole reason the two rows read as
         * different kinds of thing.
         */}
        <div
          ref={railRef}
          role="group"
          aria-label="Category"
          onKeyDown={onRailKeys}
          className="flex overflow-x-auto border-b px-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <CategoryTab
            label="All"
            active={!currentCategory}
            onClick={() => selectCategory(null)}
          />
          {catsLoading && categories.length === 0
            ? /* Hold the rail's shape while the names are in flight, or the
                 tabs pop in one row late and shove the grid down. */
              [74, 52, 66].map((w, i) => (
                <span key={i} aria-hidden className="flex h-11 shrink-0 items-center px-2.5">
                  <Skeleton className="h-3.5" style={{ width: w }} />
                </span>
              ))
            : categories.map((c) => (
                <CategoryTab
                  key={c.id}
                  label={c.name}
                  active={currentCategory === c.slug}
                  onClick={() => selectCategory(c.slug)}
                />
              ))}
        </div>

        {/*
         * Metadata, in a lighter weight and below the rule: how many pieces,
         * and how the list is ordered. Both controls are text buttons — the
         * old outlined pills wore the shape of a Select trigger without being
         * one, which is what made the header read as a pile of buttons.
         */}
        <div className="flex h-10 items-center justify-between gap-2 px-3.5">
          {loading ? (
            <Skeleton className="ml-0.5 h-3 w-14 shrink-0" />
          ) : (
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {products.length} {products.length === 1 ? 'piece' : 'pieces'}
            </span>
          )}

          {/*
           * On a 320px screen the two sides compete. The count is short and
           * load-bearing, so it holds; the sort label is long and already
           * ellipsises, so it is the one that gives way.
           */}
          <div className="flex min-w-0 items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOpen(true)}
              aria-haspopup="dialog"
              className="min-w-0 shrink gap-1 px-2 text-xs font-medium"
            >
              <span className="truncate">{sortOrder ? sortLabel : 'Sort'}</span>
              <ChevronDown className="size-3 opacity-60" />
            </Button>

            <Separator orientation="vertical" className="mx-1 !h-4" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterOpen(true)}
              aria-haspopup="dialog"
              className="gap-1.5 px-2 text-xs font-medium"
            >
              <SlidersHorizontal className="size-3.5" />
              Filter
              {activeFilters.length > 0 && (
                <Badge className="h-4 min-w-4 justify-center rounded-full px-1 text-[10px] tabular-nums">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* What's applied, readable without opening anything. */}
        {activeFilters.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto px-3.5 pb-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => clearFilter(f.key)}
                className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-secondary pl-3 pr-2 text-xs text-foreground"
              >
                {f.label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            Try again
          </Button>
        </div>
      ) : loading ? (
        <GridSkeleton />
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShoppingBag className="h-6 w-6" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium text-foreground">Nothing here yet</p>
            <p className="text-sm text-muted-foreground">
              Try another category, or clear the filters you have on.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.replace('/products')}>
            Clear everything
          </Button>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-x-2.5 gap-y-6 px-3.5 pb-2 pt-1">
            {visible.map((product) => (
              <ProductTile
                key={product.id}
                product={product}
                saved={savedIds.has(product.id)}
                onSave={() => toggleSave(product)}
                onPeek={() => setPeekId(product.id)}
              />
            ))}
          </ul>

          {shown < products.length && (
            <div className="px-4 pt-3.5">
              <Button
                variant="outline"
                className="h-12 w-full rounded-xl"
                onClick={() => setShown((n) => n + PAGE_SIZE)}
              >
                Load more
                <span className="ml-1 text-muted-foreground">
                  ({products.length - shown} left)
                </span>
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── Sort ────────────────────────────────────────────── */}
      <Drawer open={sortOpen} onOpenChange={setSortOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Sort by</DrawerTitle>
          </DrawerHeader>
          <div className="px-2 pb-4">
            {SORTS.map((s) => {
              const on = (sortOrder || '') === s.value
              return (
                <button
                  key={s.value || 'default'}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => selectSort(s.value)}
                  className="flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className={cn(
                      'flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-[1.5px]',
                      on ? 'border-foreground' : 'border-muted-foreground/40'
                    )}
                  >
                    {on && <span className="h-[9px] w-[9px] rounded-full bg-foreground" />}
                  </span>
                  {s.label}
                </button>
              )
            })}
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── Filter ──────────────────────────────────────────── */}
      <FilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        products={products}
        inStockOnly={inStockOnly}
        priceBandKey={priceBand?.key ?? null}
        ratingMin={ratingMin}
        onApply={(next) => {
          push((qs) => {
            next.inStock ? qs.set('inStock', 'true') : qs.delete('inStock')
            const band = PRICE_BANDS.find((b) => b.key === next.priceBand)
            if (band) {
              band.min ? qs.set('priceMin', band.min) : qs.delete('priceMin')
              band.max ? qs.set('priceMax', band.max) : qs.delete('priceMax')
            } else {
              qs.delete('priceMin')
              qs.delete('priceMax')
            }
            next.ratingMin ? qs.set('ratingMin', next.ratingMin) : qs.delete('ratingMin')
          })
          setFilterOpen(false)
        }}
      />

      {/* ── Peek ────────────────────────────────────────────── */}
      <Drawer open={peekId !== null} onOpenChange={(o) => !o && setPeekId(null)}>
        <DrawerContent>
          {peeked && (
            <>
              <DrawerHeader className="sr-only">
                <DrawerTitle>{peeked.name}</DrawerTitle>
              </DrawerHeader>
              <div className="flex gap-3.5 px-4 pb-4 pt-3">
                <Link
                  href={`/products/${peeked.id}`}
                  className="aspect-square w-[104px] shrink-0 overflow-hidden rounded-[10px] border bg-muted"
                >
                  {peeked.imageUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={peeked.imageUrls[0]}
                      alt={peeked.name}
                      className="h-full w-full object-contain p-1.5"
                      decoding="async"
                    />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  {peeked.category && (
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {peeked.category.name}
                    </p>
                  )}
                  <p className="mt-1.5 font-serif text-[19px] leading-tight text-foreground">
                    {peeked.name}
                  </p>
                  <p className="mt-2 text-[17px] font-semibold tabular-nums text-foreground">
                    {formatPrice(peeked.price)}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {firstSpecs(peeked.specifications, 2).map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                    {peeked.stockQuantity > 0 && peeked.stockQuantity <= 5 && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-500">
                        Only {peeked.stockQuantity} left
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-4 pb-1">
                <Button asChild variant="outline" className="h-11 w-full rounded-[10px]">
                  <Link href={`/products/${peeked.id}`}>See full details</Link>
                </Button>
              </div>

              <DrawerFooter>
                <Button
                  variant="outline"
                  className="h-12 flex-none rounded-xl px-5"
                  onClick={() => setPeekId(null)}
                >
                  Close
                </Button>
                <Button
                  className="h-12 flex-1 rounded-xl"
                  disabled={peeked.stockQuantity <= 0 || addingId === peeked.id}
                  onClick={() => addPeeked(peeked)}
                >
                  {peeked.stockQuantity <= 0
                    ? 'Sold out'
                    : addingId === peeked.id
                    ? 'Adding…'
                    : 'Add to bag'}
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}

/* -------------------------------------------------------------- */
/* PIECES                                                          */
/* -------------------------------------------------------------- */

/*
 * The Tabs treatment from the guide — a scrolling list on a rule, the active
 * item marked by a 2px underline rather than a fill. `-mb-px` drops that
 * underline onto the rail's own hairline so the two read as one line.
 *
 * It stays a button rather than a Radix Tab because it drives the URL, not a
 * panel: a `role="tab"` with no `tabpanel` to control is a broken aria
 * reference, and the whole point of the rail is that it is one tap deep.
 */
function CategoryTab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      data-active={active ? '' : undefined}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'relative -mb-px h-11 shrink-0 whitespace-nowrap rounded-none border-b-2 px-2.5',
        'text-[13.5px] transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        active
          ? 'border-primary font-semibold text-foreground'
          : 'border-transparent font-medium text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
    </button>
  )
}

function ProductTile({
  product,
  saved,
  onSave,
  onPeek,
}: {
  product: Product
  saved: boolean
  onSave: () => void
  onPeek: () => void
}) {
  const isOut = product.stockQuantity <= 0
  const isLow = !isOut && product.stockQuantity <= 5
  const image = product.imageUrls[0]

  return (
    <li className="group/tile flex min-w-0 flex-col gap-1.5">
      {/* Square and contained, not 4:5 and cropped. Product shots are square,
          so the old frame zoomed them ~25% and clipped the piece at both
          edges; the tile is also ~44pt shorter now, which is most of another
          row per screen. */}
      <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
        <Link href={`/products/${product.id}`} className="absolute inset-0">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className={cn(
                'h-full w-full object-contain p-2 transition-transform duration-300 ease-out',
                'group-active/tile:scale-[0.98]',
                isOut && 'grayscale opacity-50'
              )}
            />
          ) : null}
          <span className="sr-only">{product.name}</span>
        </Link>

        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
          onClick={onSave}
          className="absolute right-1 top-1 z-10 grid h-9 w-9 place-items-center"
        >
          <span
            className={cn(
              'grid h-[26px] w-[26px] place-items-center rounded-full shadow-sm transition-transform duration-200',
              'active:scale-90',
              saved ? 'bg-foreground text-background' : 'bg-background/90 text-foreground'
            )}
          >
            <Heart className={cn('h-3.5 w-3.5', saved && 'fill-current')} />
          </span>
        </button>

        {isOut ? (
          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-background/95 px-2 py-0.5 text-[10.5px] font-medium shadow-sm">
            Sold out
          </span>
        ) : (
          <button
            type="button"
            onClick={onPeek}
            className="absolute bottom-1.5 right-1.5 z-10 inline-flex h-7 items-center gap-1 rounded-full bg-background/95 px-2.5 text-[11.5px] font-semibold text-foreground shadow-sm transition-transform duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Maximize2 className="h-3 w-3" />
            Peek
          </button>
        )}
      </div>

      <Link
        href={`/products/${product.id}`}
        className="line-clamp-2 min-h-[2.7em] text-[13.5px] font-medium leading-snug text-foreground"
      >
        {product.name}
      </Link>

      <p className="truncate text-[13.5px] font-semibold tabular-nums text-foreground">
        {formatPrice(product.price)}
        {isLow && (
          <span className="font-normal text-amber-600 dark:text-amber-500">
            {' '}
            · {product.stockQuantity} left
          </span>
        )}
      </p>
    </li>
  )
}

function GridSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-x-2.5 gap-y-6 px-3.5 pb-2 pt-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex flex-col gap-1.5">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </li>
      ))}
    </ul>
  )
}

function FilterDrawer({
  open,
  onOpenChange,
  products,
  inStockOnly,
  priceBandKey,
  ratingMin,
  onApply,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  products: Product[]
  inStockOnly: boolean
  priceBandKey: string | null
  ratingMin: string
  onApply: (next: { inStock: boolean; priceBand: string | null; ratingMin: string }) => void
}) {
  const [inStock, setInStock] = useState(inStockOnly)
  const [band, setBand] = useState<string | null>(priceBandKey)
  const [rating, setRating] = useState(ratingMin)

  // Re-seed from the URL each time it opens, so a cancelled edit doesn't stick.
  useEffect(() => {
    if (!open) return
    setInStock(inStockOnly)
    setBand(priceBandKey)
    setRating(ratingMin)
  }, [open, inStockOnly, priceBandKey, ratingMin])

  /*
   * Counting against the loaded set gives the button an honest number for the
   * current category without a round trip. It is a preview, and it is exact
   * whenever the whole category is already in memory.
   */
  const count = useMemo(() => {
    const chosen = PRICE_BANDS.find((b) => b.key === band)
    return products.filter((p) => {
      if (inStock && p.stockQuantity <= 0) return false
      if (chosen) {
        if (chosen.min && p.price < Number(chosen.min)) return false
        if (chosen.max && p.price > Number(chosen.max)) return false
      }
      if (rating && (p.avgRating ?? 0) < Number(rating)) return false
      return true
    }).length
  }, [products, inStock, band, rating])

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filter</DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-2 pb-2">
          <p className="px-3 pb-1 pt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            Availability
          </p>
          <button
            type="button"
            role="checkbox"
            aria-checked={inStock}
            onClick={() => setInStock((v) => !v)}
            className="flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className={cn(
                'flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[6px] border-[1.5px] transition-colors',
                inStock ? 'border-foreground bg-foreground' : 'border-muted-foreground/40'
              )}
            >
              {inStock && <Check className="h-3 w-3 text-background" strokeWidth={3} />}
            </span>
            In stock only
          </button>

          <p className="px-3 pb-1 pt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            Price
          </p>
          {PRICE_BANDS.map((b) => {
            const on = band === b.key
            return (
              <button
                key={b.key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setBand(on ? null : b.key)}
                className="flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    'flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-[1.5px]',
                    on ? 'border-foreground' : 'border-muted-foreground/40'
                  )}
                >
                  {on && <span className="h-[9px] w-[9px] rounded-full bg-foreground" />}
                </span>
                {b.label}
              </button>
            )
          })}

          <p className="px-3 pb-1 pt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            Rating
          </p>
          {['4', '3'].map((r) => {
            const on = rating === r
            return (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setRating(on ? '' : r)}
                className="flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    'flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-[1.5px]',
                    on ? 'border-foreground' : 'border-muted-foreground/40'
                  )}
                >
                  {on && <span className="h-[9px] w-[9px] rounded-full bg-foreground" />}
                </span>
                {r}+ stars
              </button>
            )
          })}
        </div>

        <DrawerFooter>
          <Button
            variant="outline"
            className="h-12 flex-none rounded-xl px-5"
            onClick={() => {
              setInStock(false)
              setBand(null)
              setRating('')
            }}
          >
            Clear
          </Button>
          <Button
            className="h-12 flex-1 rounded-xl"
            onClick={() => onApply({ inStock, priceBand: band, ratingMin: rating })}
          >
            Show {count} {count === 1 ? 'piece' : 'pieces'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
