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
import type { User as AuthUser } from "../../contexts/AuthContext"

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean }
type NavSection = { label: string; items: NavItem[] }

const userNav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/orders", label: "Orders", icon: Package },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/dashboard/cart", label: "Cart", icon: ShoppingCart },
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

function NavGroup({ label, items, pathname, onNavigate, collapsed }: {
  label?: string
  items: NavItem[]
  pathname: string
  onNavigate?: () => void
  collapsed?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && !collapsed && (
        <p className="px-3 pb-2 pt-4 text-xs font-medium text-muted-foreground/80">
          {label}
        </p>
      )}
      {label && collapsed && (
        <div className="mx-2 my-2 h-px bg-border" aria-hidden />
      )}
      {items.map((item) => {
        const active = isActive(pathname, item.href, item.exact)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            aria-label={collapsed ? item.label : undefined}
            className={cn(
              "group relative flex items-center rounded-md text-sm transition-colors",
              collapsed
                ? "h-10 w-10 justify-center mx-auto"
                : "gap-3 px-3 py-2.5",
              active
                ? "bg-secondary text-foreground font-medium"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0",
                active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            {!collapsed && <span className="truncate">{item.label}</span>}
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

  return (
    <div className="flex h-full flex-col">
      {/* Brand + collapse toggle */}
      <div
        className={cn(
          "flex h-16 items-center border-b",
          collapsed ? "justify-center px-2" : "justify-between px-5"
        )}
      >
        {!collapsed && (
          <Link
            href="/"
            onClick={onNavigate}
            className="text-base font-semibold tracking-tight text-foreground"
          >
            Kalakraft
          </Link>
        )}
        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar (⌘B)" : "Collapse sidebar (⌘B)"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto pb-4",
          collapsed ? "px-2 pt-3" : "px-3"
        )}
      >
        <NavGroup
          items={userNav}
          pathname={pathname}
          onNavigate={onNavigate}
          collapsed={collapsed}
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
      <div
        className={cn(
          "flex items-center border-t",
          collapsed
            ? "flex-col gap-2 px-2 py-3"
            : "gap-3 px-4 py-4"
        )}
      >
        <Avatar
          className={cn("border", collapsed ? "h-8 w-8" : "h-9 w-9")}
          title={collapsed ? user.fullName : undefined}
        >
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
          <AvatarFallback className="bg-secondary text-xs font-medium text-foreground">
            {initialsOf(user.fullName)}
          </AvatarFallback>
        </Avatar>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        )}

        <button
          type="button"
          onClick={onLogout}
          aria-label="Log out"
          title={collapsed ? "Log out" : undefined}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
