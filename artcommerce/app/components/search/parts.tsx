"use client"

import { useCallback, useEffect, useState } from "react"
import { Clock, X } from "lucide-react"

import { cn } from "@/lib/utils"
import type { SearchChip } from "../../../lib/parseSearchQuery"

/* ------------------------------------------------------------------ */
/* Shared vocabulary                                                   */
/* ------------------------------------------------------------------ */

/**
 * Matches PRICE_BANDS on the catalogue page, so a band picked in search and a
 * band picked in the filter drawer mean the same thing. The `phrase` is what
 * gets appended to the field — tapping a chip and typing produce identical
 * state, which is why there is only one code path to reason about.
 */
export const PRICE_BANDS = [
  { key: "under2000", label: "Under ₹2,000", phrase: "under 2000" },
  { key: "2000to5000", label: "₹2,000 – ₹5,000", phrase: "2000 to 5000" },
  { key: "over5000", label: "Over ₹5,000", phrase: "over 5000" },
] as const

const RECENTS_KEY = "recentSearches"
const MAX_RECENTS = 5

export interface SearchCategory {
  id: number
  name: string
  slug: string
  image: string | null
}

/** Categories and mood tags, both fetched once when the panel first opens. */
export function useSearchFacets(enabled: boolean) {
  const [categories, setCategories] = useState<SearchCategory[]>([])
  const [moods, setMoods] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!enabled || loaded) return
    const controller = new AbortController()
    const opts = { signal: controller.signal }

    Promise.all([
      fetch("/api/categories", opts)
        .then((r) => (r.ok ? r.json() : { categories: [] }))
        .catch(() => ({ categories: [] })),
      fetch("/api/products/usage-tags", opts)
        .then((r) => (r.ok ? r.json() : { tags: [] }))
        .catch(() => ({ tags: [] })),
    ]).then(([cat, tag]) => {
      if (controller.signal.aborted) return
      setCategories(Array.isArray(cat.categories) ? cat.categories : [])
      setMoods(Array.isArray(tag.tags) ? tag.tags : [])
      setLoaded(true)
    })

    return () => controller.abort()
  }, [enabled, loaded])

  return { categories, moods }
}

