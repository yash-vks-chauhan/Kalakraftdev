"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LayoutGrid, Search, ShoppingBag } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "../../contexts/AuthContext"
import { useCart } from "../../contexts/CartContext"
import { CommandPalette } from "./CommandPalette"

/**
 * The single mobile navigation surface for the whole app.
 *
 * Replaces two unrelated systems: a hamburger drawer on the storefront and a
 * full-width tab bar in the dashboard, which swapped under you at the
 * /dashboard boundary. A floating dock reads as one product on both sides,
 * takes less vertical space than a full-width bar, and lets the page content
 * run underneath it rather than being boxed in.
 *
 * Three targets only — anything deeper lives one tap away in the palette,
 * which searches products, pages and actions together.
 */
export function MobileDock() {
  const pathname = usePathname() ?? "/"
  const { user } = useAuth()
  const { cartItems } = useCart()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [hidden, setHidden] = useState(false)

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  const inDashboard = pathname.startsWith("/dashboard")

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
    setPaletteOpen(false)
  }, [pathname])

  const homeHref = inDashboard ? "/dashboard" : "/"
  const HomeIcon = inDashboard ? LayoutGrid : Home
  const homeActive = pathname === "/" || pathname === "/dashboard"

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-3 lg:hidden",
          "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          hidden ? "translate-y-[140%]" : "translate-y-0"
        )}
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <nav
          aria-label="Primary"
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-center gap-1 rounded-full border",
            "bg-background/80 p-1.5 shadow-lg shadow-black/[0.08] backdrop-blur-xl",
            "supports-[backdrop-filter]:bg-background/70"
          )}
        >
          <Link
            href={homeHref}
            aria-label={inDashboard ? "Dashboard" : "Home"}
            aria-current={homeActive ? "page" : undefined}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              homeActive
                ? "bg-foreground text-background"
                : "text-muted-foreground active:bg-secondary"
            )}
          >
            <HomeIcon className="h-[19px] w-[19px]" strokeWidth={homeActive ? 2.3 : 1.9} />
          </Link>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search products, pages and actions"
            aria-expanded={paletteOpen}
            className={cn(
              "flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full px-3.5",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "text-left text-muted-foreground transition-colors active:bg-secondary"
            )}
          >
            <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
            <span className="truncate text-[14px] font-medium">Search</span>
          </button>

          <Link
            href={user ? "/dashboard/cart" : "/cart"}
            aria-label={
              cartCount > 0
                ? `Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`
                : "Cart"
            }
            className={cn(
              "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "text-muted-foreground transition-colors active:bg-secondary"
            )}
          >
            <ShoppingBag className="h-[19px] w-[19px]" strokeWidth={1.9} />
            {cartCount > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center",
                  "rounded-full border-2 border-background bg-foreground px-1",
                  "text-[10px] font-semibold leading-none tabular-nums text-background"
                )}
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </nav>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  )
}
