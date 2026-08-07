"use client"

import { ReactNode, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  Globe2,
  Heart,
  Palette,
  Sparkles,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { getImageUrl } from "../../lib/cloudinaryImages"
import { TRUST_STATS } from "./_components/AuthBits"

interface HeroSlide {
  src: string
  caption: string
  category: string
}

// Pre-optimized hosted versions (Cloudinary auto-format + quality, capped at
// 1600px wide) so the brand panel paints fast without depending on the 15-20MB
// local PNG files.
const HERO_SLIDES: HeroSlide[] = [
  {
    src: "https://res.cloudinary.com/downe8107/image/upload/c_fill,w_1600,h_1200,q_auto:good,f_auto/v1751076343/kalakraft/featured3.png",
    caption: "Resin Tray Set",
    category: "Trays · Hand-poured",
  },
  {
    src: "https://res.cloudinary.com/downe8107/image/upload/c_fill,w_1600,h_1200,q_auto:good,f_auto/v1751076808/kalakraft/featured1.png",
    caption: "Handcrafted Resin Clock",
    category: "Clocks · Limited series",
  },
  {
    src: "https://res.cloudinary.com/downe8107/image/upload/c_fill,w_1600,h_1200,q_auto:good,f_auto/v1751076810/kalakraft/featured2.png",
    caption: "Decorative Wall Piece",
    category: "Wall décor · Made to order",
  },
]

// Narrower crops for the mobile crown — a 390px-wide band never needs the
// 1600px desktop asset.
const MOBILE_SLIDE_SRC = HERO_SLIDES.map((s) =>
  s.src.replace("c_fill,w_1600,h_1200", "c_fill,w_780,h_520")
)

// Numbers live in AuthBits so the desktop panel and the mobile TrustRow can
// never drift apart; the icons are a desktop-only flourish.
const TRUST_BADGES = [Palette, Globe2, Heart].map((icon, i) => ({
  icon,
  ...TRUST_STATS[i],
}))

const WARM_BACKDROP = `
  radial-gradient(ellipse 55% 50% at 18% 25%, hsl(28 90% 35% / 0.55), transparent 65%),
  radial-gradient(ellipse 50% 55% at 85% 75%, hsl(340 65% 30% / 0.45), transparent 65%),
  radial-gradient(circle at 50% 100%, hsl(262 50% 25% / 0.5), transparent 70%),
  radial-gradient(circle at 50% 0%, hsl(45 60% 30% / 0.25), transparent 50%)
`

interface AuthShellProps {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  steps?: {
    current: number
    items: { label: string; description: string }[]
  }
  /**
   * Mobile only. Swaps the compact brand strip for the full brand crown —
   * the same gradients, mandala and rotating pieces the desktop panel gets,
   * at mobile scale — and lifts the form onto a rounded sheet. The desktop
   * (lg and up) layout is identical either way.
   */
  mobileCrown?: boolean
  /**
   * Mobile crown size. "default" is the full brand crown with the rotating
   * pieces; "compact" is shorter and still, for screens that are a task
   * rather than a welcome.
   */
  crownSize?: "default" | "compact"
  /** Replaces the crown's badge and headline. */
  crownCopy?: ReactNode
  /** Replaces the crown's top-right "Browse shop" pill. */
  crownAction?: ReactNode
  /** Mobile only. Sits above the form; hidden from lg up (desktop uses `footer`). */
  tabs?: ReactNode
  /**
   * Mobile only. Pinned above the home indicator so the primary action
   * survives the on-screen keyboard. Pages render their own inline copy of
   * the button from lg up.
   */
  actionBar?: ReactNode
}

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  steps,
  mobileCrown = false,
  crownSize = "default",
  crownCopy,
  crownAction,
  tabs,
  actionBar,
}: AuthShellProps) {
  const [slideIdx, setSlideIdx] = useState(0)
  // Mobile: the crown gives its height back to the form while a field is
  // focused, so an open keyboard never squeezes the inputs.
  const [compact, setCompact] = useState(false)
  // How much of the layout the on-screen keyboard is covering. iOS Safari
  // never shrinks the layout viewport for the keyboard, and Chrome defaults to
  // resizing only the visual one, so a bottom bar in normal flow would sit
  // underneath the keys. Shrinking the sheet by the overlap keeps it above.
  const [keyboardInset, setKeyboardInset] = useState(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  const logoSrc = getImageUrl("logo.png")

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlideIdx((i) => (i + 1) % HERO_SLIDES.length)
    }, 6500)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!mobileCrown) return
    const vv = window.visualViewport
    if (!vv) return

    const desktop = window.matchMedia("(min-width: 1024px)")
    const update = () => {
      if (desktop.matches) {
        setKeyboardInset(0)
        return
      }
      const overlap = window.innerHeight - vv.height - vv.offsetTop
      // 80px of slack so a collapsing URL bar doesn't read as a keyboard.
      setKeyboardInset(overlap > 80 ? Math.round(overlap) : 0)
    }

    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    desktop.addEventListener("change", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
      desktop.removeEventListener("change", update)
    }
  }, [mobileCrown])

  const current = HERO_SLIDES[slideIdx]

  function handleFocusCapture(e: React.FocusEvent<HTMLDivElement>) {
    const el = e.target as HTMLElement
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      setCompact(true)
    }
  }

  // Stay collapsed while focus moves between fields (and to the show/hide
  // password buttons); only expand once focus leaves the sheet entirely.
  function handleBlurCapture() {
    window.setTimeout(() => {
      const active = document.activeElement
      if (!sheetRef.current || !active || !sheetRef.current.contains(active)) {
        setCompact(false)
      }
    }, 0)
  }

  return (
    // `auth-shell` opts these screens into the mobile touch-target sizing in
    // globals.css (44px controls, 12px minimum text) without affecting the
    // marketing pages that share the same shadcn primitives.
    <div className="auth-shell grid h-svh w-full overflow-hidden bg-background lg:grid-cols-5">
      {/* ─────────────────────────── Brand panel ─────────────────────────── */}
      <aside className="relative hidden overflow-hidden bg-stone-950 lg:col-span-3 lg:flex lg:flex-col">
        {/* Always-on warm artisan backdrop */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-stone-950 via-zinc-950 to-stone-900"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ backgroundImage: WARM_BACKDROP }}
        />
        {/* Delicate mandala-inspired pattern */}
        <MandalaPattern id="kk-mandala" className="opacity-[0.07]" />

        {/* Optional hero slides via CSS background-image (CDN, small + fast) */}
        {HERO_SLIDES.map((s, i) => (
          <div
            key={s.src}
            aria-hidden={i !== slideIdx}
            className={cn(
              "absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-out",
              i === slideIdx ? "opacity-40" : "opacity-0"
            )}
            style={{ backgroundImage: `url('${s.src}')` }}
          />
        ))}

        {/* Final overlay tuned for legibility */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/35 via-black/15 to-black/45"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
        />

        {/* Top: brand mark + browse-shop link */}
        <div className="relative z-10 flex items-center justify-between px-8 pt-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-white"
            aria-label="Kalakraft home"
          >
            <BrandMark logoSrc={logoSrc} />
            <span className="text-base font-semibold tracking-wide">
              Kalakraft
            </span>
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/15"
          >
            Browse shop
            <Sparkles className="h-3 w-3" />
          </Link>
        </div>

        {/* Bottom: copy + trust + slide info */}
        <div className="relative z-10 mt-auto flex flex-col gap-7 px-10 pb-8">
          <div className="flex max-w-xl flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white/85 ring-1 ring-white/15 backdrop-blur">
              <Sparkles className="h-3 w-3" />
              Handcrafted in India
            </span>
            <h2 className="text-3xl font-light leading-[1.15] text-white sm:text-4xl xl:text-[2.4rem]">
              Where every piece tells a
              <span className="ml-2 font-serif italic text-white">story.</span>
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-white/75">
              One-of-a-kind resin art, ceramics and décor from India&apos;s most
              thoughtful makers — delivered to your door, anywhere in the world.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {TRUST_BADGES.map((b) => (
              <div key={b.label} className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur">
                  <b.icon className="h-4 w-4" />
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-white">
                    {b.value}
                  </span>
                  <span className="text-[11px] text-white/60">{b.label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-end justify-between gap-4 border-t border-white/10 pt-4">
            <div className="flex min-w-0 flex-col">
              <span className="text-[10px] uppercase tracking-[0.22em] text-white/50">
                In focus
              </span>
              <span className="truncate text-sm font-medium text-white">
                {current.caption}
              </span>
              <span className="truncate text-[11px] text-white/55">
                {current.category}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5"
              role="tablist"
              aria-label="Featured pieces"
            >
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === slideIdx}
                  aria-label={`Show piece ${i + 1}`}
                  onClick={() => setSlideIdx(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === slideIdx
                      ? "w-8 bg-white"
                      : "w-1.5 bg-white/30 hover:bg-white/55"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────── Form panel ─────────────────────────── */}
      <section
        className={cn(
          "relative flex h-svh flex-col lg:col-span-2 lg:overflow-y-auto lg:overscroll-contain",
          // With the crown, the sheet owns the scrolling on mobile so the
          // action bar can stay pinned. Without it, the panel scrolls itself.
          mobileCrown ? "overflow-hidden" : "overflow-y-auto overscroll-contain"
        )}
      >
        {mobileCrown ? (
          <MobileCrown
            compact={compact}
            size={crownSize}
            copy={crownCopy}
            action={crownAction}
            slideIdx={slideIdx}
            onSelectSlide={setSlideIdx}
            logoSrc={logoSrc}
          />
        ) : (
          <>
            {/* Mobile-only brand strip */}
            <div className="pt-safe lg:hidden" />
            <div className="flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden">
              <Link href="/" className="flex items-center gap-2">
                <BrandMark logoSrc={logoSrc} compact />
                <span className="text-sm font-semibold">Kalakraft</span>
              </Link>
              <Link
                href="/products"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Browse shop →
              </Link>
            </div>
          </>
        )}

        {/* Desktop back-to-shop link */}
        <div className="hidden items-center justify-end px-10 pt-5 lg:flex">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to shop
          </Link>
        </div>

        {/*
          Mobile: a rounded sheet lifted over the crown, scrolling internally so
          the action bar below it stays put. From lg up every one of these
          classes resets and the panel lays out exactly as it did before.
        */}
        <div
          ref={sheetRef}
          onFocusCapture={mobileCrown ? handleFocusCapture : undefined}
          onBlurCapture={mobileCrown ? handleBlurCapture : undefined}
          style={keyboardInset ? { marginBottom: keyboardInset } : undefined}
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            mobileCrown &&
              "relative z-10 -mt-6 rounded-t-3xl bg-background shadow-[0_-14px_34px_-18px_rgba(0,0,0,0.35)] lg:mt-0 lg:rounded-none lg:shadow-none"
          )}
        >
          {mobileCrown && (
            <span
              aria-hidden
              className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-border lg:hidden"
            />
          )}

          {/*
            Top-aligned on mobile: centring inside h-svh meant the whole form
            jumped and compressed the moment the iOS keyboard opened. From lg up
            there is room to spare, so it centres as before.
          */}
          <div
            className={cn(
              "flex min-h-0 flex-1 items-start justify-center px-5 py-6 sm:px-10 lg:items-center lg:overflow-visible",
              mobileCrown &&
                "overflow-y-auto overscroll-contain pt-4 lg:py-6"
            )}
          >
            <div className="flex w-full max-w-md flex-col gap-5">
              {tabs && <div className="lg:hidden">{tabs}</div>}

              <div
                className={cn(
                  "flex-col gap-1.5",
                  // With the crown carrying the brand on mobile, the pages
                  // render their own compact heading inside the sheet.
                  mobileCrown ? "hidden lg:flex" : "flex"
                )}
              >
                {eyebrow && (
                  <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {eyebrow}
                  </span>
                )}
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {subtitle}
                  </p>
                )}
              </div>

              {steps && <StepIndicator current={steps.current} items={steps.items} />}

              {children}

              {footer && (
                <div
                  className={cn(
                    "border-t pt-4 text-center text-sm text-muted-foreground",
                    // On mobile the swap line lives in the action bar instead.
                    actionBar ? "hidden lg:block" : "block"
                  )}
                >
                  {footer}
                </div>
              )}

              {/* Home-indicator clearance — the desktop mini footer is lg-only */}
              {!actionBar && <div className="pb-safe lg:hidden" />}
            </div>
          </div>

          {actionBar && (
            <div className="shrink-0 border-t bg-background px-5 pb-safe pt-3 shadow-[0_-8px_20px_-14px_rgba(0,0,0,0.25)] lg:hidden">
              <div className="mx-auto flex w-full max-w-md flex-col gap-2 pb-3">
                {actionBar}
              </div>
            </div>
          )}
        </div>

        {/* Mini footer */}
        <div className="hidden items-center justify-between gap-4 border-t px-10 py-3 text-[11px] text-muted-foreground lg:flex">
          <span>© {new Date().getFullYear()} Kalakraft</span>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

/* -------------------------------------------------------------- */
/* MobileCrown — the desktop brand panel, at mobile scale          */
/* -------------------------------------------------------------- */

function MobileCrown({
  compact,
  size,
  copy,
  action,
  slideIdx,
  onSelectSlide,
  logoSrc,
}: {
  compact: boolean
  size: "default" | "compact"
  copy?: ReactNode
  action?: ReactNode
  slideIdx: number
  onSelectSlide: (i: number) => void
  logoSrc: string
}) {
  const current = HERO_SLIDES[slideIdx]
  const short = size === "compact"
  const openHeight = short ? 168 : 230
  const shutHeight = short ? 96 : 104

  return (
    <div
      // The notch inset is added to the height rather than eaten out of it,
      // so the brand row keeps its full size on a notched phone instead of
      // being pushed under the sheet that lifts over the crown.
      style={{
        height: `calc(${
          compact ? shutHeight : openHeight
        }px + env(safe-area-inset-top, 0px))`,
      }}
      className="relative shrink-0 overflow-hidden bg-stone-950 transition-[height] duration-500 ease-out motion-reduce:transition-none lg:hidden"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-stone-950 via-zinc-950 to-stone-900"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundImage: WARM_BACKDROP }}
      />
      <MandalaPattern id="kk-mandala-mobile" className="opacity-[0.07]" />

      {/* The rotating pieces belong on a welcome, not on a task screen. */}
      {!short &&
        MOBILE_SLIDE_SRC.map((src, i) => (
          <div
            key={src}
            aria-hidden
            className={cn(
              "absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-out",
              i === slideIdx ? "opacity-40" : "opacity-0"
            )}
            style={{ backgroundImage: `url('${src}')` }}
          />
        ))}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40"
      />

      <div className="pt-safe relative z-10 flex h-full flex-col px-5 pb-5">
        <div className="flex items-center justify-between pt-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-white"
            aria-label="Kalakraft home"
          >
            <BrandMark logoSrc={logoSrc} />
            <span className="text-[15px] font-semibold tracking-wide">
              Kalakraft
            </span>
          </Link>
          {action ?? (
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/20"
            >
              Browse shop
              <Sparkles className="h-3 w-3" />
            </Link>
          )}
        </div>

        <div
          aria-hidden={compact}
          className={cn(
            "mt-auto flex flex-col gap-2.5 transition-all duration-300 motion-reduce:transition-none",
            compact && "pointer-events-none translate-y-2 opacity-0"
          )}
        >
          {copy ?? (
            <>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[9.5px] font-medium uppercase tracking-[0.2em] text-white/85 ring-1 ring-white/15 backdrop-blur">
                <Sparkles className="h-2.5 w-2.5" />
                Handcrafted in India
              </span>
              <h2 className="text-[26px] font-light leading-[1.14] tracking-tight text-white">
                Where every piece tells a
                <span className="ml-1.5 font-serif italic">story.</span>
              </h2>
            </>
          )}

          <div
            className={cn(
              "flex items-center justify-between gap-4 border-t border-white/15 pt-2.5",
              short && "hidden"
            )}
          >
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-[12.5px] font-medium text-white">
                {current.caption}
              </span>
              <span className="truncate text-[10.5px] text-white/60">
                {current.category}
              </span>
            </div>
            {/* The dot is 6px, but the button around it is 24px tall and
                spaced so neighbouring targets never overlap (WCAG 2.5.8). */}
            <div
              className="-mr-2 flex items-center gap-0.5"
              role="tablist"
              aria-label="Featured pieces"
            >
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === slideIdx}
                  aria-label={`Show piece ${i + 1}`}
                  tabIndex={compact ? -1 : 0}
                  onClick={() => onSelectSlide(i)}
                  className="flex h-6 items-center px-2"
                >
                  <span
                    className={cn(
                      "block h-1.5 rounded-full transition-all duration-300",
                      i === slideIdx ? "w-6 bg-white" : "w-1.5 bg-white/35"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MandalaPattern({ id, className }: { id: string; className?: string }) {
  return (
    <svg
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id={id}
          x="0"
          y="0"
          width="120"
          height="120"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="60" cy="60" r="1.5" fill="#fff" />
          <circle
            cx="60"
            cy="60"
            r="22"
            stroke="#fff"
            strokeWidth="0.4"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r="44"
            stroke="#fff"
            strokeWidth="0.25"
            fill="none"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

/* -------------------------------------------------------------- */
/* BrandMark — Kalakraft logo with bulletproof SVG fallback        */
/* -------------------------------------------------------------- */

function BrandMark({
  logoSrc,
  compact = false,
}: {
  logoSrc: string
  compact?: boolean
}) {
  const [imgFailed, setImgFailed] = useState(false)

  const wrapperClass = compact
    ? "flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-foreground/5"
    : "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/20 backdrop-blur"

  if (imgFailed) {
    return (
      <span className={wrapperClass} aria-hidden>
        <KMonogram size={compact ? 18 : 24} />
      </span>
    )
  }

  return (
    <span className={wrapperClass}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoSrc}
        alt=""
        width={compact ? 20 : 28}
        height={compact ? 20 : 28}
        className={compact ? "h-5 w-5 object-contain" : "h-7 w-7 object-contain"}
        loading="eager"
        decoding="async"
        onError={() => setImgFailed(true)}
      />
    </span>
  )
}

function KMonogram({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="kk-mono" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#kk-mono)" />
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

/* -------------------------------------------------------------- */
/* StepIndicator — compact, no descriptions (avoids overflow)      */
/* -------------------------------------------------------------- */

function StepIndicator({
  current,
  items,
}: {
  current: number
  items: { label: string; description: string }[]
}) {
  const activeItem = items[current - 1]

  return (
    <div className="flex flex-col gap-2">
      {/*
        Three truncated 11px labels side by side were unreadable stubs on a
        390px screen. On mobile only the active step is named — with an
        explicit "Step 2 of 3" — and the others collapse to dots. From sm up
        there is room for the full segmented layout.
      */}
      <ol
        aria-label="Progress"
        className="flex items-stretch gap-1 rounded-xl border bg-muted/30 p-1"
      >
        {items.map((item, idx) => {
          const stepNumber = idx + 1
          const state =
            stepNumber < current
              ? "complete"
              : stepNumber === current
              ? "active"
              : "upcoming"

          return (
            <li
              key={item.label}
              aria-current={state === "active" ? "step" : undefined}
              title={item.description}
              className={cn(
                "flex min-w-0 items-center justify-center gap-2 rounded-lg px-2 py-2 transition-colors sm:flex-1",
                // Mobile: the active step takes the room, others stay compact.
                state === "active" ? "flex-1" : "shrink-0",
                state === "active" && "bg-foreground text-background shadow-sm",
                state === "complete" && "text-foreground/85",
                state === "upcoming" && "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
                  state === "active" && "bg-background/15 text-background",
                  state === "complete" && "bg-emerald-500 text-white",
                  state === "upcoming" && "bg-background text-muted-foreground ring-1 ring-border"
                )}
              >
                {state === "complete" ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : (
                  String(stepNumber).padStart(2, "0")
                )}
              </span>
              <span
                className={cn(
                  "truncate text-[11px] font-semibold",
                  state === "active" ? "text-background" : "hidden sm:inline"
                )}
              >
                {item.label}
              </span>
            </li>
          )
        })}
      </ol>

      {activeItem && (
        <p className="px-1 text-[12px] text-muted-foreground sm:hidden">
          Step {current} of {items.length} · {activeItem.description}
        </p>
      )}
    </div>
  )
}
