"use client"

import { ReactNode, useEffect, useState } from "react"
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

const TRUST_BADGES = [
  { icon: Palette, value: "200+", label: "Curated artisans" },
  { icon: Globe2, value: "20+", label: "Countries served" },
  { icon: Heart, value: "5,000+", label: "Happy collectors" },
]

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
}

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  steps,
}: AuthShellProps) {
  const [slideIdx, setSlideIdx] = useState(0)
  const logoSrc = getImageUrl("logo.png")

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlideIdx((i) => (i + 1) % HERO_SLIDES.length)
    }, 6500)
    return () => window.clearInterval(id)
  }, [])

  const current = HERO_SLIDES[slideIdx]

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
          style={{
            backgroundImage: `
              radial-gradient(ellipse 55% 50% at 18% 25%, hsl(28 90% 35% / 0.55), transparent 65%),
              radial-gradient(ellipse 50% 55% at 85% 75%, hsl(340 65% 30% / 0.45), transparent 65%),
              radial-gradient(circle at 50% 100%, hsl(262 50% 25% / 0.5), transparent 70%),
              radial-gradient(circle at 50% 0%, hsl(45 60% 30% / 0.25), transparent 50%)
            `,
          }}
        />
        {/* Delicate mandala-inspired pattern */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="kk-mandala"
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
          <rect width="100%" height="100%" fill="url(#kk-mandala)" />
        </svg>

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
      <section className="relative flex h-svh flex-col overflow-y-auto overscroll-contain lg:col-span-2">
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
          Top-aligned on mobile: centring inside h-svh meant the whole form
          jumped and compressed the moment the iOS keyboard opened. From lg up
          there is room to spare, so it centres as before.
        */}
        <div className="flex flex-1 items-start justify-center px-5 py-6 sm:px-10 lg:items-center">
          <div className="flex w-full max-w-md flex-col gap-5">
            <div className="flex flex-col gap-1.5">
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
              <div className="border-t pt-4 text-center text-sm text-muted-foreground">
                {footer}
              </div>
            )}

            {/* Home-indicator clearance — the desktop mini footer is lg-only */}
            <div className="pb-safe lg:hidden" />
          </div>
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
