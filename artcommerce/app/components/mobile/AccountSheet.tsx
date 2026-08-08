"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Boxes,
  ChevronRight,
  Info,
  LayoutDashboard,
  LifeBuoy,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  Shield,
  ShoppingBag,
  Star,
  Store,
  Tag,
  User,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import ConfirmDialog from "../ConfirmDialog"
import { useAuth } from "../../contexts/AuthContext"
import { useCart } from "../../contexts/CartContext"
import { useWishlist } from "../../contexts/WishlistContext"
import { useAppMode, type AppMode } from "../../contexts/ModeContext"
import { SegmentedControl, type SegmentedControlItem } from "../../dashboard/_components/SegmentedControl"

/* ------------------------------------------------------------------ */
/* Content model                                                       */
/* ------------------------------------------------------------------ */

/*
 * Deliberately local rather than reused from `nav-config.ts`.
 *
 * The sidebar and the command palette list every destination flat; this sheet
 * splits them across three tiles and two groups, drops the three that the
 * tiles already cover, and names things the way people say them ("Login &
 * security", not "Security"). Sharing one model would mean one of the two
 * surfaces reading wrong. The routes are the contract — keep them in step.
 */

interface SheetLink {
  href: string
  label: string
  /** Second line, used only where the label is genuinely ambiguous. */
  description?: string
  icon: LucideIcon
}

/** Shopping mode. Orders, Saved and Cart live in the tiles above. */
const SHOP_LINKS: SheetLink[] = [
  {
    href: "/dashboard",
    label: "Overview",
    description: "Spend, activity, recent orders",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/support",
    label: "Support",
    description: "Your tickets and help",
    icon: LifeBuoy,
  },
]

/** Store mode. All orders, Low stock and Support tickets live in the tiles. */
const STORE_LINKS: SheetLink[] = [
  {
    href: "/dashboard",
    label: "Overview",
    description: "Revenue, volume, status mix",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/admin/products",
    label: "Products",
    description: "Listings, pricing, inventory",
    icon: Boxes,
  },
  {
    href: "/dashboard/admin/users",
    label: "Users",
    description: "Roles, access, accounts",
    icon: Users,
  },
  {
    href: "/dashboard/admin/coupons",
    label: "Coupons",
    description: "Discount codes and campaigns",
    icon: Tag,
  },
  {
    href: "/dashboard/admin/reviews",
    label: "Reviews",
    description: "Ratings and moderation",
    icon: Star,
  },
]

/** Present in both modes — your account is yours whichever hat you wear. */
const ACCOUNT_LINKS: SheetLink[] = [
  {
    href: "/dashboard/profile?section=identity",
    label: "Profile",
    description: "Name, photo, email",
    icon: User,
  },
  {
    href: "/dashboard/profile?section=security",
    label: "Login & security",
    description: "Password and sign-in",
    icon: Shield,
  },
  {
    href: "/dashboard/profile?section=addresses",
    label: "Addresses",
    description: "Saved delivery locations",
    icon: MapPin,
  },
]

const GUEST_LINKS: SheetLink[] = [
  {
    href: "/support",
    label: "Help & support",
    description: "Contact us or read the FAQ",
    icon: LifeBuoy,
  },
  {
    href: "/about",
    label: "About Kalakraft",
    description: "Our makers and our story",
    icon: Info,
  },
]

const MODE_ITEMS: readonly SegmentedControlItem<AppMode>[] = [
  { key: "shop", label: "Shopping", icon: ShoppingBag },
  { key: "store", label: "Store", icon: Store },
]

/* ------------------------------------------------------------------ */
/* Admin counts                                                        */
/* ------------------------------------------------------------------ */

interface AdminCounts {
  ordersToday: number | null
  lowStock: number | null
  openTickets: number | null
}

const EMPTY_COUNTS: AdminCounts = {
  ordersToday: null,
  lowStock: null,
  openTickets: null,
}

/**
 * Fetched when the sheet opens, never on mount: a customer must not pay for
 * three admin requests they can't use, and an admin who never opens the sheet
 * shouldn't either. Auth is cookie-based (see lib/session-auth), so
 * `credentials: "include"` is all these need.
 */
