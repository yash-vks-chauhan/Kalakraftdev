"use client"

import { ReactNode, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Instagram,
  Loader2,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { getImageUrl } from "../../lib/cloudinaryImages"

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
]

const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/products", label: "All products" },
      { href: "/products?sort=newest", label: "New arrivals" },
      { href: "/products?category=tray", label: "Trays" },
      { href: "/products?category=clocks", label: "Clocks" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "FAQs" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/contact", label: "Get in touch" },
    ],
  },
]

interface MarketingShellProps {
  children: ReactNode
  /** When true (e.g. on /privacy), shows a thin scroll-progress bar under the nav. */
  showReadingProgress?: boolean
}

export default function MarketingShell({
  children,
  showReadingProgress = false,
}: MarketingShellProps) {
  const pathname = usePathname() ?? ""
  const logoSrc = getImageUrl("logo.png")
  const [progress, setProgress] = useState(0)
  const [logoFailed, setLogoFailed] = useState(false)

  useEffect(() => {
    if (!showReadingProgress) return
    let raf = 0
    const update = () => {
      const scrolled = window.scrollY
      const total =
        document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0)
      raf = 0
    }
    const onScroll = () => {
      if (raf) return
      raf = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [showReadingProgress])

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* ─────────────────────── Top nav ─────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark
                logoSrc={logoSrc}
                failed={logoFailed}
                onError={() => setLogoFailed(true)}
              />
              <span className="text-base font-semibold tracking-tight">
                Kalakraft
              </span>
            </Link>

            {/* Center nav (md+) */}
            <nav className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map((l) => {
                const isActive =
                  pathname === l.href || pathname.startsWith(l.href + "/")
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {l.label}
                  </Link>
                )
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1.5">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden text-xs sm:inline-flex"
              >
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="gap-1.5">
                <Link href="/products">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Shop
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile inline nav */}
        <nav className="border-t border-border/60 md:hidden">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
              {NAV_LINKS.map((l) => {
                const isActive =
                  pathname === l.href || pathname.startsWith(l.href + "/")
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors",
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {l.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Scroll-progress hairline (optional, used on /privacy) */}
        {showReadingProgress && (
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-transparent"
          >
            <div
              className="h-full bg-foreground transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      {/* ─────────────────────── Page content ─────────────────────── */}
      <div className="flex-1">{children}</div>

      {/* ─────────────────────── Footer ─────────────────────── */}
      <footer className="border-t bg-muted/15">
        {/* Newsletter row */}
        <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <NewsletterRow />
        </div>
        <Separator />
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-12">
            {/* Brand block */}
            <div className="flex flex-col gap-3">
              <Link href="/" className="flex items-center gap-2.5">
                <BrandMark
                  logoSrc={logoSrc}
                  failed={logoFailed}
                  onError={() => setLogoFailed(true)}
                  size="footer"
                />
                <span className="text-base font-semibold tracking-tight">
                  Kalakraft
                </span>
              </Link>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                Curated handcrafted resin art, ceramics and décor from
                India&apos;s most thoughtful makers.
              </p>
              <div className="mt-1 flex items-center gap-2.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  Handcrafted in India
                </span>
              </div>
            </div>

            {/* Link columns */}
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-col gap-3">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {col.title}
                </h4>
                <ul className="flex flex-col gap-2">
                  {col.links.map((l) => {
                    const isActive =
                      pathname === l.href || pathname.startsWith(l.href + "/")
                    return (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          className={cn(
                            "inline-flex items-center gap-1 text-sm transition-colors",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {l.label}
                          {isActive && (
                            <span
                              aria-hidden
                              className="h-1 w-1 rounded-full bg-foreground"
                            />
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Kalakraft. All rights reserved.
            </p>
            <div className="flex items-center gap-1">
              <SocialLink
                href="https://instagram.com/kalakraft"
                label="Instagram"
                icon={Instagram}
              />
              <SocialLink href="mailto:hello@kalakraft.com" label="Email" icon={Mail} />
              <SocialLink href="/privacy" label="Privacy" icon={ShieldCheck} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* -------------------------------------------------------------- */
/* NewsletterRow — slim subscribe form above the link columns      */
/* -------------------------------------------------------------- */

function NewsletterRow() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    setStatus("submitting")
    // Best-effort POST — works even when no /api/newsletter route exists yet.
    await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed, source: "marketing-footer" }),
    }).catch(() => null)
    setStatus("done")
  }

  return (
    <div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center">
      <div className="flex max-w-md flex-col gap-1">
        <h3 className="text-base font-semibold tracking-tight sm:text-lg">
          Artisan drops, in your inbox.
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          New pieces and limited series — once or twice a month, never more.
        </p>
      </div>

      {status === "done" ? (
        <div
          role="status"
          className="inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <CheckCircle2 className="h-4 w-4" />
          You&apos;re on the list — welcome.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-md flex-col gap-2"
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={status === "submitting"}
                required
                className="h-10 pl-9"
                aria-label="Email address"
              />
            </div>
            <Button
              type="submit"
              disabled={status === "submitting"}
              className="h-10 shrink-0 gap-1.5"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Subscribing
                </>
              ) : (
                <>
                  Subscribe
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            No spam · unsubscribe anytime.
          </p>
        </form>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- */
/* BrandMark — same monogram fallback used in AuthShell            */
/* -------------------------------------------------------------- */

function BrandMark({
  logoSrc,
  failed,
  onError,
  size = "header",
}: {
  logoSrc: string
  failed: boolean
  onError: () => void
  size?: "header" | "footer"
}) {
  const dims =
    size === "footer"
      ? { box: "h-8 w-8 rounded-lg", inner: "h-6 w-6", svg: 20 }
      : { box: "h-8 w-8 rounded-lg", inner: "h-6 w-6", svg: 20 }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-foreground/5",
        dims.box
      )}
    >
      {failed ? (
        <KMonogram size={dims.svg} />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logoSrc}
          alt=""
          width={dims.svg}
          height={dims.svg}
          className={cn(dims.inner, "object-contain")}
          loading="eager"
          decoding="async"
          onError={onError}
        />
      )}
    </span>
  )
}

function KMonogram({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="kk-mono-marketing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#kk-mono-marketing)" />
      <text
        x="16"
        y="23"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontWeight={700}
        fontSize="20"
        fill="#fff"
      >
        K
      </text>
    </svg>
  )
}

function SocialLink({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: typeof Instagram
}) {
  const external = href.startsWith("http") || href.startsWith("mailto:")
  const inner = (
    <>
      <Icon className="h-3.5 w-3.5" />
      {external && <ArrowUpRight className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-100" />}
    </>
  )
  const className =
    "group inline-flex h-8 w-8 items-center justify-center gap-0.5 rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={className}
      >
        {inner}
      </a>
    )
  }
  return (
    <Link href={href} aria-label={label} className={className}>
      {inner}
    </Link>
  )
}
