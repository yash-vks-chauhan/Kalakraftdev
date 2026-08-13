"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  X,
} from "lucide-react"

import { ActionSheet, type ActionSheetGroup } from "../../../_components/ActionSheet"
import { DockSpacer, Group } from "../../../_components/overview/primitives"
import {
  LOW_STOCK_THRESHOLD,
  formatPrice,
  stockDot,
  stockLabelShort,
  stockTone,
  type Category,
  type Product,
} from "./catalogue"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * The catalogue as a phone screen rather than the desktop page folded in half.
 *
 * Three things drove the shape. The four stat cards cost ~160pt of the opening
 * view and none of them was tappable, so they are the filter rail now — the
 * same counts, a quarter of the height, and "6 low" is also the way to reach
 * those six. Search moved from seventh element to second, and sticks. And the
 * rows lost their card: page padding, a bordered Card and the list's own
 * padding left a row 326pt of a 390pt screen to draw a product in.
 */

type StatusKey = "all" | "live" | "hidden" | "low" | "out"
type SortKey = "updated" | "name" | "price" | "stock" | "sold"

const SORTS: { key: SortKey; label: string; description: string }[] = [
  { key: "updated", label: "Recently updated", description: "What changed last" },
  { key: "name", label: "Name A–Z", description: "Alphabetical" },
  { key: "price", label: "Price, high to low", description: "Most valuable first" },
  { key: "stock", label: "Stock, low to high", description: "What runs out next" },
  { key: "sold", label: "Best selling", description: "Units sold to date" },
]

function describeCount(n: number) {
  return `${n} ${n === 1 ? "product" : "products"}`
}

/**
 * The heading names the view you are actually looking at. "Low" spells out its
 * threshold here, because the dashboard's attention queue counts five or fewer
 * and this list counts ten — the same word, two numbers, and no way to tell
 * from a chip alone which one you have.
 */
const STATUS_HEADING: Record<StatusKey, string> = {
  all: "All products",
  live: "Live",
  hidden: "Hidden",
  low: `Low stock (≤${LOW_STOCK_THRESHOLD})`,
  out: "Out of stock",
}

