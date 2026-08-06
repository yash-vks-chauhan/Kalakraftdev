"use client"

import { usePathname, useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { pageMetaFor } from "./nav-config"

/**
 * A title bar and nothing else.
 *
 * Navigation, search and cart all live in the app-wide MobileDock at the
 * bottom, within thumb reach. Repeating them up here would put the same three
 * controls on screen twice — the kind of doubling that made earlier passes
 * feel cluttered. The left slot is a back chevron on nested routes, so the
 * title sits flush left at the top level the way a native app bar does.
 */
export function MobileHeader() {
  const pathname = usePathname() ?? "/dashboard"
  const router = useRouter()
  const { title, detail } = pageMetaFor(pathname)

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 lg:hidden">
      {/* Notch clearance — app/layout.tsx sets viewport-fit=cover */}
      <div className="pt-safe" />
      <div className="flex h-14 items-center gap-1 px-2">
        {detail && (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="-ml-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors active:bg-secondary"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <h1
          className={cn(
            "min-w-0 flex-1 truncate text-[17px] font-semibold tracking-tight text-foreground",
            detail ? "px-1" : "pl-2"
          )}
        >
          {title}
        </h1>

      </div>
    </header>
  )
}
