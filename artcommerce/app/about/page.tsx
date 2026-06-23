// File: app/about/page.tsx
import Link from "next/link"
import type { Metadata } from "next"
import {
  ArrowRight,
  Award,
  Compass,
  Globe2,
  Hammer,
  Heart,
  Leaf,
  Mail,
  Palette,
  Quote,
  Sparkles,
  Users,
} from "lucide-react"

import MarketingShell from "../components/MarketingShell"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "About — Kalakraft",
  description:
    "Curated handcrafted resin art, ceramics and décor from India's most thoughtful artisans.",
}

const VALUES = [
  {
    icon: Hammer,
    title: "Hand-finished, never rushed",
    body: "Every piece is poured, cured and finished by a single maker. No assembly lines, no shortcuts.",
  },
  {
    icon: Heart,
    title: "Fair to the maker",
    body: "Artisans set their own price floor and keep at least 70% of every sale. Always.",
  },
  {
    icon: Leaf,
    title: "Materials we'd live with",
    body: "Food-safe resins, reclaimed brass and locally sourced woods. We refuse to ship what we wouldn't keep.",
  },
  {
    icon: Award,
    title: "Quality-checked twice",
    body: "Each piece passes the maker's review and a second studio inspection before it leaves for your home.",
  },
]

const STATS = [
  { value: "200+", label: "Artisans on the platform", icon: Palette },
  { value: "20+", label: "Countries we ship to", icon: Globe2 },
  { value: "5,000+", label: "Happy collectors", icon: Users },
  { value: "98%", label: "On-time delivery", icon: Compass },
]

const MILESTONES = [
  {
    year: "2021",
    title: "A workshop in Jaipur",
    body: "Started as a single studio sharing space with three resin artists.",
  },
  {
    year: "2022",
    title: "First commission abroad",
    body: "A Tokyo gallery commissioned a custom run of 40 wall pieces.",
  },
  {
    year: "2023",
    title: "Open to makers everywhere",
    body: "Opened applications to artisans across India — 1,400+ submissions in the first month.",
  },
  {
    year: "2024",
    title: "Kalakraft today",
    body: "200+ artisans, four warehouses, and pieces in homes across 20+ countries.",
  },
]

