"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Check,
  Loader2,
  Mail,
  Package,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react"

import { useAuth } from "../../contexts/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/auth/login")
      return
    }
    const last = typeof window !== "undefined" ? localStorage.getItem("lastOrderNumber") : null
    setOrderNumber(last)
  }, [user, authLoading, router])

  async function handleCopyOrder() {
    if (!orderNumber) return
    try {
      await navigator.clipboard.writeText(orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // noop
    }
  }

  if (!user || !orderNumber) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Preparing your confirmation…
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {/* Hero card */}
      <Card className="overflow-hidden shadow-sm">
        <div className="relative flex flex-col items-center gap-5 px-6 pb-8 pt-12 text-center sm:px-10 sm:pt-14">
          {/* Decorative concentric rings */}
          <div className="relative flex h-20 w-20 items-center justify-center">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-emerald-500/10"
            />
            <span
              aria-hidden
              className="absolute -inset-3 rounded-full bg-emerald-500/5"
            />
            <span
              aria-hidden
              className="absolute -inset-6 rounded-full ring-1 ring-emerald-500/10"
            />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              <Check className="h-7 w-7" strokeWidth={3} />
            </span>
            <Sparkles
              aria-hidden
              className="absolute -right-2 -top-1 h-4 w-4 text-amber-500"
            />
          </div>

          <div className="flex max-w-md flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Thank you, {user.fullName?.split(" ")[0] || "friend"}!
            </h1>
            <p className="text-sm text-muted-foreground">
              Your order has been placed successfully. A confirmation email is on its way to your inbox.
            </p>
          </div>

          {/* Order number chip */}
          <button
            type="button"
            onClick={handleCopyOrder}
            className="group inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm shadow-sm transition-all hover:border-foreground/30 hover:shadow-md"
            aria-label={copied ? "Order number copied" : "Copy order number"}
          >
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Order
            </span>
            <span className="font-mono text-sm font-semibold text-foreground">
              #{orderNumber}
            </span>
            <span
              className={
                copied
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground transition-colors group-hover:text-foreground"
              }
              aria-hidden
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <CopyIcon className="h-3.5 w-3.5" />
              )}
            </span>
          </button>
        </div>

        <Separator />

        {/* Status timeline */}
        <CardContent className="flex flex-col gap-4 p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            What happens next
          </p>
          <ol className="grid gap-4 sm:grid-cols-3">
            <TimelineStep
              icon={Check}
              title="Order received"
              description="We’ve confirmed your order and saved your details."
              status="done"
            />
            <TimelineStep
              icon={Package}
              title="Preparing"
              description="Our team is carefully packing your pieces."
              status="active"
            />
            <TimelineStep
              icon={Truck}
              title="On the way"
              description="You’ll get a tracking link once it ships."
              status="upcoming"
            />
          </ol>
        </CardContent>
      </Card>

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="gap-1 p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted/50 text-foreground">
              <Package className="h-4 w-4" />
            </span>
            <CardTitle className="mt-2 text-base">Track your order</CardTitle>
            <CardDescription>
              Follow real-time updates on packing and delivery from your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <Button asChild size="sm" className="w-full gap-1.5 group/cta">
              <Link href="/dashboard/orders">
                View orders
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="gap-1 p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted/50 text-foreground">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <CardTitle className="mt-2 text-base">Keep exploring</CardTitle>
            <CardDescription>
              Discover more handcrafted pieces and add them to your wishlist.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <Button asChild variant="outline" size="sm" className="w-full gap-1.5 group/cta">
              <Link href="/products">
                Continue shopping
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Inbox reminder */}
      <Card className="border-dashed bg-muted/30 shadow-none">
        <CardContent className="flex items-start gap-3 p-4 sm:p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
            <Mail className="h-4 w-4" />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-foreground">Check your inbox</p>
            <p className="text-sm text-muted-foreground">
              We sent the receipt to{" "}
              <span className="font-medium text-foreground">{user.email}</span>. If you don’t see
              it within a few minutes, peek in your spam folder.
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Need help with this order?{" "}
        <Link href="/dashboard/support" className="font-medium text-foreground underline-offset-4 hover:underline">
          Contact support
        </Link>
      </p>
    </main>
  )
}

function TimelineStep({
  icon: Icon,
  title,
  description,
  status,
}: {
  icon: typeof Check
  title: string
  description: string
  status: "done" | "active" | "upcoming"
}) {
  const dot =
    status === "done"
      ? "bg-emerald-500 text-white border-transparent"
      : status === "active"
      ? "bg-foreground text-background border-transparent"
      : "bg-background text-muted-foreground"

  const badge =
    status === "done" ? (
      <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
        Done
      </Badge>
    ) : status === "active" ? (
      <Badge variant="secondary">In progress</Badge>
    ) : (
      <Badge variant="outline" className="text-muted-foreground">
        Up next
      </Badge>
    )

  return (
    <li className="flex flex-col gap-2 rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full border ${dot}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        {badge}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs leading-snug text-muted-foreground">{description}</p>
      </div>
    </li>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}