export function ProductsMobile({
  products,
  categories,
  onEdit,
  onToggleActive,
  onDelete,
  onNew,
}: {
  products: Product[]
  categories: Category[]
  onEdit: (id: number) => void
  onToggleActive: (id: number, next: boolean) => void
  onDelete: (product: Product) => void
  onNew: () => void
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<StatusKey>("all")
  const [categoryId, setCategoryId] = useState<number | "all">("all")
  const [sort, setSort] = useState<SortKey>("updated")
  const [refineOpen, setRefineOpen] = useState(false)
  // The row whose actions are showing. It is deliberately not cleared on close
  // — the sheet animates out over 300ms, and emptying it first would blank the
  // title and the action list on the way down.
  const [actionTarget, setActionTarget] = useState<Product | null>(null)
  const [actionsOpen, setActionsOpen] = useState(false)

  function openActions(product: Product) {
    setActionTarget(product)
    setActionsOpen(true)
  }

  const total = useMemo(
    () => ({
      all: products.length,
      live: products.filter((p) => p.isActive).length,
    }),
    [products]
  )

  /*
   * Each facet counts what the *other* facet leaves standing: pick a category
   * and the status chips report that category, not the whole catalogue. A chip
   * reading "Low 6" above a list of two was the version that lied.
   */
  const counts = useMemo(() => {
    const scope =
      categoryId === "all" ? products : products.filter((p) => p.categoryId === categoryId)
    let live = 0
    let low = 0
    let out = 0
    for (const p of scope) {
      if (p.isActive) live++
      if (p.stockQuantity === 0) out++
      else if (p.stockQuantity <= LOW_STOCK_THRESHOLD) low++
    }
    return { all: scope.length, live, hidden: scope.length - live, low, out }
  }, [products, categoryId])

  const categoryCounts = useMemo(() => {
    const map = new Map<number | "all", number>()
    let all = 0
    for (const p of products) {
      if (status === "live" && !p.isActive) continue
      if (status === "hidden" && p.isActive) continue
      if (status === "low" && !(p.stockQuantity > 0 && p.stockQuantity <= LOW_STOCK_THRESHOLD))
        continue
      if (status === "out" && p.stockQuantity !== 0) continue
      all++
      if (p.categoryId != null) map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1)
    }
    map.set("all", all)
    return map
  }, [products, status])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = products.filter((p) => {
      if (status === "live" && !p.isActive) return false
      if (status === "hidden" && p.isActive) return false
      if (status === "low" && !(p.stockQuantity > 0 && p.stockQuantity <= LOW_STOCK_THRESHOLD))
        return false
      if (status === "out" && p.stockQuantity !== 0) return false
      if (categoryId !== "all" && p.categoryId !== categoryId) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) return false
      return true
    })

    // The API already returns updatedAt DESC, so "recently updated" is the
    // order it arrived in — sorting it again would be a no-op at best.
    if (sort === "updated") return list
    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name)
      if (sort === "price") return b.price - a.price
      if (sort === "stock") return a.stockQuantity - b.stockQuantity
      return b.totalSold - a.totalSold
    })
  }, [products, query, status, categoryId, sort])

  const activeCategory =
    categoryId === "all" ? null : categories.find((c) => c.id === categoryId) ?? null
  const refined = categoryId !== "all" || sort !== "updated"
  const filtered = refined || status !== "all" || query.trim().length > 0

  const chips: { key: StatusKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "live", label: "Live", count: counts.live },
    { key: "hidden", label: "Hidden", count: counts.hidden },
    { key: "low", label: "Low", count: counts.low },
    { key: "out", label: "Out", count: counts.out },
  ]

  const refineGroups: ActionSheetGroup[] = [
    {
      label: "Category",
      actions: [
        {
          id: "cat-all",
          label: "All products",
          description: describeCount(categoryCounts.get("all") ?? 0),
          selected: categoryId === "all",
          onSelect: () => setCategoryId("all"),
        },
        ...categories.map((c) => ({
          id: `cat-${c.id}`,
          label: c.name,
          description: describeCount(categoryCounts.get(c.id) ?? 0),
          selected: categoryId === c.id,
          onSelect: () => setCategoryId(c.id),
        })),
      ],
    },
    {
      label: "Sort by",
      actions: SORTS.map((s) => ({
        id: `sort-${s.key}`,
        label: s.label,
        description: s.description,
        selected: sort === s.key,
        onSelect: () => setSort(s.key),
      })),
    },
    {
      label: "Jump to",
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
          description: "Set stock without opening each product",
          icon: AlertTriangle,
          href: "/dashboard/admin/products/low-stock",
        },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start gap-3 px-0.5 pt-0.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.038em] text-foreground">
            Products
          </h1>
          <p className="text-[13px] text-muted-foreground">
            {total.all} {total.all === 1 ? "piece" : "pieces"} · {total.live} live
          </p>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-foreground px-3.5 text-[13.5px] font-semibold tracking-[-0.01em] text-background transition-opacity active:opacity-80"
        >
          <Plus className="size-4" />
          New
        </button>
      </header>

      {/*
        Sticky under the app bar, not under the top of the viewport: the
        dashboard's MobileHeader is sticky at 0 and this would slide beneath it.
        --mobile-header-total is that bar's height plus its rule and the notch.
      */}
      <div
        className="sticky z-20 -mx-4 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6"
        style={{ top: "var(--mobile-header-total, 3.5rem)" }}
      >
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-[17px] -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              type="text"
              enterKeyHint="search"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="h-11 w-full rounded-xl border bg-muted pl-10 pr-9 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground focus:bg-background"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground active:bg-secondary"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setRefineOpen(true)}
            aria-label="Refine"
            className="relative flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted text-foreground transition-colors active:bg-secondary"
          >
            <SlidersHorizontal className="size-[18px]" />
            {refined && (
              <span
                aria-hidden
                className="absolute right-1.5 top-1.5 size-[7px] rounded-full border-[1.5px] border-background bg-foreground"
              />
            )}
          </button>
        </div>
      </div>

      {/* The stat cards, spent as filters. */}
      <div
        role="group"
        aria-label="Filter by status"
        className="kk-no-scrollbar -mx-4 -my-1 flex gap-1.5 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6"
      >
        {chips.map((chip) => {
          const on = status === chip.key
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setStatus(chip.key)}
              aria-pressed={on}
              className={cn(
                "flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[11px] px-3.5 text-[12.5px] font-semibold tracking-tight transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                on
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground active:bg-secondary"
              )}
            >
              {chip.label}
              <span className={cn("tabular-nums", on ? "opacity-70" : "opacity-75")}>
                {chip.count}
              </span>
            </button>
          )
        })}
      </div>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-baseline gap-2 px-1">
          <h2 className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {activeCategory
              ? status === "all"
                ? activeCategory.name
                : `${activeCategory.name} · ${STATUS_HEADING[status]}`
              : STATUS_HEADING[status]}
          </h2>
          <span className="ml-auto shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
            {visible.length} shown
          </span>
        </div>

        <Group>
          {visible.length === 0 ? (
            <EmptyRow
              filtered={filtered}
              onClear={() => {
                setQuery("")
                setStatus("all")
                setCategoryId("all")
              }}
              onNew={onNew}
            />
          ) : (
            visible.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                onEdit={() => onEdit(product.id)}
                onOpenActions={() => openActions(product)}
              />
            ))
          )}
        </Group>
      </section>

      <DockSpacer />

      <ActionSheet
        open={refineOpen}
        onOpenChange={setRefineOpen}
        title="Refine"
        description="Category, order and shortcuts"
        groups={refineGroups}
        keepOpenOnSelect
        dismissLabel="Done"
      />

      <ActionSheet
        open={actionsOpen}
        onOpenChange={setActionsOpen}
        title={actionTarget?.name || "Untitled product"}
        description={
          actionTarget
            ? `${formatPrice(actionTarget.price, actionTarget.currency)} · ${stockLabelShort(
                actionTarget.stockQuantity
              )} · ${actionTarget.totalSold.toLocaleString("en-IN")} sold`
            : undefined
        }
        groups={
          actionTarget
            ? [
                {
                  actions: [
                    {
                      id: "edit",
                      label: "Edit product",
                      description: "Photos, price, stock and copy",
                      icon: Pencil,
                      onSelect: () => onEdit(actionTarget.id),
                    },
                    {
                      id: "toggle",
                      label: actionTarget.isActive ? "Hide from store" : "Publish to store",
                      description: actionTarget.isActive
                        ? "Customers stop seeing it"
                        : "Customers can see and buy it",
                      icon: actionTarget.isActive ? EyeOff : Eye,
                      onSelect: () => onToggleActive(actionTarget.id, !actionTarget.isActive),
                    },
                    {
                      id: "view",
                      label: "View on storefront",
                      description: "Open the customer's page",
                      icon: ExternalLink,
                      href: `/products/${actionTarget.id}`,
                    },
                  ],
                },
                {
                  actions: [
                    {
                      id: "delete",
                      label: "Delete product",
                      description: "Permanent — cannot be undone",
                      icon: Trash2,
                      destructive: true,
                      onSelect: () => onDelete(actionTarget),
                    },
                  ],
                },
              ]
            : []
        }
      />
    </div>
  )
}

