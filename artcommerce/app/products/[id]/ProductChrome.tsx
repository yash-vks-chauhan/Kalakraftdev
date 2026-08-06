'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, Heart, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE } from './pdp-utils'
import { formatPrice } from '../../../lib/formatPrice'

export interface ChromeSection {
  id: string
  label: string
}

interface ProductChromeProps {
  name: string
  price: number
  currency: string
  thumbnail?: string
  sections: ChromeSection[]
  cartCount: number
  cartHref: string
  wishlistHref: string
  soldOut: boolean
  adding: boolean
  added: boolean
  onAdd: () => void
}

// One bar, two lives. At the top of the page it is the gallery's own
// letterhead; once the buy column scrolls away it becomes the acquisition
// bar — the piece, its price, the way in, and the page's table of contents —
// so nothing is ever more than one click away.
export default function ProductChrome({
  name,
  price,
  currency,
  thumbnail,
  sections,
  cartCount,
  cartHref,
  wishlistHref,
  soldOut,
  adding,
  added,
  onAdd,
}: ProductChromeProps) {
  const [compact, setCompact] = useState(false)
  const [active, setActive] = useState<string>('')

  // The hero's trailing sentinel decides which life the bar is living.
  useEffect(() => {
    const sentinel = document.getElementById('pdp-hero-end')
    if (!sentinel) return
    const io = new IntersectionObserver(
      ([entry]) => setCompact(entry.boundingClientRect.top < 64 && !entry.isIntersecting),
      { rootMargin: '-64px 0px 0px 0px', threshold: 0 },
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [])

  // Scrollspy: whichever section owns the upper third of the viewport wins.
  useEffect(() => {
    if (sections.length === 0) return
    const els = sections
      .map(s => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el))
    if (els.length === 0) return

    const io = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-22% 0px -68% 0px', threshold: 0 },
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [sections])

  const jump = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    setActive(id)
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const iconLink =
    'relative flex h-9 w-9 items-center justify-center rounded-full text-[#666] transition-colors hover:bg-[#f5f5f5] hover:text-[#1a1a1a]'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#ececec] bg-white">
      <div className="relative mx-auto flex h-16 max-w-[1240px] items-center px-6 lg:px-10">
        <AnimatePresence mode="wait" initial={false}>
          {compact ? (
            <motion.div
              key="acquire"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: EASE }}
              className="flex w-full items-center gap-6"
            >
              {/* The piece, still in view */}
              <div className="flex min-w-0 items-center gap-3">
                {thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbnail}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-md border border-[#ececec] bg-[#fafafa] object-contain p-0.5"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate font-serif text-[17px] font-medium leading-tight text-[#1a1a1a]">
                    {name}
                  </p>
                  <p className="text-[11px] font-medium tabular-nums tracking-[0.08em] text-[#999]">
                    {formatPrice(price, currency)}
                  </p>
                </div>
              </div>

              {/* Table of contents */}
              {sections.length > 0 && (
                <nav className="mx-auto hidden items-center gap-7 xl:flex">
                  {sections.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => jump(s.id)}
                      className={cn(
                        'relative py-1 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors',
                        active === s.id ? 'text-[#1a1a1a]' : 'text-[#999] hover:text-[#1a1a1a]',
                      )}
                    >
                      {s.label}
                      {active === s.id && (
                        <motion.span
                          layoutId="chrome-underline"
                          className="absolute -bottom-0.5 left-0 h-px w-full bg-[#d4a373]"
                          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                        />
                      )}
                    </button>
                  ))}
                </nav>
              )}

              <div className="ml-auto flex shrink-0 items-center gap-2 xl:ml-0">
                <button
                  type="button"
                  onClick={onAdd}
                  disabled={soldOut || adding}
                  className={cn(
                    'inline-flex h-10 items-center justify-center gap-2 rounded-full px-6 text-[13px] font-medium transition-colors',
                    soldOut
                      ? 'cursor-not-allowed bg-[#f0f0f0] text-[#999]'
                      : 'bg-[#1a1a1a] text-white hover:bg-[#000]',
                  )}
                >
                  {soldOut ? (
                    'Sold out'
                  ) : added ? (
                    <>
                      <Check className="h-4 w-4" /> Added
                    </>
                  ) : adding ? (
                    'Adding…'
                  ) : (
                    'Add to cart'
                  )}
                </button>
                <Link href={cartHref} aria-label="Cart" className={iconLink}>
                  <ShoppingCart className="h-[18px] w-[18px]" />
                  {cartCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1a1a1a] px-1 text-[9.5px] font-semibold leading-none text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="letterhead"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.24, ease: EASE }}
              className="flex w-full items-center justify-between gap-6"
            >
              <Link
                href="/products"
                className="group inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#999] transition-colors hover:text-[#1a1a1a]"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
                Collection
              </Link>

              <Link
                href="/"
                aria-label="Kalakraft home"
                className="absolute left-1/2 -translate-x-1/2 font-serif text-[22px] font-medium lowercase leading-none tracking-[0.01em] text-[#1a1a1a]"
              >
                kalakraft
              </Link>

              <div className="flex items-center gap-1">
                <Link href={wishlistHref} aria-label="Wishlist" className={iconLink}>
                  <Heart className="h-[18px] w-[18px]" />
                </Link>
                <Link href={cartHref} aria-label="Cart" className={iconLink}>
                  <ShoppingCart className="h-[18px] w-[18px]" />
                  {cartCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1a1a1a] px-1 text-[9.5px] font-semibold leading-none text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
