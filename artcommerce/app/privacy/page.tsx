// File: app/privacy/page.tsx
'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Route } from "next"
import {
  ArrowUp,
  Cookie,
  Database,
  FileText,
  Globe2,
  Mail,
  ScrollText,
  Settings2,
  Share2,
  ShieldCheck,
  UserCog,
} from "lucide-react"

import MarketingShell from "../components/MarketingShell"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const LAST_UPDATED = "May 1, 2026"
const EFFECTIVE_DATE = "May 15, 2026"

interface Section {
  id: string
  title: string
  icon: typeof ShieldCheck
  body: React.ReactNode
}

const SECTIONS: Section[] = [
  {
    id: "overview",
    title: "Overview",
    icon: ShieldCheck,
    body: (
      <>
        <p>
          This policy explains what information Kalakraft collects when you
          shop with us or browse our site, how we use it, and the choices you
          have. We&apos;ve written it in plain language because we read every
          customer email and we know &quot;legalese&quot; isn&apos;t helpful.
        </p>
        <p>
          If anything here is unclear, write to{" "}
          <a href="mailto:privacy@kalakraft.com" className="font-medium underline-offset-4 hover:underline">
            privacy@kalakraft.com
          </a>{" "}
          — a human will answer.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "Information we collect",
    icon: Database,
    body: (
      <>
        <p>We collect only what we need to run the shop and deliver your orders:</p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
          <li>
            <strong className="text-foreground">Account info</strong> — name,
            email, password (hashed, never readable by us).
          </li>
          <li>
            <strong className="text-foreground">Order info</strong> — shipping
            address, billing address, items ordered, payment confirmation IDs.
            We do <em>not</em> store full card numbers.
          </li>
          <li>
            <strong className="text-foreground">Browsing data</strong> — pages
            you view, search terms and clicks, used to make the shop better. No
            cross-site tracking.
          </li>
          <li>
            <strong className="text-foreground">Support messages</strong> —
            anything you send us via the contact form or email.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use it",
    icon: Settings2,
    body: (
      <>
        <p>We use the information above strictly to:</p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
          <li>Process and ship your orders, and handle returns or exchanges.</li>
          <li>Reply to your questions and provide customer support.</li>
          <li>Send transactional emails (receipts, shipping updates).</li>
          <li>
            Improve the shop &mdash; which pieces resonate, where customers get stuck,
            what to curate next.
          </li>
          <li>
            Detect and prevent fraud, abuse, or violations of our terms.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> sell or rent your personal information to
          third parties. Ever.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies & similar tech",
    icon: Cookie,
    body: (
      <>
        <p>
          We use a small set of cookies. Most are essential — they keep you
          signed in and remember your cart. A few are analytical and help us see
          which pages are working.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <CookieType
            tone="essential"
            title="Essential"
            body="Sign-in session, cart contents, fraud detection. These can't be turned off — the shop won't work without them."
          />
          <CookieType
            tone="analytics"
            title="Analytics"
            body="Aggregate page-view counts and broken-link reporting. No personal profiles are built. Can be disabled in your browser."
          />
        </div>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share with",
    icon: Share2,
    body: (
      <>
        <p>
          We share data with a short, vetted list of providers who help us run
          the shop:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
          <li>
            <strong className="text-foreground">Payment processors</strong> —
            to charge cards and process refunds.
          </li>
          <li>
            <strong className="text-foreground">Shipping carriers</strong> — to
            move your piece from our studio to your door.
          </li>
          <li>
            <strong className="text-foreground">Email service</strong> — to
            send order confirmations and reset codes.
          </li>
          <li>
            <strong className="text-foreground">Hosting & analytics</strong> —
            to keep the site online and improve it.
          </li>
        </ul>
        <p>
          Each provider is contractually limited to the data they need and can
          only use it for the purpose we&apos;ve agreed.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights & choices",
    icon: UserCog,
    body: (
      <>
        <p>You have control over your data. At any time you can:</p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
          <li>Sign in to your dashboard and update your profile or addresses.</li>
          <li>Request a copy of the information we hold about you.</li>
          <li>Ask us to delete your account and the data tied to it.</li>
          <li>Unsubscribe from non-essential emails with one click.</li>
        </ul>
        <p>
          Email{" "}
          <a href="mailto:privacy@kalakraft.com" className="font-medium underline-offset-4 hover:underline">
            privacy@kalakraft.com
          </a>{" "}
          and we&apos;ll act on requests within 30 days.
        </p>
      </>
    ),
  },
  {
    id: "international",
    title: "International transfers",
    icon: Globe2,
    body: (
      <>
        <p>
          Our servers are hosted in India and the European Union. If you order
          from outside these regions, your data may be transferred to a
          jurisdiction with different privacy laws. We rely on standard
          contractual clauses and equivalent safeguards in all such transfers.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    icon: ShieldCheck,
    body: (
      <>
        <p>
          We take security seriously. All traffic is encrypted over HTTPS,
          passwords are hashed with industry-standard algorithms, and access to
          customer data is logged and limited to staff who need it.
        </p>
        <p>
          No system is perfect — if you suspect anything wrong with your
          account, write to{" "}
          <a href="mailto:security@kalakraft.com" className="font-medium underline-offset-4 hover:underline">
            security@kalakraft.com
          </a>{" "}
          immediately.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    icon: ScrollText,
    body: (
      <>
        <p>
          When we update this policy materially, we&apos;ll email account holders
          and post a banner on the site at least 14 days before changes take
          effect. The current version always lives at this URL.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    icon: Mail,
    body: (
      <>
        <p>
          Questions about this policy, your data, or how anything works behind
          the scenes:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
          <li>
            Email:{" "}
            <a
              href="mailto:privacy@kalakraft.com"
              className="font-medium underline-offset-4 hover:underline"
            >
              privacy@kalakraft.com
            </a>
          </li>
          <li>Post: Kalakraft Studio, Sector 3, Jaipur 302001, India</li>
        </ul>
      </>
    ),
  },
]

export default function PrivacyPage() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id)

  useEffect(() => {
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
  }, [])

  return (
    <MarketingShell showReadingProgress>
      <main className="flex flex-col">
      {/* ───────────────────── Hero ───────────────────── */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-zinc-50 via-background to-zinc-50 dark:from-zinc-950 dark:via-background dark:to-zinc-950">
        <div
          aria-hidden
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, hsl(220 60% 60% / 0.14), transparent 50%),
              radial-gradient(circle at 80% 70%, hsl(160 50% 50% / 0.16), transparent 50%)
            `,
          }}
        />
        <div className="container relative mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <div className="flex max-w-3xl flex-col gap-3">
            <Badge
              variant="outline"
              className="w-fit gap-1.5 rounded-full border-foreground/15 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] backdrop-blur"
            >
              <ShieldCheck className="h-3 w-3" />
              Privacy
            </Badge>
            <h1 className="text-4xl font-light leading-[1.1] tracking-tight sm:text-5xl">
              Privacy policy.
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Written plainly so you actually know what we collect, why, and what
              choices you have.
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Last updated <strong className="font-medium text-foreground">{LAST_UPDATED}</strong>
              </span>
              <span className="text-border">·</span>
              <span>
                Effective <strong className="font-medium text-foreground">{EFFECTIVE_DATE}</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── Body: TOC + sections ───────────────────── */}
      <section className="container mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-12">
          {/* Sticky TOC */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <Card className="shadow-sm">
              <CardContent className="flex flex-col gap-1 p-2">
                <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  On this page
                </p>
                <nav className="flex flex-col gap-0.5">
                  {SECTIONS.map((s, i) => {
                    const isActive = activeId === s.id
                    return (
                      <Link
                        key={s.id}
                        href={`#${s.id}` as Route}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                      >
                        <span className="w-4 text-[10px] tabular-nums text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="truncate">{s.title}</span>
                      </Link>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>

            <Card className="mt-4 shadow-sm">
              <CardContent className="flex flex-col gap-2 p-4">
                <p className="text-xs font-semibold">A quick word</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  We never sell your data. We collect only what we need to run
                  the shop and ship your order.
                </p>
              </CardContent>
            </Card>
          </aside>

          {/* Sections */}
          <article className="flex min-w-0 flex-col gap-10">
            {SECTIONS.map((s, i) => (
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
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2
                      id={`${s.id}-heading`}
                      className="text-xl font-semibold tracking-tight sm:text-2xl"
                    >
                      {s.title}
                    </h2>
                  </div>
                </div>
                <div className="flex flex-col gap-3 pl-12 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </div>
                {i < SECTIONS.length - 1 && <Separator className="mt-10" />}
              </section>
            ))}
          </article>
        </div>

        {/* Back-to-top */}
        <div className="mt-12 flex justify-center">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <a href="#top">
              <ArrowUp className="h-3.5 w-3.5" />
              Back to top
            </a>
          </Button>
        </div>
      </section>
      </main>
    </MarketingShell>
  )
}

/* -------------------------------------------------------------- */
/* Helpers                                                         */
/* -------------------------------------------------------------- */

function CookieType({
  tone,
  title,
  body,
}: {
  tone: "essential" | "analytics"
  title: string
  body: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border p-3.5",
        tone === "essential"
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-sky-500/20 bg-sky-500/5"
      )}
    >
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]",
          tone === "essential"
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : "bg-sky-500/15 text-sky-700 dark:text-sky-300"
        )}
      >
        <Cookie className="h-3 w-3" />
        {title}
      </span>
      <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}
