// File: app/dashboard/account/tickets/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Plus,
  Inbox,
  ChevronRight,
  MessageSquare,
  AlertCircle,
} from "lucide-react"

import { useAuth } from "../../../contexts/AuthContext"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type Ticket = {
  id: string
  subject: string
  createdAt: string
}

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

export default function MyTicketsPage() {
  const { user, loading: authLoading } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const res = await fetch("/api/support/my-tickets", {
          credentials: "include",
        })
        if (!res.ok) throw new Error("Failed to fetch tickets")
        const data = await res.json()
        setTickets(data.tickets || [])
      } catch (err: any) {
        console.error(err)
        setError(err.message || "Error loading tickets")
      } finally {
        setLoading(false)
      }
    })()
  }, [authLoading, user])

  const sorted = [...tickets].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Support tickets</h1>
          <p className="text-sm text-muted-foreground">
            Every conversation you&apos;ve had with our team, in one place.
          </p>
        </div>
        <Button asChild className="gap-1.5 self-start sm:self-auto">
          <Link href="/dashboard/support/new">
            <Plus className="h-4 w-4" />
            New ticket
          </Link>
        </Button>
      </header>

      <Card className="shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>Your tickets</CardTitle>
          <CardDescription>
            {loading
              ? "Loading…"
              : `${tickets.length} ${tickets.length === 1 ? "ticket" : "tickets"}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            {loading ? (
              <div className="divide-y">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton className="h-3.5 w-48 max-w-full" />
                      <Skeleton className="h-2.5 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                </span>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Inbox className="h-5 w-5" />
                </span>
                <div className="flex max-w-xs flex-col gap-1">
                  <p className="text-sm font-medium text-foreground">No tickets yet</p>
                  <p className="text-xs text-muted-foreground">
                    Have a question? Reach out and we&apos;ll help you sort it.
                  </p>
                </div>
                <Button asChild size="sm" className="mt-1 gap-1.5">
                  <Link href="/dashboard/support/new">
                    <Plus className="h-4 w-4" />
                    Start a conversation
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y">
                {sorted.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/dashboard/support/ticket/${t.id}`}
                      className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:px-6"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-medium text-foreground">
                          {t.subject}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Opened {formatRelative(t.createdAt)}
                        </span>
                      </div>
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
