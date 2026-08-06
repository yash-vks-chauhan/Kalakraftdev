import { Home, LifeBuoy, Info, Sparkles } from "lucide-react"

import type { NavItem } from "../../dashboard/_components/nav-config"

/**
 * Storefront destinations for the shared command palette. The dashboard's
 * equivalents live in dashboard/_components/nav-config; both feed the same
 * palette so a customer and an admin search one index, not two.
 */
export const SHOP_NAV: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    exact: true,
    description: "Featured pieces and collections",
    keywords: ["start", "landing", "front"],
  },
  {
    href: "/products",
    label: "Shop all",
    icon: Sparkles,
    description: "Browse the full catalogue",
    keywords: ["catalogue", "catalog", "browse", "collection", "buy", "store"],
  },
  {
    href: "/support",
    label: "Help & support",
    icon: LifeBuoy,
    description: "Contact us or raise a ticket",
    keywords: ["contact", "faq", "question", "problem", "return", "refund"],
  },
  {
    href: "/about",
    label: "About Kalakraft",
    icon: Info,
    description: "Our makers and our story",
    keywords: ["story", "makers", "artisans", "brand"],
  },
]
