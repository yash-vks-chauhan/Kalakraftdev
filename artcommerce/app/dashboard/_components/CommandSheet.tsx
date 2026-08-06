"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { CornerDownLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { User as AuthUser } from "../../contexts/AuthContext"
import { useCart } from "../../contexts/CartContext"
import { useWishlist } from "../../contexts/WishlistContext"
import {
  adminNav,
  isActive,
  quickActionsForRole,
  userNav,
  type NavKey,
} from "./nav-config"

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

interface CommandSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AuthUser
  onLogout: () => void
  onSearchProducts: () => void
}

/**
 * Replaces the mobile hamburger drawer.
 *
 * A drawer only answers "show me the list of pages" — you still have to know
 * which page holds the thing you want, and scan for it. This answers "take me
 * to the thing", by name or by intent: type "discount" and land on Coupons,
 * type "refund" and land on Orders. Nothing has to be memorised.
 *
 * It stays fully browsable with an empty query, so it also works as a plain
 * menu for anyone who'd rather not type — the palette is a superset of the
 * drawer it replaces, never a harder path to the same place.
 */
export function CommandSheet({
  open,
  onOpenChange,
  user,
  onLogout,
  onSearchProducts,
}: CommandSheetProps) {
  const router = useRouter()
  const pathname = usePathname() ?? "/dashboard"
  const [query, setQuery] = useState("")
  const { cartItems } = useCart()
  const { wishlistItems } = useWishlist()

  const isAdmin = user.role === "admin"
  const actions = quickActionsForRole(isAdmin)

  const counts: Record<NavKey, number> = {
    cart: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    wishlist: wishlistItems.length,
  }

  // A stale query on reopen would hide most of the menu behind a filter the
  // user has forgotten they typed.
  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const go = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  const runAction = (id: string, href?: string) => {
    if (href) return go(href)
    onOpenChange(false)
    if (id === "search-products") onSearchProducts()
    if (id === "sign-out") onLogout()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="dashboard-shell max-h-[88vh] gap-0 rounded-t-2xl p-0"
      >
        <SheetTitle className="sr-only">Jump to</SheetTitle>
        <SheetDescription className="sr-only">
          Search for a page or an action, or browse the list below
        </SheetDescription>

        {/* Grab handle — signals "drag me", matches native sheet affordance */}
        <div className="flex justify-center pb-1 pt-2.5">
          <span aria-hidden className="h-1 w-9 rounded-full bg-border" />
        </div>

        {/* Who you're signed in as, so admins never act on the wrong account */}
        <div className="flex items-center gap-2.5 px-4 pb-2.5 pt-1">
          <Avatar className="h-8 w-8 border">
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={user.fullName} />
            )}
            <AvatarFallback className="bg-secondary text-[11px] font-medium text-foreground">
              {initialsOf(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-foreground">
              {user.fullName}
            </p>
            <p className="truncate text-[12px] text-muted-foreground">
              {isAdmin ? "Administrator" : "Customer"}
            </p>
          </div>
        </div>

        <Command
          // Our keywords carry the intent matching; cmdk's own fuzzy scoring on
          // top of them produced noisy ordering, so match on substring only.
          filter={(value, search, keywords) => {
            const haystack = `${value} ${(keywords ?? []).join(" ")}`.toLowerCase()
            return haystack.includes(search.toLowerCase().trim()) ? 1 : 0
          }}
          className="rounded-none bg-transparent"
        >
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search pages and actions…"
            autoFocus={false}
          />

          <CommandList className="max-h-[52vh] px-2 pb-2">
            <CommandEmpty>
              <span className="text-sm">No match for “{query}”</span>
            </CommandEmpty>

            <CommandGroup heading="Actions">
              {actions.map((action) => {
                const Icon = action.icon
                const destructive = action.id === "sign-out"
                return (
                  <CommandItem
                    key={action.id}
                    value={action.label}
                    keywords={action.keywords}
                    onSelect={() => runAction(action.id, action.href)}
                    className={cn(
                      "min-h-[46px]",
                      destructive &&
                        "text-destructive data-[selected=true]:bg-destructive/10 data-[selected=true]:text-destructive [&_svg]:text-destructive"
                    )}
                  >
                    <Icon />
                    <span className="flex-1 text-[15px]">{action.label}</span>
                    <CornerDownLeft className="size-3.5 opacity-0 data-[selected=true]:opacity-40" />
                  </CommandItem>
                )
              })}
            </CommandGroup>

            <NavCommandGroup
              heading="Account"
              items={userNav}
              pathname={pathname}
              counts={counts}
              onSelect={go}
            />

            {isAdmin && (
              <NavCommandGroup
                heading="Manage store"
                items={adminNav}
                pathname={pathname}
                counts={counts}
                onSelect={go}
              />
            )}
          </CommandList>
        </Command>

        <div className="pb-safe" />
      </SheetContent>
    </Sheet>
  )
}

function NavCommandGroup({
  heading,
  items,
  pathname,
  counts,
  onSelect,
}: {
  heading: string
  items: typeof userNav
  pathname: string
  counts: Record<NavKey, number>
  onSelect: (href: string) => void
}) {
  return (
    <CommandGroup heading={heading}>
      {items.map((item) => {
        const Icon = item.icon
        const active = isActive(pathname, item.href, item.exact)
        const count = item.countKey ? counts[item.countKey] : 0

        return (
          <CommandItem
            key={item.href}
            value={item.label}
            keywords={[...(item.keywords ?? []), item.description ?? ""]}
            onSelect={() => onSelect(item.href)}
            className="min-h-[46px]"
          >
            <Icon className={cn(active && "text-foreground")} />
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block truncate text-[15px]",
                  active ? "font-semibold text-foreground" : "text-foreground"
                )}
              >
                {item.label}
              </span>
              {item.description && (
                <span className="block truncate text-[12px] text-muted-foreground">
                  {item.description}
                </span>
              )}
            </span>
            {count > 0 && (
              <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold tabular-nums text-foreground">
                {count > 99 ? "99+" : count}
              </span>
            )}
            {active && (
              <span
                aria-label="Current page"
                className="size-1.5 shrink-0 rounded-full bg-foreground"
              />
            )}
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}
