"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { ArrowRight, Loader2, PackageX, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useAuth } from "../../contexts/AuthContext"
import {
  adminNav,
  isActive,
  quickActionsForRole,
  userNav,
} from "../../dashboard/_components/nav-config"
import { SHOP_NAV } from "./nav-shop"
import { firstImage, useProductSearch } from "./useProductSearch"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatPrice(value: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `₹${value}`
  }
}

/**
 * One search for the whole app.
 *
 * Previously there were two: SearchModal (products, storefront only) and a
 * navigation-only palette in the dashboard — so tapping search inside the
 * dashboard of a *store* could not find a product. This returns products,
 * pages and actions in one grouped list, and is mounted app-wide by the dock.
 *
 * Products lead the results: on a commerce site that is what people are
 * looking for the overwhelming majority of the time. Pages and actions sit
 * below, and are role-aware so admins get store management too.
 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const pathname = usePathname() ?? "/"
  const { user, logout } = useAuth()
  const [query, setQuery] = useState("")

  const isAdmin = user?.role === "admin"
  const signedIn = Boolean(user)
  const { results: products, loading } = useProductSearch(query, open)
  const actions = signedIn ? quickActionsForRole(isAdmin) : []
  const trimmed = query.trim()

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
    if (id === "search-products") router.push("/products")
    /*
     * This used to push /auth/logout — a page route that has never existed,
     * so the one sign-out reachable on a phone was a 404. Sign out is a real
     * operation: clear the session, then AuthContext redirects to login.
     * No confirmation here, unlike the account sheet: reaching this means
     * opening search and picking "Sign out" by name, which is deliberate
     * enough on its own.
     */
    if (id === "sign-out") void logout()
  }

  const destinations = signedIn ? [...SHOP_NAV, ...userNav] : SHOP_NAV
  const hasProducts = products.length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="dashboard-shell max-h-[88vh] gap-0 rounded-t-2xl p-0"
      >
        <SheetTitle className="sr-only">Search</SheetTitle>
        <SheetDescription className="sr-only">
          Search products, pages and actions
        </SheetDescription>

        <div className="flex justify-center pb-1 pt-2.5">
          <span aria-hidden className="h-1 w-9 rounded-full bg-border" />
        </div>

        <Command
          // Our keywords carry the intent matching and products are already
          // ranked by Fuse; cmdk's own fuzzy scoring on top reordered both.
          filter={(value, search, keywords) => {
            const hay = `${value} ${(keywords ?? []).join(" ")}`.toLowerCase()
            return hay.includes(search.toLowerCase().trim()) ? 1 : 0
          }}
          className="rounded-none bg-transparent"
        >
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search products, pages, actions…"
          />

          <CommandList className="max-h-[58vh] px-2 pb-2">
            <CommandEmpty>
              {loading ? (
                <span className="inline-flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching…
                </span>
              ) : (
                <span className="text-sm">No match for “{trimmed}”</span>
              )}
            </CommandEmpty>

            {/* Products first — this is a store */}
            {hasProducts && (
              <CommandGroup heading="Products">
                {products.map((p) => {
                  const src = firstImage(p)
                  return (
                    <CommandItem
                      key={`p-${p.id}`}
                      value={`product-${p.id}-${p.name}`}
                      keywords={[p.name, p.shortDesc ?? "", p.category?.name ?? ""]}
                      onSelect={() => go(`/products/${p.id}`)}
                      className="min-h-[56px]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={src}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <PackageX className="h-4 w-4 text-muted-foreground" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] text-foreground">
                          {p.name}
                        </span>
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {p.category?.name ?? "Product"}
                        </span>
                      </span>
                      <span className="shrink-0 text-[13px] font-semibold tabular-nums text-foreground">
                        {formatPrice(p.price, p.currency)}
                      </span>
                    </CommandItem>
                  )
                })}
                {trimmed && (
                  <CommandItem
                    value={`see-all-${trimmed}`}
                    onSelect={() => go(`/products?search=${encodeURIComponent(trimmed)}`)}
                    className="min-h-[46px]"
                  >
                    <Search />
                    <span className="flex-1 text-[15px]">
                      See all results for “{trimmed}”
                    </span>
                    <ArrowRight className="size-4" />
                  </CommandItem>
                )}
              </CommandGroup>
            )}

            {actions.length > 0 && (
              <CommandGroup heading="Actions">
                {actions.map((a) => {
                  const Icon = a.icon
                  const destructive = a.id === "sign-out"
                  return (
                    <CommandItem
                      key={a.id}
                      value={a.label}
                      keywords={a.keywords}
                      onSelect={() => runAction(a.id, a.href)}
                      className={cn(
                        "min-h-[46px]",
                        destructive &&
                          "text-destructive data-[selected=true]:bg-destructive/10 data-[selected=true]:text-destructive [&_svg]:text-destructive"
                      )}
                    >
                      <Icon />
                      <span className="flex-1 text-[15px]">{a.label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            <CommandGroup heading="Go to">
              {destinations.map((item) => {
                const Icon = item.icon
                const active = isActive(pathname, item.href, item.exact)
                return (
                  <CommandItem
                    key={item.href}
                    value={item.label}
                    keywords={[...(item.keywords ?? []), item.description ?? ""]}
                    onSelect={() => go(item.href)}
                    className="min-h-[46px]"
                  >
                    <Icon />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-[15px] text-foreground",
                          active && "font-semibold"
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

            {isAdmin && (
              <CommandGroup heading="Manage store">
                {adminNav.map((item) => {
                  const Icon = item.icon
                  const active = isActive(pathname, item.href, item.exact)
                  return (
                    <CommandItem
                      key={item.href}
                      value={item.label}
                      keywords={[...(item.keywords ?? []), item.description ?? ""]}
                      onSelect={() => go(item.href)}
                      className="min-h-[46px]"
                    >
                      <Icon />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-[15px] text-foreground",
                            active && "font-semibold"
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
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {!signedIn && (
              <CommandGroup heading="Account">
                <CommandItem
                  value="Sign in"
                  keywords={["login", "account", "register"]}
                  onSelect={() => go("/auth/login")}
                  className="min-h-[46px]"
                >
                  <ArrowRight />
                  <span className="flex-1 text-[15px]">Sign in</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>

        <div className="pb-safe" />
      </SheetContent>
    </Sheet>
  )
}
