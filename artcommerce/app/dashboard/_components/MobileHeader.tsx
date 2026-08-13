"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { AccountButton } from "../../components/mobile/AccountSheet"
import { pageMetaFor } from "./nav-config"

/** How far the page scrolls before a collapsing title takes over the bar. */
const COLLAPSE_AT = 26

/**
 * A title bar, a back chevron and the account avatar.
 *
 * Navigation, search and cart live in the app-wide MobileDock at the bottom,
 * within thumb reach; repeating them up here would put the same controls on
 * screen twice. The avatar is the exception — /dashboard bypasses
 * MobileLayout entirely, so without it this subtree has no account surface at
 * all, and no way to sign out on a phone.
 *
 * Pages marked `collapsingTitle` render their own large title in the content
 * and this bar stays empty until it scrolls past, which is the arrangement a
 * phone user's eye already expects. Everywhere else the bar titles the page
 * outright, exactly as before.
 */
export function MobileHeader() {
  const pathname = usePathname() ?? "/dashboard"
  const router = useRouter()
  const { title, detail, collapsingTitle } = pageMetaFor(pathname)
  const [collapsed, setCollapsed] = useState(false)

  // Mobile scrolls the document — the inner panel only scrolls from lg up.
  useEffect(() => {
    if (!collapsingTitle) {
      setCollapsed(false)
      return
    }

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setCollapsed(window.scrollY > COLLAPSE_AT)
      })
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [collapsingTitle, pathname])

  const titleHidden = collapsingTitle && !collapsed

  return (
    <header className="sticky top-0 z-30 shrink-0 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 lg:hidden">
      {/* Notch clearance — app/layout.tsx sets viewport-fit=cover */}
      <div className="pt-safe" />
      <div
        className={cn(
          // The border stays in the box either way — only its colour changes —
          // so collapsing the title never shifts the layout by a pixel. The rule
          // arrives with the title, so an uncollapsed large title is not cut off
          // from the content it belongs to.
          "flex h-14 items-center gap-1 border-b px-2 transition-colors duration-200",
          titleHidden && "border-transparent"
        )}
      >
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
          aria-hidden={titleHidden}
          className={cn(
            "min-w-0 flex-1 truncate text-[17px] font-semibold tracking-tight text-foreground",
            detail ? "px-1" : "pl-2",
            collapsingTitle &&
              "transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
            titleHidden && "translate-y-1.5 opacity-0"
          )}
        >
          {title}
        </h1>

        <AccountButton className="-mr-0.5 shrink-0" />
      </div>
    </header>
  )
}
