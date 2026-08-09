"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Fuse from "fuse.js"

import {
  parseSearchQuery,
  type SearchChip,
} from "../../../lib/parseSearchQuery"

export interface IndexedProduct {
  id: number
  name: string
  slug: string
  shortDesc?: string | null
  price: number
  currency?: string
  imageUrls?: string[] | string | null
  stockQuantity: number
  createdAt?: string
  usageTags?: string[] | string | null
  category?: { id: number; name: string; slug: string } | null
}

export interface SearchOutcome {
  results: IndexedProduct[]
  /** The chips still in force — may be fewer than parsed, if it had to retreat. */
  chips: SearchChip[]
  /** Free text that matched nothing and was set aside. */
  dropped: string | null
  /** Chips released, newest first, because together they matched nothing. */
  released: string[]
  rest: string
}

/** imageUrls is a Json column, so it arrives as an array or a JSON string. */
export function firstImage(product: IndexedProduct): string | undefined {
  const raw = product.imageUrls
  if (Array.isArray(raw)) return typeof raw[0] === "string" ? raw[0] : undefined
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && typeof parsed[0] === "string") return parsed[0]
    } catch {
      return raw || undefined
    }
  }
  return undefined
}

export function imageList(product: IndexedProduct): string[] {
  const raw = product.imageUrls
  if (Array.isArray(raw)) return raw.filter((u): u is string => typeof u === "string")
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter((u): u is string => typeof u === "string")
    } catch {
      return raw ? [raw] : []
    }
  }
  return []
}

export function tagsOf(product: IndexedProduct): string[] {
  const raw = product.usageTags
  if (Array.isArray(raw)) return raw.filter((t): t is string => typeof t === "string")
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter((t): t is string => typeof t === "string")
    } catch {
      return []
    }
  }
  return []
}

function applyChips(list: IndexedProduct[], chips: SearchChip[]): IndexedProduct[] {
  if (!chips.length) return list
  return list.filter((product) =>
    chips.every((chip) => {
      if (chip.kind === "category") {
        return product.category?.name?.toLowerCase() === chip.value.toLowerCase()
      }
      if (chip.kind === "mood") {
        return tagsOf(product).some((t) => t.toLowerCase() === chip.value.toLowerCase())
      }
      if (chip.kind === "price") {
        const min = chip.min ?? 0
        const max = chip.max ?? Infinity
        return product.price >= min && product.price <= max
      }
      return true
    })
  )
}

/**
 * Sold-out pieces stay in the results — for one-off art, "I want that one" is
 * worth a restock alert, and StockAlert already exists in the schema — but
 * they never lead. Newest first within stock, so the shop looks alive.
 */
function rank(list: IndexedProduct[]): IndexedProduct[] {
  return [...list].sort((a, b) => {
    const aOut = a.stockQuantity <= 0 ? 1 : 0
    const bOut = b.stockQuantity <= 0 ? 1 : 0
    if (aOut !== bOut) return aOut - bOut
    const at = a.createdAt ? Date.parse(a.createdAt) : 0
    const bt = b.createdAt ? Date.parse(b.createdAt) : 0
    return bt - at
  })
}

/**
 * One index for the whole storefront.
 *
 * Previously the desktop modal refetched from the server on a 500ms debounce
 * and fuzzed at threshold 0.4, while the mobile palette held the catalogue and
 * fuzzed at 0.3 with a 3-character minimum — so the same word returned
 * different pieces depending on the device. This is the only engine now.
 */
export function useProductIndex(enabled: boolean) {
  const [catalogue, setCatalogue] = useState<IndexedProduct[]>([])
  const [loading, setLoading] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!enabled || loadedRef.current) return
    loadedRef.current = true
    const controller = new AbortController()
    setLoading(true)

    fetch("/api/products?fields=search&limit=500", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => setCatalogue(Array.isArray(data.products) ? data.products : []))
      .catch(() => {
        // Aborted or offline. Let it retry on the next open rather than
        // wedging the panel on a stale empty index.
        loadedRef.current = false
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [enabled])

  const fuse = useMemo(
    () =>
      new Fuse(catalogue, {
        keys: [
          { name: "name", weight: 0.7 },
          { name: "shortDesc", weight: 0.2 },
          { name: "category.name", weight: 0.1 },
        ],
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 2,
        findAllMatches: false,
      }),
    [catalogue]
  )

  return { catalogue, fuse, loading }
}

/**
 * Runs a parsed query, retreating rather than returning nothing: free text is
 * given up first, then chips are released newest-first. A zero-result screen
 * in a shop is a lost sale.
 */
export function runSearch(
  catalogue: IndexedProduct[],
  fuse: Fuse<IndexedProduct>,
  raw: string
): SearchOutcome {
  const { chips, rest } = parseSearchQuery(raw)
  const empty: SearchOutcome = {
    results: [],
    chips,
    dropped: null,
    released: [],
    rest,
  }

  if (!catalogue.length) return empty

  const matchRest = (pool: IndexedProduct[]) => {
    if (!rest) return pool
    const ids = new Set(fuse.search(rest).map((hit) => hit.item.id))
    return pool.filter((p) => ids.has(p.id))
  }

  const scoped = applyChips(catalogue, chips)
  const hit = matchRest(scoped)
  if (hit.length) return { results: rank(hit), chips, dropped: null, released: [], rest }

  // Free text is the least reliable signal, so it goes first.
  if (rest && scoped.length) {
    return { results: rank(scoped), chips, dropped: rest, released: [], rest }
  }

  const kept = [...chips]
  const released: string[] = []
  while (kept.length && !applyChips(catalogue, kept).length) {
    const gone = kept.pop()
    if (gone) released.push(gone.value)
  }

  const widened = applyChips(catalogue, kept)
  const narrowed = matchRest(widened)
  const results = narrowed.length ? narrowed : widened

  return {
    results: rank(results),
    chips: kept,
    dropped: rest && !narrowed.length ? rest : null,
    released,
    rest,
  }
}
