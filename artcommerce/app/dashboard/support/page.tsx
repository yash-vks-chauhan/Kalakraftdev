// app/dashboard/support/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  LifeBuoy,
  Plus,
  Inbox,
  CircleDot,
  Clock,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from "lucide-react"

import { useAuth } from "../../contexts/AuthContext"
import { SegmentedControl, SegmentedControlItem } from "../_components/SegmentedControl"
import {
  SupportStatusBadge,
} from "../../components/support/SupportStatusBadge"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface Ticket {
  id: string
  subject: string
  status: "open" | "pending" | "closed" | string
  createdAt: string
}

type TabKey = "all" | "open" | "pending" | "closed"

const tabs: { key: TabKey; label: string; icon: typeof Inbox }[] = [
  { key: "all", label: "All", icon: Inbox },
  { key: "open", label: "Open", icon: CircleDot },
  { key: "pending", label: "Pending", icon: Clock },
  { key: "closed", label: "Closed", icon: CheckCircle2 },
]

function formatRelative(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const min = Math.round(diffMs / 60000)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day}d ago`
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function MySupportTickets() {
  const { token, user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [activeTab, setActiveTab] = useState<TabKey>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!user || !token) {
      setLoading(false)
      setError("Please sign in to view your support tickets.")
      return
    }
    try {
      setError(null)
      setLoading(true)
      const res = await fetch("/api/support/my-tickets", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load")
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token])

  const counts = useMemo(() => {
    const open = tickets.filter((t) => t.status === "open").length
    const pending = tickets.filter((t) => t.status === "pending").length
    const closed = tickets.filter((t) => t.status === "closed").length
    return { total: tickets.length, open, pending, closed }
  }, [tickets])

  const displayTickets = useMemo(() => {
    let list = tickets
    if (activeTab !== "all") {
      list = list.filter((t) => t.status === activeTab)
    }
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [tickets, activeTab])

  return (
    <main className="flex flex-col gap-6">
      {/* Page header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
          <p className="text-sm text-muted-foreground">
            Questions about an order, a delivery, or a product? Start a conversation
            and our team will get back to you.
          </p>
        </div>
        <Button asChild className="gap-1.5 self-start sm:self-auto">
          <Link href="/support">
            <Plus className="h-4 w-4" />
            New ticket
          </Link>
        </Button>
      </header>

      {/* Friendly assurance banner */}
      <Card className="border-dashed bg-muted/30 shadow-none">
        <CardContent className="flex items-start gap-3 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background text-foreground shadow-sm">
            <LifeBuoy className="h-4 w-4" />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-foreground">
              We usually reply within a few hours
            </p>
            <p className="text-sm text-muted-foreground">
              Real people, real answers — Monday to Saturday, 9am–7pm IST. Every reply
              lands right here in your ticket.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="gap-4 p-4 sm:p-6">
          <div className="flex flex-col gap-1">
            <CardTitle>Your conversations</CardTitle>
            <CardDescription>
              {loading
                ? "Loading your tickets…"
                : counts.total === 0
                ? "You haven't opened any tickets yet."
                : `${counts.total} ${counts.total === 1 ? "ticket" : "tickets"} total · ${counts.open + counts.pending} active`}
            </CardDescription>
          </div>

          <SegmentedControl<TabKey>
            ariaLabel="Filter tickets by status"
            value={activeTab}
            onChange={setActiveTab}
            items={tabs.map<SegmentedControlItem<TabKey>>((t) => ({
              key: t.key,
              label: t.label,
              icon: t.icon,
              count:
                t.key === "all"
                  ? counts.total
                  : t.key === "open"
                  ? counts.open
                  : t.key === "pending"
                  ? counts.pending
                  : counts.closed,
            }))}
          />
        </CardHeader>

        <CardContent className="p-0">
          <div className="border-t">
            {loading ? (
              <div className="divide-y">
                {Array.from({ length: 4 }).map((_, i) => (
                  <TicketRowSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                </span>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try again
                </Button>
              </div>
            ) : displayTickets.length === 0 ? (
              <EmptyState activeTab={activeTab} />
            ) : (
              <ul className="divide-y">
                {displayTickets.map((ticket) => (
                  <li key={ticket.id}>
                    <Link
                      href={`/dashboard/support/ticket/${ticket.id}`}
                      className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:px-6"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-medium text-foreground">
                          {ticket.subject}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Opened {formatRelative(ticket.createdAt)}
                        </span>
                      </div>
                      <SupportStatusBadge status={ticket.status} className="hidden sm:inline-flex" />
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

function EmptyState({ activeTab }: { activeTab: TabKey }) {
  const copy =
    activeTab === "all"
      ? {
          title: "No tickets yet",
          body: "When you reach out to us, your conversation will show up here so you can follow along.",
        }
      : activeTab === "closed"
      ? {
          title: "Nothing closed yet",
          body: "Resolved conversations will be tucked away here for your records.",
        }
      : {
          title: `No ${activeTab} tickets`,
          body: "You're all caught up — there's nothing waiting on this side.",
        }

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="h-5 w-5" />
      </span>
      <div className="flex max-w-xs flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{copy.title}</p>
        <p className="text-xs text-muted-foreground">{copy.body}</p>
      </div>
      {activeTab === "all" && (
        <Button asChild size="sm" className="mt-1 gap-1.5">
          <Link href="/support">
            <Plus className="h-4 w-4" />
            Start a conversation
          </Link>
        </Button>
      )}
    </div>
  )
}

function TicketRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-48 max-w-full" />
        <Skeleton className="h-2.5 w-24" />
      </div>
      <Skeleton className="hidden h-5 w-16 rounded-full sm:block" />
      <Skeleton className="h-4 w-4 rounded" />
    </div>
  )
}
