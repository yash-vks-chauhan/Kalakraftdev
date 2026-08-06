"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid } from "lucide-react"

import { cn } from "@/lib/utils"
import type { User as AuthUser } from "../../contexts/AuthContext"
import { useCart } from "../../contexts/CartContext"
import { useWishlist } from "../../contexts/WishlistContext"
import {
  adminNav,
  isActive,
  isTabActive,
  tabsForRole,
  userNav,
  type NavKey,
} from "./nav-config"

function formatCount(count: number) {
  if (count <= 0) return null
  return count > 99 ? "99+" : count.toString()
}

interface BottomTabBarProps {
  user: AuthUser
  /** Opens the command palette, which holds everything the tabs don't. */
  onOpenCommand: () => void
  commandOpen: boolean
}

/**
 * Persistent bottom navigation — the piece that makes the dashboard read as an
 * app rather than a shrunken website. Previously every jump between sections
 * cost two taps (hamburger, wait for the drawer, tap); the four most-used
 * destinations are now one thumb-tap away.
 *
 * Tabs are role-aware (see tabsForRole): admins get store-management
 * destinations, customers get shopping ones. The fifth slot opens the command
 * palette rather than a second menu.
 */
export function BottomTabBar({
  user,
  onOpenCommand,
  commandOpen,
}: BottomTabBarProps) {
  const pathname = usePathname() ?? "/dashboard"
  const { cartItems } = useCart()
  const { wishlistItems } = useWishlist()

  const isAdmin = user.role === "admin"
  const tabs = tabsForRole(isAdmin)

  const counts: Record<NavKey, number> = {
    cart: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    wishlist: wishlistItems.length,
  }

  // Light the fifth slot when the current route lives outside the tabs, so the
  // bar never shows an empty selection.
  const offTabRoute =
    !tabs.some((tab) => isTabActive(pathname, tab)) &&
    [...userNav, ...adminNav].some((i) => isActive(pathname, i.href, i.exact))
  const browseActive = offTabRoute || commandOpen

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md",
        "supports-[backdrop-filter]:bg-background/85 lg:hidden"
      )}
    >
      <div className="flex h-14 items-stretch">
        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab)
          const Icon = tab.icon
          const count = tab.countKey ? counts[tab.countKey] : 0
          const countLabel = formatCount(count)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex flex-1 flex-col items-center justify-center gap-1",
                "transition-colors duration-150 active:bg-secondary/60",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <span className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    "h-[22px] w-[22px] transition-transform duration-200",
                    active && "scale-105"
                  )}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                {countLabel && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -right-2.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center",
                      "rounded-full border-2 border-background bg-foreground px-1",
                      "text-[10px] font-semibold leading-none tabular-nums text-background"
                    )}
                  >
                    {countLabel}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-[11px] leading-none tracking-tight",
                  active ? "font-semibold" : "font-medium"
                )}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={onOpenCommand}
          aria-label="Browse and search all pages"
          aria-expanded={commandOpen}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1",
            "transition-colors duration-150 active:bg-secondary/60",
            browseActive ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <LayoutGrid
            className="h-[22px] w-[22px]"
            strokeWidth={browseActive ? 2.4 : 1.8}
          />
          <span
            className={cn(
              "text-[11px] leading-none tracking-tight",
              browseActive ? "font-semibold" : "font-medium"
            )}
          >
            Browse
          </span>
        </button>
      </div>
      {/* Home-indicator clearance */}
      <div className="h-safe-bottom" />
    </nav>
  )
}
