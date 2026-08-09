"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, ChevronLeft, PackageX, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  parseSearchQuery,
  removeChipFromQuery,
  searchHref,
  type SearchChip,
} from "../../../lib/parseSearchQuery"
import {
  firstImage,
  imageList,
  runSearch,
  tagsOf,
  useProductIndex,
  type IndexedProduct,
} from "./useProductIndex"
import {
  BlockLabel,
  CategoryRail,
  ChipRow,
  Highlighted,
  PRICE_BANDS,
  RecentChips,
  RetreatNotice,
  StockFlag,
  TermChip,
  formatPrice,
  useRecentSearches,
  useSearchFacets,
} from "./parts"

export interface ProductSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** SSR-safe, and correct on the very first paint rather than after an effect. */
function useIsDesktop() {
  const query = "(min-width: 768px)"
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setIsDesktop(mql.matches)
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isDesktop
}

/**
 * The storefront's search.
 *
 * One parser, one index and one set of results, in two layouts: a mouse hovers
 * and a keyboard arrows, so desktop gets a live preview pane; a thumb scans
 * and taps, so mobile gets a full-height card grid. Everything it understands
 * maps onto parameters /products already accepts, so "see all" continues the
 * search instead of starting it again.
 */
export function ProductSearch({ open, onOpenChange }: ProductSearchProps) {
  const router = useRouter()
  const isDesktop = useIsDesktop()

  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const [debounced, setDebounced] = useState("")

  const { catalogue, fuse, loading } = useProductIndex(open)
  const { categories, moods } = useSearchFacets(open)
  const { recents, remember } = useRecentSearches()

  // 120ms over an in-memory index, not 500ms over the network.
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query), 120)
    return () => window.clearTimeout(id)
  }, [query])

  useEffect(() => {
    if (!open) {
      setQuery("")
      setDebounced("")
      setActive(0)
    }
  }, [open])

  const outcome = useMemo(
    () => runSearch(catalogue, fuse, debounced),
    [catalogue, fuse, debounced]
  )

  const typing = debounced.trim().length > 0
  const results = outcome.results
  const shown = typing ? results : []
  const selected = shown[Math.min(active, Math.max(shown.length - 1, 0))]
  // At rest the pane is labelled "in the studio this week", so it has to be
  // the newest piece, not whatever happens to rank first.
  const featured = catalogue[0]
  const preview = typing ? selected : featured

  useEffect(() => {
    setActive(0)
  }, [debounced])

  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  const go = useCallback(
    (href: string) => {
      onOpenChange(false)
      router.push(href)
    },
    [onOpenChange, router]
  )

  /** Chips and free text append to the field, so both paths produce one state. */
  const appendTerm = useCallback((term: string) => {
    setQuery((prev) => `${prev.trim()} ${term}`.trim())
  }, [])

  const dropChip = useCallback((chip: SearchChip) => {
    setQuery((prev) => removeChipFromQuery(prev, chip))
  }, [])

  const seeAll = useCallback(() => {
    const { chips, rest } = parseSearchQuery(debounced)
    const href = searchHref(chips, outcome.dropped ? "" : rest)
    if (debounced.trim()) remember(debounced.trim())
    go(href)
  }, [debounced, outcome.dropped, remember, go])

  const openPiece = useCallback(
    (product: IndexedProduct) => {
      if (debounced.trim()) remember(debounced.trim())
      go(`/products/${product.id}`)
    },
    [debounced, remember, go]
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault()
        setActive((i) => Math.min(i + 1, Math.max(shown.length - 1, 0)))
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
      } else if (event.key === "Enter") {
        event.preventDefault()
        if (selected) openPiece(selected)
        else seeAll()
      }
      /*
       * No backspace-drops-the-last-chip here, though the design called for
       * it. Chips are a *reading* of the field, not tokens beside it — which
       * is what makes tapping "Gifting" and typing "gift" produce identical
       * state — so an empty field can never have chips for backspace to drop.
       * Deleting the words is the removal gesture, and each chip has an ×.
       */
    },
    [shown.length, selected, openPiece, seeAll]
  )

  const shared = {
    query,
    setQuery,
    outcome,
    typing,
    shown,
    preview,
    active,
    setActive,
    loading,
    categories,
    moods,
    recents,
    appendTerm,
    dropChip,
    seeAll,
    openPiece,
    onKeyDown,
    close,
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showClose={false}
          className="dashboard-shell flex h-[580px] max-h-[86vh] w-[calc(100vw-2rem)] max-w-[720px] flex-col overflow-hidden p-0"
          onOpenAutoFocus={(event) => {
            // Focus the field, not the dialog, so you can type immediately.
            event.preventDefault()
            const root = event.currentTarget as HTMLElement | null
            root?.querySelector<HTMLInputElement>("input")?.focus()
          }}
        >
          <DialogTitle className="sr-only">Search pieces</DialogTitle>
          <DialogDescription className="sr-only">
            Search the catalogue by name, category, mood, language or price.
          </DialogDescription>
          <DesktopLayout {...shared} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="dashboard-shell flex h-[94vh] max-h-[94vh] flex-col gap-0 p-0">
        <DrawerTitle className="sr-only">Search pieces</DrawerTitle>
        <DrawerDescription className="sr-only">
          Search the catalogue by name, category, mood, language or price.
        </DrawerDescription>
        <MobileLayoutInner {...shared} />
      </DrawerContent>
    </Drawer>
  )
}

