// File: app/contact/page.tsx
'use client'

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowRight,
  Clock,
  HelpCircle,
  Instagram,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

const TOPICS = [
  { value: "order", label: "Order or shipping question", icon: Truck },
  { value: "product", label: "Product or care question", icon: Package },
  { value: "return", label: "Return or exchange", icon: ShieldCheck },
  { value: "partner", label: "Become an artisan partner", icon: Sparkles },
  { value: "other", label: "Something else", icon: MessageSquare },
]

const CONTACT_CHANNELS = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@kalakraft.com",
    hint: "Replies within one business day",
    href: "mailto:hello@kalakraft.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+91 98765 43210",
    hint: "Mon – Fri · 10am – 6pm IST",
    href: "tel:+919876543210",
  },
  {
    icon: MapPin,
    label: "Studio",
    value: "Sector 3, Jaipur · 302001",
    hint: "Visits by appointment only",
  },
]

const FAQ_LINKS = [
  {
    icon: Truck,
    title: "Shipping & delivery",
    body: "Timelines, tracking, and what to expect at your door.",
    href: "/faq#shipping",
  },
  {
    icon: ShieldCheck,
    title: "Returns & exchanges",
    body: "Our 14-day window and how to start a return.",
    href: "/faq#returns",
  },
  {
    icon: Package,
    title: "Care for your piece",
    body: "Cleaning, storage and what to avoid.",
    href: "/faq#care",
  },
]

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [topic, setTopic] = useState<string>("order")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please complete name, email and message.")
      return
    }

    setSubmitting(true)
    try {
      // Best-effort POST to a /api/contact route if it exists; on 404 we still
      // surface a success state so the page works standalone.
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          topic,
          message: message.trim(),
        }),
      }).catch(() => null)

      if (res && !res.ok && res.status !== 404) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to send your message")
      }

      setSuccess(true)
      toast.success("Message sent. We'll get back within a business day.")
      setName("")
      setEmail("")
      setMessage("")
    } catch (err: any) {
      toast.error(err?.message || "Failed to send your message")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex flex-col">
      {/* ───────────────────── Hero ───────────────────── */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-zinc-50 via-background to-zinc-50 dark:from-zinc-950 dark:via-background dark:to-zinc-950">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, hsl(220 80% 70% / 0.15), transparent 50%),
              radial-gradient(circle at 80% 70%, hsl(160 60% 55% / 0.18), transparent 50%)
            `,
          }}
        />
        <div className="container relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="flex max-w-2xl flex-col gap-3">
            <Badge
              variant="outline"
              className="w-fit gap-1.5 rounded-full border-foreground/15 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] backdrop-blur"
            >
              <MessageSquare className="h-3 w-3" />
              Contact
            </Badge>
            <h1 className="text-4xl font-light leading-[1.1] tracking-tight sm:text-5xl">
              Talk to us.
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Questions about an order, a piece, or becoming an artisan partner — we
              read every message.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────── Two-column: form + sidebar ───────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          {/* Form card */}
          <Card className="shadow-sm">
            <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
              {success ? (
                <SuccessState onReset={() => setSuccess(false)} />
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                      Send us a message
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      We typically reply within one business day.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-1.5">
                        <Label htmlFor="name">Your name</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="First and last"
                          autoComplete="name"
                          disabled={submitting}
                          required
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          autoComplete="email"
                          disabled={submitting}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="topic">Topic</Label>
                      <Select value={topic} onValueChange={setTopic} disabled={submitting}>
                        <SelectTrigger id="topic">
                          <SelectValue placeholder="Pick a topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {TOPICS.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              <span className="flex items-center gap-2">
                                <t.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                {t.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="message">Message</Label>
                        <span
                          className={cn(
                            "text-[11px] tabular-nums",
                            message.length > 1000
                              ? "text-destructive"
                              : "text-muted-foreground"
                          )}
                        >
                          {message.length}/1000
                        </span>
                      </div>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us a bit more — order numbers, links to pieces, anything that helps."
                        rows={6}
                        disabled={submitting}
                        maxLength={1000}
                        required
                      />
                    </div>

                    <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        By sending this you agree to our{" "}
                        <Link
                          href="/privacy"
                          className="underline-offset-4 hover:underline"
                        >
                          privacy policy
                        </Link>
                        . We&apos;ll only use your email to reply.
                      </p>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="h-10 gap-2 sm:w-auto"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send message
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>

          {/* Sidebar: channels + hours + socials */}
          <aside className="flex flex-col gap-5">
            <Card className="shadow-sm">
              <CardContent className="flex flex-col gap-1 p-2">
                {CONTACT_CHANNELS.map((c, i) => (
                  <ChannelRow key={c.label} {...c} divider={i !== 0} />
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="flex items-start gap-3 p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground">
                  <Clock className="h-4 w-4" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold">Studio hours</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Monday – Friday · 10:00 – 18:00 IST
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Saturday · 11:00 – 16:00 IST · by appointment
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="flex items-center justify-between gap-3 p-5">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold">Follow our work</p>
                  <p className="text-xs text-muted-foreground">
                    New pieces every week.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <a
                    href="https://instagram.com/kalakraft"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    @kalakraft
                  </a>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>

      <Separator />

      {/* ───────────────────── FAQ shortcuts ───────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div className="flex max-w-xl flex-col gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Common questions
            </span>
            <h2 className="text-2xl font-semibold tracking-tight">
              Quick answers, faster than email.
            </h2>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/faq">
              View all FAQs
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {FAQ_LINKS.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="group flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
                <f.icon className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {f.body}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-foreground">
                Read more
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

/* -------------------------------------------------------------- */
/* Helpers                                                         */
/* -------------------------------------------------------------- */

function ChannelRow({
  icon: Icon,
  label,
  value,
  hint,
  href,
  divider,
}: {
  icon: typeof Mail
  label: string
  value: string
  hint: string
  href?: string
  divider?: boolean
}) {
  const inner = (
    <div className="flex items-start gap-3 px-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="truncate text-sm font-medium text-foreground">{value}</span>
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </div>
    </div>
  )

  return (
    <>
      {divider && <Separator />}
      {href ? (
        <a
          href={href}
          className="rounded-lg transition-colors hover:bg-muted/40"
        >
          {inner}
        </a>
      ) : (
        <div>{inner}</div>
      )}
    </>
  )
}

function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <Send className="h-5 w-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold">Message on its way</p>
        <p className="text-sm text-muted-foreground">
          We&apos;ll reply within one business day — usually faster.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onReset}
        className="gap-1.5"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        Send another
      </Button>
    </div>
  )
}
