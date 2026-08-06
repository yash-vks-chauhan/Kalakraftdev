"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Fuse from "fuse.js"

export interface SearchProduct {
  id: number
  name: string
  slug: string
  price: number
  currency?: string
  imageUrls?: string[] | string
  shortDesc?: string
  stockQuantity?: number
  category?: { id: number; name: string; slug: string } | null
}

/**
 * Product search for the unified command palette.
 *
 * The catalogue is fetched once and matched client-side with Fuse, mirroring
 * what SearchModal already does — a store's search has to return products, and
 * before this the dashboard's palette could only find pages.
 */
export function useProductSearch(query: string, enabled: boolean) {
  const [catalogue, setCatalogue] = useState<SearchProduct[]>([])
  const [loading, setLoading] = useState(false)
  const loadedRef = useRef(false)

  // Load lazily: nobody pays for this until the palette is first opened.
  useEffect(() => {
    if (!enabled || loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    fetch("/api/products?limit=200")
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data) => setCatalogue(data.products ?? []))
      .catch(() => setCatalogue([]))
      .finally(() => setLoading(false))
  }, [enabled])

  const fuse = useMemo(
    () =>
      new Fuse(catalogue, {
        keys: [
          { name: "name", weight: 0.7 },
          { name: "shortDesc", weight: 0.2 },
          { name: "category.name", weight: 0.1 },
        ],
        // 0.38 with ignoreLocation matched almost the whole catalogue —
        // searching "resin" returned "Midnight Marble Coasters". Tighter
        // threshold plus a required match length keeps results honest.
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 3,
        findAllMatches: false,
      }),
    [catalogue]
  )

  const results = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    return fuse.search(q, { limit: 6 }).map((r) => r.item)
  }, [fuse, query])

  return { results, loading, catalogueSize: catalogue.length }
}

export function firstImage(p: SearchProduct): string | undefined {
  const raw = p.imageUrls
  if (Array.isArray(raw)) return raw[0]
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed[0]
    } catch {
      return raw || undefined
    }
  }
  return undefined
}
