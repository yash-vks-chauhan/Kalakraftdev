"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Minus,
  MoreVertical,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  X,
} from "lucide-react"

import { ActionSheet, type ActionSheetGroup } from "../../../_components/ActionSheet"
import {
  LOW_STOCK_THRESHOLD,
  formatPrice,
  type Category,
  type Product,
} from "./catalogue"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * The catalogue as a table that happens to be 390 points wide.
 *
 * Three moves separate this from a list of cards. Every figure lives in one
 * right-aligned tabular column under a labelled header — an inventory screen
 * you cannot scan a column of quantities on is not an inventory screen. That
 * header is also the sort control, and the column shows whatever you sorted
 * by, so there is one control and one place for the answer. And the four stat
 * cards that used to cost ~160pt of the opening view are the facet strip now:
 * the count and the route to what it counts are the same thing.
 *
 * Chrome is flat — hairlines, no blur, no floating cards. The only elevated
 * surface in the screen is a sheet.
 */

type FacetKey = "all" | "live" | "low" | "out"
type SortKey = "stock" | "price" | "sold" | "name" | "updated"
type SortDir = "asc" | "desc"

const SORTS: { key: SortKey; label: string; description: string }[] = [
  { key: "stock", label: "Stock", description: "What runs out next" },
  { key: "price", label: "Price", description: "Most valuable first" },
  { key: "sold", label: "Units sold", description: "Best selling to date" },
  { key: "name", label: "Name", description: "Alphabetical" },
  { key: "updated", label: "Updated", description: "What changed last" },
]

/** Sorts that read low-to-high first; the rest open descending. */
const ASCENDING_FIRST: SortKey[] = ["stock", "name"]

const FACETS: { key: FacetKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "low", label: "Low" },
  { key: "out", label: "Out" },
]

function matchesFacet(p: Product, facet: FacetKey) {
  if (facet === "live") return p.isActive
  if (facet === "low") return p.stockQuantity > 0 && p.stockQuantity <= LOW_STOCK_THRESHOLD
  if (facet === "out") return p.stockQuantity === 0
  return true
}

function padId(id: number) {
  return `#${String(id).padStart(2, "0")}`
}