export default function AboutPage() {
  return (
    <MarketingShell>
      <main className="flex flex-col">
      {/* ───────────────────── Hero ───────────────────── */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-zinc-50 via-background to-zinc-50 dark:from-zinc-950 dark:via-background dark:to-zinc-950">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `
              radial-gradient(circle at 15% 30%, hsl(262 83% 70% / 0.15), transparent 50%),
              radial-gradient(circle at 85% 70%, hsl(28 95% 60% / 0.18), transparent 50%)
            `,
          }}
        />
        <div className="container relative mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-28">
          <div className="flex max-w-3xl flex-col gap-4">
            <Badge
              variant="outline"
              className="w-fit gap-1.5 rounded-full border-foreground/15 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] backdrop-blur"
            >
              <Sparkles className="h-3 w-3" />
              About Kalakraft
            </Badge>
            <h1 className="text-4xl font-light leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Crafted with purpose.
              <br />
              <span className="font-serif italic">Made to last.</span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Kalakraft is a curated marketplace for handcrafted resin art,
              ceramics and décor from India&apos;s most thoughtful makers — built so
              one-of-a-kind pieces find homes that love them.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Button asChild className="gap-1.5">
                <Link href="/products">
                  Browse the shop
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-1.5">
                <Link href="/contact">
                  Talk to us
                  <Mail className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── Stats strip ───────────────────── */}
      <section className="border-b">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-start gap-1.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/5 text-foreground">
                  <s.icon className="h-4 w-4" />
                </span>
                <span className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
                  {s.value}
                </span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────── Our story (two-column) ───────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Our story
            </span>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              We started in a shared studio with three resin artists.
            </h2>
          </div>
          <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              Kalakraft began in 2021 when we kept getting asked the same
              question by friends: <em>where do I buy art that doesn&apos;t feel
              mass-produced?</em> The answer existed — India has more skilled makers
              per square mile than anywhere on earth — but it was scattered
              across small workshops, Instagram DMs, and weekend markets.
            </p>
            <p>
              So we built the bridge. A platform where artisans keep ownership of
              their craft and pricing, and collectors find pieces with provenance
              — who made it, where, what it&apos;s made of, and how to care for it.
            </p>
            <p>
              Three years on, we work with 200+ makers across the country, ship
              to homes in 20+ countries, and still inspect every piece by hand
              before it leaves the studio.
            </p>

            <Card className="relative mt-3 overflow-hidden border-foreground/10 bg-gradient-to-br from-muted/60 via-background to-background shadow-sm">
              <span
                aria-hidden
                className="pointer-events-none absolute -right-3 -top-8 select-none font-serif text-[140px] leading-none text-foreground/[0.05]"
              >
                &rdquo;
              </span>
              <CardContent className="relative flex flex-col gap-5 p-6 sm:p-7">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/5 text-foreground">
                  <Quote className="h-4 w-4" />
                </span>
                <blockquote className="text-lg font-light italic leading-relaxed tracking-tight text-foreground sm:text-xl">
                  Kalakraft is the first platform that treated my work like art
                  instead of inventory.
                </blockquote>
                <div className="flex items-center gap-3 border-t border-border/60 pt-4">
                  <Avatar className="h-10 w-10 ring-1 ring-border">
                    <AvatarFallback className="bg-foreground text-xs font-semibold text-background">
                      MS
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      Meera S.
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Resin artist, Jaipur · On Kalakraft since 2022
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator />

      {/* ───────────────────── Values ───────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mb-10 flex max-w-2xl flex-col gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            What we stand for
          </span>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Four things we refuse to compromise on.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <Card key={v.title} className="shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-3 p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
                  <v.icon className="h-5 w-5" />
                </span>
                <h3 className="text-sm font-semibold">{v.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {v.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* ───────────────────── Milestones ───────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mb-10 flex max-w-2xl flex-col gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            How we got here
          </span>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            From a shared studio to homes around the world.
          </h2>
        </div>
        <ol className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {MILESTONES.map((m, i) => {
            const isLast = i === MILESTONES.length - 1
            return (
              <li key={m.year} className="group flex flex-col gap-4">
                {/* Node + connector line */}
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold tabular-nums transition-transform duration-300 group-hover:scale-105",
                      isLast
                        ? "border-transparent bg-foreground text-background shadow-lg shadow-foreground/25"
                        : "border-border bg-background text-foreground group-hover:border-foreground/40"
                    )}
                  >
                    0{i + 1}
                  </span>
                  {!isLast && (
                    <span
                      aria-hidden
                      className="hidden h-px flex-1 bg-gradient-to-r from-border to-border/30 lg:block"
                    />
                  )}
                </div>

                {/* Card */}
                <div className="flex flex-col rounded-xl border bg-card p-4 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-foreground/20 group-hover:shadow-md">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground tabular-nums">
                      {m.year}
                    </span>
                    {isLast && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
                        Now
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold">{m.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {m.body}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {/* ───────────────────── CTA banner ───────────────────── */}
      <section className="border-t bg-foreground text-background">
        <div className="container mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex max-w-xl flex-col gap-2">
              <h2 className="text-2xl font-light leading-tight sm:text-3xl">
                Find a piece that feels{" "}
                <span className="font-serif italic">like home.</span>
              </h2>
              <p className="text-sm text-background/70">
                Browse 200+ artisans and 800+ pieces curated this season.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                variant="secondary"
                className="gap-1.5 bg-background text-foreground hover:bg-background/90"
              >
                <Link href="/products">
                  Shop now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="gap-1.5 border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
              >
                <Link href="/contact">Contact us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      </main>
    </MarketingShell>
  )
}
