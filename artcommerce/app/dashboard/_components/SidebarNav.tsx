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
} from "lucide-react"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
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

function NavGroup({ label, items, pathname, onNavigate }: {
  label?: string
  items: NavItem[]
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <p className="px-3 pb-1 pt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      )}
      {items.map((item) => {
        const active = isActive(pathname, item.href, item.exact)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-secondary text-foreground font-medium"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            <span className="truncate">{item.label}</span>
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
}

export function SidebarNav({ user, onLogout, onNavigate }: SidebarNavProps) {
  const pathname = usePathname() ?? "/dashboard"
  const isAdmin = user.role === "admin"

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-14 items-center px-5">
        <Link href="/" onClick={onNavigate} className="text-sm font-semibold tracking-tight text-foreground">
          Artcommerce
        </Link>
      </div>
      <Separator />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavGroup items={userNav} pathname={pathname} onNavigate={onNavigate} />
        {isAdmin && (
          <NavGroup
            label="Admin"
            items={adminNav}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        )}
      </nav>

      <Separator />

      {/* User footer */}
      <div className="flex items-center gap-3 p-3">
        <Avatar className="h-9 w-9 border">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
          <AvatarFallback className="bg-secondary text-xs font-medium text-foreground">
            {initialsOf(user.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{user.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