/* ------------------------------------------------------------------ */
/* Shared field                                                        */
/* ------------------------------------------------------------------ */

interface LayoutProps {
  query: string
  setQuery: (value: string) => void
  outcome: ReturnType<typeof runSearch>
  typing: boolean
  shown: IndexedProduct[]
  preview?: IndexedProduct
  active: number
  setActive: (index: number) => void
  loading: boolean
  categories: ReturnType<typeof useSearchFacets>["categories"]
  moods: string[]
  recents: string[]
  appendTerm: (term: string) => void
  dropChip: (chip: SearchChip) => void
  seeAll: () => void
  openPiece: (product: IndexedProduct) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  close: () => void
}

function SearchField({
  query,
  setQuery,
  onKeyDown,
  leading,
  trailing,
  placeholder,
  autoFocus,
}: {
  query: string
  setQuery: (value: string) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  leading: React.ReactNode
  trailing?: React.ReactNode
  placeholder: string
  autoFocus?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-3">
      {leading}
      <input
        type="text"
        value={query}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label="Search pieces"
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "h-7 min-w-0 flex-1 border-0 bg-transparent p-0 text-base tracking-tight text-foreground",
          "outline-none placeholder:text-muted-foreground"
        )}
      />
      {trailing}
    </div>
  )
}