function useAdminCounts(enabled: boolean): AdminCounts {
  const [counts, setCounts] = useState<AdminCounts>(EMPTY_COUNTS)

  useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()
    const opts = { credentials: "include" as const, signal: controller.signal }

    const read = async <T,>(url: string, pick: (json: any) => T): Promise<T | null> => {
      try {
        const res = await fetch(url, opts)
        if (!res.ok) return null
        return pick(await res.json())
      } catch {
        // Aborted, offline, or a shape we didn't expect — the tile shows a
        // dash rather than a wrong number.
        return null
      }
    }

    Promise.all([
      read("/api/admin/metrics?period=today", (j) =>
        typeof j?.totalOrders === "number" ? j.totalOrders : null
      ),
      read("/api/admin/products/low-stock", (j) =>
        Array.isArray(j?.products) ? j.products.length : null
      ),
      read("/api/admin/support/ticket", (j) =>
        Array.isArray(j)
          ? j.filter((t: { status?: string }) => t?.status === "open").length
          : null
      ),
    ]).then(([ordersToday, lowStock, openTickets]) => {
      if (controller.signal.aborted) return
      setCounts({ ordersToday, lowStock, openTickets })
    })

    return () => controller.abort()
  }, [enabled])

  return counts
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function initialsOf(name?: string) {
  if (!name) return "?"
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  )
}

function StatTile({
  href,
  value,
  label,
  tone = "default",
  onNavigate,
}: {
  href: string
  value: number | null
  label: string
  tone?: "default" | "warn" | "alert"
  onNavigate: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="rounded-xl border bg-background px-2.5 py-2 transition-colors active:bg-secondary"
    >
      {value === null ? (
        <Skeleton className="h-[21px] w-9 rounded" />
      ) : (
        <span
          className={cn(
            "block text-xl font-semibold leading-tight tracking-tight tabular-nums",
            tone === "warn"
              ? "text-amber-600"
              : tone === "alert"
              ? "text-destructive"
              : "text-foreground"
          )}
        >
          {value > 999 ? "999+" : value}
        </span>
      )}
      <span className="mt-0.5 block truncate text-[11px] leading-tight text-muted-foreground">
        {label}
      </span>
    </Link>
  )
}

