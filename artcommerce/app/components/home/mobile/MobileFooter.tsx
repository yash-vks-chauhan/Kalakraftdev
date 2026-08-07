"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Instagram, Loader2, MessageCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pour, grain } from "./Pour"

const GROUPS = [
  {
    id: "shop",
    label: "Shop",
    links: [
      { href: "/products", label: "All pieces" },
      { href: "/products?sort=newest", label: "New arrivals" },
      { href: "/products?sort=best_sellers", label: "Best sellers" },
      { href: "/products?inStock=true", label: "Ready to ship" },
    ],
  },
  {
    id: "help",
    label: "Help",
    links: [
      { href: "/faq", label: "Shipping & delivery" },
      { href: "/faq", label: "Returns" },
      { href: "/support", label: "Support" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    id: "about",
    label: "About",
    links: [
      { href: "/about", label: "Our makers" },
      { href: "/about", label: "The craft" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
]

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * The second and last place the pour appears, so the page is bookended by it.
 * Link groups collapse into an accordion because a flat list of twelve runs
 * well past the fold on a phone, and the wordmark closes the page as a
 * graphic rather than another link.
 */
export function MobileFooter() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "done">("idle")
  const [error, setError] = useState("")

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!EMAIL.test(email.trim())) {
      setError("Enter an email address we can reach you at.")
      return
    }
    setError("")
    setState("sending")
    // No newsletter endpoint exists yet — this is the shape it will take.
    window.setTimeout(() => setState("done"), 700)
  }

  return (
    <footer className={cn("relative mt-7 overflow-hidden bg-[#0d0b0a] text-stone-100", grain)}>
      <Pour className="!inset-[-40%_-20%_40%_-20%]" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_bottom,hsl(var(--background))_0%,rgba(13,11,10,0.86)_16%,rgba(13,11,10,0.97)_46%)]"
      />

      <div className="relative flex flex-col gap-6 px-4 pt-9">
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[21px] font-light leading-tight">
            First look at every <span className="font-serif italic">pour.</span>
          </h2>
          <p className="text-[12.5px] leading-relaxed text-stone-100/60">
            One letter a month — new drops, the makers behind them, nothing else.
          </p>

          {state === "done" ? (
            <p className="inline-flex items-center gap-2 text-xs text-emerald-300">
              <Check className="h-3.5 w-3.5" />
              You&apos;re on the list — the first letter lands next month.
            </p>
          ) : (
            <form onSubmit={handleJoin} className="flex flex-col gap-1.5" noValidate>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError("")
                  }}
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-label="Email address"
                  aria-invalid={Boolean(error)}
                  className="h-11 border-stone-100/20 bg-stone-100/[0.07] text-base text-white placeholder:text-stone-100/40"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={state === "sending"}
                  className="h-11 shrink-0 bg-white text-stone-900 hover:bg-white/90"
                >
                  {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
                </Button>
              </div>
              {error && <span className="text-[11px] text-red-300">{error}</span>}
            </form>
          )}
        </div>

        <Accordion type="single" collapsible defaultValue="shop" className="border-t border-stone-100/15">
          {GROUPS.map((group) => (
            <AccordionItem
              key={group.id}
              value={group.id}
              className="border-stone-100/15"
            >
              <AccordionTrigger className="py-4 text-[13.5px] text-stone-100 hover:no-underline">
                {group.label}
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="flex flex-col">
                  {group.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="py-2 text-[13px] text-stone-100/60"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="flex gap-2">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Instagram"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-100/20 text-stone-100/80"
          >
            <Instagram className="h-[17px] w-[17px]" />
          </a>
          <a
            href="https://wa.me/"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="WhatsApp"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-100/20 text-stone-100/80"
          >
            <MessageCircle className="h-[17px] w-[17px]" />
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.1em] text-stone-100/40">
            Secure checkout
          </span>
          {["UPI", "Visa", "Mastercard", "Razorpay"].map((label) => (
            <span
              key={label}
              className="inline-flex h-[22px] items-center rounded border border-stone-100/20 px-2 text-[9.5px] tracking-wide text-stone-100/65"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* The wordmark as a graphic, clipped by the edge — the page's signature. */}
      <div className="relative mt-3 h-[104px] overflow-hidden border-t border-stone-100/15">
        <span
          aria-hidden
          className="absolute -left-1 top-1 whitespace-nowrap font-serif text-[88px] font-normal italic leading-none tracking-[-0.04em] text-transparent [-webkit-text-stroke:1px_rgba(245,241,236,0.26)]"
        >
          kalakraft
        </span>
      </div>

      <div className="relative flex justify-between gap-3 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+84px)] text-[10.5px] text-stone-100/40">
        <span>© {new Date().getFullYear()} Kalakraft</span>
        <span>Handcrafted in India</span>
      </div>
    </footer>
  )
}
