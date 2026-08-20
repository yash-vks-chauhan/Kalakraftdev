'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DataCache } from '../../../lib/dataCache'
import { getImageSources } from '../../../lib/cloudinaryImages'
import CategoryImage from '../CategoryImage'
import SectionHeader from './SectionHeader'
import Reveal from './Reveal'

// How long each collection holds the frame before the index turns the page.
const CYCLE_MS = 5000

const EASE = [0.21, 0.47, 0.32, 0.98] as const

// Slugs are exact matches for product.category.slug — the same values the
// products page filters on ('tray' and 'Tray' are distinct DB categories).
const COLLECTIONS = [
  {
    name: 'Clocks',
    slug: 'clocks',
    stills: ['category1.png'],
    alt: 'Handcrafted resin clocks',
    line: 'Functional art that keeps time in colour.',
  },
  {
    name: 'Wall Decor',
    slug: 'decor',
    stills: [
      'https://ik.imagekit.io/4pjvf8k9u/Videos/imageclock.png?updatedAt=1754677566365',
      'imageclock.png',
    ],
    alt: 'Resin wall art pieces',
    line: 'Statement pieces for quiet walls.',
  },
  {
    name: 'Trays',
    slug: 'tray',
    stills: ['category4.png'],
    alt: 'Stylish resin serving trays',
    line: 'Serveware with a mirror-smooth finish.',
  },
  {
    name: 'Jewelry Trays',
    slug: 'Tray',
    stills: [
      'https://ik.imagekit.io/4pjvf8k9u/Videos/trayscollection.png?updatedAt=1754677551492',
      'trayscollection.png',
    ],
    alt: 'Elegant resin jewelry trays',
    line: 'A resting place for everyday treasures.',
  },
  {
    name: 'Pots & Vases',
    slug: 'pots',
    stills: [
      'https://ik.imagekit.io/4pjvf8k9u/Videos/vases.png?updatedAt=1754677551331',
      'vases.png',
    ],
    alt: 'Decorative resin vases',
    line: 'Sculptural homes for living things.',
  },
  {
    name: 'Rangoli',
    slug: 'rangoli',
    stills: ['category8.png'],
    alt: 'Traditional rangoli art',
    line: 'Tradition, poured in permanent colour.',
  },
]

/** Everywhere this collection's picture might be, best first. */
function stillsFor(collection: (typeof COLLECTIONS)[number]): string[] {
  return collection.stills.flatMap(getImageSources)
}

const FALLBACK_IMG = 'https://placehold.co/900x600/f0f0f0/999?text=Kalakraft'

interface SlugStats {
  count: number
  from: number
  /** A photo of something actually in this collection — see the note on
   *  CategoryImage for why the bundled still cannot be relied on alone. */
  image: string | null
}

/** imageUrls is a Json column, so it arrives as an array or as a string. */
function firstImage(value: unknown): string | null {
  let list: unknown = value
  if (typeof value === 'string') {
    try {
      list = JSON.parse(value)
    } catch {
      return null
    }
  }
  if (!Array.isArray(list)) return null
  for (const entry of list) {
    if (typeof entry === 'string' && entry.trim()) return entry
    if (entry && typeof entry === 'object' && typeof (entry as any).url === 'string') {
      return (entry as any).url
    }
  }
  return null
}

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)