/* ---------------------------------------------------------------- row */

/**
 * 52pt photo, name, then price and stock on one meta line. The whole left side
 * is the edit target — editing is what an admin opened the list to do — and the
 * ⋯ column keeps its own 46pt lane so the two never fight for the same tap.
 */
function ProductRow({
  product,
  onEdit,
  onOpenActions,
}: {
  product: Product
  onEdit: () => void
  onOpenActions: () => void
}) {
  const cover = product.imageUrls?.[0]

  return (
    <div className="flex items-stretch">
      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left transition-colors active:bg-secondary"
      >
        <span
          className={cn(
            "flex size-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[13px] border bg-background",
            !product.isActive && "opacity-45"
          )}
        >
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <Package className="size-4 text-muted-foreground" />
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="min-w-0 truncate text-[15px] font-semibold tracking-[-0.012em] text-foreground">
              {product.name || "Untitled product"}
            </span>
            {!product.isActive && (
              <span className="shrink-0 rounded-full border bg-secondary px-1.5 py-px text-[10.5px] font-semibold text-muted-foreground">
                Hidden
              </span>
            )}
          </span>
          <span className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-[12.5px] text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">
              {formatPrice(product.price, product.currency)}
            </span>
            <span aria-hidden>·</span>
            <span
              aria-hidden
              className={cn("size-1.5 shrink-0 rounded-full", stockDot(product.stockQuantity))}
            />
            <span className={cn("truncate", stockTone(product.stockQuantity))}>
              {stockLabelShort(product.stockQuantity)}
            </span>
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={onOpenActions}
        aria-label={`Actions for ${product.name || "this product"}`}
        className="flex w-[46px] shrink-0 items-center justify-center border-l text-muted-foreground transition-colors active:bg-secondary"
      >
        <MoreHorizontal className="size-5" />
      </button>
    </div>
  )
}

function EmptyRow({
  filtered,
  onClear,
  onNew,
}: {
  filtered: boolean
  onClear: () => void
  onNew: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-6 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Package className="size-5" />
      </span>
      <p className="text-[15px] font-semibold text-foreground">
        {filtered ? "Nothing matches" : "No products yet"}
      </p>
      <p className="max-w-[32ch] text-[13px] text-muted-foreground">
        {filtered
          ? "Try another filter, or clear the search."
          : "Add your first piece and it will show up here."}
      </p>
      <button
        type="button"
        onClick={filtered ? onClear : onNew}
        className="mt-1 flex h-9 items-center gap-1.5 rounded-[11px] bg-foreground px-3.5 text-[12.5px] font-semibold text-background active:opacity-80"
      >
        {filtered ? "Clear filters" : "Add a product"}
      </button>
    </div>
  )
}

/* ----------------------------------------------------------- skeleton */

export function ProductsMobileSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start gap-3 px-0.5 pt-0.5">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-3.5 w-32" />
        </div>
        <Skeleton className="h-10 w-[74px] rounded-xl" />
      </header>

      <div className="flex items-center gap-2 py-2">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="size-11 shrink-0 rounded-xl" />
      </div>

      <div className="flex gap-1.5">
        {[62, 72, 84, 66, 62].map((w, i) => (
          <Skeleton key={i} className="h-9 shrink-0 rounded-[11px]" style={{ width: w }} />
        ))}
      </div>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-baseline px-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="ml-auto h-3 w-14" />
        </div>
        <Group>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="size-[52px] shrink-0 rounded-[13px]" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
            </div>
          ))}
        </Group>
      </section>

      <DockSpacer />
    </div>
  )
}