export function ProductsMobile({
  products,
  categories,
  onEdit,
  onToggleActive,
  onSetStock,
  onDelete,
  onBulk,
  onNew,
  bulkPending,
}: {
  products: Product[]
  categories: Category[]
  onEdit: (id: number) => void
  onToggleActive: (id: number, next: boolean) => void
  onSetStock: (id: number, next: number) => void
  onDelete: (product: Product) => void
  onBulk: (action: "publish" | "hide" | "delete", ids: number[]) => void
  onNew: () => void
  bulkPending: boolean
}) {
  const [query, setQuery] = useState("")
  const [facet, setFacet] = useState<FacetKey>("all")
  const [categoryId, setCategoryId] = useState<number | "all">("all")
  const [sort, setSort] = useState<SortKey>("stock")
  const [dir, setDir] = useState<SortDir>("asc")

  const [selecting, setSelecting] = useState(false)
  const [picked, setPicked] = useState<Set<number>>(new Set())

  const [sortOpen, setSortOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [rowOpen, setRowOpen] = useState(false)
  /* Held by id, not by value: the sheet stays open while you tap the stepper,
     so it has to read the product the list is holding now, not a snapshot. */
  const [targetId, setTargetId] = useState<number | null>(null)
  const target = useMemo(
    () => (targetId === null ? null : products.find((p) => p.id === targetId) ?? null),
    [products, targetId]
  )

  /* Select mode owns the bottom of the screen; the app-wide dock steps aside
     rather than being covered by a bar it would paint over anyway. */
  useEffect(() => {
    if (!selecting) return
    document.body.dataset.hideDock = "1"
    return () => {
      delete document.body.dataset.hideDock
    }
  }, [selecting])

  /* Each facet counts what the other leaves standing: pick a category and the
     strip reports that category, not the whole catalogue. */
  const counts = useMemo(() => {
    const scope =
      categoryId === "all" ? products : products.filter((p) => p.categoryId === categoryId)
    return {
      all: scope.length,
      live: scope.filter((p) => matchesFacet(p, "live")).length,
      low: scope.filter((p) => matchesFacet(p, "low")).length,
      out: scope.filter((p) => matchesFacet(p, "out")).length,
    }
  }, [products, categoryId])

  const categoryCounts = useMemo(() => {
    const map = new Map<number | "all", number>()
    let all = 0
    for (const p of products) {
      if (!matchesFacet(p, facet)) continue
      all++
      if (p.categoryId != null) map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1)
    }
    map.set("all", all)
    return map
  }, [products, facet])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = products.filter((p) => {
      if (!matchesFacet(p, facet)) return false
      if (categoryId !== "all" && p.categoryId !== categoryId) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) return false
      return true
    })
    const k = dir === "asc" ? 1 : -1
    // "updated" is the order the API returned — updatedAt DESC.
    return [...list].sort((a, b) => {
      if (sort === "stock") return (a.stockQuantity - b.stockQuantity) * k
      if (sort === "price") return (a.price - b.price) * k
      if (sort === "sold") return (a.totalSold - b.totalSold) * k
      if (sort === "name") return a.name.localeCompare(b.name) * k
      return (products.indexOf(a) - products.indexOf(b)) * k
    })
  }, [products, query, facet, categoryId, sort, dir])

  const categoryName = (id: number | null) =>
    categories.find((c) => c.id === id)?.name ?? "Uncategorised"

  const activeSort = SORTS.find((s) => s.key === sort)!
  const refined = categoryId !== "all"
  const pickedIds = [...picked]

  function togglePick(id: number) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function chooseSort(key: SortKey) {
    if (key === sort) {
      setDir((d) => (d === "asc" ? "desc" : "asc"))
      return
    }
    setSort(key)
    setDir(ASCENDING_FIRST.includes(key) ? "asc" : "desc")
  }

  function openRow(product: Product) {
    setTargetId(product.id)
    setRowOpen(true)
  }

  function leaveSelectMode() {
    setSelecting(false)
    setPicked(new Set())
  }

  const filterGroups: ActionSheetGroup[] = [
    {
      label: "Category",
      actions: [
        {
          id: "cat-all",
          label: "All categories",
          value: categoryCounts.get("all") ?? 0,
          selected: categoryId === "all",
          onSelect: () => setCategoryId("all"),
        },
        ...categories.map((c) => ({
          id: `cat-${c.id}`,
          label: c.name,
          value: categoryCounts.get(c.id) ?? 0,
          selected: categoryId === c.id,
          onSelect: () => setCategoryId(c.id),
        })),
      ],
    },
    {
      label: "Elsewhere",
      actions: [
        {
          id: "rated",
          label: "Highest rated",
          description: "What customers score best",
          icon: Star,
          href: "/dashboard/admin/products/highest-rated",
        },
        {
          id: "restock",
          label: "Restock queue",
          description: "Set stock in bulk",
          icon: AlertTriangle,
          href: "/dashboard/admin/products/low-stock",
        },
      ],
    },
  ]

  return (
    <div className="flex flex-col">
      {/*
        Control surface. Sticky under the app bar, which is `sticky top-0`
        itself — --mobile-header-total is its height plus rule and notch.
        The column header belongs to this block rather than the list: left in
        the flow it scrolled away and took the sort control with it, leaving a
        column of bare figures with nothing naming them.
      */}
      <div
        className="sticky z-20 -mx-4 -mt-5 border-b bg-background sm:-mx-6"
        style={{ top: "var(--mobile-header-total, 3.5rem)" }}
      >
        <div className="flex items-center gap-2 px-4 py-2.5 sm:px-6">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search catalogue"
              aria-label="Search catalogue"
              type="text"
              enterKeyHint="search"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-9 text-[14.5px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-faint focus:border-foreground focus:shadow-[0_0_0_3px_hsl(var(--foreground)/0.07)]"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-faint transition-colors active:bg-wash"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            aria-label="Filter"
            className="relative flex size-10 shrink-0 items-center justify-center rounded-md border border-input text-foreground transition-colors active:bg-wash"
          >
            <SlidersHorizontal className="size-[18px]" />
            {refined && (
              <span
                aria-hidden
                className="absolute -right-0.5 -top-0.5 size-[7px] rounded-full border-[1.5px] border-background bg-foreground"
              />
            )}
          </button>

          <button
            type="button"
            onClick={onNew}
            aria-label="New product"
            className="flex size-10 shrink-0 items-center justify-center rounded-md border border-input text-foreground transition-colors active:bg-wash"
          >
            <Plus className="size-[18px]" />
          </button>
        </div>

        {/* The stat cards, spent as filters. */}
        <div
          role="group"
          aria-label="Filter by status"
          className="kk-no-scrollbar flex gap-5 overflow-x-auto px-4 sm:px-6"
        >
          {FACETS.map((f) => {
            const on = facet === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFacet(f.key)}
                aria-pressed={on}
                className={cn(
                  "relative flex shrink-0 items-baseline gap-1.5 whitespace-nowrap pb-2.5 pt-0.5",
                  "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-t-full after:bg-foreground after:transition-opacity",
                  on ? "after:opacity-100" : "after:opacity-0"
                )}
              >
                <span
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-[0.12em]",
                    on ? "text-foreground" : "text-faint"
                  )}
                >
                  {f.label}
                </span>
                <span
                  className={cn(
                    "text-[13px] tabular-nums",
                    on ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                  )}
                >
                  {counts[f.key]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Column header — and the sort control. */}
        <div className="flex items-center gap-2.5 border-t bg-wash px-4 py-2 sm:px-6">
          <span className="min-w-0 flex-1 font-mono text-[9.5px] uppercase tracking-[0.15em] text-faint">
            Product
          </span>
          <button
            type="button"
            onClick={() => setSortOpen(true)}
            className="inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.15em] text-foreground"
          >
            {activeSort.label}
            {dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
          </button>
          <button
            type="button"
            onClick={() => (selecting ? leaveSelectMode() : setSelecting(true))}
            className={cn(
              "border-l border-input pl-2.5 font-mono text-[9.5px] uppercase tracking-[0.15em] transition-colors",
              selecting ? "text-foreground" : "text-faint"
            )}
          >
            {selecting ? "Done" : "Select"}
          </button>
        </div>
      </div>

      {/* Rows */}
      <div className="-mx-4 sm:-mx-6">
        {visible.length === 0 ? (
          <EmptyState
            filtered={facet !== "all" || refined || query.trim().length > 0}
            onClear={() => {
              setQuery("")
              setFacet("all")
              setCategoryId("all")
            }}
            onNew={onNew}
          />
        ) : (
          visible.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              sort={sort}
              categoryName={categoryName(product.categoryId)}
              selecting={selecting}
              picked={picked.has(product.id)}
              onOpen={() =>
                selecting ? togglePick(product.id) : onEdit(product.id)
              }
              onActions={() => openRow(product)}
            />
          ))
        )}
      </div>

      {/* Clears the dock, or the bulk bar when selecting. */}
      <div className={cn("shrink-0", selecting ? "h-24" : "h-6")} />

      {/* Always mounted so it can slide both ways; unmounting would give it
          an entrance and no exit. */}
      <BulkBar
        visible={selecting}
        count={pickedIds.length}
        pending={bulkPending}
        onAction={(action) => {
          onBulk(action, pickedIds)
          leaveSelectMode()
        }}
      />

      <ActionSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        title="Sort by"
        description="The right-hand column follows this"
        dismissLabel="Done"
        keepOpenOnSelect
        groups={[
          {
            actions: SORTS.map((s) => ({
              id: `sort-${s.key}`,
              label: s.label,
              description: s.description,
              value:
                sort === s.key ? (dir === "asc" ? "Low → high" : "High → low") : undefined,
              selected: sort === s.key,
              onSelect: () => chooseSort(s.key),
            })),
          },
        ]}
      />

      <ActionSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        title="Filter"
        description="Category and shortcuts"
        dismissLabel="Done"
        keepOpenOnSelect
        headAction={
          refined ? { label: "Reset", onSelect: () => setCategoryId("all") } : undefined
        }
        groups={filterGroups}
      />

      <RowSheet
        open={rowOpen}
        onOpenChange={setRowOpen}
        product={target}
        categoryName={target ? categoryName(target.categoryId) : ""}
        onSetStock={onSetStock}
        onToggleActive={onToggleActive}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}

