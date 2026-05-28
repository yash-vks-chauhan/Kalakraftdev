"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  User,
  Package,
  Heart,
  ShoppingCart,
  LifeBuoy,
  ShoppingBag,
  Users,
  Tag,
  Star,
  AlertTriangle,
  Boxes,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { User as AuthUser } from "../../contexts/AuthContext"
import { useCart } from "../../contexts/CartContext"
import { useWishlist } from "../../contexts/WishlistContext"

type NavKey = "cart" | "wishlist"
type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  countKey?: NavKey
}

const userNav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/orders", label: "Orders", icon: Package },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart, countKey: "wishlist" },
  { href: "/dashboard/cart", label: "Cart", icon: ShoppingCart, countKey: "cart" },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
  { href: "/dashboard/profile", label: "Profile", icon: User },
]

const adminNav: NavItem[] = [
  { href: "/dashboard/admin/orders", label: "All Orders", icon: ShoppingBag },
  { href: "/dashboard/admin/products", label: "Products", icon: Boxes },
  { href: "/dashboard/admin/products/low-stock", label: "Low Stock", icon: AlertTriangle },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/dashboard/admin/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/admin/support", label: "Support", icon: LifeBuoy },
]

// Apple-like spring easing + staggered fades so labels disappear before the
// sidebar width shrinks and reappear after it has opened.
const LABEL_FADE = "transition-[opacity,transform] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[opacity,transform]"
const LABEL_HIDDEN = "duration-[140ms] opacity-0 -translate-x-1 pointer-events-none"
const LABEL_VISIBLE = "duration-[220ms] delay-[140ms] opacity-100 translate-x-0"

function initialsOf(name?: string) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + "/")
}

function formatBadgeCount(count: number) {
  if (count <= 0) return null
  return count > 99 ? "99+" : count.toString()
}

function NavGroup({ label, items, pathname, onNavigate, collapsed, counts }: {
  label?: string
  items: NavItem[]
  pathname: string
  onNavigate?: () => void
  collapsed?: boolean
  counts?: Partial<Record<NavKey, number>>
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <div className="relative mt-3 mb-1 h-6">
          <p
            className={cn(
              "absolute inset-x-0 bottom-1 px-3 text-xs font-medium text-muted-foreground/80 whitespace-nowrap",
              LABEL_FADE,
              collapsed ? LABEL_HIDDEN : LABEL_VISIBLE
            )}
          >
            {label}
          </p>
          <div
            className={cn(
              "absolute inset-x-2 bottom-2 h-px bg-border transition-opacity ease-[cubic-bezier(0.32,0.72,0,1)]",
              collapsed
                ? "duration-[220ms] delay-[140ms] opacity-100"
                : "duration-[140ms] opacity-0"
            )}
            aria-hidden
          />
        </div>
      )}
      {items.map((item) => {
        const active = isActive(pathname, item.href, item.exact)
        const Icon = item.icon
        const rawCount = item.countKey ? counts?.[item.countKey] ?? 0 : 0
        const countLabel = formatBadgeCount(rawCount)
        const titleWithCount =
          countLabel && collapsed ? `${item.label} (${rawCount})` : item.label
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? titleWithCount : undefined}
            aria-label={
              collapsed && countLabel
                ? `${item.label}, ${rawCount} ${rawCount === 1 ? "item" : "items"}`
                : collapsed
                ? item.label
                : undefined
            }
            className={cn(
              "group relative flex h-10 items-center overflow-hidden rounded-md whitespace-nowrap transition-colors duration-150",
              active
                ? "bg-secondary text-foreground font-medium"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
              <Icon
                className={cn(
                  "h-[18px] w-[18px] transition-colors",
                  active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {countLabel && (
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute right-1 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-background bg-foreground px-1 text-[9px] font-semibold leading-none tabular-nums text-background shadow-sm",
                    "transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
                    collapsed
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-75"
                  )}
                >
                  {countLabel}
                </span>
              )}
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                LABEL_FADE,
                collapsed ? LABEL_HIDDEN : LABEL_VISIBLE
              )}
            >
              {item.label}
            </span>
            {countLabel && (
              <Badge
                variant={active ? "default" : "secondary"}
                aria-hidden
                className={cn(
                  "mr-2 h-5 min-w-[20px] justify-center rounded-full px-1.5 text-[10px] font-medium tabular-nums",
                  LABEL_FADE,
                  collapsed ? LABEL_HIDDEN : LABEL_VISIBLE
                )}
              >
                {countLabel}
              </Badge>
            )}
          </Link>
        )
      })}
    </div>
  )
}

export interface SidebarNavProps {
  user: AuthUser
  onLogout: () => void
  onNavigate?: () => void
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

export function SidebarNav({
  user,
  onLogout,
  onNavigate,
  collapsed = false,
  onToggleCollapsed,
}: SidebarNavProps) {
  const pathname = usePathname() ?? "/dashboard"
  const isAdmin = user.role === "admin"
  const { cartItems } = useCart()
  const { wishlistItems } = useWishlist()
  const userCounts: Partial<Record<NavKey, number>> = {
    cart: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    wishlist: wishlistItems.length,
  }

  return (
    <div className="flex h-full flex-col">
      {/* Brand + collapse toggle */}
      <div className="flex h-14 shrink-0 items-center overflow-hidden border-b pl-3">
        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar (⌘B)" : "Collapse sidebar (⌘B)"}
            className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground"
          >
            <PanelLeftClose
              className={cn(
                "absolute h-4 w-4 transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
                collapsed ? "opacity-0 -rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
              )}
            />
            <PanelLeftOpen
              className={cn(
                "absolute h-4 w-4 transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
                collapsed ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75"
              )}
            />
          </button>
        )}
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(
            "whitespace-nowrap text-base font-semibold tracking-tight text-foreground",
            onToggleCollapsed ? "ml-2" : "ml-1",
            LABEL_FADE,
            collapsed ? LABEL_HIDDEN : LABEL_VISIBLE
          )}
        >
          Kalakraft
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-2">
        <NavGroup
          items={userNav}
          pathname={pathname}
          onNavigate={onNavigate}
          collapsed={collapsed}
          counts={userCounts}
        />
        {isAdmin && (
          <NavGroup
            label="Admin"
            items={adminNav}
            pathname={pathname}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        )}
      </nav>

      {/* User footer */}
      <div className="flex h-16 shrink-0 items-center overflow-hidden border-t pl-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center">
          <Avatar
            className="h-9 w-9 border"
            title={collapsed ? user.fullName : undefined}
          >
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
            <AvatarFallback className="bg-secondary text-xs font-medium text-foreground">
              {initialsOf(user.fullName)}
            </AvatarFallback>
          </Avatar>
        </span>

        <div
          className={cn(
            "ml-2 min-w-0 flex-1",
            LABEL_FADE,
            collapsed ? LABEL_HIDDEN : LABEL_VISIBLE
          )}
        >
          <p className="truncate text-sm font-medium text-foreground">{user.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Log out"
          tabIndex={collapsed ? -1 : 0}
          className={cn(
            "mr-3 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground",
            LABEL_FADE,
            collapsed ? LABEL_HIDDEN : LABEL_VISIBLE
          )}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
