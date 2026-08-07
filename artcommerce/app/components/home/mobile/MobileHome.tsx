"use client"

import { useEffect, useState } from "react"

import { CategoryRail, type HomeCategory } from "./CategoryRail"
import { EditorialBand } from "./EditorialBand"
import { HeroPour } from "./HeroPour"
import { MobileFooter } from "./MobileFooter"
import { OccasionChips } from "./OccasionChips"
import { BestSellersRail, NewInGrid } from "./ProductSections"
import { TrustStrip } from "./TrustStrip"
import type { MobileProduct } from "./types"

/**
 * The mobile homepage.
 *
 * Replaces the branch in app/page.tsx that the file itself labelled
 * "unchanged legacy sections": a serif hero, nine hardcoded categories, a grid
 * shuffled with Math.random on every mount, then four carousels of the same
 * shape and a video.
 *
 * Everything here comes from endpoints that already existed. Nothing is
 * shuffled — best sellers are ranked by sales and new arrivals by date, so a
 * piece someone half-remembers is still where they left it.
 */
export default function MobileHome() {
  const [categories, setCategories] = useState<HomeCategory[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [bestSellers, setBestSellers] = useState<MobileProduct[]>([])
  const [newIn, setNewIn] = useState<MobileProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const settle = <T,>(promise: Promise<Response>, pick: (data: any) => T, fallback: T) =>
        promise
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
          .then(pick)
          .catch(() => fallback)

      const [cats, usageTags, best, latest] = await Promise.all([
        settle<HomeCategory[]>(fetch("/api/categories"), (d) => d.categories ?? [], []),
        settle<string[]>(fetch("/api/products/usage-tags"), (d) => d.tags ?? [], []),
        settle<MobileProduct[]>(
          fetch("/api/products/best-sellers?limit=6"),
          (d) => d.products ?? [],
          []
        ),
        // The products route has no limit param, so the slice happens here.
        settle<MobileProduct[]>(
          fetch("/api/products?inStock=true"),
          (d) => (d.products ?? []).slice(0, 4),
          []
        ),
      ])

      if (cancelled) return
      setCategories(cats)
      setTags(usageTags)
      setBestSellers(best)
      setNewIn(latest)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // The section numbers are part of the design, so they have to count what
  // actually renders. Each section hides itself when it has nothing to show —
  // no usage tags on any product, say — and hardcoded numbers left a hole
  // like 01, 03, 04. This walks them in render order instead.
  let counted = 0
  const step = (shown: boolean) =>
    shown ? String(++counted).padStart(2, "0") : ""

  const categoryIndex = step(loading || categories.length > 0)
  const occasionIndex = step(loading || tags.length > 0)
  const bestIndex = step(loading || bestSellers.length > 0)
  const newIndex = step(loading || newIn.length > 0)

  return (
    <div className="bg-background text-foreground">
      <HeroPour />

      <CategoryRail categories={categories} loading={loading} index={categoryIndex} />
      <OccasionChips tags={tags} loading={loading} index={occasionIndex} />
      <BestSellersRail products={bestSellers} loading={loading} index={bestIndex} />
      <EditorialBand />
      <NewInGrid products={newIn} loading={loading} index={newIndex} />
      <TrustStrip />
      <MobileFooter />
    </div>
  )
}