// "Shop by category" as an exhibition directory: a typographic index on the
// left drives one large specimen frame on the right. Left idle, the index
// slowly turns its own pages; hover or focus takes over instantly.
export default function CollectionsIndex() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [stats, setStats] = useState<Map<string, SlugStats> | null>(null)

  const stageRef = useRef<HTMLDivElement>(null)
  const inView = useInView(stageRef, { margin: '-15% 0px' })
  const reducedMotion = useReducedMotion()

  const cycling = inView && !paused && !reducedMotion

  useEffect(() => {
    if (!cycling) return
    const t = setTimeout(() => setActive(i => (i + 1) % COLLECTIONS.length), CYCLE_MS)
    return () => clearTimeout(t)
  }, [active, cycling])

  // Live inventory for the directory: piece counts and starting prices from
  // the same catalogue cache the rest of the homepage reads.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const products = await DataCache.getProducts()
        if (cancelled || !Array.isArray(products)) return
        const map = new Map<string, SlugStats>()
        for (const p of products) {
          const slug = p?.category?.slug
          if (!slug || p?.isActive === false) continue
          const price = Number(p?.price)
          const image = firstImage(p?.imageUrls)
          const entry = map.get(slug)
          if (!entry) {
            map.set(slug, { count: 1, from: Number.isFinite(price) ? price : Infinity, image })
          } else {
            entry.count += 1
            if (Number.isFinite(price) && price < entry.from) entry.from = price
            if (!entry.image && image) entry.image = image
          }
        }
        if (!cancelled && map.size > 0) setStats(map)
      } catch {
        // Counts are garnish — the index works without them.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Warm the frame: fetch every collection's candidates up front so the first
  // full cycle crossfades instead of loading — and so that falling back to the
  // bundled still, where that happens, is not a second visible wait.
  useEffect(() => {
    for (const c of COLLECTIONS) {
      for (const src of [stats?.get(c.slug)?.image, stillsFor(c)[0]]) {
        if (!src) continue
        const img = new Image()
        img.src = src
      }
    }
  }, [stats])

  const current = COLLECTIONS[active]
  const currentStats = stats?.get(current.slug)

  return (
    <section id="collections" className="scroll-mt-16 bg-white">
      <div className="mx-auto max-w-7xl px-10 py-28 2xl:px-4">
        <Reveal>
          <SectionHeader
            eyebrow="Collections"
            title="Shop by category"
            sub="The index turns its own pages — rest on a name to hold it."
            action={{ href: '/products', label: 'View all products' }}
          />
        </Reveal>

        <Reveal delay={0.1}>
          <div
            ref={stageRef}
            className="mt-16 grid grid-cols-12 items-center gap-x-16"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            {/* The index */}
            <nav aria-label="Shop by category" className="col-span-5">
              <ul>
                {COLLECTIONS.map((c, i) => {
                  const isActive = i === active
                  const s = stats?.get(c.slug)
                  return (
                    <li key={c.slug} className="relative border-b border-[#ececec] first:border-t">
                      <Link
                        href={`/products?category=${encodeURIComponent(c.slug)}`}
                        aria-current={isActive ? 'true' : undefined}
                        onMouseEnter={() => setActive(i)}
                        onFocus={() => setActive(i)}
                        className="group flex items-baseline gap-5 py-[25px] pl-6 pr-2 outline-none"
                      >
                        <span
                          className={cn(
                            'text-[11px] font-medium tabular-nums tracking-[0.15em] transition-colors duration-300',
                            isActive ? 'text-[#b8845a]' : 'text-[#b9b9b9]',
                          )}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span
                          className={cn(
                            'font-serif text-3xl font-medium leading-none transition-all duration-300',
                            isActive
                              ? 'translate-x-1.5 text-[#1a1a1a]'
                              : 'text-[#9e9e9e] group-hover:text-[#1a1a1a]',
                          )}
                        >
                          {c.name}
                        </span>
                        <span className="ml-auto flex items-center gap-3">
                          {s && (
                            <span
                              className={cn(
                                'text-xs tabular-nums transition-colors duration-300',
                                isActive ? 'text-[#666]' : 'text-[#b9b9b9]',
                              )}
                            >
                              {s.count} {s.count === 1 ? 'piece' : 'pieces'}
                            </span>
                          )}
                          <ArrowRight
                            className={cn(
                              'h-4 w-4 transition-all duration-300',
                              isActive
                                ? 'translate-x-0 text-[#1a1a1a] opacity-100'
                                : '-translate-x-1 text-[#999] opacity-0',
                            )}
                          />
                        </span>
                      </Link>

                      {/* Copper marker glides between rows */}
                      {isActive && (
                        <motion.span
                          layoutId="collections-marker"
                          aria-hidden="true"
                          className="absolute left-0 w-[2px] bg-[#d4a373]"
                          style={{ top: 'calc(50% - 14px)', height: 28 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                        />
                      )}

                      {/* Cycle progress: a copper hairline filling the row's rule */}
                      <AnimatePresence>
                        {isActive && cycling && (
                          <motion.span
                            key={active}
                            aria-hidden="true"
                            className="absolute -bottom-px left-0 h-px w-full origin-left bg-[#d4a373]"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.3 } }}
                            transition={{ duration: CYCLE_MS / 1000, ease: 'linear' }}
                          />
                        )}
                      </AnimatePresence>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* The specimen frame */}
            <div className="col-span-7">
              <div className="rounded-2xl border border-[#e5e5e5] bg-white p-4">
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-[#f5f5f5]">
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={current.slug}
                      initial={{
                        opacity: 0,
                        scale: reducedMotion ? 1 : 1.045,
                        filter: 'grayscale(0.9)',
                      }}
                      animate={{ opacity: 1, scale: 1, filter: 'grayscale(0)' }}
                      // The outgoing image holds still beneath while the
                      // newcomer develops over it, then unmounts.
                      exit={{ opacity: 1, transition: { duration: 0.8 } }}
                      transition={{ duration: 0.8, ease: EASE }}
                      className="absolute inset-0"
                    >
                      <CategoryImage
                        sources={[currentStats?.image, ...stillsFor(current), FALLBACK_IMG]}
                        alt={current.alt}
                        className="h-full w-full object-cover"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Museum placard */}
                <motion.div
                  key={current.slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="flex items-end justify-between gap-8 px-2 pb-2 pt-6"
                >
                  <div>
                    <h3 className="font-serif text-2xl font-medium leading-none text-[#1a1a1a]">
                      {current.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#666]">{current.line}</p>
                    {currentStats && Number.isFinite(currentStats.from) && (
                      <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#999]">
                        From {formatINR(currentStats.from)}
                      </p>
                    )}
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="shrink-0 border-[#e5e5e5] text-[#1a1a1a] hover:bg-[#fafafa] hover:text-[#1a1a1a]"
                  >
                    <Link href={`/products?category=${encodeURIComponent(current.slug)}`}>
                      Browse {current.name}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
