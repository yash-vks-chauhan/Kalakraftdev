// File: app/terms/page.tsx
'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Route } from "next"
import {
  ArrowUp,
  Ban,
  Copyright,
  CreditCard,
  FileCheck,
  FileText,
  Gavel,
  Palette,
  RefreshCw,
  Scale,
  ScrollText,
  ShieldAlert,
  ShoppingBag,
  Truck,
  UserCheck,
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
  icon: typeof ScrollText
  body: React.ReactNode
}

const SECTIONS: Section[] = [
  {
    id: "agreement",
    title: "Agreement to terms",
    icon: FileCheck,
    body: (
      <>
        <p>
          These terms are an agreement between you and Kalakraft. By browsing
          our site, creating an account, or placing an order, you agree to
          everything below. If you don&apos;t agree, please don&apos;t use the
          shop.
        </p>
        <p>
          We&apos;ve kept the language plain on purpose — you shouldn&apos;t
          need a lawyer to understand who&apos;s responsible for what.
        </p>
      </>
    ),
  },
  {
    id: "account",
    title: "Your account",
    icon: UserCheck,
    body: (
      <>
        <p>
          You can browse without an account, but checkout and order history need
          one. When you create an account you agree to:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
          <li>Give accurate contact and shipping details.</li>
          <li>Keep your password private — you&apos;re responsible for activity on your account.</li>
          <li>Be at least 18, or have a guardian&apos;s consent to buy.</li>
          <li>
            Tell us promptly at{" "}
            <a
              href="mailto:security@kalakraft.com"
              className="font-medium underline-offset-4 hover:underline"
            >
              security@kalakraft.com
            </a>{" "}
            if you suspect unauthorized use.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "orders",
    title: "Orders & pricing",
    icon: ShoppingBag,
    body: (
      <>
        <p>
          An order is an offer to buy. We confirm it by email once the studio
          accepts it — that&apos;s when the contract is formed. Until then we
          may decline or cancel an order, for example if:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
          <li>A piece sells out or is damaged before dispatch.</li>
          <li>A price or description was listed in clear error.</li>
          <li>We can&apos;t verify payment or the shipping address.</li>
        </ul>
        <p>
          Because every piece is handmade, slight variation in color, grain and
          finish is expected and is not a defect. Prices are shown in your
          local currency where available and include applicable taxes at
          checkout.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    title: "Payments",
    icon: CreditCard,
    body: (
      <>
        <p>
          Payments are handled by PCI-certified processors over encrypted
          connections. We never see or store full card numbers — only a
          confirmation ID. You confirm that the payment method you use is yours
          and authorized.
        </p>
        <p>
          If a charge fails or is reversed after dispatch, we may pause your
          account until the balance is settled.
        </p>
      </>
    ),
  },
  {
    id: "shipping-returns",
    title: "Shipping, returns & refunds",
    icon: Truck,
    body: (
      <>
        <p>
          Shipping timelines, the 14-day return window, and refund handling are
          covered in detail in our help pages. In short: most in-stock pieces
          ship within 2–4 business days, and unused items can be returned within
          14 days of delivery.
        </p>
        <p>
          For specifics on timelines, who pays return shipping, and made-to-order
          exceptions, see the{" "}
          <Link
            href="/faq#shipping"
            className="font-medium underline-offset-4 hover:underline"
          >
            Shipping
          </Link>{" "}
          and{" "}
          <Link
            href="/faq#returns"
            className="font-medium underline-offset-4 hover:underline"
          >
            Returns
          </Link>{" "}
          sections of our FAQ.
        </p>
      </>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    icon: Copyright,
    body: (
      <>
        <p>
          The Kalakraft name, logo, site design, and written content are owned
          by us or our artisans and protected by copyright and trademark law.
          Buying a piece transfers ownership of that physical object — not the
          rights to reproduce its design.
        </p>
        <p>
          You may not copy, scrape, or resell our content or imagery for
          commercial use without written permission.
        </p>
      </>
    ),
  },
  {
    id: "user-content",
    title: "Reviews & submissions",
    icon: Palette,
    body: (
      <>
        <p>
          When you post a review, photo, or message, you keep ownership of it
          but grant us a non-exclusive license to display it on the shop and in
          related marketing. You confirm the content is yours to share and
          isn&apos;t unlawful or misleading.
        </p>
        <p>
          We may remove content that violates these terms or that we judge to be
          spam, abusive, or off-topic.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    icon: Ban,
    body: (
      <>
        <p>To keep the shop safe and fair, you agree not to:</p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
          <li>Break the law, or use the shop to harm others.</li>
          <li>Place fraudulent orders or abuse promotions and coupons.</li>
          <li>Probe, scan, or stress-test our systems without consent.</li>
          <li>Scrape data or resell access to the platform.</li>
          <li>Impersonate Kalakraft, our staff, or our artisans.</li>
        </ul>
        <p>
          We may suspend or close accounts that break these rules.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    icon: ShieldAlert,
    body: (
      <>
        <p>
          We work hard to keep the shop accurate and available, but it&apos;s
          provided &ldquo;as is.&rdquo; We don&apos;t promise the site will be
          uninterrupted or error-free, and colors on screen can differ slightly
          from the real piece due to your display.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    icon: Scale,
    body: (
      <>
        <p>
          To the extent the law allows, Kalakraft isn&apos;t liable for indirect
          or consequential losses arising from your use of the shop. Where we
          are liable, our total responsibility for any order is limited to the
          amount you paid for that order.
        </p>
        <p>
          Nothing in these terms limits rights you have under mandatory consumer
          law in your country.
        </p>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law",
    icon: Gavel,
    body: (
      <>
        <p>
          These terms are governed by the laws of India. Disputes that
          can&apos;t be resolved by talking to us will be handled by the courts
          of Jaipur, Rajasthan — without affecting any consumer protections you
          have where you live.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    icon: RefreshCw,
    body: (
      <>
        <p>
          We may update these terms as the shop evolves. When changes are
          material, we&apos;ll post a notice on the site and update the date
          below at least 14 days before they take effect. Continuing to use the
          shop after that means you accept the new terms.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    icon: FileText,
    body: (
      <>
        <p>Questions about these terms? We&apos;re happy to explain anything:</p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
          <li>
            Email:{" "}
            <a
              href="mailto:hello@kalakraft.com"
              className="font-medium underline-offset-4 hover:underline"
            >
              hello@kalakraft.com
            </a>
          </li>
          <li>Post: Kalakraft Studio, Sector 3, Jaipur 302001, India</li>
        </ul>
      </>
    ),
  },
]

export default function TermsPage() {
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
                radial-gradient(circle at 20% 30%, hsl(28 90% 60% / 0.14), transparent 50%),
                radial-gradient(circle at 80% 70%, hsl(262 70% 60% / 0.16), transparent 50%)
              `,
            }}
          />
          <div className="container relative mx-auto max-w-5xl px-4 py-14 sm:py-20">
            <div className="flex max-w-3xl flex-col gap-3">
              <Badge
                variant="outline"
                className="w-fit gap-1.5 rounded-full border-foreground/15 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] backdrop-blur"
              >
                <ScrollText className="h-3 w-3" />
                Terms
              </Badge>
              <h1 className="text-4xl font-light leading-[1.1] tracking-tight sm:text-5xl">
                Terms of service.
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                The plain-language agreement that covers shopping with us — what
                you can expect, and what we ask in return.
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Last updated{" "}
                  <strong className="font-medium text-foreground">
                    {LAST_UPDATED}
                  </strong>
                </span>
                <span className="text-border">·</span>
                <span>
                  Effective{" "}
                  <strong className="font-medium text-foreground">
                    {EFFECTIVE_DATE}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────── Body: TOC + sections ───────────────────── */}
        <section className="container mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-12">
            {/* Sticky TOC */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
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
                              ? "bg-accent font-medium text-accent-foreground"
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
                  <p className="text-xs font-semibold">The short version</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Shop fairly, pieces are handmade so expect slight variation,
                    and we&apos;ll always treat you the way we&apos;d want to be
                    treated.
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
