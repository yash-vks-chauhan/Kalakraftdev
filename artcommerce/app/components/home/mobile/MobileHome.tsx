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

  return (
    <div className="bg-background text-foreground">
      <HeroPour />

      {/*
        The hero used to stop at a hard white line, which left the pour — the
        one idea the whole brand is built on — sealed inside two boxes. This
        carries its warmth a short way past the edge and dissolves it, so the
        hero resolves into the page. It stops before the products: they should
        stay the loudest thing here.
      */}
      <div className="relative isolate">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-60 bg-[radial-gradient(125%_100%_at_50%_0%,rgba(194,112,58,0.17),rgba(125,47,63,0.07)_45%,transparent_72%)]"
        />
        <CategoryRail categories={categories} loading={loading} />
        <OccasionChips tags={tags} loading={loading} />
      </div>

      <BestSellersRail products={bestSellers} loading={loading} />
      <EditorialBand />
      <NewInGrid products={newIn} loading={loading} />
      <TrustStrip />
      <MobileFooter />
    </div>
  )
}
