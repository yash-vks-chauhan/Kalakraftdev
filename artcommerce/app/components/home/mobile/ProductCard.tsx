"use client"

import { useState } from "react"
import Link from "next/link"
import { Heart, Loader2, Plus, Star } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "../../../contexts/AuthContext"
import { useCart } from "../../../contexts/CartContext"
import { useWishlist } from "../../../contexts/WishlistContext"
import { LOW_STOCK, firstImage, formatPrice, type MobileProduct } from "./types"
import { grain } from "./Pour"

/**
 * The card answers the four questions a shopper actually has — what is it,
 * what does it cost, is it any good, can I still get one — and then lets them
 * act without leaving the page. CartItem is product + quantity with no
 * variants, so one tap is a complete action.
 *
 * Both actions hit the real contexts, which raise their own notifications —
 * on a phone those arrive as the black pill above the dock. Nothing here
 * toasts on success, or every tap would confirm itself twice.
 */
export function ProductCard({
  product,
  rank,
  priority,
}: {
  product: MobileProduct
  /** Only the best-sellers rail passes this; elsewhere a number means nothing. */
  rank?: number
  priority?: boolean
}) {
  const image = firstImage(product.imageUrls)
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { user } = useAuth()
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  // The heart used to be local state, so it forgot itself on every navigation
  // and never reached the wishlist the dock counts.
  const saved = isInWishlist(product.id)

  const outOfStock = product.stockQuantity <= 0
  const lowStock = !outOfStock && product.stockQuantity <= LOW_STOCK
  const rating = product.avgRating ?? 0

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (adding) return
    // addToCart throws before it can notify anyone when there is no token, so
    // a guest would otherwise get "could not add" for something that is really
    // just a sign-in.
    if (!user) {
      toast("Sign in to add to cart")
      return
    }
    setAdding(true)
    try {
      await addToCart(product.id, 1)
    } catch {
      toast.error("Could not add that to your cart")
    } finally {
      setAdding(false)
    }
  }

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (saving) return
    if (!user) {
      toast("Sign in to save pieces")
      return
    }
    setSaving(true)
    try {
      if (saved) await removeFromWishlist(product.id)
      else await addToWishlist(product.id)
    } catch {
      toast.error("Could not update your saved list")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Link href={`/products/${product.id}`} className="group flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-[calc(var(--radius)+4px)] border transition-transform duration-200 group-active:scale-[0.985]">
        <AspectRatio ratio={1}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className={cn("h-full w-full object-cover", grain)}
            />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </AspectRatio>

        {typeof rank === "number" && (
          <Badge className="absolute left-2 top-2 h-5 rounded-full px-2 text-[9.5px] tabular-nums">
            {String(rank).padStart(2, "0")}
          </Badge>
        )}

        <button
          type="button"
          onClick={handleSave}
          aria-pressed={saved}
          disabled={saving}
          aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
          className={cn(
            "absolute right-1.5 top-1.5 flex h-10 w-10 items-center justify-center rounded-full",
            "text-stone-600 transition-transform active:scale-90"
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 backdrop-blur">
            <Heart className={cn("h-4 w-4", saved && "fill-red-600 text-red-600")} />
          </span>
        </button>

        {(lowStock || outOfStock) && (
          <Badge
            variant="secondary"
            className="absolute bottom-2 left-2 h-5 rounded-full bg-background/92 px-2 text-[9.5px] font-semibold uppercase tracking-wide backdrop-blur"
          >
            {outOfStock ? "Made to order" : `${product.stockQuantity} left`}
          </Badge>
        )}
      </div>

      <span className="line-clamp-2 min-h-[34px] text-[12.5px] leading-[1.35]">
        {product.name}
      </span>

      <span className="flex items-baseline gap-2">
        <b className="text-sm font-semibold tracking-[-0.015em] tabular-nums">
          {formatPrice(product.price)}
        </b>
        {rating > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Star className="h-3 w-3 fill-current" />
            {rating.toFixed(1)}
            {product.ratingCount ? ` · ${product.ratingCount}` : ""}
          </span>
        )}
      </span>

      <Button
        variant="outline"
        onClick={handleAdd}
        disabled={adding}
        className="h-9 w-full gap-1.5 text-xs font-medium"
      >
        {adding ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
        {outOfStock ? "Enquire" : "Add to cart"}
      </Button>
    </Link>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="aspect-square w-full rounded-[calc(var(--radius)+4px)]" />
      <Skeleton className="h-3 w-4/5 rounded" />
      <Skeleton className="h-3 w-2/5 rounded" />
      <Skeleton className="h-9 w-full rounded-[var(--radius)]" />
    </div>
  )
}