function SeeAllBar({
  typing,
  count,
  onSeeAll,
  children,
}: {
  typing: boolean
  count: number
  onSeeAll: () => void
  children?: React.ReactNode
}) {
  return (
    <div className="shrink-0 border-t bg-background">
      <button
        type="button"
        onClick={onSeeAll}
        className={cn(
          "flex min-h-[46px] w-full items-center gap-2.5 px-3.5 text-left",
          "text-sm font-semibold tracking-tight text-foreground transition-colors hover:bg-secondary"
        )}
      >
        {typing ? `See all ${count} piece${count === 1 ? "" : "s"}` : "Browse the full catalogue"}
        <ArrowRight className="h-4 w-4" />
      </button>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Desktop — list and preview                                          */
/* ------------------------------------------------------------------ */

function DesktopLayout(props: LayoutProps) {
  const {
    query, setQuery, outcome, typing, shown, preview, active, setActive,
    loading, categories, moods, recents, appendTerm, dropChip, seeAll,
    openPiece, onKeyDown, close,
  } = props

  const listRef = useRef<HTMLDivElement>(null)

  // Keep the arrowed row in view without yanking the whole dialog.
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    node?.scrollIntoView({ block: "nearest" })
  }, [active])

  return (
    <>
      <div className="shrink-0 border-b">
        <SearchField
          query={query}
          setQuery={setQuery}
          onKeyDown={onKeyDown}
          placeholder="Search pieces — or try “gift under ₹2,000”"
          leading={<Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />}
          trailing={
            <button
              type="button"
              onClick={close}
              className="shrink-0 rounded-md border px-2 py-1 font-mono text-[10px] tracking-wide text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              ESC
            </button>
          }
        />
        <ChipRow chips={outcome.chips} onRemove={dropChip} />
      </div>

      <RetreatNotice
        dropped={outcome.dropped}
        released={outcome.released}
        onReset={() => setQuery("")}
      />

      <div className="flex min-h-0 flex-1">
        <div ref={listRef} className="w-[298px] shrink-0 overflow-y-auto border-r p-1.5">
          {typing ? (
            <>
              <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {loading ? "Searching…" : `${shown.length} piece${shown.length === 1 ? "" : "s"}`}
              </p>
              {shown.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  data-index={index}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => openPiece(product)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                    index === active ? "bg-secondary" : "hover:bg-secondary/60"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "w-1 self-stretch rounded-full bg-foreground transition-opacity",
                      index === active ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium tracking-tight text-foreground">
                      <Highlighted text={product.name} term={outcome.rest} />
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                      {product.category?.name ?? "Piece"}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold tabular-nums tracking-tight">
                    {formatPrice(product.price, product.currency)}
                  </span>
                </button>
              ))}
            </>
          ) : (
            <div className="flex flex-col gap-4 px-2 pb-2 pt-3">
              {recents.length > 0 && (
                <div>
                  <BlockLabel>Recent</BlockLabel>
                  <RecentChips recents={recents} onPick={setQuery} />
                </div>
              )}
              <div>
                <BlockLabel>Browse by category</BlockLabel>
                <CategoryRail categories={categories} onPick={appendTerm} />
              </div>
              {moods.length > 0 && (
                <div>
                  <BlockLabel>Shop by mood</BlockLabel>
                  <div className="flex flex-wrap gap-1.5 px-0.5">
                    {moods.slice(0, 8).map((mood) => (
                      <TermChip key={mood} onClick={() => appendTerm(mood)}>
                        {mood}
                      </TermChip>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <BlockLabel>Price</BlockLabel>
                <div className="flex flex-wrap gap-1.5 px-0.5">
                  {PRICE_BANDS.map((band) => (
                    <TermChip key={band.key} onClick={() => appendTerm(band.phrase)}>
                      {band.label}
                    </TermChip>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto bg-muted/30">
          {preview ? (
            <PreviewPane
              key={preview.id}
              product={preview}
              heading={typing ? null : "In the studio this week"}
              onOpen={() => openPiece(preview)}
              onMood={appendTerm}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-xs text-muted-foreground">
              {loading ? "Loading the catalogue…" : "Nothing to preview yet."}
            </div>
          )}
        </div>
      </div>

      <SeeAllBar typing={typing} count={shown.length} onSeeAll={seeAll}>
        <div className="flex items-center gap-3.5 border-t px-3.5 py-1.5 text-[10.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> move
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>↵</Kbd> open
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>esc</Kbd> close
          </span>
          <span className="ml-auto inline-flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd> anywhere
          </span>
        </div>
      </SeeAllBar>
    </>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid h-[17px] min-w-[17px] place-items-center rounded border border-b-2 bg-secondary px-1 font-mono text-[9.5px] text-foreground">
      {children}
    </kbd>
  )
}

function PreviewPane({
  product,
  heading,
  onOpen,
  onMood,
}: {
  product: IndexedProduct
  heading: string | null
  onOpen: () => void
  onMood: (mood: string) => void
}) {
  const images = imageList(product).slice(0, 3)
  const hero = images[0] ?? firstImage(product)
  const tags = tagsOf(product).slice(0, 3)

  return (
    <div className="kk-fade p-4">
      {heading && <BlockLabel>{heading}</BlockLabel>}

      {/* Fixed height, not aspect-ratio: the pane has a budget, and the name,
          price and button have to stay above the fold. */}
      <div className="relative h-[158px] w-full overflow-hidden rounded-xl border bg-secondary">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <PackageX className="h-5 w-5" />
          </div>
        )}
        {product.stockQuantity <= 3 && (
          <span className="absolute left-2 top-2 rounded-full bg-background/95 px-2 py-0.5">
            <StockFlag stock={product.stockQuantity} />
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-2 flex gap-1.5">
          {images.map((src, i) => (
            <span
              key={src + i}
              className={cn(
                "block h-[34px] w-[42px] overflow-hidden rounded-md border",
                i === 0 && "ring-[1.5px] ring-foreground"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="min-w-0 text-[17px] font-semibold leading-tight tracking-tight text-foreground">
          {product.name}
        </h3>
        <span className="shrink-0 text-[19px] font-semibold tabular-nums tracking-tight">
          {formatPrice(product.price, product.currency)}
        </span>
      </div>

      <p className="mt-1.5 truncate text-[11.5px] text-muted-foreground">
        {[product.category?.name, product.shortDesc].filter(Boolean).join(" · ")}
      </p>

      {tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onMood(tag)}
              className="rounded-full border bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "mt-3 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg",
          "bg-primary text-sm font-semibold tracking-tight text-primary-foreground",
          "transition-colors hover:bg-primary/90"
        )}
      >
        View piece
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Mobile — full height, two up                                        */
/* ------------------------------------------------------------------ */

function MobileLayoutInner(props: LayoutProps) {
  const {
    query, setQuery, outcome, typing, shown, loading, categories, moods,
    recents, appendTerm, dropChip, seeAll, openPiece, onKeyDown, close,
  } = props

  const newest = props.preview ? [props.preview] : []
  const restingPieces = typing ? [] : shown.length ? shown : newest

  return (
    <>
      <div className="shrink-0 border-b">
        <div className="pt-safe" />
        <SearchField
          query={query}
          setQuery={setQuery}
          onKeyDown={onKeyDown}
          autoFocus
          placeholder="Search pieces, or say it your way"
          leading={
            <button
              type="button"
              onClick={close}
              aria-label="Close search"
              className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-foreground transition-colors active:bg-secondary"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          }
          trailing={
            query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="shrink-0 rounded-md border px-2 py-1 font-mono text-[10px] tracking-wide text-muted-foreground transition-colors active:bg-secondary"
              >
                CLEAR
              </button>
            ) : undefined
          }
        />
        <ChipRow chips={outcome.chips} onRemove={dropChip} />
      </div>

      <RetreatNotice
        dropped={outcome.dropped}
        released={outcome.released}
        onReset={() => setQuery("")}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {typing ? (
          shown.length ? (
            <ProductGrid products={shown} term={outcome.rest} onOpen={openPiece} />
          ) : (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {loading ? "Searching…" : "Loading the catalogue…"}
            </p>
          )
        ) : (
          <div className="flex flex-col gap-5 px-3.5 pb-3 pt-3.5">
            {recents.length > 0 && (
              <div>
                <BlockLabel>Recent</BlockLabel>
                <RecentChips recents={recents} onPick={setQuery} />
              </div>
            )}
            <div>
              <BlockLabel>Browse by category</BlockLabel>
              <CategoryRail categories={categories} onPick={appendTerm} />
            </div>
            {moods.length > 0 && (
              <div>
                <BlockLabel>Shop by mood</BlockLabel>
                <div className="flex flex-wrap gap-1.5 px-0.5">
                  {moods.slice(0, 8).map((mood) => (
                    <TermChip key={mood} onClick={() => appendTerm(mood)}>
                      {mood}
                    </TermChip>
                  ))}
                </div>
              </div>
            )}
            <div>
              <BlockLabel>Price</BlockLabel>
              <div className="flex flex-wrap gap-1.5 px-0.5">
                {PRICE_BANDS.map((band) => (
                  <TermChip key={band.key} onClick={() => appendTerm(band.phrase)}>
                    {band.label}
                  </TermChip>
                ))}
              </div>
            </div>
            {restingPieces.length > 0 && (
              <div className="-mx-3.5">
                <div className="px-3.5">
                  <BlockLabel>In the studio this week</BlockLabel>
                </div>
                <ProductGrid
                  products={props.outcome.results.slice(0, 4)}
                  term=""
                  onOpen={openPiece}
                />
              </div>
            )}
          </div>
        )}
        <div className="h-3" />
      </div>

      <SeeAllBar typing={typing} count={shown.length} onSeeAll={seeAll}>
        <div className="pb-safe" />
      </SeeAllBar>
    </>
  )
}

function ProductGrid({
  products,
  term,
  onOpen,
}: {
  products: IndexedProduct[]
  term: string
  onOpen: (product: IndexedProduct) => void
}) {
  return (
    <div className="kk-fade grid grid-cols-2 gap-2.5 px-3.5 pt-3">
      {products.map((product) => {
        const src = firstImage(product)
        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onOpen(product)}
            className="w-full text-left"
          >
            <span className="relative block aspect-square w-full overflow-hidden rounded-xl border bg-secondary">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <PackageX className="h-5 w-5" />
                </span>
              )}
              {product.stockQuantity <= 3 && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-background/95 px-1.5 py-0.5">
                  <StockFlag stock={product.stockQuantity} />
                </span>
              )}
            </span>
            <span className="mt-1.5 block text-[12.5px] font-medium leading-tight tracking-tight text-foreground">
              <Highlighted text={product.name} term={term} />
            </span>
            <span className="mt-0.5 block text-[12.5px] font-semibold tabular-nums tracking-tight">
              {formatPrice(product.price, product.currency)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default ProductSearch
