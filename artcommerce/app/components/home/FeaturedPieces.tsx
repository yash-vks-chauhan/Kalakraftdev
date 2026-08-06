'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { DataCache } from '../../../lib/dataCache'
import ProductCardPro from '../../products/ProductCardPro'
import SectionHeader from './SectionHeader'
import Reveal from './Reveal'

const MAX_PIECES = 8

interface Product {
  id: number
  name: string
  slug: string
  shortDesc: string
  price: number
  currency: string
  imageUrls: string[]
  stockQuantity: number
  isActive?: boolean
  createdAt?: string
  category: { id: number; name: string; slug: string } | null
  avgRating?: number
  ratingCount?: number
}

function normalise(raw: any): Product {
  let imageUrls: string[] = []
  try {
    imageUrls = Array.isArray(raw.imageUrls) ? raw.imageUrls : JSON.parse(raw.imageUrls || '[]')
  } catch {
    imageUrls = []
  }
  return { ...raw, imageUrls }
}

export default function FeaturedPieces() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const cached = await DataCache.getProducts()
        if (cancelled) return
        if (Array.isArray(cached)) {
          const items = cached
            .map(normalise)
            .filter(p => p.isActive && p.imageUrls.length > 0)
            // Deterministic order: newest first — the section is stable
            // between visits instead of reshuffling on every render.
            .sort((a, b) => {
              const ta = a.createdAt ? Date.parse(a.createdAt) : 0
              const tb = b.createdAt ? Date.parse(b.createdAt) : 0
              return tb - ta || b.id - a.id
            })
          setProducts(items)
        }
      } catch {
        // fall through to the empty state
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Tabs come from the data itself: the four most common categories.
  const tabs = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of products) {
      if (p.category?.name) counts.set(p.category.name, (counts.get(p.category.name) ?? 0) + 1)
    }
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => name)
    return ['All', ...top]
  }, [products])

  const visible = useMemo(() => {
    const pool =
      activeTab === 'All' ? products : products.filter(p => p.category?.name === activeTab)
    return pool.slice(0, MAX_PIECES)
  }, [products, activeTab])

  return (
    <section className="border-t border-[#ececec] bg-[#fafafa]">
      <div className="mx-auto max-w-7xl px-10 py-28 2xl:px-4">
        <Reveal>
          <SectionHeader
            eyebrow="The pieces"
            title="Featured work"
            sub="A rotating edit of what is fresh out of the studio — poured, cured, and finished by hand."
            action={{ href: '/products', label: 'Browse everything' }}
          />
        </Reveal>

        {/* Category tabs */}
        {!loading && products.length > 0 && tabs.length > 2 && (
          <Reveal delay={0.1}>
            <div className="mt-10 inline-flex items-center gap-1 rounded-full border border-[#e5e5e5] bg-white p-1">
              {tabs.map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors duration-200',
                    activeTab === tab
                      ? 'bg-[#1a1a1a] text-white'
                      : 'text-[#666] hover:text-[#1a1a1a]',
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </Reveal>
        )}

        <div className="mt-12">
          {loading ? (
            <div className="grid grid-cols-4 gap-x-6 gap-y-12">
              {Array.from({ length: MAX_PIECES }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="aspect-[4/5] w-full rounded-xl bg-[#ececec]" />
                  <Skeleton className="h-4 w-2/3 bg-[#ececec]" />
                  <Skeleton className="h-4 w-1/3 bg-[#ececec]" />
                </div>
              ))}
            </div>
          ) : visible.length > 0 ? (
            <div className="grid grid-cols-4 gap-x-6 gap-y-12">
              {visible.map((product, index) => (
                <ProductCardPro key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#ddd] bg-white py-20 text-center">
              <p className="font-serif text-2xl text-[#1a1a1a]">The studio shelf is being restocked</p>
              <p className="max-w-sm text-sm text-[#666]">
                New pieces are on their way. Browse the full catalogue in the meantime.
              </p>
              <Button asChild className="mt-2 bg-[#1a1a1a] text-white hover:bg-[#333]">
                <Link href="/products">Browse all products</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
