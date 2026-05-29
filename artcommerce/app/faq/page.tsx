// File: app/faq/page.tsx
'use client'

import { ReactNode, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { Route } from "next"
import {
  ArrowRight,
  ChevronDown,
  CreditCard,
  HelpCircle,
  Mail,
  MessageSquare,
  Package,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  User2,
  X,
} from "lucide-react"

import MarketingShell from "../components/MarketingShell"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

interface FAQItem {
  q: string
  a: ReactNode
}

interface FAQSection {
  id: string
  title: string
  icon: typeof ShieldCheck
  description: string
  items: FAQItem[]
}

const SECTIONS: FAQSection[] = [
  {
    id: "shipping",
    title: "Shipping & delivery",
    icon: Truck,
    description: "Timelines, tracking, and what to expect at your door.",
    items: [
      {
        q: "When will my order ship?",
        a: (
          <>
            <p>
              In-stock pieces ship within <strong>2–4 business days</strong>{" "}
              from our Jaipur studio. Made-to-order items take longer — the
              product page shows the expected lead time before you check out.
            </p>
          </>
        ),
      },
      {
        q: "How long does delivery take?",
        a: (
          <ul className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
            <li>India — 3 to 6 business days after dispatch</li>
            <li>North America &amp; Europe — 7 to 14 business days</li>
            <li>Rest of world — 10 to 21 business days</li>
          </ul>
        ),
      },
      {
        q: "Do you ship internationally?",
        a: (
          <p>
            Yes — we ship to 20+ countries. Customs duties and import taxes are
            calculated at checkout where possible. In a few regions you may be
            asked to pay duties on delivery; we&apos;ll always flag this on the
            product page.
          </p>
        ),
      },
      {
        q: "How do I track my order?",
        a: (
          <p>
            Once your piece ships, you&apos;ll get an email with a tracking
            number. You can also see live status under{" "}
            <Link
              href="/dashboard/orders"
              className="underline-offset-4 hover:underline"
            >
              Orders
            </Link>{" "}
            in your dashboard.
          </p>
        ),
      },
      {
        q: "What if my package is delayed or lost?",
        a: (
          <p>
            Reach out to{" "}
            <a
              href="mailto:hello@kalakraft.com"
              className="font-medium underline-offset-4 hover:underline"
            >
              hello@kalakraft.com
            </a>{" "}
            with your order number. We&apos;ll work with the carrier and, if a
            package is confirmed lost, send a replacement or full refund — no
            paperwork hoops.
          </p>
        ),
      },
    ],
  },
  {
    id: "returns",
    title: "Returns & exchanges",
    icon: ShieldCheck,
    description: "Our 14-day window and how to start a return.",
    items: [
      {
        q: "What's your return policy?",
        a: (
          <p>
            Most pieces can be returned within <strong>14 days</strong> of
            delivery for any reason. Items must be unused and in their original
            packaging. Made-to-order and custom pieces aren&apos;t returnable
            unless they arrive damaged.
          </p>
        ),
      },
      {
        q: "How do I start a return?",
        a: (
          <p>
            Open the order in{" "}
            <Link
              href="/dashboard/orders"
              className="underline-offset-4 hover:underline"
            >
              your dashboard
            </Link>{" "}
            and tap &ldquo;Start a return.&rdquo; You&apos;ll get a shipping
            label and instructions within one business day.
          </p>
        ),
      },
      {
        q: "Who pays for return shipping?",
        a: (
          <p>
            We cover return shipping when a piece arrives damaged or different
            from what was ordered. For change-of-mind returns, the return label
            is deducted from the refund.
          </p>
        ),
      },
      {
        q: "When will I get my refund?",
        a: (
          <p>
            Refunds are issued within <strong>5 business days</strong> of us
            receiving the return. Bank settlement usually takes another 2–3 days
            after that, depending on your card or wallet.
          </p>
        ),
      },
      {
        q: "Can I exchange instead of returning?",
        a: (
          <p>
            Yes — start a regular return and use the refund toward a fresh
            order. We don&apos;t do direct swaps so inventory stays accurate for
            other collectors.
          </p>
        ),
      },
    ],
  },
  {
    id: "care",
    title: "Care & maintenance",
    icon: Package,
    description: "Cleaning, storage and what to avoid.",
    items: [
      {
        q: "How do I clean my resin piece?",
        a: (
          <p>
            A soft, slightly damp cloth is all you need. Avoid abrasive
            sponges, alcohol, and harsh cleaners — they can dull the gloss.
          </p>
        ),
      },
      {
        q: "Can resin pieces go in water?",
        a: (
          <p>
            Trays are water-tolerant for short exposure — wipe spills quickly.
            Don&apos;t submerge or run them through the dishwasher.
          </p>
        ),
      },
      {
        q: "Will my piece change color over time?",
        a: (
          <p>
            Quality resin holds its color for years indoors. Direct sunlight
            for many hours a day can cause gradual ambering — keep your piece
            away from sun-baked windows for the longest life.
          </p>
        ),
      },
      {
        q: "How should I store it long-term?",
        a: (
          <p>
            Wrap in soft cloth or bubble wrap and store flat in a cool, dry
            place. Avoid stacking heavy items on top.
          </p>
        ),
      },
    ],
  },
  {
    id: "orders",
    title: "Orders & payments",
    icon: CreditCard,
    description: "Checkout, payment methods and gift options.",
    items: [
      {
        q: "What payment methods do you accept?",
        a: (
          <p>
            All major credit and debit cards, PayPal, UPI (in India), and
            cash-on-delivery for select pincodes. We never store full card
            numbers ourselves.
          </p>
        ),
      },
      {
        q: "Can I modify my order after placing it?",
        a: (
          <p>
            Edits like address changes are possible while the order is still in{" "}
            <em>Pending</em> status. Once it&apos;s accepted by the studio,
            email{" "}
            <a
              href="mailto:hello@kalakraft.com"
              className="font-medium underline-offset-4 hover:underline"
            >
              hello@kalakraft.com
            </a>{" "}
            quickly — we&apos;ll do our best.
          </p>
        ),
      },
      {
        q: "Is my payment information secure?",
        a: (
          <p>
            Yes. Payments are processed by PCI-certified providers over
            encrypted HTTPS. We see only a confirmation ID, never your card
            details. See our{" "}
            <Link
              href="/privacy"
              className="underline-offset-4 hover:underline"
            >
              privacy policy
            </Link>{" "}
            for the full picture.
          </p>
        ),
      },
      {
        q: "Do you offer gift wrapping?",
        a: (
          <p>
            Every piece ships gift-ready in a hand-tied cotton sleeve. Add a
            note at checkout and we&apos;ll include it on a hand-stamped card.
          </p>
        ),
      },
    ],
  },
  {
    id: "products",
    title: "Products & artisans",
    icon: Palette,
    description: "About the pieces and the makers behind them.",
    items: [
      {
        q: "Are all pieces unique?",
        a: (
          <p>
            Most are. Resin pours and hand finishes mean no two pieces are
            identical even within a series — that variation is part of the
            craft.
          </p>
        ),
      },
      {
        q: "How are artisans chosen?",
        a: (
          <p>
            We invite makers based on craftsmanship, ethical materials and a
            distinct voice. Each artisan goes through a portfolio review and a
            sample-piece quality check before joining the platform.
          </p>
        ),
      },
      {
        q: "Can I commission a custom piece?",
        a: (
          <p>
            Yes — write to{" "}
            <a
              href="mailto:hello@kalakraft.com"
              className="font-medium underline-offset-4 hover:underline"
            >
              hello@kalakraft.com
            </a>{" "}
            with what you&apos;re after, and we&apos;ll pair you with the right
            artisan. Lead times for custom work usually run 4–6 weeks.
          </p>
        ),
      },
      {
        q: "Where are the materials sourced?",
        a: (
          <p>
            Resins are food-safe and lab-tested. Brass and wood are sourced
            from regional workshops we&apos;ve audited in person. Each product
            page lists the material origins.
          </p>
        ),
      },
    ],
  },
  {
    id: "account",
    title: "Account",
    icon: User2,
    description: "Sign in, profile and settings.",
    items: [
      {
        q: "How do I create an account?",
        a: (
          <p>
            Head to{" "}
            <Link
              href="/auth/signup"
              className="underline-offset-4 hover:underline"
            >
              sign up
            </Link>{" "}
            and use email or continue with Google / Facebook. You can also
            check out as a guest and create an account later from the order
            confirmation page.
          </p>
        ),
      },
      {
        q: "I forgot my password — what now?",
        a: (
          <p>
            Use{" "}
            <Link
              href="/auth/forgot-password"
              className="underline-offset-4 hover:underline"
            >
              forgot password
            </Link>{" "}
            — we&apos;ll email a six-character code so you can set a new one.
            Codes expire after 5 minutes for safety.
          </p>
        ),
      },
      {
        q: "How do I update my shipping address?",
        a: (
          <p>
            Sign in and open{" "}
            <Link
              href="/dashboard/addresses"
              className="underline-offset-4 hover:underline"
            >
              Addresses
            </Link>{" "}
            in your dashboard. New addresses also save automatically when you
            check out.
          </p>
        ),
      },
      {
        q: "Can I delete my account?",
        a: (
          <p>
            Yes — email{" "}
            <a
              href="mailto:privacy@kalakraft.com"
              className="font-medium underline-offset-4 hover:underline"
            >
              privacy@kalakraft.com
            </a>{" "}
            from the address on your account and we&apos;ll remove your data
            within 30 days. Active orders are kept until they&apos;re completed
            or refunded.
          </p>
        ),
      },
    ],
  },
]

function getPlainText(node: ReactNode): string {
  if (node == null || node === false || node === true) return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(getPlainText).join(" ")
  if (typeof node === "object" && "props" in (node as any)) {
    return getPlainText((node as any).props.children)
  }
  return ""
}

export default function FAQPage() {
  const [query, setQuery] = useState("")
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id)

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SECTIONS
    return SECTIONS.map((s) => ({
      ...s,
      items: s.items.filter((item) => {
        const haystack = (item.q + " " + getPlainText(item.a)).toLowerCase()
        return haystack.includes(q)
      }),
    })).filter((s) => s.items.length > 0)
  }, [query])

  const totalQuestions = SECTIONS.reduce((s, c) => s + c.items.length, 0)
  const matchedCount = filteredSections.reduce(
    (s, c) => s + c.items.length,
    0
  )

  // Active section detection via IntersectionObserver
  useEffect(() => {
    if (query) return // skip while filtering
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (a.target as HTMLElement).offsetTop -
              (b.target as HTMLElement).offsetTop
          )
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [query])

  return (
    <MarketingShell>
      <main className="flex flex-col">
        {/* ───────────────────── Hero ───────────────────── */}
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-zinc-50 via-background to-zinc-50 dark:from-zinc-950 dark:via-background dark:to-zinc-950">
          <div
            aria-hidden
            className="absolute inset-0 opacity-55"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, hsl(160 60% 55% / 0.16), transparent 50%),
                radial-gradient(circle at 80% 70%, hsl(28 90% 60% / 0.18), transparent 50%)
              `,
            }}
          />
          <div className="container relative mx-auto max-w-5xl px-4 py-14 sm:py-20">
            <div className="flex max-w-3xl flex-col gap-3">
              <Badge
                variant="outline"
                className="w-fit gap-1.5 rounded-full border-foreground/15 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] backdrop-blur"
              >
                <HelpCircle className="h-3 w-3" />
                FAQs
              </Badge>
              <h1 className="text-4xl font-light leading-[1.1] tracking-tight sm:text-5xl">
                Quick answers,
                <br />
                <span className="font-serif italic">faster than email.</span>
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Search {totalQuestions} questions across shipping, returns, care
                and more. Can&apos;t find it?{" "}
                <Link
                  href="/contact"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  Talk to us
                </Link>
                .
              </p>

              <div className="mt-4 max-w-xl">
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  matched={matchedCount}
                  total={totalQuestions}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────── Body ───────────────────── */}
        <section className="container mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-12">
            {/* Sticky TOC */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <Card className="shadow-sm">
                <CardContent className="flex flex-col gap-1 p-2">
                  <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Topics
                  </p>
                  <nav className="flex flex-col gap-0.5">
                    {SECTIONS.map((s) => {
                      const isActive = activeId === s.id
                      const count = filteredSections.find((f) => f.id === s.id)
                        ?.items.length
                      const dimmed = query && (count ?? 0) === 0
                      return (
                        <Link
                          key={s.id}
                          href={`#${s.id}` as Route}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                            dimmed
                              ? "text-muted-foreground/40"
                              : isActive
                              ? "bg-accent font-medium text-accent-foreground"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                          )}
                        >
                          <s.icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{s.title}</span>
                          {query && (
                            <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                              {count ?? 0}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </nav>
                </CardContent>
              </Card>

              <Card className="mt-4 shadow-sm">
                <CardContent className="flex flex-col gap-3 p-4">
                  <p className="text-xs font-semibold">Still stuck?</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    We read every email and reply within a business day.
                  </p>
                  <Button asChild size="sm" className="w-full gap-1.5">
                    <Link href="/contact">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Talk to us
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </aside>

            {/* Sections */}
            <article className="flex min-w-0 flex-col gap-10">
              {filteredSections.length === 0 ? (
                <EmptyState query={query} onReset={() => setQuery("")} />
              ) : (
                filteredSections.map((s, i) => (
                  <section
                    key={s.id}
                    id={s.id}
                    aria-labelledby={`${s.id}-heading`}
                    className="scroll-mt-24"
                  >
                    <div className="mb-4 flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
                        <s.icon className="h-4 w-4" />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          {String(i + 1).padStart(2, "0")} · {s.items.length}{" "}
                          {s.items.length === 1 ? "question" : "questions"}
                        </span>
                        <h2
                          id={`${s.id}-heading`}
                          className="text-xl font-semibold tracking-tight sm:text-2xl"
                        >
                          {s.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {s.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pl-12">
                      {s.items.map((item, idx) => (
                        <FAQEntry
                          key={`${s.id}-${idx}`}
                          question={item.q}
                          answer={item.a}
                          highlight={query}
                        />
                      ))}
                    </div>

                    {i < filteredSections.length - 1 && (
                      <Separator className="mt-10" />
                    )}
                  </section>
                ))
              )}
            </article>
          </div>
        </section>

        {/* ───────────────────── End CTA ───────────────────── */}
        <section className="border-t bg-foreground text-background">
          <div className="container mx-auto max-w-6xl px-4 py-12 sm:py-14">
            <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex max-w-xl flex-col gap-2">
                <h2 className="text-2xl font-light leading-tight sm:text-3xl">
                  Didn&apos;t find your answer?
                </h2>
                <p className="text-sm text-background/70">
                  Write to us — a human reads every message and replies within a
                  business day.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Button
                  asChild
                  variant="secondary"
                  className="gap-1.5 bg-background text-foreground hover:bg-background/90"
                >
                  <Link href="/contact">
                    <Mail className="h-4 w-4" />
                    Email us
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="gap-1.5 border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
                >
                  <Link href="/products">
                    Browse shop
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  )
}

/* -------------------------------------------------------------- */
/* SearchBar                                                       */
/* -------------------------------------------------------------- */

function SearchBar({
  value,
  onChange,
  matched,
  total,
}: {
  value: string
  onChange: (v: string) => void
  matched: number
  total: number
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search FAQs — try &ldquo;shipping&rdquo; or &ldquo;refund&rdquo;"
          className="h-11 bg-background pl-10 pr-10 text-base sm:text-sm"
          aria-label="Search FAQs"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {value && (
        <p className="px-1 text-xs text-muted-foreground">
          {matched > 0
            ? `${matched} of ${total} questions match`
            : "No matches — try fewer or different words"}
        </p>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- */
/* FAQEntry — accordion item using native <details>                */
/* -------------------------------------------------------------- */

function FAQEntry({
  question,
  answer,
  highlight,
}: {
  question: string
  answer: ReactNode
  highlight: string
}) {
  return (
    <details className="group rounded-lg border bg-card transition-colors open:border-foreground/30 open:bg-card hover:border-foreground/20">
      <summary
        className={cn(
          "flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium text-foreground",
          "list-none [&::-webkit-details-marker]:hidden"
        )}
      >
        <span className="flex-1">
          <HighlightedText text={question} highlight={highlight} />
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            "group-open:rotate-180 group-open:text-foreground"
          )}
        />
      </summary>
      <div className="border-t px-4 pb-4 pt-3 text-sm leading-relaxed text-muted-foreground">
        {answer}
      </div>
    </details>
  )
}

function HighlightedText({
  text,
  highlight,
}: {
  text: string
  highlight: string
}) {
  const q = highlight.trim()
  if (!q) return <>{text}</>

  const lower = text.toLowerCase()
  const needle = q.toLowerCase()
  const idx = lower.indexOf(needle)
  if (idx === -1) return <>{text}</>

  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-amber-200/70 px-0.5 text-foreground dark:bg-amber-500/30">
        {text.slice(idx, idx + needle.length)}
      </mark>
      {text.slice(idx + needle.length)}
    </>
  )
}

/* -------------------------------------------------------------- */
/* EmptyState                                                       */
/* -------------------------------------------------------------- */

function EmptyState({
  query,
  onReset,
}: {
  query: string
  onReset: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border bg-card py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5 text-foreground">
        <Search className="h-5 w-5" />
      </span>
      <div className="flex flex-col gap-1 px-6">
        <p className="text-base font-semibold">
          No matches for &ldquo;{query}&rdquo;
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Try fewer words, check spelling, or browse the topics on the left.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5">
          <X className="h-3.5 w-3.5" />
          Clear search
        </Button>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/contact">
            <Sparkles className="h-3.5 w-3.5" />
            Ask us directly
          </Link>
        </Button>
      </div>
    </div>
  )
}