/** The `recentSearches` key the old desktop modal already wrote to. */
export function useRecentSearches() {
  const [recents, setRecents] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENTS_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) {
        setRecents(parsed.filter((s): s is string => typeof s === "string"))
      }
    } catch {}
  }, [])

  const remember = useCallback((term: string) => {
    const value = term.trim()
    if (!value) return
    setRecents((prev) => {
      const next = [value, ...prev.filter((s) => s.toLowerCase() !== value.toLowerCase())]
        .slice(0, MAX_RECENTS)
      try {
        window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  return { recents, remember }
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

/**
 * What the search understood, as removable chips.
 *
 * A chip shows its working when the word typed differs from the label —
 * "ghadi → Clocks". That single arrow is the whole argument for the parser:
 * it teaches the vocabulary and proves the field is listening.
 */
export function ChipRow({
  chips,
  onRemove,
  className,
}: {
  chips: SearchChip[]
  onRemove: (chip: SearchChip) => void
  className?: string
}) {
  if (!chips.length) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 px-3.5 pb-2.5", className)}>
      <span className="mr-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Read
      </span>
      {chips.map((chip) => (
        <span
          key={`${chip.kind}:${chip.value}`}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-lg border bg-secondary pl-2.5 pr-1",
            "text-xs font-semibold tracking-tight text-foreground"
          )}
        >
          {chip.source && (
            <>
              <em className="font-mono text-[11px] font-normal not-italic text-muted-foreground">
                {chip.source}
              </em>
              <span aria-hidden className="text-amber-600">
                →
              </span>
            </>
          )}
          {chip.value}
          <button
            type="button"
            onClick={() => onRemove(chip)}
            aria-label={`Remove ${chip.value}`}
            className={cn(
              "grid h-[18px] w-[18px] place-items-center rounded text-muted-foreground",
              "transition-colors hover:bg-foreground/10 hover:text-foreground"
            )}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  )
}

/**
 * Says what the search gave up on, rather than silently returning nothing.
 * A dead end in a shop is a lost sale.
 */
export function RetreatNotice({
  dropped,
  released,
  onReset,
}: {
  dropped: string | null
  released: string[]
  onReset: () => void
}) {
  if (!dropped && !released.length) return null

  return (
    <p
      role="status"
      className={cn(
        "flex items-center gap-2 border-b bg-amber-50 px-3.5 py-2 text-xs text-foreground",
        "dark:bg-amber-950/30"
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
      {released.length ? (
        <>
          Nothing matched with <b className="font-semibold">{released.join(" + ")}</b> —
          showing without {released.length > 1 ? "them" : "it"}.
        </>
      ) : (
        <>
          No pieces are tagged <b className="font-semibold">“{dropped}”</b> — ignoring it for
          now.
        </>
      )}
      <button
        type="button"
        onClick={onReset}
        className="ml-auto shrink-0 rounded px-1.5 py-0.5 font-semibold text-amber-700 transition-colors hover:bg-amber-600/10"
      >
        Start over
      </button>
    </p>
  )
}

export function BlockLabel({
  children,
  aside,
}: {
  children: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <p className="flex items-baseline justify-between gap-2 px-0.5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      <span>{children}</span>
      {aside && <span className="text-[11px] font-normal normal-case tracking-normal">{aside}</span>}
    </p>
  )
}

/** Category cards with the thumbnail /api/categories borrows from each. */
export function CategoryRail({
  categories,
  onPick,
}: {
  categories: SearchCategory[]
  onPick: (name: string) => void
}) {
  if (!categories.length) return null

  return (
    <div className="-mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onPick(category.name)}
          className="group w-[88px] shrink-0 text-left"
        >
          <span
            className={cn(
              "block h-[66px] w-[88px] overflow-hidden rounded-lg border bg-secondary",
              "transition-[transform,box-shadow] duration-200 ease-out",
              "group-hover:-translate-y-0.5 group-hover:shadow-md motion-reduce:transition-none"
            )}
          >
            {category.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={category.image}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : null}
          </span>
          <span className="mt-1.5 block truncate text-xs font-medium tracking-tight text-foreground">
            {category.name}
          </span>
        </button>
      ))}
    </div>
  )
}

export function TermChip({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode
  onClick: () => void
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full border bg-background px-3",
        "text-xs font-medium tracking-tight text-foreground",
        "transition-colors hover:bg-secondary"
      )}
    >
      {icon}
      {children}
    </button>
  )
}

export function RecentChips({
  recents,
  onPick,
}: {
  recents: string[]
  onPick: (term: string) => void
}) {
  if (!recents.length) return null
  return (
    <div className="flex flex-wrap gap-1.5 px-0.5">
      {recents.map((term) => (
        <TermChip key={term} onClick={() => onPick(term)} icon={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}>
          <span className="text-muted-foreground">{term}</span>
        </TermChip>
      ))}
    </div>
  )
}

export function formatPrice(value: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `₹${Math.round(value).toLocaleString("en-IN")}`
  }
}

/** Highlights the matched run, in the app's amber rather than browser yellow. */
export function Highlighted({ text, term }: { text: string; term: string }) {
  const needle = term.trim().split(/\s+/)[0]
  if (!needle) return <>{text}</>
  const at = text.toLowerCase().indexOf(needle.toLowerCase())
  if (at === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-[2px] bg-amber-600 px-0.5 text-background">
        {text.slice(at, at + needle.length)}
      </mark>
      {text.slice(at + needle.length)}
    </>
  )
}

export function StockFlag({ stock }: { stock: number }) {
  if (stock <= 0) {
    return <span className="text-[10px] font-bold uppercase tracking-wide text-destructive">Sold out</span>
  }
  if (stock <= 3) {
    return <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600">{stock} left</span>
  }
  return null
}
