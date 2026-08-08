'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Heart,
  PackageX,
  RotateCcw,
  Share2,
  ShieldCheck,
  Truck,
  X,
  ZoomIn,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../contexts/WishlistContext'
import type { Review } from './ProductReviews'

/* -------------------------------------------------------------- */
/* TYPES                                                           */
/* -------------------------------------------------------------- */

interface Product {
  id: number
  name: string
  slug: string
  description: string
  shortDesc: string
  price: number
  currency: string
  imageUrls: string[]
  stockQuantity: number
  category: { id: number; name: string; slug: string } | null
  specifications?: string | null
  careInstructions?: string | null
  stylingIdeaImages?: ({ url: string; text?: string } | string)[] | null
  isNew?: boolean
  avgRating?: number
}

interface MobileProductDetailsProps {
  product: Product
  avgRating: number
  ratingCount: number
  similarProducts?: Product[]
  reviews?: Review[]
}

const LOW_STOCK = 5
/** How far the lightbox enlarges. 2.6× shows brush and pour detail without
 *  turning a 1000px photo into mush. */
const ZOOM_SCALE = 2.6

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value)
}

/** "Material: Epoxy resin" → { key, value }. Anything else is ignored here. */
function parseSpecPairs(spec: string | null | undefined) {
  if (!spec) return [] as { key: string; value: string }[]
  return spec
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes(':'))
    .map((line) => {
      const [key, ...rest] = line.split(':')
      return { key: key.trim(), value: rest.join(':').trim() }
    })
    .filter((p) => p.key && p.value)
}

function bulletise(text: string | null | undefined) {
  if (!text) return [] as string[]
  return text
    .split('\n')
    .map((l) => l.trim().replace(/^-\s*/, ''))
    .filter(Boolean)
}

/* -------------------------------------------------------------- */
/* PAGE                                                            */
/* -------------------------------------------------------------- */

