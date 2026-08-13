import {
  AlertTriangle,
  Boxes,
  Heart,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageSquarePlus,
  Package,
  PackagePlus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Tag,
  User,
  Users,
  type LucideIcon,
} from "lucide-react"

export type NavKey = "cart" | "wishlist"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Match the pathname exactly instead of by prefix. */
  exact?: boolean
  /** Live count rendered as a badge. */
  countKey?: NavKey
  /** Secondary line, used by the sidebar and the command sheet. */
  description?: string
  /**
   * Extra terms the command palette matches on, so people find a page by the
   * word they actually have in mind ("discount" → Coupons, "refund" → Orders)
   * rather than having to guess our label.
   */
  keywords?: string[]
}

export const userNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
    description: "Your account at a glance",
    keywords: ["home", "dashboard", "summary", "start"],
  },
  {
    href: "/dashboard/orders",
    label: "Orders",
    icon: Package,
    description: "Track and review past orders",
    keywords: ["purchases", "history", "tracking", "delivery", "refund", "invoice"],
  },
  {
    href: "/dashboard/wishlist",
    label: "Wishlist",
    icon: Heart,
    countKey: "wishlist",
    description: "Items you've saved for later",
    keywords: ["saved", "favourites", "favorites", "liked"],
  },
  {
    href: "/dashboard/cart",
    label: "Cart",
    icon: ShoppingCart,
    countKey: "cart",
    description: "Continue your checkout",
    keywords: ["basket", "bag", "checkout", "buy"],
  },
  {
    href: "/dashboard/support",
    label: "Support",
    icon: LifeBuoy,
    description: "Open a ticket or browse FAQs",
    keywords: ["help", "ticket", "contact", "issue", "problem", "faq"],
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: User,
    description: "Personal details and security",
    keywords: ["account", "settings", "password", "address", "email", "avatar"],
  },
]

export const adminNav: NavItem[] = [
  {
    href: "/dashboard/admin/orders",
    label: "All Orders",
    icon: ShoppingBag,
    description: "Manage orders and statuses",
    keywords: ["sales", "customers", "fulfilment", "fulfillment", "shipping", "status"],
  },
  {
    href: "/dashboard/admin/products",
    label: "Products",
    icon: Boxes,
    description: "Listings, pricing and inventory",
    keywords: ["catalog", "catalogue", "inventory", "stock", "listings", "items", "price"],
  },
  {
    href: "/dashboard/admin/products/low-stock",
    label: "Low Stock",
    icon: AlertTriangle,
    description: "Items at or below threshold",
    keywords: ["restock", "inventory", "running out", "sold out", "reorder"],
  },
  {
    href: "/dashboard/admin/users",
    label: "Users",
    icon: Users,
    description: "Roles, access and accounts",
    keywords: ["customers", "accounts", "roles", "admins", "people", "permissions"],
  },
  {
    href: "/dashboard/admin/coupons",
    label: "Coupons",
    icon: Tag,
    description: "Discount codes and campaigns",
    keywords: ["discount", "promo", "voucher", "offer", "sale", "code"],
  },
  {
    href: "/dashboard/admin/reviews",
    label: "Reviews",
    icon: Star,
    description: "Moderate ratings and feedback",
    keywords: ["ratings", "feedback", "comments", "stars", "moderation"],
  },
  {
    href: "/dashboard/admin/support",
    label: "Support",
    icon: LifeBuoy,
    description: "Tickets from customers",
    keywords: ["tickets", "helpdesk", "inbox", "queries", "complaints"],
  },
]

/* ---------------------------------------------------------------- */
/* Bottom tab bar                                                    */
/* ---------------------------------------------------------------- */

export interface TabItem {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  countKey?: NavKey
}

/**
 * The four routed tabs; the bar renders a fifth slot that opens the command
 * palette. Role-aware, because an admin's primary job is running the store:
 * their tabs point at management destinations and the shopping pages move
 * into the palette (and vice versa for customers).
 */