/* ---------------------------------------------------------------- row */

function ProductRow({
  product,
  sort,
  categoryName,
  selecting,
  picked,
  onOpen,
  onActions,
}: {
  product: Product
  sort: SortKey
  categoryName: string
  selecting: boolean
  picked: boolean
  onOpen: () => void
  onActions: () => void
}) {
  const cover = product.imageUrls?.[0]
  const stock = product.stockQuantity
  const tone =
    stock === 0 ? "bad" : stock <= LOW_STOCK_THRESHOLD ? "warn" : "plain"

  /* The right column is the sort key; the meta line carries what it is not
     showing, so the same two facts are always on the row either way. */
  const showingStock = sort !== "price" && sort !== "sold"
  const value =
    sort === "price"
      ? formatPrice(product.price, product.currency)
      : sort === "sold"
      ? product.totalSold.toLocaleString("en-IN")
      : String(stock)

  const meta = [
    padId(product.id),
    categoryName.toUpperCase(),
    showingStock
      ? formatPrice(product.price, product.currency)
      : stock === 0
      ? "OUT OF STOCK"
      : `${stock} IN STOCK`,
  ].join(" · ")

  return (
    <div className="relative flex min-h-[58px] items-center gap-2.5 px-4 transition-colors active:bg-wash sm:px-6">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2.5 py-2 text-left"
        aria-pressed={selecting ? picked : undefined}
      >
        {selecting && (
          <span
            className={cn(
              "flex size-[19px] shrink-0 items-center justify-center rounded-sm border transition-colors",
              picked
                ? "border-foreground bg-foreground text-background"
                : "border-input text-transparent"
            )}
          >
            <Check className="size-3" strokeWidth={3.5} />
          </span>
        )}

        <span
          className={cn(
            "flex size-[38px] shrink-0 items-center justify-center overflow-hidden rounded-sm border bg-wash",
            !product.isActive && "opacity-45"
          )}
        >
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <Package className="size-4 text-faint" />
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-baseline gap-2">
            <span
              className={cn(
                "min-w-0 truncate text-[14px] font-medium tracking-[-0.008em]",
                product.isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {product.name || "Untitled product"}
            </span>
            {!product.isActive && (
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.13em] text-faint">
                Hidden
              </span>
            )}
          </span>
          <span className="truncate font-mono text-[10.5px] tracking-[0.02em] text-faint">
            {meta}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-1.5">
          {showingStock && tone !== "plain" && (
            <span
              aria-hidden
              className={cn(
                "size-[5px] rounded-full",
                tone === "bad" ? "bg-destructive" : "bg-warning"
              )}
            />
          )}
          <span
            className={cn(
              "min-w-[26px] text-right text-[14px] font-medium tabular-nums",
              showingStock && tone === "bad"
                ? "text-destructive"
                : showingStock && tone === "warn"
                ? "text-warning"
                : "text-foreground"
            )}
          >
            {value}
          </span>
        </span>
      </button>

      {!selecting && (
        <button
          type="button"
          onClick={onActions}
          aria-label={`Actions for ${product.name || "this product"}`}
          className="-mr-2 flex h-[58px] w-9 shrink-0 items-center justify-center text-faint transition-colors active:text-foreground"
        >
          <MoreVertical className="size-4" />
        </button>
      )}

      <span
        aria-hidden
        className={cn(
          "absolute bottom-0 right-0 h-px bg-hairline",
          selecting ? "left-[86px]" : "left-[66px]"
        )}
      />
    </div>
  )
}

/* -------------------------------------------------------------- sheets */

/**
 * Nobody rewrites product copy on a phone; they correct a count after a
 * delivery. So the sheet opens on the number itself.
 */
function RowSheet({
  open,
  onOpenChange,
  product,
  categoryName,
  onSetStock,
  onToggleActive,
  onEdit,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  categoryName: string
  onSetStock: (id: number, next: number) => void
  onToggleActive: (id: number, next: boolean) => void
  onEdit: (id: number) => void
  onDelete: (product: Product) => void
}) {
  if (!product) {
    return (
      <ActionSheet open={open} onOpenChange={onOpenChange} title="" groups={[]} />
    )
  }

  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title={product.name || "Untitled product"}
      description={`${padId(product.id)} · ${categoryName}`}
      dismissLabel="Done"
      keepOpenOnSelect
      groups={[
        {
          actions: [
            {
              id: "toggle",
              label: product.isActive ? "Hide from store" : "Publish to store",
              description: product.isActive
                ? "Live · visible to customers"
                : "Hidden · not on the storefront",
              icon: product.isActive ? EyeOff : Eye,
              onSelect: () => onToggleActive(product.id, !product.isActive),
            },
            {
              id: "edit",
              label: "Edit details",
              description: "Name · copy · photos · price",
              onSelect: () => {
                onOpenChange(false)
                onEdit(product.id)
              },
            },
            {
              id: "view",
              label: "Open on storefront",
              description: "The customer's page",
              icon: ExternalLink,
              href: `/products/${product.id}`,
            },
            {
              id: "delete",
              label: "Delete product",
              description: "Cannot be undone",
              icon: Trash2,
              destructive: true,
              onSelect: () => {
                onOpenChange(false)
                onDelete(product)
              },
            },
          ],
        },
      ]}
    >
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] text-foreground">Stock on hand</span>
          <span className="block font-mono text-[10.5px] uppercase tracking-[0.1em] text-faint">
            {product.stockQuantity === 0
              ? "Out of stock"
              : product.stockQuantity <= LOW_STOCK_THRESHOLD
              ? `Low · at or under ${LOW_STOCK_THRESHOLD}`
              : "In stock"}
          </span>
        </span>
        <span className="flex h-[38px] shrink-0 items-stretch overflow-hidden rounded-md border border-input">
          <button
            type="button"
            aria-label="One fewer"
            disabled={product.stockQuantity <= 0}
            onClick={() => onSetStock(product.id, Math.max(0, product.stockQuantity - 1))}
            className="grid w-10 place-items-center text-foreground transition-colors active:bg-wash disabled:opacity-35"
          >
            <Minus className="size-[15px]" />
          </button>
          <span className="grid w-12 place-items-center border-x border-input text-[14px] font-medium tabular-nums">
            {product.stockQuantity}
          </span>
          <button
            type="button"
            aria-label="One more"
            onClick={() => onSetStock(product.id, product.stockQuantity + 1)}
            className="grid w-10 place-items-center text-foreground transition-colors active:bg-wash"
          >
            <Plus className="size-[15px]" />
          </button>
        </span>
      </div>
    </ActionSheet>
  )
}