export default function MobileProductDetails({
  product,
  avgRating,
  ratingCount,
  similarProducts = [],
  reviews = [],
}: MobileProductDetailsProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist()

  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [careOpen, setCareOpen] = useState(false)
  const [noteExpanded, setNoteExpanded] = useState(false)
  const [barVisible, setBarVisible] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [lightboxApi, setLightboxApi] = useState<CarouselApi>()
  const [zoomed, setZoomed] = useState(false)

  const ctaRef = useRef<HTMLDivElement | null>(null)
  const zoomRef = useRef<HTMLDivElement | null>(null)
  // Where in the image the zoom was asked for, 0–1 on each axis.
  const zoomOrigin = useRef({ x: 0.5, y: 0.5 })

  const images = product.imageUrls?.length ? product.imageUrls : []
  const isOut = product.stockQuantity <= 0
  const isLow = !isOut && product.stockQuantity <= LOW_STOCK
  const saved = wishlistItems.some((w) => w.productId === product.id)

  const specPairs = useMemo(() => parseSpecPairs(product.specifications), [product.specifications])
  const facts = specPairs.slice(0, 4)
  const restSpecs = specPairs.slice(4)
  const careLines = useMemo(() => bulletise(product.careInstructions), [product.careInstructions])

  const styling = useMemo(() => {
    if (!Array.isArray(product.stylingIdeaImages)) return [] as { url: string; text?: string }[]
    return product.stylingIdeaImages
      .map((s) => (typeof s === 'string' ? { url: s } : s))
      .filter((s) => s && typeof s.url === 'string' && s.url.length > 0)
  }, [product.stylingIdeaImages])

  const distribution = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0]
    reviews.forEach((r) => {
      const i = Math.min(5, Math.max(1, Math.round(r.rating))) - 1
      buckets[i] += 1
    })
    return buckets
  }, [reviews])

  /* ── gallery ──────────────────────────────────────────────── */

  useEffect(() => {
    if (!api) return
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    onSelect()
    api.on('select', onSelect)
    api.on('reInit', onSelect)
    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api])

  // Opening the lightbox lands you on the shot you were already looking at.
  useEffect(() => {
    if (!lightboxOpen || !lightboxApi) return
    lightboxApi.scrollTo(current, true)
  }, [lightboxOpen, lightboxApi, current])

  useEffect(() => {
    if (!lightboxApi) return
    const onSelect = () => setCurrent(lightboxApi.selectedScrollSnap())
    lightboxApi.on('select', onSelect)
    return () => {
      lightboxApi.off('select', onSelect)
    }
  }, [lightboxApi])

  /** Zoom in around the point that was tapped, rather than always the middle. */
  const zoomAt = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    zoomOrigin.current = {
      x: r.width ? (e.clientX - r.left) / r.width : 0.5,
      y: r.height ? (e.clientY - r.top) / r.height : 0.5,
    }
    setZoomed(true)
  }, [])

  // Once the enlarged image is laid out, put the tapped point under the finger.
  useEffect(() => {
    if (!zoomed) return
    const el = zoomRef.current
    if (!el) return
    const id = requestAnimationFrame(() => {
      const { x, y } = zoomOrigin.current
      el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) * x)
      el.scrollTop = Math.max(0, (el.scrollHeight - el.clientHeight) * y)
    })
    return () => cancelAnimationFrame(id)
  }, [zoomed])

  // Leaving a picture should never leave the zoom behind on the next one.
  useEffect(() => {
    setZoomed(false)
  }, [current])

  // Escape closes the lightbox, and the page underneath must not scroll.
  useEffect(() => {
    if (!lightboxOpen) {
      setZoomed(false)
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [lightboxOpen])

  /*
   * The bar exists only once the inline buy row has left the screen, so the
   * page never shows the same control twice and the first screen stays image.
   */
  useEffect(() => {
    const el = ctaRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setBarVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0, rootMargin: '-56px 0px 0px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* ── actions ──────────────────────────────────────────────── */

  const handleAdd = useCallback(async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    setAdding(true)
    try {
      const ok = await addToCart(product.id, qty)
      if (ok) setConfirmOpen(true)
    } catch (err: any) {
      toast.error(err?.message || 'Could not add that to your bag')
    } finally {
      setAdding(false)
    }
  }, [user, router, addToCart, product.id, qty])

  async function toggleSave() {
    if (!user) {
      router.push('/auth/login')
      return
    }
    try {
      if (saved) await removeFromWishlist(product.id)
      else await addToWishlist(product.id)
    } catch {
      toast.error('Could not update your saved items')
    }
  }

  const handleShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const payload = { title: product.name, text: `${product.name} — ${formatPrice(product.price)}`, url }
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(payload)
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      /* the user dismissed the share sheet — nothing to report */
    }
  }, [product.name, product.price])

  // The navbar's share button dispatches this.
  useEffect(() => {
    const onShare = () => handleShare()
    window.addEventListener('shareProduct', onShare)
    return () => window.removeEventListener('shareProduct', onShare)
  }, [handleShare])

  /* ── render ───────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-background pb-tabbar">
      {/* ── Hero: the piece, full bleed ─────────────────────── */}
      <div className="relative">
        <Carousel setApi={setApi} opts={{ loop: images.length > 1 }} className="w-full">
          <CarouselContent className="ml-0">
            {(images.length ? images : [null]).map((url, i) => (
              <CarouselItem key={i} className="basis-full pl-0">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={`${product.name} — view ${i + 1}`}
                      // Tapping the piece opens it full screen — the gesture
                      // people try first, before they look for a button.
                      onClick={() => setLightboxOpen(true)}
                      className={cn('h-full w-full cursor-zoom-in object-cover', isOut && 'grayscale')}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <PackageX className="h-8 w-8" />
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Floating controls — no bar across the artwork. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 pt-3">
          <GlassButton label="Go back" onClick={() => router.back()}>
            <ArrowLeft className="h-[17px] w-[17px]" />
          </GlassButton>
          <div className="flex gap-2">
            <GlassButton
              label={saved ? 'Remove from saved' : 'Save this piece'}
              pressed={saved}
              onClick={toggleSave}
            >
              <Heart className={cn('h-[17px] w-[17px]', saved && 'fill-current')} />
            </GlassButton>
            <GlassButton label="Share" onClick={handleShare}>
              <Share2 className="h-[17px] w-[17px]" />
            </GlassButton>
          </div>
        </div>

        {images.length > 0 && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="absolute bottom-3.5 right-3 z-10 inline-flex h-[30px] items-center gap-1.5 rounded-full bg-background/90 px-2.5 text-[11.5px] font-semibold text-foreground shadow-sm backdrop-blur transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ZoomIn className="h-3 w-3" />
            Zoom
          </button>
        )}

        {images.length > 1 && (
          <div className="pointer-events-none absolute inset-x-3.5 bottom-2 z-10 flex gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-[2.5px] flex-1 rounded-full transition-colors duration-200',
                  i === current ? 'bg-white' : 'bg-white/45'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails — jump, don't hunt. */}
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto px-4 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((url, i) => (
            <button
              key={i}
              type="button"
              aria-label={`View image ${i + 1}`}
              aria-current={i === current}
              onClick={() => api?.scrollTo(i)}
              className={cn(
                'aspect-square w-[46px] shrink-0 overflow-hidden rounded-lg border-[1.5px] transition-colors',
                i === current ? 'border-foreground' : 'border-transparent'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}

      {/* ── The piece ───────────────────────────────────────── */}
      <div className="px-4 pt-4">
        {product.category && (
          <Link
            href={`/products?category=${product.category.slug}`}
            className="text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            {product.category.name}
          </Link>
        )}

        <h1 className="mt-1.5 font-serif text-[25px] font-medium leading-[1.16] tracking-tight text-foreground">
          {product.name}
        </h1>

        <div className="mt-2.5 flex items-baseline gap-2.5">
          <span className="text-[21px] font-semibold tabular-nums text-foreground">
            {formatPrice(product.price)}
          </span>
          {ratingCount > 0 && (
            <span className="text-[12.5px] text-muted-foreground">
              ★ <b className="font-semibold text-foreground">{avgRating.toFixed(1)}</b> ·{' '}
              {ratingCount} {ratingCount === 1 ? 'review' : 'reviews'}
            </span>
          )}
        </div>

        {(isOut || isLow) && (
          <p
            className={cn(
              'mt-1.5 text-[12.5px]',
              isOut ? 'text-destructive' : 'text-amber-600 dark:text-amber-500'
            )}
          >
            {isOut ? 'Sold out' : `Only ${product.stockQuantity} left — each pour is unique`}
          </p>
        )}

        {/* Inline buy row. The sticky bar below is its stand-in once it goes. */}
        <div ref={ctaRef} className="mt-4 flex gap-2.5">
          <QuantityStepper
            value={qty}
            max={product.stockQuantity}
            disabled={isOut}
            onChange={setQty}
          />
          <Button
            className="h-12 flex-1 rounded-full text-[14.5px]"
            disabled={isOut || adding}
            onClick={handleAdd}
          >
            {isOut ? 'Sold out' : adding ? 'Adding…' : `Add to bag · ${formatPrice(product.price * qty)}`}
          </Button>
        </div>

        {/* Grounded in the FAQ's stated timings, not invented. */}
        <div className="mt-3 flex items-center gap-2 rounded-[10px] bg-secondary px-3 py-2.5 text-[12.5px] text-foreground">
          <Truck className="h-[15px] w-[15px] shrink-0 text-muted-foreground" />
          <span>
            Ships in <b className="font-semibold">2–4 business days</b>, then 3–6 in transit
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <TrustTile icon={ShieldCheck} label="Insured in transit" />
          <TrustTile icon={RotateCcw} label="14-day returns" />
          <TrustTile icon={Check} label="Handmade to order" />
        </div>

        {/* Four facts, always visible — no tap to learn the size. */}
        {facts.length > 0 && (
          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border">
            {facts.map((f) => (
              <div key={f.key} className="bg-background px-3.5 py-2.5">
                <dt className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  {f.key}
                </dt>
                <dd className="mt-0.5 text-[13px] font-medium text-foreground">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* For handmade work the making is the pitch, so it is not collapsed. */}
        {product.description && (
          <div className="mt-5">
            <h2 className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              From the studio
            </h2>
            <p
              className={cn(
                'mt-2 text-sm leading-[1.62] text-foreground/85',
                !noteExpanded && 'line-clamp-3'
              )}
            >
              {product.description}
            </p>
            <button
              type="button"
              onClick={() => setNoteExpanded((v) => !v)}
              className="mt-2 py-1.5 text-[13px] font-semibold text-foreground underline underline-offset-[3px]"
            >
              {noteExpanded ? 'Read less' : 'Read more'}
            </button>
          </div>
        )}
      </div>

      {/* ── The one dark surface on the page ────────────────── */}
      {styling.length > 0 && (
        <section className="mt-7 bg-[#101013] py-6 text-white">
          <h2 className="px-4 font-serif text-[19px] font-medium">In your space</h2>
          <p className="px-4 pb-4 pt-1 text-[12.5px] text-white/60">
            Styled by the studio — every piece finishes differently.
          </p>
          <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {styling.map((shot, i) => (
              <figure key={i} className="w-[230px] shrink-0 snap-start">
                <div className="aspect-[4/5] overflow-hidden rounded-[10px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shot.url}
                    alt={`${product.name} styled, view ${i + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                {shot.text && (
                  <figcaption className="mt-2 text-xs leading-relaxed text-white/70">
                    {shot.text}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ── Reviews — present on the phone at last ──────────── */}
      {ratingCount > 0 && (
        <section className="px-4 pt-6">
          <h2 className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            What buyers say
          </h2>

          <div className="mt-3 flex items-center gap-4">
            <div>
              <p className="text-[32px] font-semibold leading-none tabular-nums text-foreground">
                {avgRating.toFixed(1)}
              </p>
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                {ratingCount} {ratingCount === 1 ? 'review' : 'reviews'}
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const n = distribution[star - 1]
                const pct = ratingCount > 0 ? (n / ratingCount) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                    <span className="w-2 text-right">{star}</span>
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                      <span
                        className="block h-full rounded-full bg-foreground"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {reviews.slice(0, 2).map((r) => (
            <article key={r.id} className="mt-3.5 border-t pt-3.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]">
                <b className="font-semibold text-foreground">
                  {r.user?.fullName || 'Verified buyer'}
                </b>
                <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-700 dark:text-emerald-500">
                  <Check className="h-3 w-3" strokeWidth={3} />
                  Verified buyer
                </span>
                <span className="tracking-[1px] text-[11px] text-foreground">
                  {'★'.repeat(Math.round(r.rating))}
                </span>
              </div>
              {r.comment && (
                <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/75">{r.comment}</p>
              )}
            </article>
          ))}

          {ratingCount > 2 && (
            <Button asChild variant="outline" className="mt-3.5 h-11 w-full rounded-[10px]">
              <Link href={`/products/${product.id}#reviews`}>Read all {ratingCount} reviews</Link>
            </Button>
          )}
        </section>
      )}

      {/* ── Everything secondary, behind one disclosure ─────── */}
      <section className="px-4 pt-6">
        <div className="border-t">
          <button
            type="button"
            aria-expanded={careOpen}
            onClick={() => setCareOpen((v) => !v)}
            className="flex w-full items-center justify-between py-4 text-sm font-medium text-foreground"
          >
            Care &amp; shipping
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform duration-200', careOpen && 'rotate-180')}
            />
          </button>
          {careOpen && (
            <div className="space-y-3 pb-4 text-[13px] leading-relaxed text-foreground/75">
              {careLines.length > 0 && (
                <ul className="list-disc space-y-1 pl-4">
                  {careLines.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              )}
              {restSpecs.length > 0 && (
                <dl className="space-y-1">
                  {restSpecs.map((s) => (
                    <div key={s.key} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{s.key}</dt>
                      <dd className="text-right text-foreground">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p>
                In-stock pieces ship within 2–4 business days, then 3–6 business days in transit
                within India. Most pieces can be returned within 14 days.{' '}
                <Link href="/faq" className="underline underline-offset-2">
                  Full policy
                </Link>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── More from this collection ───────────────────────── */}
      {similarProducts.length > 0 && (
        <section className="pt-6">
          <h2 className="px-4 pb-3 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            More from {product.category?.name || 'the studio'}
          </h2>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {similarProducts.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="w-[134px] shrink-0">
                <div className="aspect-[4/5] overflow-hidden rounded-[10px] bg-muted">
                  {p.imageUrls?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrls[0]}
                      alt={p.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </div>
                <p className="mt-1.5 truncate text-[12.5px] font-medium text-foreground">{p.name}</p>
                <p className="text-[12.5px] font-semibold tabular-nums text-foreground">
                  {formatPrice(p.price)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="h-24" />

      {/* ── Sticky buy bar, above the dock ──────────────────── */}
      {!isOut && (
        <div
          className={cn(
            'fixed inset-x-0 z-40 transition-[transform,opacity] duration-300 ease-out lg:hidden',
            barVisible
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-[160%] opacity-0'
          )}
          style={{ bottom: 'var(--mobile-dock-total, 4.5rem)' }}
        >
          <div className="mx-3 mb-2.5 flex items-center gap-2.5 rounded-[18px] border bg-background/95 p-2.5 pl-3.5 shadow-lg backdrop-blur-xl supports-[backdrop-filter]:bg-background/90">
            <div className="min-w-0">
              <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">Total</p>
              <p className="text-[17px] font-semibold leading-tight tabular-nums text-foreground">
                {formatPrice(product.price * qty)}
              </p>
            </div>
            <Button
              className="ml-auto h-12 min-w-[8.25rem] flex-1 rounded-full"
              disabled={adding}
              onClick={handleAdd}
            >
              {adding ? 'Adding…' : 'Add to bag'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Added to bag ────────────────────────────────────── */}
      <Drawer open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-500">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
              Added to your bag
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex items-center gap-3 px-4 pb-4">
            <div className="aspect-square w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              {images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[0]} alt="" className="h-full w-full object-cover" decoding="async" />
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-foreground">{product.name}</p>
              <p className="text-[12.5px] tabular-nums text-muted-foreground">
                Qty {qty} · {formatPrice(product.price * qty)}
              </p>
            </div>
          </div>
          <DrawerFooter>
            <Button
              variant="outline"
              className="h-12 flex-none rounded-xl px-5"
              onClick={() => setConfirmOpen(false)}
            >
              Keep looking
            </Button>
            <Button asChild className="h-12 flex-1 rounded-xl">
              <Link href={user ? '/dashboard/cart' : '/cart'}>View bag</Link>
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* ── Lightbox ────────────────────────────────────────── */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} — full screen`}
          className="fixed inset-0 z-[100] flex flex-col bg-[#0b0b0c]"
        >
          <div className="flex items-center justify-between px-3.5 pt-3.5">
            <span className="text-[12.5px] tabular-nums text-white/60">
              {current + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close full screen"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white"
            >
              <X className="h-[17px] w-[17px]" />
            </button>
          </div>

          {/*
           * Paging and zooming are two different surfaces on purpose. A CSS
           * transform can enlarge an image but gives nothing to pan with, so
           * zoomed-in the picture just sat there. Zoom swaps the carousel for
           * a native scroll container holding an oversized image: panning is
           * then the browser's own scrolling, with its momentum and its
           * rubber-banding, which is what "smooth" actually means here.
           */}
          {zoomed ? (
            <div
              ref={zoomRef}
              onClick={() => setZoomed(false)}
              className="min-h-0 flex-1 overflow-auto overscroll-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[current]}
                alt={`${product.name} — view ${current + 1}, enlarged`}
                className="h-auto max-w-none"
                decoding="async"
                style={{ width: `${ZOOM_SCALE * 100}%` }}
                draggable={false}
              />
            </div>
          ) : (
            <Carousel
              setApi={setLightboxApi}
              opts={{ loop: images.length > 1 }}
              className="min-h-0 flex-1"
            >
              <CarouselContent wrapperClassName="h-full" className="ml-0 h-full">
                {images.map((url, i) => (
                  <CarouselItem key={i} className="basis-full pl-0">
                    <div className="grid h-full place-items-center px-3.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`${product.name} — view ${i + 1}`}
                        onClick={(e) => zoomAt(e)}
                        className="max-h-full w-full rounded-lg object-contain"
                        decoding="async"
                        draggable={false}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          )}

          <p className="pb-2 text-center text-[11.5px] text-white/45">
            {zoomed ? 'Drag to explore · tap to fit' : 'Tap the image to zoom'}
          </p>

          <div className="flex gap-2 overflow-x-auto px-3.5 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.map((url, i) => (
              <button
                key={i}
                type="button"
                aria-label={`View image ${i + 1}`}
                aria-current={i === current}
                onClick={() => lightboxApi?.scrollTo(i)}
                className={cn(
                  'aspect-square w-[52px] shrink-0 overflow-hidden rounded-lg border-[1.5px] transition-opacity',
                  i === current ? 'border-white opacity-100' : 'border-transparent opacity-50'
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" decoding="async" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- */
/* PIECES                                                          */
/* -------------------------------------------------------------- */

function GlassButton({
  children,
  label,
  pressed,
  onClick,
}: {
  children: React.ReactNode
  label: string
  pressed?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'pointer-events-auto grid h-9 w-9 place-items-center rounded-full shadow-sm backdrop-blur transition-[background-color,color,transform] duration-200',
        'active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        pressed ? 'bg-foreground text-background' : 'bg-background/90 text-foreground'
      )}
    >
      {children}
    </button>
  )
}

function TrustTile({
  icon: Icon,
  label,
}: {
  icon: typeof ShieldCheck
  label: string
}) {
  return (
    <Link
      href="/faq"
      className="flex flex-col items-center rounded-[10px] border px-1 py-2.5 text-center transition-colors hover:bg-secondary"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="mt-1.5 text-[10.5px] leading-tight text-muted-foreground">{label}</span>
    </Link>
  )
}

function QuantityStepper({
  value,
  max,
  disabled,
  onChange,
}: {
  value: number
  max: number
  disabled?: boolean
  onChange: (n: number) => void
}) {
  const canDec = !disabled && value > 1
  const canInc = !disabled && value < Math.max(1, max)

  return (
    <div
      className={cn(
        'inline-flex h-12 shrink-0 items-center rounded-full bg-secondary',
        disabled && 'opacity-50'
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={!canDec}
        onClick={() => onChange(value - 1)}
        className="grid h-12 w-11 place-items-center rounded-full text-foreground transition-colors disabled:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      </button>
      <span className="min-w-[22px] text-center text-[14.5px] font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={!canInc}
        onClick={() => onChange(value + 1)}
        className="grid h-12 w-11 place-items-center rounded-full text-foreground transition-colors disabled:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}
