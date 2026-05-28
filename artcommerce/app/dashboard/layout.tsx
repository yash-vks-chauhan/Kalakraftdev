"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Menu, Search, Heart, ShoppingCart, ArrowUpRight } from "lucide-react"

import { useAuth } from "../contexts/AuthContext"
import LoadingSpinner from "../components/LoadingSpinner"
import SearchModal from "../components/SearchModal"
import { SidebarNav } from "./_components/SidebarNav"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  if (loading) {
    return (
      <div className="dashboard-shell flex min-h-screen items-center justify-center">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    )
  }

  if (!user) {
    redirect("/auth/login")
  }

  const handleLogout = () => {
    setMobileOpen(false)
    logout()
  }

  return (
    <div className="dashboard-shell min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-background lg:flex lg:flex-col">
        <SidebarNav user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-foreground transition-colors hover:bg-secondary"
            >
              <Menu className="h-4 w-4" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarNav
              user={user}
              onLogout={handleLogout}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold tracking-tight">Dashboard</span>
      </header>

      {/* Main content */}
      <main className="lg:pl-72">
        {/* Desktop top bar: search + store shortcuts */}
        <div className="sticky top-0 z-20 hidden h-14 items-center gap-3 border-b bg-background/95 px-10 backdrop-blur lg:flex">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="group flex h-9 flex-1 max-w-md items-center gap-2 rounded-md border bg-secondary/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
            <span>Search products…</span>
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

        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