function BulkBar({
  visible,
  count,
  pending,
  onAction,
}: {
  visible: boolean
  count: number
  pending: boolean
  onAction: (action: "publish" | "hide" | "delete") => void
}) {
  const disabled = count === 0 || pending
  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-input bg-background pb-safe lg:hidden",
        "transition-transform duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      )}
    >
      <div className="flex items-center gap-2 px-4 py-2.5">
        <span className="flex-1 font-mono text-[10px] uppercase tracking-[0.13em] text-faint">
          {pending ? "Working…" : `${count} selected`}
        </span>
        <BulkButton disabled={disabled} onClick={() => onAction("publish")}>
          Publish
        </BulkButton>
        <BulkButton disabled={disabled} onClick={() => onAction("hide")}>
          Hide
        </BulkButton>
        <BulkButton disabled={disabled} destructive onClick={() => onAction("delete")}>
          Delete
        </BulkButton>
      </div>
    </div>
  )
}

function BulkButton({
  children,
  onClick,
  disabled,
  destructive,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled: boolean
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-9 shrink-0 rounded-md border px-3 text-[13px] font-medium transition-colors disabled:opacity-35",
        destructive
          ? "border-destructive/30 text-destructive active:bg-destructive/5"
          : "border-input text-foreground active:bg-wash"
      )}
    >
      {children}
    </button>
  )
}

