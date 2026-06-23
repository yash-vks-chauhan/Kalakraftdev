'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star, ArrowUpRight } from 'lucide-react'
import WishlistButton from '../components/WishlistButton'
import { useImagePreload } from '../hooks/useImagePreload'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import animationStyles from './products-animations.module.css'

const LOW_STOCK_THRESHOLD = 5

// Shared frosted-glass surface used by every floating control on the card.
// Soft white blur + hairline highlight + layered shadow = premium, tactile.
const GLASS =
  'backdrop-blur-md bg-white/65 border border-white/70 ' +
  'shadow-[0_6px_20px_-6px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.85)]'

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
}

export default function ProductCardPro({
  product: prod,
  index = 0,
  className = '',
}: ProductCardProProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const hasMultipleImages = prod.imageUrls.length > 1
  const rating = Math.round(prod.avgRating ?? 0)
  const isOut = prod.stockQuantity === 0
  const isLow = prod.stockQuantity > 0 && prod.stockQuantity <= LOW_STOCK_THRESHOLD

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
        'group relative flex flex-col rounded-[20px] outline-none',
        'focus-visible:ring-2 focus-visible:ring-zinc-900/40 focus-visible:ring-offset-2',
        animationStyles.cardEnter,
        className,
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      {/* ── Image well ─────────────────────────────────────────────── */}
      <div
        className={cn(
          'relative aspect-[4/5] w-full overflow-hidden rounded-[20px]',
          'border border-zinc-200/80 bg-gradient-to-br from-zinc-50 via-white to-zinc-100/80',
          'transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
          'group-hover:-translate-y-1 group-hover:border-zinc-300/90',
          'group-hover:shadow-[0_28px_50px_-22px_rgba(0,0,0,0.28)]',
        )}
      >
        {/* sheen that drifts across on hover */}
        <div className="pointer-events-none absolute inset-0 z-[6] opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="absolute -inset-y-2 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent blur-md translate-x-0 group-hover:translate-x-[420%] transition-transform duration-[1100ms] ease-out" />
        </div>

        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center p-5 sm:p-6"
            style={{ willChange: 'opacity, transform' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={prod.imageUrls[currentImageIndex]}
              alt={prod.name}
              loading="lazy"
              className="h-full w-full object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.08)] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.06]"
            />
          </motion.div>
        </AnimatePresence>

        {/* Wishlist — frosted circle, top-right */}
        <div
          className="absolute right-3 top-3 z-20"
          onClick={(e) => e.preventDefault()}
        >
          <WishlistButton
            productId={prod.id}
            className={cn(
              GLASS,
              'flex h-9 w-9 items-center justify-center rounded-full text-zinc-900',
              'transition-transform duration-200 hover:scale-105 active:scale-95',
            )}
            preventNavigation={true}
          />
        </div>

        {/* Stock badge — frosted pill, top-left */}
        {(isLow || isOut) && (
          <Badge
            className={cn(
              GLASS,
              'absolute left-3 top-3 z-20 rounded-full px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]',
              isOut ? 'text-zinc-500' : 'text-zinc-900',
            )}
          >
            {isOut ? 'Sold out' : `Only ${prod.stockQuantity} left`}
          </Badge>
        )}

        {/* Image dots — frosted pill, top-center, reveal on hover */}
        {hasMultipleImages && (
          <div
            className={cn(
              GLASS,
              'absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-2.5 py-1.5',
              'opacity-0 transition-opacity duration-300 group-hover:opacity-100',
            )}
          >
            {prod.imageUrls.map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  idx === currentImageIndex
                    ? 'w-4 bg-zinc-900'
                    : 'w-1.5 bg-zinc-900/30',
                )}
              />
            ))}
          </div>
        )}

        {/* Prev / Next — frosted circles, reveal on hover */}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={(e) => step(e, -1)}
              className={cn(
                GLASS,
                'absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-zinc-900',
                'opacity-0 -translate-x-1 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100',
                'hover:scale-105 active:scale-95',
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={(e) => step(e, 1)}
              className={cn(
                GLASS,
                'absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-zinc-900',
                'opacity-0 translate-x-1 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100',
                'hover:scale-105 active:scale-95',
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Hover CTA — frosted bar slides up from the bottom */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 translate-y-3 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-y-0 group-hover:opacity-100">
          <div
            className={cn(
              GLASS,
              'flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-semibold tracking-wide text-zinc-900',
            )}
          >
            View details
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      {/* ── Meta ───────────────────────────────────────────────────── */}
      <div className="mt-3.5 flex flex-col gap-1 px-0.5">
        {prod.category && (
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
            {prod.category.name}
          </span>
        )}

        <h3 className="line-clamp-1 text-[14.5px] font-medium leading-snug text-zinc-900 transition-colors duration-200 group-hover:text-zinc-600">
          {prod.name}
        </h3>

        <div className="mt-0.5 flex items-center justify-between gap-2">
          {prod.avgRating && prod.avgRating > 0 ? (
            <span className="flex items-center gap-1">
              <span className="flex items-center gap-[1px]">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-3 w-3',
                      i < rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-zinc-200 text-zinc-200',
                    )}
                  />
                ))}
              </span>
              {prod.ratingCount ? (
                <span className="text-[11px] font-medium text-zinc-400">
                  ({prod.ratingCount})
                </span>
              ) : null}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-zinc-300">New</span>
          )}

          <span className="text-[15px] font-semibold tracking-tight text-zinc-900">
            {prod.currency} {prod.price.toFixed(2)}
          </span>
        </div>
      </div>
    </Link>
  )
}
