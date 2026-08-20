"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowRight,
  Check,
  Heart,
  Loader2,
  PackageX,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"

import { useAuth } from "../../contexts/AuthContext"
import { useCart } from "../../contexts/CartContext"
import { useWishlist, type WishlistItem } from "../../contexts/WishlistContext"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function formatCurrency(value: number, opts?: { compact?: boolean }) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: opts?.compact ? 0 : 2,
    minimumFractionDigits: opts?.compact ? 0 : 2,
  }).format(value)
}

type ItemBusy = "moving" | "added" | "removing" | null

export default function DashboardWishlistPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { wishlistItems, addToWishlist, removeFromWishlist, loading: wishlistLoading } = useWishlist()
  const { addToCart } = useCart()

  const [busy, setBusy] = useState<Record<number, ItemBusy>>({})
  const [inCart, setInCart] = useState<Record<number, boolean>>({})
  const [stockInfo, setStockInfo] = useState<Record<number, number>>({})
  const [editing, setEditing] = useState(false)
  const [announcement, setAnnouncement] = useState<string>("")

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login")
  }, [user, authLoading, router])

  // Leaving edit mode when the list empties keeps "Done" from lingering over
  // an empty screen.
  useEffect(() => {
    if (wishlistItems.length === 0 && editing) setEditing(false)
  }, [wishlistItems.length, editing])

  useEffect(() => {
    if (wishlistItems.length === 0) return
    let cancelled = false
    const ids = wishlistItems.map((item) => item.productId)

    async function fetchStock() {
      try {
        const res = await fetch(`/api/products?ids=${ids.join(",")}`)
        if (!res.ok) return
        const data = await res.json()
        if (cancelled || !Array.isArray(data.products)) return
        const next: Record<number, number> = {}
        for (const p of data.products) {
          if (typeof p?.id === "number") next[p.id] = p.stockQuantity ?? 0
        }
        setStockInfo(next)
      } catch {
        // Leave stock unknown rather than guessing zero — marking every saved
        // piece "Sold out" because one request failed is worse than saying
        // nothing, and the server still rejects an add that overruns stock.
      }
    }

    fetchStock()
    return () => {
      cancelled = true
    }
  }, [wishlistItems])

  function setItemBusy(id: number, state: ItemBusy) {
    setBusy((prev) => {
      const next = { ...prev }
      if (state === null) delete next[id]
      else next[id] = state
      return next
    })
  }

  /**
   * Adding no longer deletes the saved item.
   *
   * This used to call removeFromWishlist 550ms after a successful add, so a
   * tap appeared to eat the piece you saved, with no undo. A wishlist is a
   * list of things you like, not a staging queue — the piece stays, and the
   * button reports that it is now in the cart.
   */
  async function handleAddToCart(item: WishlistItem) {
    setItemBusy(item.id, "moving")
    try {
      const ok = await addToCart(item.productId, 1)
      if (ok) {
        setInCart((prev) => ({ ...prev, [item.id]: true }))
        setAnnouncement(`${item.product.name} added to cart, still saved`)
      }
    } finally {
      setItemBusy(item.id, null)
    }
  }

  async function handleRemove(item: WishlistItem) {
    setItemBusy(item.id, "removing")
    setAnnouncement(`${item.product.name} removed from wishlist`)
    try {
      await removeFromWishlist(item.productId, { silent: true })
      toast.success(`${item.product.name} removed`, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await addToWishlist(item.productId, { silent: true })
            } catch {
              toast.error(`Could not put ${item.product.name} back`)
            }
          },
        },
      })
    } catch {
      toast.error("Could not remove that item")
    } finally {
      setItemBusy(item.id, null)
    }
  }

  if (!user || authLoading || wishlistLoading) {
    return (
      <main className="flex flex-col gap-4 sm:gap-6">
        <WishlistHeader savedCount={0} loading />
        <SkeletonGrid />
      </main>
    )
  }

  if (wishlistItems.length === 0) {
    return (
      <main className="flex flex-col gap-4 sm:gap-6">
        <WishlistHeader savedCount={0} />
        <Card className="border-0 shadow-none sm:border sm:shadow-sm">
          <CardContent className="flex flex-col items-center gap-5 p-10 text-center sm:p-16">
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <span aria-hidden className="absolute inset-0 rounded-full ring-1 ring-border" />
              <span aria-hidden className="absolute -inset-2 rounded-full ring-1 ring-border/40" />
              <Heart className="h-6 w-6" />
              <Sparkles aria-hidden className="absolute -right-1 -top-1 h-4 w-4 text-amber-500" />
            </span>
            <div className="flex max-w-sm flex-col gap-1.5">
              <p className="text-base font-semibold text-foreground sm:text-lg">
                Your wishlist is a blank canvas
              </p>
              <p className="text-sm text-muted-foreground">
                Save the pieces that catch your eye and come back when you’re ready to buy them.
              </p>
            </div>
            <Button asChild size="sm" className="group/cta gap-1.5">
              <Link href="/products">
                <ShoppingBag className="h-4 w-4" />
                Find your favourites
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex flex-col gap-4 sm:gap-6">
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
      <WishlistHeader
        savedCount={wishlistItems.length}
        editing={editing}
        onToggleEditing={() => setEditing((v) => !v)}
      />

      {/*
       * The wrapping card cost ~34px of width per tile at 375px — page
       * padding, card border, card padding and the gap between columns — and
       * left the primary action about 86px, which truncated it to "Add to c…".
       * Below sm the grid is the page; the card returns at sm and up.
       */}
      <div className="sm:rounded-xl sm:border sm:bg-card sm:shadow-sm">
        <CardHeader className="hidden gap-1 p-4 sm:flex sm:p-6">
          <CardTitle>Your saved items</CardTitle>
          <CardDescription>
            Move favourites to your cart, or remove what you no longer need.
          </CardDescription>
        </CardHeader>

        <div className="sm:p-6 sm:pt-0">
          <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {wishlistItems.map((item) => (
              <WishlistTile
                key={item.id}
                item={item}
                stock={stockInfo[item.productId]}
                busy={busy[item.id]}
                inCart={!!inCart[item.id]}
                editing={editing}
                onAdd={() => handleAddToCart(item)}
                onRemove={() => handleRemove(item)}
              />
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}

/* -------------------------------------------------------------- */
/* TILE                                                            */
/* -------------------------------------------------------------- */

function WishlistTile({
  item,
  stock,
  busy,
  inCart,
  editing,
  onAdd,
  onRemove,
}: {
  item: WishlistItem
  stock?: number
  busy: ItemBusy
  inCart: boolean
  editing: boolean
  onAdd: () => void
  onRemove: () => void
}) {
  const stockKnown = typeof stock === "number"
  const isOut = stockKnown && stock <= 0
  const isLow = stockKnown && stock > 0 && stock <= 5
  const isAdding = busy === "moving"
  const isRemoving = busy === "removing"
  const imageUrl = item.product.imageUrls?.[0]

  return (
    <li
      className={cn(
        "group/card flex flex-col gap-2 transition-[opacity,transform] duration-300 ease-out",
        "sm:overflow-hidden sm:rounded-lg sm:border sm:border-border sm:bg-card sm:gap-0",
        "sm:hover:-translate-y-0.5 sm:hover:border-foreground/20 sm:hover:shadow-md",
        "sm:focus-within:border-foreground/20 sm:focus-within:shadow-md",
        isRemoving && "pointer-events-none scale-[0.96] opacity-0"
      )}
    >
      <div className="relative">
        <Link
          href={`/products/${item.product.id}`}
          className="relative block aspect-square w-full overflow-hidden rounded-xl bg-muted/40 sm:rounded-none"
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={item.product.name}
              loading="lazy"
              className={cn(
                "h-full w-full object-cover transition-transform duration-500 ease-out",
                "group-hover/card:scale-[1.04]",
                // A sold-out piece reads as unavailable before the words do.
                isOut && "grayscale"
              )}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <PackageX className="h-6 w-6" />
            </div>
          )}

          {/* Legibility scrim for the badge — sm and up only, where the badge
              still sits on the artwork. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 hidden h-14 bg-gradient-to-b from-black/15 to-transparent sm:block"
          />

          {stockKnown && (
            <div className="absolute left-2 top-2 hidden sm:block">
              <StockBadge stock={stock} />
            </div>
          )}
        </Link>

        {/*
         * Below sm removal lives behind Edit. A ✕ on all six pieces at rest is
         * chrome sitting on the artwork you saved; browsing is far more common
         * than pruning, so the default view is the gallery.
         */}
        {editing && (
          <button
            type="button"
            onClick={onRemove}
            disabled={isRemoving}
            aria-label={`Remove ${item.product.name} from wishlist`}
            className="absolute right-0.5 top-0.5 grid h-10 w-10 place-items-center sm:hidden"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-background/95 text-foreground shadow-sm ring-1 ring-border transition-transform duration-150 active:scale-90">
              {isRemoving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 sm:gap-2 sm:p-4">
        {/* Two lines reserved either way, so prices and buttons stay on one
            baseline across the row. */}
        <Link
          href={`/products/${item.product.id}`}
          className="line-clamp-2 min-h-[2.8em] text-[13.5px] font-medium leading-snug text-foreground transition-colors hover:underline sm:min-h-0 sm:text-sm"
        >
          {item.product.name}
        </Link>

        <p className="truncate text-[11px] text-muted-foreground max-sm:hidden">
          {item.product.category?.name ?? " "}
        </p>

        {/*
         * Stock rides the price line below sm instead of sitting on the
         * artwork, so it costs no space and covers no art. Healthy stock says
         * nothing at all.
         */}
        <p className="mt-auto truncate text-[13.5px] font-semibold tabular-nums text-foreground sm:text-base">
          <span className="sm:hidden">{formatCurrency(item.product.price, { compact: true })}</span>
          <span className="max-sm:hidden">{formatCurrency(item.product.price)}</span>
          {isLow && (
            <span className="font-normal text-amber-600 sm:hidden dark:text-amber-500">
              {" "}
              · Only {stock} left
            </span>
          )}
          {isOut && (
            <span className="font-normal text-muted-foreground sm:hidden"> · Sold out</span>
          )}
        </p>

        <div className="flex items-center gap-1.5 pt-0.5">
          {isOut ? (
            /*
             * There is no back-in-stock subscription in this codebase, so this
             * does not promise one. The product page is the useful place to
             * land from a sold-out saved piece.
             */
            <Button asChild variant="secondary" className="h-11 flex-1 gap-1.5 sm:h-8 sm:text-sm">
              <Link href={`/products/${item.product.id}`}>View piece</Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant={inCart ? "ghost" : "secondary"}
              disabled={isAdding || inCart}
              onClick={onAdd}
              className={cn(
                "h-11 flex-1 gap-1.5 transition-colors sm:h-8 sm:text-sm",
                // Solid black on every tile turned the grid into a wall of
                // buttons; a soft fill lets the pieces stay the loudest thing.
                !inCart && "bg-secondary hover:bg-secondary/80",
                inCart &&
                  "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 disabled:opacity-100 dark:text-emerald-400"
              )}
            >
              {isAdding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : inCart ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <ShoppingCart className="h-3.5 w-3.5" />
              )}
              <span className="truncate">
                {isAdding ? "Adding…" : inCart ? "In cart" : "Add to cart"}
              </span>
            </Button>
          )}

          {/* sm and up keeps the always-visible remove control — there is room
              for it there, and no Edit affordance in that layout. */}
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={onRemove}
            disabled={isRemoving || isAdding}
            aria-label={`Remove ${item.product.name} from wishlist`}
            className="hidden text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive active:scale-90 sm:inline-flex"
          >
            {isRemoving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </li>
  )
}

/* -------------------------------------------------------------- */
/* PIECES                                                          */
/* -------------------------------------------------------------- */

function WishlistHeader({
  savedCount,
  loading,
  editing,
  onToggleEditing,
}: {
  savedCount: number
  loading?: boolean
  editing?: boolean
  onToggleEditing?: () => void
}) {
  return (
    <header className="flex items-end justify-between gap-3">
      <div className="hidden min-w-0 flex-col gap-1 md:flex">
        <p className="text-xs text-muted-foreground sm:text-sm">Saved</p>
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Your wishlist
          {!loading && savedCount > 0 && (
            <Badge variant="secondary" className="rounded-full">
              {savedCount} item{savedCount === 1 ? "" : "s"}
            </Badge>
          )}
        </h1>
        <p className="text-sm text-muted-foreground">
          Pieces you’ve saved for later. Move them into your cart whenever you’re ready.
        </p>
      </div>

      {/* Below md the title block was hidden, leaving one right-aligned button
          in an empty row and no saved count anywhere on screen. */}
      <p className="text-sm text-muted-foreground md:hidden">
        {savedCount} saved
      </p>

      {savedCount > 0 && onToggleEditing && (
        <button
          type="button"
          onClick={onToggleEditing}
          aria-pressed={editing}
          className="-my-1.5 rounded px-0.5 py-1.5 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
        >
          {editing ? "Done" : "Edit"}
        </button>
      )}

      <Button asChild variant="outline" size="sm" className="hidden shrink-0 gap-1.5 md:inline-flex">
        <Link href="/products" aria-label="Browse products">
          <ShoppingBag className="h-4 w-4" />
          Browse<span className="hidden sm:inline">&nbsp;products</span>
        </Link>
      </Button>
    </header>
  )
}

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <Badge className="gap-1 border-transparent bg-destructive/85 text-white shadow-sm backdrop-blur hover:bg-destructive/90">
        Out of stock
      </Badge>
    )
  }
  if (stock > 0 && stock <= 5) {
    return (
      <Badge className="gap-1 border-transparent bg-amber-500/90 text-white shadow-sm backdrop-blur hover:bg-amber-500">
        Only {stock} left
      </Badge>
    )
  }
  return (
    <Badge className="gap-1 border-transparent bg-background/90 text-foreground shadow-sm backdrop-blur hover:bg-background">
      In stock
    </Badge>
  )
}

function SkeletonGrid() {
  return (
    <div className="sm:rounded-xl sm:border sm:bg-card sm:shadow-sm">
      <CardHeader className="hidden gap-1 p-4 sm:flex sm:p-6">
        <CardTitle>Your saved items</CardTitle>
        <CardDescription>Loading your wishlist…</CardDescription>
      </CardHeader>
      <div className="sm:p-6 sm:pt-0">
        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <li
              key={i}
              className="flex flex-col gap-2 sm:gap-0 sm:overflow-hidden sm:rounded-lg sm:border sm:bg-card"
            >
              <Skeleton className="aspect-square w-full rounded-xl sm:rounded-none" />
              <div className="flex flex-col gap-2 sm:p-4">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="mt-1 h-11 w-full sm:h-8" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
