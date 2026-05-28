"use client"

import { useState } from "react"
import { redirect } from "next/navigation"
import { Menu } from "lucide-react"

import { useAuth } from "../contexts/AuthContext"
import LoadingSpinner from "../components/LoadingSpinner"
import { SidebarNav } from "./_components/SidebarNav"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-background lg:flex lg:flex-col">
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
      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
