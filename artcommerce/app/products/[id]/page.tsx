// File: app/products/[id]/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useCart } from '../../contexts/CartContext'
import WishlistButton from '../../components/WishlistButton'
import Link from 'next/link'
import styles from './product_details.module.css'
import MobileProductDetails from './MobileProductDetails'
import ProductCardPro from '../ProductCardPro'
import { useDeviceDetection } from '../../hooks/useDeviceDetection'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Star,
  ArrowLeft,
  ChevronLeft as ChevLeft,
  ChevronRight as ChevRight,
  ChevronDown,
  Minus,
  Plus,
  Check,
  ShieldCheck,
  Truck,
  Sparkles,
} from 'lucide-react'

// SVG icons for navigation
const ChevronLeft = () => (
  <svg className={styles.navIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
  </svg>
)

const ChevronRight = () => (
  <svg className={styles.navIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
)

// New icon components for the sections
const SpecificationIcon = () => (
  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CareIcon = () => (
  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61C19.32 3.09 17.16 3.09 15.64 4.61L12 8.25L8.36 4.61C6.84 3.09 4.68 3.09 3.16 4.61C1.64 6.13 1.64 8.29 3.16 9.81L12 18.65L20.84 9.81C22.36 8.29 22.36 6.13 20.84 4.61Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor"/>
  </svg>
)

const StylingIcon = () => (
  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor"/>
  </svg>
)

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

export default function ProductDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id

  const { addToCart } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [similarProducts, setSimilarProducts] = useState<Product[]>([] as any)
  const [avgRating, setAvgRating] = useState<number>(0)
  const [ratingCount, setRatingCount] = useState<number>(0)
  const [reviews, setReviews] = useState<any[]>([])

  // Use optimized device detection hook
  const { isSmallScreen } = useDeviceDetection()
  const isMobile = isSmallScreen
  
  // New state for section toggles
  const [expandedSections, setExpandedSections] = useState({
    specifications: false,
    care: false,
    styling: true // Keep styling expanded by default
  })

  // Section toggle state for mobile
  const [sections, setSections] = useState({
    details: true,
    reviews: false,
    styling: true // Keep styling expanded by default
  })  // Fetch product details on mount
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
        setSelectedImage(0) // Reset selected image when product changes
      } catch (err: any) {
        console.error('Network error:', err)
        setFetchError('Network error—please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, router])

  // Fetch rating stats
  useEffect(() => {
    if (!id) return
    fetch(`/api/products/${id}/review`).then(r=>r.json()).then(({avg,count,reviews})=>{
      setAvgRating(avg)
      setRatingCount(count)
      setReviews(reviews||[])
    }).catch(()=>{})
  }, [id])

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Format specifications text
  const formatSpecifications = (text: string) => {
    return text.split('\n').map((line, index) => {
      const trimmed = line.trim()
      if (!trimmed) return null
      
      // Check if it's a key-value pair (contains : or -)
      if (trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':')
        const value = valueParts.join(':').trim()
        return (
          <div key={index} className={styles.specRow}>
            <span className={styles.specKey}>{key.trim()}</span>
            <span className={styles.specValue}>{value}</span>
          </div>
        )
      } else if (trimmed.startsWith('-')) {
        return (
          <div key={index} className={styles.specBullet}>
            {trimmed.substring(1).trim()}
          </div>
        )
      } else {
        return (
          <div key={index} className={styles.specText}>
            {trimmed}
          </div>
        )
      }
    }).filter(Boolean)
  }

  // Loading state
  if (loading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[1240px] bg-white px-6 pb-24 pt-6 lg:px-10">
        <div className="mb-7 h-4 w-32 animate-pulse rounded bg-zinc-100" />
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="space-y-4">
            <div className="aspect-square w-full animate-pulse rounded-[24px] bg-zinc-100" />
            <div className="flex gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[72px] w-[72px] animate-pulse rounded-xl bg-zinc-100" />
              ))}
            </div>
          </div>
          <div className="space-y-5 pt-2">
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-40 animate-pulse rounded bg-zinc-100" />
            <div className="h-9 w-32 animate-pulse rounded bg-zinc-100" />
            <div className="h-20 w-full animate-pulse rounded bg-zinc-100" />
            <div className="h-12 w-full animate-pulse rounded-full bg-zinc-100" />
          </div>
        </div>
      </main>
    )
  }

  // Error state
  if (fetchError) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-[1240px] flex-col items-center justify-center bg-white px-6 text-center">
        <p className="text-[15px] text-zinc-500">{fetchError}</p>
        <Link
          href="/products"
          className="mt-5 inline-flex h-10 items-center rounded-full bg-zinc-900 px-5 text-[13px] font-medium text-white transition-colors hover:bg-zinc-800"
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
        <p className="text-[17px] font-semibold text-zinc-900">Product not found</p>
        <p className="mt-1 text-[14px] text-zinc-500">It may have been moved or is no longer available.</p>
        <Link
          href="/products"
          className="mt-5 inline-flex h-10 items-center rounded-full bg-zinc-900 px-5 text-[13px] font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Return to collection
        </Link>
      </main>
    )
  }

  // Handle add to cart
  const handleAddToCart = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const quantity = Number(qty)
    if (isNaN(quantity) || quantity < 1) {
      setError('Quantity must be at least 1')
      return
    }

    try {
      await addToCart(product.id, quantity)
      setAdded(true)
      setTimeout(() => {
        setAdded(false)
      }, 3000)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to add to cart')
    }
  }

  // Stock status
  const getStockStatus = () => {
    if (product.stockQuantity <= 0) return { text: 'Out of stock', className: styles.outOfStock }
    if (product.stockQuantity <= 5) return { text: `Only ${product.stockQuantity} left!`, className: styles.lowStock }
    return { text: 'In stock', className: styles.inStock }
  }
  const stockStatus = getStockStatus()

  const handlePrevImage = () => {
    setSelectedImage((prev) => 
      prev === 0 ? product!.imageUrls.length - 1 : prev - 1
    )
  }

  const handleNextImage = () => {
    setSelectedImage((prev) => 
      prev === product!.imageUrls.length - 1 ? 0 : prev + 1
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

  // Desktop view — editorial product story
  const isOut = product.stockQuantity <= 0
  const isLow = product.stockQuantity > 0 && product.stockQuantity <= 5
  const ratingRounded = Math.round(avgRating)

  // Shared frosted-glass surface, matching the products grid + cards.
  const glass =
    'backdrop-blur-md bg-white/65 border border-white/70 ' +
    'shadow-[0_6px_20px_-6px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.85)]'

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1240px] bg-white px-6 pb-24 pt-6 lg:px-10">
      <style>{`@keyframes pdpFade{from{opacity:0;transform:scale(0.995)}to{opacity:1;transform:scale(1)}}`}</style>

      {/* Back link */}
      <Link
        href="/products"
        className="group mb-7 inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Back to collection
      </Link>

      {/* Added-to-cart confirmation */}
      {added && (
        <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-[13.5px] font-medium text-emerald-800 backdrop-blur">
          <Check className="h-4 w-4" /> Added to your cart
          <Link href="/cart" className="ml-1 underline underline-offset-2 hover:text-emerald-900">
            View cart
          </Link>
        </div>
      )}

      {/* ── Hero: gallery + buy box ───────────────────────────── */}
      <section className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-24">
          <div className="group relative aspect-square w-full overflow-hidden rounded-[24px] border border-zinc-200/80 bg-gradient-to-br from-zinc-50 via-white to-zinc-100/80 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.20)]">
            {product.imageUrls[selectedImage] ? (
              <img
                key={selectedImage}
                src={product.imageUrls[selectedImage]}
                alt={product.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain p-10 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
                style={{ animation: 'pdpFade .35s ease' }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[13px] text-zinc-400">
                No image available
              </div>
            )}

            {product.imageUrls.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  aria-label="Previous image"
                  className={cn(
                    glass,
                    'absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-zinc-900',
                    'opacity-0 transition-all duration-300 group-hover:opacity-100 hover:scale-105 active:scale-95',
                  )}
                >
                  <ChevLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNextImage}
                  aria-label="Next image"
                  className={cn(
                    glass,
                    'absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-zinc-900',
                    'opacity-0 transition-all duration-300 group-hover:opacity-100 hover:scale-105 active:scale-95',
                  )}
                >
                  <ChevRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Wishlist — frosted circle */}
            <div className="absolute right-4 top-4">
              <WishlistButton
                productId={product.id}
                className={cn(
                  glass,
                  'flex h-10 w-10 items-center justify-center rounded-full text-zinc-900 transition-transform duration-200 hover:scale-105 active:scale-95',
                )}
              />
            </div>
          </div>

          {/* Thumbnails */}
          {product.imageUrls.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {product.imageUrls.map((url, index) => (
                <button
                  key={url}
                  onClick={() => setSelectedImage(index)}
                  aria-label={`View image ${index + 1}`}
                  className={cn(
                    'relative h-[72px] w-[72px] overflow-hidden rounded-xl bg-zinc-50 transition-all duration-200',
                    index === selectedImage
                      ? 'ring-2 ring-zinc-900 ring-offset-2'
                      : 'border border-zinc-200 hover:border-zinc-400',
                  )}
                >
                  <img
                    src={url}
                    alt={`${product.name} - View ${index + 1}`}
                    loading="lazy"
                    className="h-full w-full object-contain p-1.5"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div className="flex flex-col">
          {product.category && (
            <Link
              href={`/products?category=${product.category.slug}`}
              className="mb-3 w-fit text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:text-zinc-700"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="text-[32px] font-semibold leading-[1.08] tracking-tight text-zinc-900 lg:text-[40px]">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="mt-4 flex items-center gap-2.5">
            <span className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-4 w-4',
                    i < ratingRounded ? 'fill-amber-400 text-amber-400' : 'fill-zinc-200 text-zinc-200',
                  )}
                />
              ))}
            </span>
            <span className="text-[13px] text-zinc-500">
              {ratingCount > 0
                ? `${avgRating.toFixed(1)} · ${ratingCount} review${ratingCount > 1 ? 's' : ''}`
                : 'No reviews yet'}
            </span>
          </div>

          {/* Price */}
          <div className="mt-5 flex items-baseline gap-1 text-zinc-900">
            <span className="text-[18px] font-medium text-zinc-500">{product.currency}</span>
            <span className="text-[34px] font-semibold tracking-tight">{product.price.toFixed(2)}</span>
          </div>

          {product.shortDesc && (
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-zinc-600">{product.shortDesc}</p>
          )}

          {/* Stock badge */}
          <div className="mt-5">
            <Badge
              variant="outline"
              className={cn(
                'rounded-full px-3 py-1 text-[12px] font-medium',
                isOut
                  ? 'border-zinc-200 bg-zinc-50 text-zinc-500'
                  : isLow
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700',
              )}
            >
              <span
                className={cn(
                  'mr-1.5 inline-block h-1.5 w-1.5 rounded-full',
                  isOut ? 'bg-zinc-400' : isLow ? 'bg-amber-500' : 'bg-emerald-500',
                )}
              />
              {isOut ? 'Out of stock' : isLow ? `Only ${product.stockQuantity} left` : 'In stock'}
            </Badge>
          </div>

          <Separator className="my-7 bg-zinc-100" />

          {/* CTA */}
          {!isOut ? (
            <form onSubmit={handleAddToCart} className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="inline-flex h-12 items-center rounded-full border border-zinc-200 bg-white">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  aria-label="Decrease quantity"
                  className="flex h-12 w-12 items-center justify-center rounded-l-full text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-[15px] font-semibold tabular-nums text-zinc-900">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(product.stockQuantity, q + 1))}
                  disabled={qty >= product.stockQuantity}
                  aria-label="Increase quantity"
                  className="flex h-12 w-12 items-center justify-center rounded-r-full text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 flex-1 rounded-full bg-zinc-900 text-[15px] font-semibold text-white hover:bg-zinc-800"
              >
                Add to Cart
              </Button>
            </form>
          ) : (
            <Button disabled size="lg" className="h-12 w-full rounded-full">
              Out of Stock
            </Button>
          )}

          {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}

          {/* Trust row */}
          <div className="mt-7 grid grid-cols-3 gap-3">
            {[
              { icon: Sparkles, label: 'Handcrafted with care' },
              { icon: Truck, label: 'Carefully packed & shipped' },
              { icon: ShieldCheck, label: 'Secure checkout' },
            ].map(({ icon: Icon, label }, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-100 bg-zinc-50/60 px-2 py-4 text-center"
              >
                <Icon className="h-5 w-5 text-zinc-500" />
                <span className="text-[11.5px] leading-tight text-zinc-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About this piece ──────────────────────────────────── */}
      {product.description && (
        <section className="mx-auto mt-24 max-w-3xl text-center lg:mt-28">
          <span className="mb-3 inline-block text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
            About this piece
          </span>
          <h2 className="text-[26px] font-semibold tracking-tight text-zinc-900 lg:text-[32px]">
            The story behind it
          </h2>
          <p className="mx-auto mt-6 max-w-2xl whitespace-pre-line text-left text-[16.5px] leading-8 text-zinc-600">
            {product.description}
          </p>
        </section>
      )}

      {/* ── Details: specifications + care ────────────────────── */}
      {(product.specifications || product.careInstructions) && (
        <section className="mx-auto mt-24 max-w-3xl lg:mt-28">
          <div className="divide-y divide-zinc-200 border-y border-zinc-200">
            {product.specifications && (
              <div>
                <button
                  onClick={() => toggleSection('specifications')}
                  aria-expanded={expandedSections.specifications}
                  className="flex w-full items-center justify-between py-5 text-left"
                >
                  <span className="text-[15px] font-semibold text-zinc-900">Specifications</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-zinc-400 transition-transform duration-300',
                      expandedSections.specifications && 'rotate-180',
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'grid transition-all duration-300 ease-out',
                    expandedSections.specifications
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <dl className="pb-6">
                      {product.specifications.split('\n').map((line, index) => {
                        const t = line.trim()
                        if (!t) return null
                        if (t.includes(':')) {
                          const [k, ...v] = t.split(':')
                          return (
                            <div
                              key={index}
                              className="flex items-baseline justify-between gap-6 border-b border-zinc-100 py-2.5 last:border-0"
                            >
                              <dt className="text-[14px] text-zinc-500">{k.trim()}</dt>
                              <dd className="text-right text-[14px] font-medium text-zinc-900">
                                {v.join(':').trim()}
                              </dd>
                            </div>
                          )
                        }
                        return (
                          <p key={index} className="py-1.5 text-[14px] leading-relaxed text-zinc-600">
                            {t.replace(/^[-•]\s*/, '')}
                          </p>
                        )
                      })}
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {product.careInstructions && (
              <div>
                <button
                  onClick={() => toggleSection('care')}
                  aria-expanded={expandedSections.care}
                  className="flex w-full items-center justify-between py-5 text-left"
                >
                  <span className="text-[15px] font-semibold text-zinc-900">Care &amp; Maintenance</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-zinc-400 transition-transform duration-300',
                      expandedSections.care && 'rotate-180',
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'grid transition-all duration-300 ease-out',
                    expandedSections.care ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col gap-1 pb-6">
                      {product.careInstructions.split('\n').map((line, index) => {
                        const t = line.trim()
                        if (!t) return null
                        return (
                          <div key={index} className="flex items-start gap-3 py-1.5">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            <span className="text-[14px] leading-relaxed text-zinc-600">
                              {t.replace(/^[-•]?\s*/, '')}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Styling inspiration gallery ───────────────────────── */}
      {product.stylingIdeaImages && product.stylingIdeaImages.length > 0 && (
        <section className="mt-24 lg:mt-28">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mb-3 inline-block text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
              Styling inspiration
            </span>
            <h2 className="text-[26px] font-semibold tracking-tight text-zinc-900 lg:text-[32px]">
              See it in your space
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-zinc-500">
              A glimpse of how this piece settles into a room — and the mood it brings with it.
            </p>
          </div>

          <div
            className={cn(
              'mt-10 grid gap-5',
              product.stylingIdeaImages.length === 1
                ? 'mx-auto max-w-xl grid-cols-1'
                : product.stylingIdeaImages.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
            )}
          >
            {product.stylingIdeaImages.map((it, idx) => {
              const obj = typeof it === 'string' ? { url: it, text: '' } : it
              const defaultCaptions = [
                'Living Room — a calming focal point that ties the space together.',
                'Office Setting — adds artistic flair to professional environments.',
                'Dining Area — complements mealtime with quiet elegance.',
              ]
              const imageCount = product.stylingIdeaImages?.length || 0
              let spaceLabel = 'Living Space'
              if (imageCount === 1) spaceLabel = 'Featured Styling'
              else if (imageCount === 2) spaceLabel = idx === 0 ? 'Living Space' : 'Workspace'
              else spaceLabel = idx === 0 ? 'Living Space' : idx === 1 ? 'Workspace' : 'Dining Area'

              return (
                <figure
                  key={idx}
                  className="group overflow-hidden rounded-[20px] border border-zinc-200/80 bg-zinc-50"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={obj.url}
                      alt={`Styling inspiration ${idx + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                    />
                    <span
                      className={cn(
                        glass,
                        'absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-900',
                      )}
                    >
                      {spaceLabel}
                    </span>
                  </div>
                  <figcaption className="px-5 py-4 text-[13.5px] leading-relaxed text-zinc-600">
                    {obj.text || defaultCaptions[idx % defaultCaptions.length]}
                  </figcaption>
                </figure>
              )
            })}
          </div>
        </section>
      )}

      {/* ── You might also like ───────────────────────────────── */}
      {similarProducts.length > 0 && (
        <section className="mt-24 lg:mt-28">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <span className="mb-2 inline-block text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                More to explore
              </span>
              <h2 className="text-[26px] font-semibold tracking-tight text-zinc-900 lg:text-[30px]">
                You might also like
              </h2>
            </div>
            {product.category && (
              <Link
                href={`/products?category=${product.category.slug}`}
                className="hidden shrink-0 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:inline"
              >
                View all {product.category.name} →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {similarProducts.map((p, i) => (
              <ProductCardPro key={p.id} product={p as any} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── Customer reviews ──────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="mx-auto mt-24 max-w-3xl lg:mt-28">
          <div className="mb-8 flex items-center gap-3">
            <h2 className="text-[24px] font-semibold tracking-tight text-zinc-900">Customer reviews</h2>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[12px] font-medium text-zinc-600">
              {ratingCount || reviews.length}
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {reviews.map((rev: any) => (
              <div key={rev.id} className="rounded-2xl border border-zinc-200/80 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[14px] font-semibold text-zinc-900">
                    {rev.user?.fullName || 'Anonymous'}
                  </span>
                  <span className="flex items-center gap-0.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-3.5 w-3.5',
                          i < rev.rating ? 'fill-amber-400 text-amber-400' : 'fill-zinc-200 text-zinc-200',
                        )}
                      />
                    ))}
                  </span>
                </div>
                {rev.comment && (
                  <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{rev.comment}</p>
                )}
                {rev.adminReply && (
                  <div className="mt-3 rounded-xl bg-zinc-50 p-3 text-[13px] italic text-zinc-500">
                    <span className="font-semibold not-italic text-zinc-700">Kalakraft:</span>{' '}
                    {rev.adminReply}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
