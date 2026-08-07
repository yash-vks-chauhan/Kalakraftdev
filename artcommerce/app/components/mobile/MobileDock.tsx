"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, Home, LayoutGrid, ShoppingBag } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "../../contexts/AuthContext"
import { useCart } from "../../contexts/CartContext"
import { useWishlist } from "../../contexts/WishlistContext"

/**
 * The single mobile navigation surface for the whole app.
 *
 * Four targets, each of them a place rather than an action: search lives in
 * the header, where a thumb looks for it while browsing, and the slot it used
 * to occupy here buys a browse destination and saved items. Home is always
 * home — the previous version turned it into Dashboard inside /dashboard,
 * which made the leftmost target mean two different things.
 */

interface DockTarget {
  key: string
  label: string
  href: string
  icon: typeof Home
  /** Active when the path starts with one of these. */
  match: string[]
  count?: number
}

export function MobileDock() {
  const pathname = usePathname() ?? "/"
  const { user } = useAuth()
  const { cartItems } = useCart()
  const { wishlistItems } = useWishlist()
  const [hidden, setHidden] = useState(false)

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)

  const targets: DockTarget[] = [
    { key: "home", label: "Home", href: "/", icon: Home, match: ["/"] },
    { key: "shop", label: "Shop", href: "/products", icon: LayoutGrid, match: ["/products"] },
    {
      key: "saved",
      label: "Saved",
      href: user ? "/dashboard/wishlist" : "/auth/login",
      icon: Heart,
      match: ["/dashboard/wishlist"],
      count: wishlistItems.length,
    },
    {
      key: "cart",
      label: "Cart",
      href: user ? "/dashboard/cart" : "/cart",
      icon: ShoppingBag,
      match: ["/cart", "/dashboard/cart"],
      count: cartCount,
    },
  ]

  // Get out of the way when scrolling down, come back on the way up — on a
  // phone the content matters more than the chrome.
  useEffect(() => {
    let lastY = window.scrollY
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const y = window.scrollY
        const delta = y - lastY
        if (Math.abs(delta) > 6) {
          setHidden(delta > 0 && y > 120)
          lastY = y
        }
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  // Never leave it hidden after a route change.
  useEffect(() => {
    setHidden(false)
  }, [pathname])

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 lg:hidden",
        "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        hidden ? "translate-y-[150%]" : "translate-y-0"
      )}
      style={{ paddingBottom: "calc(14px + env(safe-area-inset-bottom, 0px))" }}
    >
      <nav
        aria-label="Primary"
        className={cn(
          "pointer-events-auto flex w-full max-w-[340px] items-center gap-1 rounded-full border p-1.5",
          "bg-background/85 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.22)] backdrop-blur-xl backdrop-saturate-150",
          "supports-[backdrop-filter]:bg-background/80"
        )}
      >
        {targets.map((target) => {
          const active = target.match.some((m) =>
            m === "/" ? pathname === "/" : pathname.startsWith(m)
          )
          const Icon = target.icon
          return (
            <Link
              key={target.key}
              href={target.href}
              aria-current={active ? "page" : undefined}
              aria-label={
                target.count
                  ? `${target.label}, ${target.count} item${target.count === 1 ? "" : "s"}`
                  : target.label
              }
              className={cn(
                "flex h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full",
                "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active ? "text-foreground" : "text-muted-foreground active:bg-secondary"
              )}
            >
              <span className="relative flex">
                <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.2 : 1.9} />
                {target.count ? (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -top-[9px] left-[11px] flex h-4 min-w-4 items-center justify-center",
                      "rounded-full border-2 border-background bg-foreground px-1",
                      "text-[9.5px] font-bold leading-none tabular-nums text-background"
                    )}
                  >
                    {target.count > 99 ? "99+" : target.count}
                  </span>
                ) : null}
              </span>
              <small className="text-[9.5px] font-medium leading-none">{target.label}</small>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
