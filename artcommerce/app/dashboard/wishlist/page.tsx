"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

type ItemBusy = "moving" | "added" | "removing" | null

export default function DashboardWishlistPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { wishlistItems, removeFromWishlist, loading: wishlistLoading } = useWishlist()
  const { addToCart } = useCart()

  const [busy, setBusy] = useState<Record<number, ItemBusy>>({})
  const [stockInfo, setStockInfo] = useState<Record<number, number>>({})
  const [announcement, setAnnouncement] = useState<string>("")

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (wishlistItems.length === 0) return
    let cancelled = false
    async function fetchStock() {
      const next: Record<number, number> = {}
      await Promise.all(
        wishlistItems.map(async (item) => {
          try {
            const res = await fetch(`/api/products/${item.productId}`)
            if (res.ok) {
              const data = await res.json()
              next[item.productId] = data.product?.stockQuantity ?? 0
            } else {
              next[item.productId] = 0
            }
          } catch {
            next[item.productId] = 0
          }
        })
      )
      if (!cancelled) setStockInfo(next)
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

  async function handleAddToCart(item: WishlistItem) {
    setItemBusy(item.id, "moving")
    try {
      const ok = await addToCart(item.productId, 1)
      if (ok) {
        setItemBusy(item.id, "added")
        setAnnouncement(`${item.product.name} added to cart`)
        await new Promise((resolve) => setTimeout(resolve, 550))
        await removeFromWishlist(item.productId)
      } else {
        setItemBusy(item.id, null)
      }
    } catch {
      setItemBusy(item.id, null)
    }
  }

  async function handleRemove(item: WishlistItem) {
    setItemBusy(item.id, "removing")
    setAnnouncement(`${item.product.name} removed from wishlist`)
    try {
      await new Promise((resolve) => setTimeout(resolve, 240))
      await removeFromWishlist(item.productId)
    } finally {
      setItemBusy(item.id, null)
    }
  }

  if (!user || authLoading || wishlistLoading) {
    return (
      <main className="flex flex-col gap-6">
        <WishlistHeader savedCount={0} loading />
        <SkeletonGrid />
      </main>
    )
  }

  if (wishlistItems.length === 0) {
    return (
      <main className="flex flex-col gap-6">
        <WishlistHeader savedCount={0} />
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-5 p-10 text-center sm:p-16">
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full ring-1 ring-border"
              />
              <span
                aria-hidden
                className="absolute -inset-2 rounded-full ring-1 ring-border/40"
              />
              <Heart className="h-6 w-6" />
              <Sparkles
                aria-hidden
                className="absolute -right-1 -top-1 h-4 w-4 text-amber-500"
              />
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
    <main className="flex flex-col gap-6">
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
      <WishlistHeader savedCount={wishlistItems.length} />

      <Card className="shadow-sm">
        <CardHeader className="gap-1 p-4 sm:p-6">
          <CardTitle>Your saved items</CardTitle>
          <CardDescription>
            Move favourites to your cart, or remove what you no longer need.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {wishlistItems.map((item) => {
              const stock = stockInfo[item.productId]
              const stockKnown = typeof stock === "number"
              const isOut = stockKnown && stock <= 0
              const itemBusy = busy[item.id]
              const isAdding = itemBusy === "moving"
              const isAdded = itemBusy === "added"
              const isRemoving = itemBusy === "removing"
              const isBusy = isAdding || isAdded || isRemoving
              const imageUrl = item.product.imageUrls?.[0]

              const buttonLabel = isAdded
                ? "Added"
                : isAdding
                ? "Adding…"
                : isOut
                ? "Sold out"
                : "Add to cart"

              return (
                <li
                  key={item.id}
                  className={cn(
                    "group/card flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-[opacity,transform,box-shadow,border-color] duration-300 ease-out",
                    "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
                    "focus-within:border-foreground/20 focus-within:shadow-md",
                    isAdded && "border-emerald-500/40 shadow-md ring-1 ring-emerald-500/15",
                    isRemoving && "pointer-events-none scale-[0.96] opacity-0",
                    isAdding && !isAdded && "pointer-events-none"
                  )}
                >
                  <Link
                    href={`/products/${item.product.id}`}
                    className="relative block aspect-square w-full overflow-hidden bg-muted/40"
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
                          isAdded && "scale-[1.06]"
                        )}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <PackageX className="h-6 w-6" />
                      </div>
                    )}

                    {/* Subtle top gradient for badge legibility */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/15 to-transparent"
                    />

                    {/* Subtle bottom gradient on hover for action feedback */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
                    />

                    {/* Top-right remove */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleRemove(item)
                      }}
                      aria-label="Remove from wishlist"
                      disabled={isBusy}
                      className={cn(
                        "absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border bg-background/90 text-muted-foreground shadow-sm backdrop-blur",
                        "transition-all duration-200",
                        "opacity-90 hover:scale-105 hover:bg-background hover:text-destructive hover:opacity-100",
                        "focus-visible:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/40",
                        "disabled:opacity-50"
                      )}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>

                    {/* Stock badge overlay */}
                    {stockKnown && (
                      <div className="absolute left-2 top-2">
                        <StockBadge stock={stock} />
                      </div>
                    )}

                    {/* Success overlay */}
                    {isAdded && (
                      <div
                        aria-hidden
                        className="absolute inset-0 flex items-center justify-center bg-emerald-500/15 backdrop-blur-[2px] transition-opacity duration-200"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                          <Check className="h-6 w-6" strokeWidth={3} />
                        </span>
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/products/${item.product.id}`}
                        className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors hover:text-foreground hover:underline"
                      >
                        {item.product.name}
                      </Link>
                      {item.product.category?.name && (
                        <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
                          {item.product.category.name}
                        </p>
                      )}
                    </div>

                    <p className="mt-auto text-sm font-semibold tabular-nums text-foreground sm:text-base">
                      {formatCurrency(item.product.price)}
                    </p>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant={isOut ? "secondary" : isAdded ? "secondary" : "default"}
                        disabled={isOut || isBusy}
                        onClick={() => handleAddToCart(item)}
                        className={cn(
                          "flex-1 gap-1.5 transition-colors",
                          isAdded &&
                            "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400"
                        )}
                      >
                        {isAdding ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isAdded ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <ShoppingCart className="h-3.5 w-3.5" />
                        )}
                        <span className="truncate">{buttonLabel}</span>
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleRemove(item)}
                        disabled={isBusy}
                        aria-label="Remove from wishlist"
                        className="text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive active:scale-90"
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
            })}
          </ul>
        </CardContent>
      </Card>
    </main>
  )
}

function WishlistHeader({
  savedCount,
  loading,
}: {
  savedCount: number
  loading?: boolean
}) {
  return (
    <header className="flex items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
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
      <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
        <Link href="/products" aria-label="Browse products">
          <ShoppingBag className="h-4 w-4" />
          <span className="hidden sm:inline">Browse products</span>
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
    <Card className="shadow-sm">
      <CardHeader className="gap-1 p-4 sm:p-6">
        <CardTitle>Your saved items</CardTitle>
        <CardDescription>Loading your wishlist…</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="flex flex-col overflow-hidden rounded-lg border bg-card"
            >
              <div className="aspect-square w-full animate-pulse bg-muted/60" />
              <div className="flex flex-col gap-2 p-3 sm:p-4">
                <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted/70" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted/60" />
                <div className="mt-2 h-8 w-full animate-pulse rounded bg-muted/60" />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