export function tabsForRole(isAdmin: boolean): TabItem[] {
  if (isAdmin) {
    return [
      { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/dashboard/admin/products", label: "Products", icon: Boxes },
      { href: "/dashboard/admin/users", label: "Users", icon: Users },
    ]
  }
  return [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/orders", label: "Orders", icon: Package },
    { href: "/dashboard/wishlist", label: "Saved", icon: Heart, countKey: "wishlist" },
    { href: "/dashboard/cart", label: "Cart", icon: ShoppingCart, countKey: "cart" },
  ]
}

/* ---------------------------------------------------------------- */
/* Quick actions (command palette)                                   */
/* ---------------------------------------------------------------- */

export interface QuickAction {
  id: string
  label: string
  icon: LucideIcon
  keywords?: string[]
  /** Navigation actions carry an href; behavioural ones are handled by id. */
  href?: string
}

/**
 * Verbs rather than places. These are the things people open the dashboard
 * *to do*, so surfacing them alongside destinations removes the "which page
 * was that on again?" step entirely.
 */
export function quickActionsForRole(isAdmin: boolean): QuickAction[] {
  const actions: QuickAction[] = []

  if (isAdmin) {
    actions.push({
      id: "new-product",
      label: "Add a new product",
      icon: PackagePlus,
      href: "/dashboard/admin/products/new",
      keywords: ["create", "add", "upload", "list", "new item"],
    })
  }

  actions.push(
    {
      id: "new-ticket",
      label: "Contact support",
      icon: MessageSquarePlus,
      href: "/dashboard/support/new",
      keywords: ["help", "ticket", "raise", "issue", "problem", "ask"],
    },
    {
      id: "search-products",
      label: "Search the catalogue",
      icon: Search,
      keywords: ["find", "product", "browse", "look up", "shop"],
    },
    {
      id: "view-store",
      label: "View store",
      icon: Store,
      href: "/",
      keywords: ["shop", "storefront", "homepage", "site"],
    },
    {
      id: "sign-out",
      label: "Sign out",
      icon: LogOut,
      keywords: ["logout", "log out", "exit", "leave"],
    }
  )

  return actions
}

/* ---------------------------------------------------------------- */
/* Active state + page titles                                        */
/* ---------------------------------------------------------------- */

export function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + "/")
}

/**
 * A tab stays lit while you're anywhere beneath it, but "/dashboard" would
 * otherwise swallow every route, and admin sub-paths must not light up the
 * customer-facing equivalents.
 */
export function isTabActive(pathname: string, tab: TabItem) {
  if (tab.exact) return pathname === tab.href
  // Guard the boundary so "/dashboard/orders2" never matches
  // "/dashboard/orders". Admin vs customer paths differ by prefix already.
  return pathname === tab.href || pathname.startsWith(tab.href + "/")
}

interface TitleRule {
  /** Matched against the pathname in order; first hit wins. */
  test: (path: string) => boolean
  title: string
  /** Detail views get a back chevron instead of a flush-left title. */
  detail?: boolean
  /**
   * The page renders its own large title, so the bar holds its title back until
   * that one has scrolled away. Opt-in: on every other page the bar is the only
   * place the title appears, and hiding it would leave the header blank.
   */
  collapsingTitle?: boolean
}

const TITLE_RULES: TitleRule[] = [
  { test: (p) => p === "/dashboard", title: "Overview", collapsingTitle: true },

  // Customer
  { test: (p) => /^\/dashboard\/orders\/[^/]+$/.test(p), title: "Order details", detail: true },
  { test: (p) => p === "/dashboard/orders", title: "Orders" },
  { test: (p) => p === "/dashboard/wishlist", title: "Wishlist" },
  { test: (p) => p === "/dashboard/cart", title: "Cart" },
  { test: (p) => p === "/dashboard/support/new", title: "New ticket", detail: true },
  { test: (p) => /^\/dashboard\/support\/ticket\/[^/]+$/.test(p), title: "Ticket", detail: true },
  { test: (p) => p === "/dashboard/support", title: "Support" },
  { test: (p) => p === "/dashboard/profile", title: "Profile" },

  // Admin
  { test: (p) => p === "/dashboard/admin/orders", title: "All orders" },
  { test: (p) => p === "/dashboard/admin/products/new", title: "New product", detail: true },
  { test: (p) => p === "/dashboard/admin/products/low-stock", title: "Low stock", detail: true },
  { test: (p) => p === "/dashboard/admin/products/highest-rated", title: "Highest rated", detail: true },
  { test: (p) => /^\/dashboard\/admin\/products\/[^/]+$/.test(p), title: "Edit product", detail: true },
  { test: (p) => p === "/dashboard/admin/products", title: "Products", collapsingTitle: true },
  { test: (p) => p === "/dashboard/admin/users", title: "Users" },
  { test: (p) => p === "/dashboard/admin/coupons", title: "Coupons" },
  { test: (p) => p === "/dashboard/admin/reviews", title: "Reviews" },
  { test: (p) => /^\/dashboard\/admin\/support\/[^/]+$/.test(p), title: "Ticket", detail: true },
  { test: (p) => p === "/dashboard/admin/support", title: "Support tickets" },
]

export function pageMetaFor(pathname: string): {
  title: string
  detail: boolean
  collapsingTitle: boolean
} {
  for (const rule of TITLE_RULES) {
    if (rule.test(pathname)) {
      return {
        title: rule.title,
        detail: Boolean(rule.detail),
        collapsingTitle: Boolean(rule.collapsingTitle),
      }
    }
  }
  return { title: "Dashboard", detail: false, collapsingTitle: false }
}