function EmptyState({
  filtered,
  onClear,
  onNew,
}: {
  filtered: boolean
  onClear: () => void
  onNew: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-faint">
        {filtered ? "No match" : "Empty"}
      </span>
      <p className="text-[15px] font-semibold text-foreground">
        {filtered ? "Nothing in this view" : "No products yet"}
      </p>
      <p className="max-w-[30ch] text-[13px] text-muted-foreground">
        {filtered
          ? "Clear the search, or widen the filter."
          : "Add your first piece and it will show up here."}
      </p>
      <button
        type="button"
        onClick={filtered ? onClear : onNew}
        className="mt-1.5 h-9 rounded-md border border-input px-3.5 text-[13px] font-medium transition-colors active:bg-wash"
      >
        {filtered ? "Reset" : "Add a product"}
      </button>
    </div>
  )
}

/* ----------------------------------------------------------- skeleton */

export function ProductsMobileSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="-mx-4 -mt-5 border-b sm:-mx-6">
        <div className="flex items-center gap-2 px-4 py-2.5 sm:px-6">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="size-10 shrink-0 rounded-md" />
          <Skeleton className="size-10 shrink-0 rounded-md" />
        </div>
        <div className="flex gap-5 px-4 pb-2.5 sm:px-6">
          {[42, 46, 42, 42].map((w, i) => (
            <Skeleton key={i} className="h-4" style={{ width: w }} />
          ))}
        </div>
      </div>

      <div className="-mx-4 flex items-center gap-2.5 border-b bg-wash px-4 py-2 sm:-mx-6 sm:px-6">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="ml-auto h-2.5 w-12" />
      </div>

      <div className="-mx-4 sm:-mx-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex min-h-[58px] items-center gap-2.5 border-b border-hairline px-4 sm:px-6">
            <Skeleton className="size-[38px] shrink-0 rounded-sm" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2.5 w-2/3" />
            </div>
            <Skeleton className="h-3.5 w-7 shrink-0" />
          </div>
        ))}
      </div>

      <div className="h-6" />
    </div>
  )
}
