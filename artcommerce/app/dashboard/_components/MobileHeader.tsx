"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronLeft, Search, ShoppingCart } from "lucide-react"

import { cn } from "@/lib/utils"
import { useCart } from "../../contexts/CartContext"
import { pageMetaFor } from "./nav-config"

interface MobileHeaderProps {
  onOpenCommand: () => void
}

/**
 * The mobile app bar. Replaces the previous stub (hamburger + logo only),
 * which gave every screen an identical top bar and left mobile users with no
 * search and no cart access — both were desktop-only.
 *
 * There is deliberately no hamburger: navigation lives in the bottom tab bar
 * (primary) and the command palette (everything else). The left slot is a
 * back chevron on nested routes and empty at the top level, so the title sits
 * flush left the way a native app bar does.
 */
export function MobileHeader({ onOpenCommand }: MobileHeaderProps) {
  const pathname = usePathname() ?? "/dashboard"
  const router = useRouter()
  const { cartItems } = useCart()
  const { title, detail } = pageMetaFor(pathname)

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 lg:hidden">
      {/* Notch clearance — app/layout.tsx sets viewport-fit=cover */}
      <div className="pt-safe" />
      <div className="flex h-14 items-center gap-1 px-2">
        {detail && (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="-ml-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors active:bg-secondary"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <h1
          className={cn(
            "min-w-0 flex-1 truncate text-[17px] font-semibold tracking-tight text-foreground",
            detail ? "px-1" : "pl-2"
          )}
        >
          {title}
        </h1>

        <button
          type="button"
          onClick={onOpenCommand}
          aria-label="Search pages and actions"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors active:bg-secondary"
        >
          <Search className="h-[21px] w-[21px]" />
        </button>

        <Link
          href="/dashboard/cart"
          aria-label={
            cartCount > 0
              ? `Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`
              : "Cart"
          }
          className="relative -mr-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors active:bg-secondary"
        >
          <ShoppingCart className="h-[21px] w-[21px]" />
          {cartCount > 0 && (
            <span
              aria-hidden
              className={cn(
                "absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center",
                "rounded-full border-2 border-background bg-foreground px-1",
                "text-[10px] font-semibold leading-none tabular-nums text-background"
              )}
            >
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
