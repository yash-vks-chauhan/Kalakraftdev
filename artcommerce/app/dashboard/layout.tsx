"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search, Heart, ShoppingCart, ArrowUpRight } from "lucide-react"

import { useAuth } from "../contexts/AuthContext"
import LoadingSpinner from "../components/LoadingSpinner"
import { CommandPalette } from "../components/mobile/CommandPalette"
import { SidebarNav } from "./_components/SidebarNav"
import { MobileHeader } from "./_components/MobileHeader"
import { cn } from "@/lib/utils"

const SIDEBAR_STORAGE_KEY = "dashboard:sidebar:collapsed"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Desktop scrolls an inner panel; mobile scrolls the document. Reset both,
  // or navigating on a phone lands you mid-page at the previous scroll offset.
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [pathname])

  // Hydrate collapsed state from localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
      if (stored === "1") setCollapsed(true)
    } catch {}
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0")
      } catch {}
      return next
    })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
      if ((e.metaKey || e.ctrlKey) && key === "b") {
        e.preventDefault()
        toggleCollapsed()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login")
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="dashboard-shell flex min-h-dvh items-center justify-center bg-background">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="dashboard-shell flex min-h-dvh items-center justify-center bg-background">
        <LoadingSpinner message="Redirecting..." />
      </div>
    )
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="dashboard-shell flex min-h-dvh flex-col bg-background text-foreground lg:h-dvh lg:overflow-hidden lg:bg-muted">
      {/* Desktop sidebar — sits naked on the muted canvas (inset pattern) */}
      <aside
        data-state={collapsed ? "collapsed" : "expanded"}
        style={{ willChange: "width" }}
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden overflow-hidden transition-[width] duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] lg:flex lg:flex-col",
          collapsed ? "w-16" : "w-72"
        )}
      >
        <SidebarNav
          user={user}
          onLogout={handleLogout}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
        />
      </aside>

      {/* Mobile app bar — contextual title only; search and cart live in
          the app-wide dock at the bottom, within thumb reach. */}
      <MobileHeader />

      {/* Main content — a white inset panel on the muted canvas */}
      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col transition-[padding-left] duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
          collapsed ? "lg:pl-16" : "lg:pl-72"
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col bg-background lg:my-2 lg:mr-2 lg:overflow-hidden lg:rounded-xl lg:border lg:shadow-sm">
          {/* Desktop top bar: search + store shortcuts */}
          <div className="hidden h-14 shrink-0 items-center gap-3 border-b px-6 lg:flex lg:px-10">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="group flex h-9 flex-1 max-w-md items-center gap-2 rounded-md border bg-secondary/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Open search"
            >
              <Search className="h-4 w-4" />
              <span>Search pages, actions, products…</span>
              <kbd className="ml-auto hidden items-center rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground xl:inline-flex">
                ⌘K
              </kbd>
            </button>

            <div className="ml-auto flex items-center gap-1">
              <Link
                href="/"
                className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                View store
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/dashboard/wishlist"
                aria-label="Wishlist"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Heart className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/cart"
                aria-label="Cart"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <ShoppingCart className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div ref={contentRef} className="min-h-0 flex-1 lg:overflow-y-auto">
            {/* pb-tabbar keeps the last row clear of the fixed bottom nav
                (and the home indicator below it) on mobile. */}
            <div className="w-full px-4 py-5 pb-tabbar sm:px-6 lg:px-10 lg:py-10">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/*
        The dashboard keeps a navigation palette rather than the storefront's
        products-only search: "Coupons" is exactly what an admin opens ⌘K to
        find, and it returns products underneath the pages anyway.
      */}
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}
