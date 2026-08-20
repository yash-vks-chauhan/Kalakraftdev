'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'
import WishlistButton from '../components/WishlistButton'
import { useImagePreload } from '../hooks/useImagePreload'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { cn } from '@/lib/utils'
import { Rating } from '@/components/ui/rating'
import { formatPrice } from '../../lib/formatPrice'
import animationStyles from './products-animations.module.css'

const LOW_STOCK_THRESHOLD = 5

// Every floating control on the card: a flat white disc on a hairline. No
// frosted glass — the gallery language is flat surfaces and thin rules.
const DISC =
  'flex items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-[#1a1a1a] ' +
  'shadow-[0_2px_8px_-4px_rgba(0,0,0,0.16)] transition-all duration-300 ' +
  'hover:border-[#b9b9b9] active:scale-95'

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

interface ProductCardProProps {
  product: Product
  index?: number
  className?: string
  /**
   * 'shop' — the browsing grid: quick add, angle stepping, wishlist.
   * 'quiet' — a reading rail beside another piece: the work and its price
   * only, so the card never competes with the page it sits under.
   */
  variant?: 'shop' | 'quiet'
}

// A piece hung as a small mounted print: matte well, hairline frame, serif
// name. Shared by the products grid, the homepage shelf, and the detail
// page's explore rail so one piece reads the same everywhere.
export default function ProductCardPro({
  product: prod,
  index = 0,
  className = '',
  variant = 'shop',
}: ProductCardProProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [cartState, setCartState] = useState<'idle' | 'adding' | 'added'>('idle')
  const { user } = useAuth()
  const { addToCart } = useCart()
  const router = useRouter()

  const quiet = variant === 'quiet'
  const hasMultipleImages = !quiet && prod.imageUrls.length > 1
  const rating = prod.avgRating ?? 0
  const isOut = prod.stockQuantity === 0
  const isLow = prod.stockQuantity > 0 && prod.stockQuantity <= LOW_STOCK_THRESHOLD

  // Quick add — the card is a Link, so swallow the navigation.
  const quickAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (cartState !== 'idle') return
    if (!user) {
      router.push('/auth/login')
      return
    }
    setCartState('adding')
    try {
      const ok = await addToCart(prod.id, 1)
      setCartState(ok ? 'added' : 'idle')
      if (ok) setTimeout(() => setCartState('idle'), 1600)
    } catch {
      setCartState('idle')
    }
  }

  // Preload neighbours for instant swaps
  const { preloadImage } = useImagePreload(prod.imageUrls, { priorityCount: 1 })
  useEffect(() => {
    if (!hasMultipleImages) return
    const total = prod.imageUrls.length
    preloadImage(prod.imageUrls[(currentImageIndex + 1) % total])
    preloadImage(prod.imageUrls[(currentImageIndex - 1 + total) % total])
  }, [currentImageIndex, hasMultipleImages, prod.imageUrls, preloadImage])

  const step = (e: React.MouseEvent, dir: 1 | -1) => {
    e.preventDefault()
    e.stopPropagation()
    const total = prod.imageUrls.length
    setCurrentImageIndex((prev) => (prev + dir + total) % total)
  }

  return (
    <Link
      href={`/products/${prod.id}`}
      className={cn(
        'group relative flex flex-col outline-none',
        !quiet && animationStyles.cardEnter,
        className,
      )}
      style={quiet ? undefined : { animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      {/* ── The mount ───────────────────────────────────────────────── */}
      <div
        className={cn(
          'relative aspect-[4/5] w-full overflow-hidden rounded-xl',
          'border border-[#e5e5e5] bg-[#fafafa]',
          'transition-colors duration-500 group-hover:border-[#d0d0d0]',
        )}
      >
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="absolute inset-0"
            style={{ willChange: 'opacity' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={prod.imageUrls[currentImageIndex]}
              alt={prod.name}
              loading="lazy"
              className={cn(
                'h-full w-full object-contain p-5 transition-transform duration-[900ms] ease-[cubic-bezier(0.21,0.47,0.32,0.98)] group-hover:scale-[1.05]',
                isOut && 'opacity-45 grayscale',
              )}
            />
          </motion.div>
        </AnimatePresence>

        {/* Stock, set as a plate rather than a badge */}
        {(isLow || isOut) && (
          <span
            className={cn(
              'absolute left-4 top-4 z-20 text-[10px] font-medium uppercase tracking-[0.2em]',
              isOut ? 'text-[#999]' : 'text-[#b8845a]',
            )}
          >
            {isOut ? 'Sold out' : `Only ${prod.stockQuantity} left`}
          </span>
        )}

        {!quiet && (
          <>
            {/* Wishlist */}
            <div className="absolute right-3 top-3 z-20" onClick={(e) => e.preventDefault()}>
              <WishlistButton
                productId={prod.id}
                className={cn(DISC, 'h-9 w-9')}
                preventNavigation={true}
              />
            </div>

            {/* Which angle you're on — copper marks the current one */}
            {hasMultipleImages && (
              <div
                className={cn(
                  'absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5',
                  'transition-opacity duration-200',
                  !isOut && 'group-hover:pointer-events-none group-hover:opacity-0',
                )}
              >
                {prod.imageUrls.map((_, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      'h-[3px] rounded-full transition-all duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
                      idx === currentImageIndex ? 'w-5 bg-[#d4a373]' : 'w-[3px] bg-[#d0d0d0]',
                    )}
                  />
                ))}
              </div>
            )}

            {/* Step between angles */}
            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={(e) => step(e, -1)}
                  className={cn(
                    DISC,
                    'absolute left-3 top-1/2 z-20 h-9 w-9 -translate-y-1/2',
                    '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100',
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={(e) => step(e, 1)}
                  className={cn(
                    DISC,
                    'absolute right-3 top-1/2 z-20 h-9 w-9 -translate-y-1/2',
                    'translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100',
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Quick add — rises from the bottom edge on approach */}
            {!isOut && (
              <button
                type="button"
                onClick={quickAdd}
                aria-label={`Add ${prod.name} to cart`}
                className={cn(
                  'absolute inset-x-3 bottom-3 z-30 flex h-10 items-center justify-center gap-2 rounded-full',
                  'bg-[#1a1a1a] text-[13px] font-medium text-white',
                  'translate-y-2 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
                  'group-hover:translate-y-0 group-hover:opacity-100',
                  'hover:bg-[#000] active:scale-[0.98]',
                  'focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:outline-none',
                  cartState === 'added' && 'bg-[#3f6b4f] hover:bg-[#3f6b4f]',
                )}
              >
                {cartState === 'added' ? (
                  <>
                    <Check className="h-4 w-4" strokeWidth={2.5} /> Added
                  </>
                ) : cartState === 'adding' ? (
                  'Adding…'
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" /> Add to cart
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* ── The placard ─────────────────────────────────────────────── */}
      <div className="mt-4">
        <h3 className="flex items-start gap-1.5 font-serif text-[19px] font-medium leading-tight text-[#1a1a1a]">
          <span className="line-clamp-2">{prod.name}</span>
          <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 -translate-x-1 text-[#b9b9b9] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
        </h3>

        <div className="mt-2 flex items-center justify-between gap-3">
          <span
            className={cn(
              'text-[13.5px] tabular-nums',
              isOut ? 'text-[#b9b9b9]' : 'text-[#666]',
            )}
          >
            {formatPrice(prod.price, prod.currency)}
          </span>

          {rating > 0 && (
            <span className="flex items-center gap-1.5">
              <Rating value={rating} size="xs" />
              {prod.ratingCount ? (
                <span className="text-[11px] tabular-nums text-[#b9b9b9]">
                  ({prod.ratingCount})
                </span>
              ) : null}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