function LinkRow({
  link,
  first,
  onNavigate,
}: {
  link: SheetLink
  first: boolean
  onNavigate: () => void
}) {
  const Icon = link.icon
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={cn(
        "relative flex min-h-[52px] items-center gap-3.5 px-3.5 transition-colors active:bg-secondary",
        // Hairline inset to the label, so the icon column reads as one gutter.
        !first &&
          "before:absolute before:left-[46px] before:right-0 before:top-0 before:h-px before:bg-border"
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium leading-tight text-foreground">
          {link.label}
        </span>
        {link.description && (
          <span className="mt-0.5 block truncate text-[11px] leading-tight text-muted-foreground">
            {link.description}
          </span>
        )}
      </span>
      <ChevronRight className="h-[15px] w-[15px] shrink-0 text-muted-foreground/40" />
    </Link>
  )
}

function LinkGroup({
  label,
  links,
  onNavigate,
}: {
  label: string
  links: SheetLink[]
  onNavigate: () => void
}) {
  return (
    <div className="pb-4">
      <p className="px-0.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="overflow-hidden rounded-xl border bg-background">
        {links.map((link, i) => (
          <LinkRow key={link.href} link={link} first={i === 0} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* The sheet                                                           */
/* ------------------------------------------------------------------ */

export interface AccountSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountSheet({ open, onOpenChange }: AccountSheetProps) {
  const { user, logout } = useAuth()
  const { cartItems } = useCart()
  const { wishlistItems } = useWishlist()
  const { isStoreMode, setMode } = useAppMode()

  const isAdmin = user?.role === "admin"
  const counts = useAdminCounts(open && Boolean(isAdmin))

  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  )
  // Free: /api/auth/me already returns the order list on the user object,
  // so the tile costs nothing extra.
  const orderCount = user?.orders?.length ?? 0

  /*
   * The drawer is a modal Radix dialog: it traps focus and drops
   * pointer-events on the body. ConfirmDialog portals to the body too, so it
   * has to take the stage alone — dismiss the sheet first, then confirm.
   */
  const askToSignOut = useCallback(() => {
    onOpenChange(false)
    setLogoutOpen(true)
  }, [onOpenChange])

  const handleConfirmLogout = useCallback(async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
      setLogoutOpen(false)
    }
  }, [logout])

  const signedIn = Boolean(user)

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        {/*
          `dashboard-shell` is required, not cosmetic: the 44px touch-target
          floor in globals.css is scoped to it, and this content is portalled
          to document.body where it would otherwise inherit shadcn's desktop
          h-9 sizing.
        */}
        <DrawerContent className="dashboard-shell max-h-[90vh] gap-0 bg-background p-0">
          <DrawerTitle className="sr-only">
            {signedIn ? "Your account" : "Account"}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {signedIn
              ? "Your orders, saved items, settings and store management."
              : "Sign in, create an account, or get help."}
          </DrawerDescription>

          {signedIn && user ? (
            <>
              {/* ── Zone 1 + 2 — identity and mode, pinned ── */}
              <div className="shrink-0">
                <Link
                  href="/dashboard/profile"
                  onClick={close}
                  className="flex items-center gap-3 px-4 pb-3.5 pt-2 transition-colors active:bg-secondary"
                >
                  <Avatar className="h-11 w-11 border">
                    {user.avatarUrl && (
                      <AvatarImage src={user.avatarUrl} alt="" />
                    )}
                    <AvatarFallback className="bg-secondary text-sm font-semibold text-foreground">
                      {initialsOf(user.fullName)}
                    </AvatarFallback>
                  </Avatar>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-semibold leading-tight tracking-tight text-foreground">
                        {user.fullName || "Your account"}
                      </span>
                      <Badge
                        variant={isAdmin ? "default" : "secondary"}
                        className="px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider"
                      >
                        {isAdmin ? "Admin" : "Member"}
                      </Badge>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </span>

                  <ChevronRight className="h-[15px] w-[15px] shrink-0 text-muted-foreground/40" />
                </Link>

                {isAdmin && (
                  <div className="px-4 pb-3.5">
                    <SegmentedControl<AppMode>
                      items={MODE_ITEMS}
                      value={isStoreMode ? "store" : "shop"}
                      onChange={setMode}
                      ariaLabel="Shopping or store mode"
                      className="min-h-[46px] rounded-lg bg-secondary lg:w-full"
                    />
                  </div>
                )}
              </div>

              {/* ── Zone 3 + 4 — tiles and directory, scrolls ── */}
              <div className="min-h-0 flex-1 overflow-y-auto px-4">
                <div className="grid grid-cols-3 gap-2 pb-4">
                  {isStoreMode ? (
                    <>
                      <StatTile
                        href="/dashboard/admin/orders"
                        value={counts.ordersToday}
                        label="Orders today"
                        onNavigate={close}
                      />
                      <StatTile
                        href="/dashboard/admin/products/low-stock"
                        value={counts.lowStock}
                        label="Low stock"
                        tone={counts.lowStock ? "warn" : "default"}
                        onNavigate={close}
                      />
                      <StatTile
                        href="/dashboard/admin/support"
                        value={counts.openTickets}
                        label="Open tickets"
                        tone={counts.openTickets ? "alert" : "default"}
                        onNavigate={close}
                      />
                    </>
                  ) : (
                    <>
                      <StatTile
                        href="/dashboard/orders"
                        value={orderCount}
                        label="Orders"
                        onNavigate={close}
                      />
                      <StatTile
                        href="/dashboard/wishlist"
                        value={wishlistItems.length}
                        label="Saved"
                        onNavigate={close}
                      />
                      <StatTile
                        href="/dashboard/cart"
                        value={cartCount}
                        label="Cart"
                        onNavigate={close}
                      />
                    </>
                  )}
                </div>

                {isStoreMode && (
                  <Button asChild size="lg" className="mb-4 w-full gap-2">
                    <Link href="/dashboard/admin/products/new" onClick={close}>
                      <Plus className="h-4 w-4" />
                      Add a new product
                    </Link>
                  </Button>
                )}

                <LinkGroup
                  label={isStoreMode ? "Store" : "Shopping"}
                  links={isStoreMode ? STORE_LINKS : SHOP_LINKS}
                  onNavigate={close}
                />
                <LinkGroup label="Account" links={ACCOUNT_LINKS} onNavigate={close} />
              </div>

              {/* ── Zone 5 — store and sign out, pinned ── */}
              <div className="shrink-0 border-t">
                <div className="grid grid-cols-2 gap-2.5 px-4 pb-3 pt-3">
                  <Button asChild variant="outline" size="lg" className="gap-2 px-3">
                    <Link href="/" onClick={close}>
                      <Store className="h-4 w-4 text-muted-foreground" />
                      View store
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={askToSignOut}
                    className="gap-2 px-3 text-destructive hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                </div>
                <div className="pb-safe" />
              </div>
            </>
          ) : (
            /* ── Signed out ── */
            <>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2">
                <div className="flex flex-col items-center pb-5 text-center">
                  <span className="mb-3 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <User className="h-[22px] w-[22px]" />
                  </span>
                  <h2 className="text-[17px] font-semibold tracking-tight text-foreground">
                    Sign in to Kalakraft
                  </h2>
                  <p className="mt-1 max-w-[30ch] text-[13px] leading-snug text-muted-foreground">
                    Track your orders, keep a wishlist, and check out without
                    retyping anything.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 pb-5">
                  <Button asChild size="lg" className="w-full gap-2">
                    <Link href="/auth/login" onClick={close}>
                      <LogIn className="h-4 w-4" />
                      Sign in
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full gap-2">
                    <Link href="/auth/signup" onClick={close}>
                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                      Create an account
                    </Link>
                  </Button>
                </div>

                <LinkGroup label="Help" links={GUEST_LINKS} onNavigate={close} />
              </div>

              <div className="shrink-0 border-t">
                <div className="px-4 pb-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={close}
                    className="w-full gap-2"
                  >
                    <Store className="h-4 w-4 text-muted-foreground" />
                    Continue browsing
                  </Button>
                </div>
                <div className="pb-safe" />
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <ConfirmDialog
        open={logoutOpen}
        title="Sign out?"
        description={`You'll be signed out of ${
          user?.fullName?.split(" ")[0] || "your account"
        } on this device. You can sign back in anytime.`}
        confirmLabel="Sign out"
        processingLabel="Signing out…"
        cancelLabel="Stay signed in"
        variant="destructive"
        icon={<LogOut className="h-4 w-4" />}
        isProcessing={loggingOut}
        onConfirm={handleConfirmLogout}
        onClose={() => {
          if (!loggingOut) setLogoutOpen(false)
        }}
      />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Trigger                                                             */
/* ------------------------------------------------------------------ */

export interface AccountButtonProps {
  /** Over the homepage hero the header content is white. */
  onDark?: boolean
  className?: string
}

/**
 * The avatar in the mobile header, and the sheet it opens.
 *
 * A button rather than a link: this opens a dialog, and a link that opens a
 * dialog is announced wrong by screen readers and breaks long-press /
 * open-in-new-tab. Radix owns focus trap, Escape and focus restore.
 */
export function AccountButton({ onDark = false, className }: AccountButtonProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Never leave the sheet up across a route change — every row navigates.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={user ? "Your account" : "Sign in"}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
          onDark ? "text-white active:bg-white/10" : "text-foreground active:bg-black/5",
          className
        )}
      >
        {user ? (
          <span
            className={cn(
              "flex h-[26px] w-[26px] items-center justify-center rounded-full border text-[10px] font-bold uppercase leading-none",
              onDark
                ? "border-white/45 bg-white/15 text-white"
                : "border-border bg-secondary text-foreground"
            )}
          >
            {initialsOf(user.fullName)}
          </span>
        ) : (
          <User size={19} strokeWidth={1.9} />
        )}
      </button>

      <AccountSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
