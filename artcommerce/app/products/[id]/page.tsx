// File: app/products/[id]/page.tsx
'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowRight, Check, Minus, Package, Plus, ShieldCheck, Truck } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import WishlistButton from '../../components/WishlistButton'
import MobileProductDetails from './MobileProductDetails'
import ProductCardPro from '../ProductCardPro'
import Reveal from '../../components/home/Reveal'
import SectionHeader from '../../components/home/SectionHeader'
import ProductChrome, { type ChromeSection } from './ProductChrome'
import ProductStage from './ProductStage'
import ProductReviews, { type Review } from './ProductReviews'
import Stars from '../../components/Stars'
import { parseLines, parseSpecs } from './pdp-utils'
import { formatPrice } from '../../../lib/formatPrice'
import { useDeviceDetection } from '../../hooks/useDeviceDetection'
import { cn } from '@/lib/utils'

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
}

const LOW_STOCK = 5

// Every section sits on the same rhythm: a hairline rule, then air.
const SECTION = 'scroll-mt-24 border-t border-[#ececec] pt-20 lg:pt-24'

export default function ProductDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id

  const { addToCart, cartItems } = useCart()
  const { user } = useAuth()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [cartState, setCartState] = useState<'idle' | 'adding' | 'added'>('idle')
  const [similarProducts, setSimilarProducts] = useState<Product[]>([] as any)
  const [avgRating, setAvgRating] = useState<number>(0)
  const [ratingCount, setRatingCount] = useState<number>(0)
  const [reviews, setReviews] = useState<Review[]>([])

  // Use optimized device detection hook
  const { isSmallScreen } = useDeviceDetection()
  const isMobile = isSmallScreen

  // Fetch product details on mount
  useEffect(() => {
    if (!id) {
      router.replace('/products')
      return
    }

    async function fetchProduct() {
      setLoading(true)
      setFetchError(null)

      try {
        const res = await fetch(`/api/products/${id}`, { cache: 'no-store' })
        if (!res.ok) {
          if (res.status === 404) {
            router.replace('/404')
            return
          }
          setFetchError(`Server error: ${res.status}`)
          return
        }
        const data = await res.json()

        // Normalize imageUrls and filter out any null/invalid entries
        let rawImgs: (string | null)[] = [];
        if (Array.isArray(data.product.imageUrls)) {
          rawImgs = data.product.imageUrls;
        } else {
          try {
            const parsed = JSON.parse(data.product.imageUrls || '[]');
            if (Array.isArray(parsed)) {
              rawImgs = parsed;
            }
          } catch {
            // Fails silently, rawImgs remains []
          }
        }

        const cleanImageUrls = rawImgs.filter((url): url is string => typeof url === 'string' && url.length > 0);

        setProduct({ ...data.product, imageUrls: cleanImageUrls })
        // fetch similar products
        if (data.product?.category?.slug) {
          fetch(`/api/products?category=${data.product.category.slug}`)
            .then(r => r.json())
            .then(j => {
              const others = (j.products || [])
                .filter((p: any) => p.id !== data.product.id)
                .slice(0, 4)
                .map((p: any) => {
                  // Normalize imageUrls (API may return a JSON string) so the
                  // shared ProductCardPro renders these the same as the grid.
                  let imgs: string[] = []
                  if (Array.isArray(p.imageUrls)) {
                    imgs = p.imageUrls
                  } else {
                    try {
                      const parsed = JSON.parse(p.imageUrls || '[]')
                      imgs = Array.isArray(parsed) ? parsed : []
                    } catch {
                      imgs = []
                    }
                  }
                  imgs = imgs
                    .filter((u: any): u is string => typeof u === 'string' && u.length > 0)
                    .map((u: string) => (u.startsWith('http') || u.startsWith('/') ? u : `/uploads/${u}`))
                  return { ...p, imageUrls: imgs }
                })
              setSimilarProducts(others)
            })
            .catch(console.error)
        }
      } catch (err: any) {
        console.error('Network error:', err)
        setFetchError('Network error—please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, router])

  // Rating stats + the accounts themselves
  const loadReviews = useCallback(() => {
    if (!id) return
    fetch(`/api/products/${id}/review`)
      .then(r => r.json())
      .then(({ avg, count, reviews }) => {
        setAvgRating(avg || 0)
        setRatingCount(count || 0)
        setReviews(reviews || [])
      })
      .catch(() => {})
  }, [id])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const specs = useMemo(() => parseSpecs(product?.specifications), [product?.specifications])
  const care = useMemo(() => parseLines(product?.careInstructions), [product?.careInstructions])

  const stylingImages = useMemo(
    () =>
      (product?.stylingIdeaImages || []).map(it =>
        typeof it === 'string' ? { url: it, text: '' } : it,
      ),
    [product?.stylingIdeaImages],
  )

  const isOut = (product?.stockQuantity ?? 0) <= 0

  const handleAddToCart = useCallback(async () => {
    if (!product || isOut || cartState !== 'idle') return
    setError(null)
    setCartState('adding')
    try {
      const ok = await addToCart(product.id, qty)
      if (ok === false) {
        setCartState('idle')
        return
      }
      setCartState('added')
      toast.success(`${product.name} added to your cart`, {
        description: `${qty} ${qty === 1 ? 'piece' : 'pieces'} · ${formatPrice(product.price * qty, product.currency)}`,
        action: { label: 'View cart', onClick: () => router.push('/dashboard/cart') },
      })
      setTimeout(() => setCartState('idle'), 2600)
    } catch (err: any) {
      console.error(err)
      setCartState('idle')
      setError(err?.message || 'Failed to add to cart')
    }
  }, [addToCart, cartState, isOut, product, qty, router])

  // The page's table of contents — only the sections this piece actually has.
  const sections = useMemo<ChromeSection[]>(() => {
    const list: ChromeSection[] = []
    if (product?.description) list.push({ id: 'story', label: 'The story' })
    if (specs.rows.length || specs.notes.length || care.length)
      list.push({ id: 'details', label: 'Details' })
    if (stylingImages.length) list.push({ id: 'in-situ', label: 'In your space' })
    list.push({ id: 'reviews', label: 'Reviews' })
    if (similarProducts.length) list.push({ id: 'explore', label: 'Explore' })
    return list
  }, [product?.description, specs, care, stylingImages.length, similarProducts.length])

  // Loading state
  if (loading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[1240px] bg-white px-6 pb-24 pt-8 lg:px-10">
        <div className="mb-7 h-3 w-40 animate-pulse rounded bg-[#f0f0f0]" />
        <div className="grid grid-cols-12 items-start gap-x-14">
          <div className="col-span-7 grid grid-cols-[76px_minmax(0,1fr)] gap-5">
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-md bg-[#f0f0f0]" />
              ))}
            </div>
            <div className="h-[586px] animate-pulse rounded-2xl bg-[#f0f0f0]" />
          </div>
          <div className="col-span-5 space-y-5 pt-2">
            <div className="h-3 w-24 animate-pulse rounded bg-[#f0f0f0]" />
            <div className="h-11 w-4/5 animate-pulse rounded bg-[#f0f0f0]" />
            <div className="h-4 w-40 animate-pulse rounded bg-[#f0f0f0]" />
            <div className="h-9 w-32 animate-pulse rounded bg-[#f0f0f0]" />
            <div className="h-20 w-full animate-pulse rounded bg-[#f0f0f0]" />
            <div className="h-12 w-full animate-pulse rounded-full bg-[#f0f0f0]" />
          </div>
        </div>
      </main>
    )
  }

  // Error state
  if (fetchError) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-[1240px] flex-col items-center justify-center bg-white px-6 text-center">
        <p className="text-[15px] text-[#666]">{fetchError}</p>
        <Link
          href="/products"
          className="mt-5 inline-flex h-11 items-center rounded-full bg-[#1a1a1a] px-6 text-[13px] font-medium text-white transition-colors hover:bg-[#000]"
        >
          Return to collection
        </Link>
      </main>
    )
  }

  // Not found state
  if (!product) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-[1240px] flex-col items-center justify-center bg-white px-6 text-center">
        <p className="font-serif text-3xl font-medium text-[#1a1a1a]">Product not found</p>
        <p className="mt-2 text-[14px] text-[#666]">
          It may have been moved or is no longer available.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-[#1a1a1a] px-6 text-[13px] font-medium text-white transition-colors hover:bg-[#000]"
        >
          Return to collection
        </Link>
      </main>
    )
  }

  // Render mobile view if on mobile device
  if (isMobile) {
    return (
      <MobileProductDetails
        product={product}
        avgRating={avgRating}
        ratingCount={ratingCount}
        similarProducts={similarProducts}
      />
    );
  }

  // ── Desktop: the piece, presented ───────────────────────────────────
  const isLow = !isOut && product.stockQuantity <= LOW_STOCK
  const cartHref = user ? '/dashboard/cart' : '/auth/login'
  const wishlistHref = user ? '/dashboard/wishlist' : '/auth/login'
  // The four facts worth reading before you scroll — the rest lives in Details.
  const digest = specs.rows.slice(0, 4)

  return (
    <>
      <ProductChrome
        name={product.name}
        price={product.price}
        currency={product.currency}
        thumbnail={product.imageUrls[0]}
        sections={sections}
        cartCount={user ? cartItems.length : 0}
        cartHref={cartHref}
        wishlistHref={wishlistHref}
        soldOut={isOut}
        adding={cartState === 'adding'}
        added={cartState === 'added'}
        onAdd={handleAddToCart}
      />

      <main className="mx-auto w-full max-w-[1240px] bg-white px-6 pb-28 pt-7 lg:px-10">
        {/* Breadcrumb — where you are, in one line */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#b9b9b9]"
        >
          <Link href="/" className="transition-colors hover:text-[#1a1a1a]">
            Home
          </Link>
          <span className="text-[#e0e0e0]">/</span>
          <Link href="/products" className="transition-colors hover:text-[#1a1a1a]">
            Collection
          </Link>
          {product.category && (
            <>
              <span className="text-[#e0e0e0]">/</span>
              <Link
                href={`/products?category=${encodeURIComponent(product.category.slug)}`}
                className="transition-colors hover:text-[#1a1a1a]"
              >
                {product.category.name}
              </Link>
            </>
          )}
        </nav>

        {/* ── The viewing wall ──────────────────────────────────────── */}
        <section className="mt-7 grid grid-cols-12 items-start gap-x-14">
          <div className="col-span-7">
            <ProductStage images={product.imageUrls} name={product.name} />
          </div>

          {/* The placard */}
          <div className="col-span-5 flex flex-col pt-1">
            {product.category && (
              <>
                <Link
                  href={`/products?category=${encodeURIComponent(product.category.slug)}`}
                  className="w-fit text-[11px] font-medium uppercase tracking-[0.3em] text-[#999] transition-colors hover:text-[#1a1a1a]"
                >
                  {product.category.name}
                </Link>
                <span
                  aria-hidden="true"
                  className="mt-2.5 block h-px w-10 bg-gradient-to-r from-[#d4a373] to-transparent"
                />
              </>
            )}

            <h1 className="mt-3.5 font-serif text-[44px] font-medium leading-[1.05] tracking-[-0.01em] text-[#1a1a1a]">
              {product.name}
            </h1>

            {/* Rating jumps to the accounts rather than just sitting there */}
            <button
              type="button"
              onClick={() =>
                document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="group mt-4 flex w-fit items-center gap-2.5 outline-none"
            >
              <Stars value={avgRating} size={14} />
              <span className="text-[13px] text-[#666] transition-colors group-hover:text-[#1a1a1a]">
                {ratingCount > 0
                  ? `${avgRating.toFixed(1)} · ${ratingCount} review${ratingCount > 1 ? 's' : ''}`
                  : 'No reviews yet'}
              </span>
            </button>

            <div className="mt-6 flex items-baseline gap-2.5">
              <span className="font-serif text-[38px] font-medium leading-none tracking-tight text-[#1a1a1a]">
                {formatPrice(product.price, product.currency)}
              </span>
            </div>

            {product.shortDesc && (
              <p className="mt-5 max-w-md text-[15px] leading-[1.7] text-[#666]">
                {product.shortDesc}
              </p>
            )}

            {/* Spec digest — the facts that decide a purchase, in plain sight */}
            {digest.length > 0 && (
              <dl className="mt-7 grid grid-cols-2 gap-x-8 border-y border-[#ececec] py-5">
                {digest.map(row => (
                  <div key={row.key} className="py-1.5">
                    <dt className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-[#b9b9b9]">
                      {row.key}
                    </dt>
                    <dd className="mt-1 text-[13.5px] text-[#1a1a1a]">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {/* Availability, stated flatly */}
            <p className="mt-6 flex items-center gap-2 text-[13px] text-[#666]">
              <span
                className={cn(
                  'inline-block h-1.5 w-1.5 rounded-full',
                  isOut ? 'bg-[#c9c9c9]' : isLow ? 'bg-[#d4a373]' : 'bg-[#1a1a1a]',
                )}
              />
              {isOut
                ? 'Currently sold out'
                : isLow
                  ? `Only ${product.stockQuantity} left — each one hand-poured`
                  : 'In stock, ready to ship'}
            </p>

            {/* The way in */}
            <div className="mt-5 flex items-center gap-3">
              {!isOut && (
                <div className="inline-flex h-12 shrink-0 items-center rounded-full border border-[#e5e5e5]">
                  <button
                    type="button"
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                    className="flex h-12 w-11 items-center justify-center rounded-l-full text-[#666] transition-colors hover:text-[#1a1a1a] disabled:opacity-30"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-[14px] font-medium tabular-nums text-[#1a1a1a]">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(q => Math.min(product.stockQuantity, q + 1))}
                    disabled={qty >= product.stockQuantity}
                    aria-label="Increase quantity"
                    className="flex h-12 w-11 items-center justify-center rounded-r-full text-[#666] transition-colors hover:text-[#1a1a1a] disabled:opacity-30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOut || cartState !== 'idle'}
                className={cn(
                  'inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-[14px] font-medium transition-colors',
                  isOut
                    ? 'cursor-not-allowed bg-[#f2f2f2] text-[#999]'
                    : 'bg-[#1a1a1a] text-white hover:bg-[#000]',
                )}
              >
                {isOut ? (
                  'Sold out'
                ) : cartState === 'added' ? (
                  <>
                    <Check className="h-4 w-4" /> Added to cart
                  </>
                ) : cartState === 'adding' ? (
                  'Adding…'
                ) : (
                  'Add to cart'
                )}
              </button>

              <WishlistButton
                productId={product.id}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e5e5e5] text-[#1a1a1a] transition-colors hover:border-[#1a1a1a]"
              />
            </div>

            {error && <p className="mt-3 text-[13px] text-[#b4453c]">{error}</p>}

            {/* Reassurance as one quiet line, not three boxes */}
            <div className="mt-7 flex flex-col gap-2.5 border-t border-[#ececec] pt-6">
              {[
                { icon: Package, label: 'Hand-poured — no two pieces are identical' },
                { icon: Truck, label: 'Carefully wrapped and dispatched' },
                { icon: ShieldCheck, label: 'Secure checkout' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2.5 text-[12.5px] text-[#999]">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-[#c4c4c4]" strokeWidth={1.5} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Tells the chrome when the buy column has left the building */}
        <div id="pdp-hero-end" aria-hidden="true" className="h-px" />

        {/* ── The story ─────────────────────────────────────────────── */}
        {product.description && (
          <section id="story" className={cn(SECTION, 'mt-24')}>
            <Reveal>
              <div className="grid grid-cols-12 gap-x-16">
                <div className="col-span-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#999]">
                    About this piece
                  </p>
                  <span
                    aria-hidden="true"
                    className="mt-2.5 block h-px w-10 bg-gradient-to-r from-[#d4a373] to-transparent"
                  />
                  <h2 className="mt-3 font-serif text-4xl font-medium leading-[1.1] text-[#1a1a1a]">
                    The story
                    <br />
                    behind it
                  </h2>
                </div>
                <div className="col-span-7 col-start-6">
                  <div className="whitespace-pre-line text-[16.5px] leading-[1.85] text-[#4a4a4a]">
                    {product.description}
                  </div>
                </div>
              </div>
            </Reveal>
          </section>
        )}

        {/* ── Details: nothing hidden behind a chevron ───────────────── */}
        {(specs.rows.length > 0 || specs.notes.length > 0 || care.length > 0) && (
          <section id="details" className={cn(SECTION, 'mt-20 lg:mt-24')}>
            <Reveal>
              <SectionHeader eyebrow="Details" title="Specifications & care" />

              <div className="mt-12 grid grid-cols-12 gap-x-16">
                {(specs.rows.length > 0 || specs.notes.length > 0) && (
                  <div className={care.length > 0 ? 'col-span-7' : 'col-span-12'}>
                    <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#999]">
                      Specifications
                    </h3>
                    <dl className="mt-5 border-t border-[#ececec]">
                      {specs.rows.map(row => (
                        <div
                          key={row.key}
                          className="flex items-baseline justify-between gap-8 border-b border-[#ececec] py-3.5"
                        >
                          <dt className="text-[14px] text-[#999]">{row.key}</dt>
                          <dd className="text-right text-[14px] font-medium text-[#1a1a1a]">
                            {row.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {specs.notes.length > 0 && (
                      <div className="mt-5 flex flex-col gap-2">
                        {specs.notes.map((n, i) => (
                          <p key={i} className="text-[14px] leading-relaxed text-[#666]">
                            {n}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {care.length > 0 && (
                  <div
                    className={
                      specs.rows.length > 0 || specs.notes.length > 0
                        ? 'col-span-4 col-start-9'
                        : 'col-span-12'
                    }
                  >
                    <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#999]">
                      Care &amp; keeping
                    </h3>
                    <ul className="mt-5 flex flex-col gap-3.5">
                      {care.map((line, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#d4a373]" />
                          <span className="text-[14px] leading-[1.7] text-[#666]">{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Reveal>
          </section>
        )}

        {/* ── In your space ─────────────────────────────────────────── */}
        {stylingImages.length > 0 && (
          <section id="in-situ" className={cn(SECTION, 'mt-20 lg:mt-24')}>
            <Reveal>
              <SectionHeader
                eyebrow="In your space"
                title="Seen in a room"
                sub="How the piece sits once it is out of the box — and the light it likes."
              />
            </Reveal>

            <Reveal delay={0.08}>
              <div className="mt-12 flex flex-col gap-5">
                {/* Lead frame */}
                <StylingFrame
                  item={stylingImages[0]}
                  index={0}
                  aspect="aspect-[16/9]"
                  productName={product.name}
                />
                {stylingImages.length > 1 && (
                  <div
                    className={cn(
                      'grid gap-5',
                      stylingImages.length === 2 ? 'grid-cols-1' : 'grid-cols-2',
                    )}
                  >
                    {stylingImages.slice(1).map((item, i) => (
                      <StylingFrame
                        key={i}
                        item={item}
                        index={i + 1}
                        aspect={stylingImages.length === 2 ? 'aspect-[16/9]' : 'aspect-[4/3]'}
                        productName={product.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          </section>
        )}

        {/* ── Reviews ───────────────────────────────────────────────── */}
        <section id="reviews" className={cn(SECTION, 'mt-20 lg:mt-24')}>
          <Reveal>
            <SectionHeader
              eyebrow="Reviews"
              title="What owners say"
              sub="Written only by people whose order has been delivered."
            />
          </Reveal>
          <div className="mt-12">
            <ProductReviews
              productId={product.id}
              productName={product.name}
              avg={avgRating}
              count={ratingCount}
              reviews={reviews}
              onSubmitted={loadReviews}
            />
          </div>
        </section>

        {/* ── Explore ───────────────────────────────────────────────── */}
        {similarProducts.length > 0 && (
          <section id="explore" className={cn(SECTION, 'mt-20 lg:mt-24')}>
            <Reveal>
              <SectionHeader
                eyebrow="More to explore"
                title={product.category ? `More from ${product.category.name}` : 'You might also like'}
                action={
                  product.category
                    ? {
                        href: `/products?category=${encodeURIComponent(product.category.slug)}`,
                        label: `View all ${product.category.name}`,
                      }
                    : { href: '/products', label: 'View all products' }
                }
              />
            </Reveal>
            <Reveal delay={0.08}>
              <div className="mt-12 grid grid-cols-4 gap-x-7 gap-y-12">
                {similarProducts.map(p => (
                  <ProductCardPro key={p.id} product={p as any} variant="quiet" />
                ))}
              </div>
            </Reveal>
          </section>
        )}

        {/* ── Keep looking ──────────────────────────────────────────── */}
        <section className="mt-20 rounded-2xl bg-[#fafafa] px-12 py-14 lg:mt-24">
          <div className="flex items-end justify-between gap-10">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#999]">
                Keep looking
              </p>
              <span
                aria-hidden="true"
                className="mt-2.5 block h-px w-10 bg-gradient-to-r from-[#d4a373] to-transparent"
              />
              <h2 className="mt-3 font-serif text-4xl font-medium leading-[1.1] text-[#1a1a1a]">
                Every piece is one of one.
              </h2>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-3">
              {product.category && (
                <Link
                  href={`/products?category=${encodeURIComponent(product.category.slug)}`}
                  className="group inline-flex items-center gap-2 font-serif text-2xl font-medium text-[#1a1a1a]"
                >
                  Browse {product.category.name}
                  <ArrowRight className="h-4 w-4 text-[#999] transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              )}
              <Link
                href="/products"
                className="group inline-flex items-center gap-2 text-[13px] font-medium text-[#666] transition-colors hover:text-[#1a1a1a]"
              >
                The full collection
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

// A styling photograph in its mount: matted frame, slow zoom on approach,
// and a numbered caption underneath instead of a label floated over the art.
function StylingFrame({
  item,
  index,
  aspect,
  productName,
}: {
  item: { url: string; text?: string }
  index: number
  aspect: string
  productName: string
}) {
  return (
    <figure className="group">
      <div className={cn('relative overflow-hidden rounded-2xl bg-[#f5f5f5]', aspect)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={`${productName} styled in a room`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.21,0.47,0.32,0.98)] group-hover:scale-[1.045]"
        />
      </div>
      <figcaption className="mt-3.5 flex items-baseline gap-3 px-1">
        <span className="text-[11px] font-medium tabular-nums tracking-[0.16em] text-[#c4c4c4]">
          {String(index + 1).padStart(2, '0')}
        </span>
        {item.text && (
          <span className="text-[13.5px] leading-relaxed text-[#666]">{item.text}</span>
        )}
      </figcaption>
    </figure>
  )
}
