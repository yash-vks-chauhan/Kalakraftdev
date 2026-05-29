"use client"

import { ReactNode, useEffect, useState } from "react"
import Image from "next/image"
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

interface HeroSlide {
  src: string
  caption: string
  category: string
}

const HERO_SLIDES: HeroSlide[] = [
  {
    src: "/images/featured1.png",
    caption: "Handcrafted Resin Clock",
    category: "Clocks · Limited series",
  },
  {
    src: "/images/featured2.png",
    caption: "Decorative Wall Piece",
    category: "Wall décor · Made to order",
  },
  {
    src: "/images/featured3.JPG",
    caption: "Resin Tray Set",
    category: "Trays · Hand-poured",
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

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlideIdx((i) => (i + 1) % HERO_SLIDES.length)
    }, 6000)
    return () => window.clearInterval(id)
  }, [])

  const current = HERO_SLIDES[slideIdx]

  return (
    <div className="grid min-h-svh w-full bg-background lg:grid-cols-5">
      {/* ───────── Brand panel (desktop only) ───────── */}
      <aside className="relative hidden overflow-hidden bg-zinc-950 lg:col-span-3 lg:flex lg:flex-col">
        {/* Background slides */}
        {HERO_SLIDES.map((s, i) => (
          <div
            key={s.src}
            className={cn(
              "absolute inset-0 transition-opacity duration-[1400ms] ease-out",
              i === slideIdx ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={i !== slideIdx}
          >
            <Image
              src={s.src}
              alt={s.caption}
              fill
              priority={i === 0}
              sizes="60vw"
              className="object-cover"
            />
          </div>
        ))}

        {/* Atmospheric overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/55 via-black/35 to-black/55" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/55 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-black/40 to-transparent" />

        {/* Top: brand mark + home link */}
        <div className="relative z-10 flex items-center justify-between p-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-white"
            aria-label="Kalakraft home"
          >
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/20 backdrop-blur">
              <Image
                src="/images/logo.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </span>
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

        {/* Center / bottom: copy + trust + slide info */}
        <div className="relative z-10 mt-auto flex flex-col gap-8 px-10 pb-10">
          <div className="flex max-w-xl flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white/85 ring-1 ring-white/15 backdrop-blur">
              <Sparkles className="h-3 w-3" />
              Handcrafted in India
            </span>
            <h2 className="text-3xl font-light leading-[1.15] text-white sm:text-4xl xl:text-[2.6rem]">
              Where every piece tells a
              <span className="ml-2 font-serif italic text-white">story.</span>
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-white/75">
              Discover one-of-a-kind resin art, ceramics and décor from India&apos;s
              most thoughtful makers — delivered to your door, anywhere in the world.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-9 gap-y-3">
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
                    i === slideIdx ? "w-8 bg-white" : "w-1.5 bg-white/30 hover:bg-white/55"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ───────── Form panel ───────── */}
      <section className="relative flex min-h-svh flex-col lg:col-span-2">
        {/* Mobile-only brand strip */}
        <div className="flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md bg-foreground/5">
              <Image
                src="/images/logo.png"
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 object-contain"
              />
            </span>
            <span className="text-sm font-semibold">Kalakraft</span>
          </Link>
          <Link
            href="/products"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Browse shop →
          </Link>
        </div>

        {/* Desktop "back home" link, top-right of form pane */}
        <div className="hidden items-center justify-end px-10 pt-6 lg:flex">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to shop
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="flex w-full max-w-md flex-col gap-6">
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
              <div className="border-t pt-5 text-center text-sm text-muted-foreground">
                {footer}
              </div>
            )}
          </div>
        </div>

        {/* Mini footer */}
        <div className="hidden items-center justify-between gap-4 border-t px-10 py-4 text-[11px] text-muted-foreground lg:flex">
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

function StepIndicator({
  current,
  items,
}: {
  current: number
  items: { label: string; description: string }[]
}) {
  return (
    <ol
      aria-label="Progress"
      className="flex items-stretch gap-2 rounded-lg border bg-muted/30 p-1.5"
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
            className={cn(
              "flex flex-1 items-center gap-2 rounded-md px-2.5 py-2 transition-colors",
              state === "active" && "bg-background shadow-sm ring-1 ring-border",
              state === "complete" && "text-foreground/85",
              state === "upcoming" && "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
                state === "complete" && "bg-emerald-500 text-white",
                state === "active" && "bg-foreground text-background",
                state === "upcoming" && "bg-muted text-muted-foreground"
              )}
            >
              {state === "complete" ? (
                <Check className="h-3 w-3" />
              ) : (
                String(stepNumber).padStart(2, "0")
              )}
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-[11px] font-semibold">
                {item.label}
              </span>
              <span className="hidden truncate text-[10px] text-muted-foreground sm:inline">
                {item.description}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
