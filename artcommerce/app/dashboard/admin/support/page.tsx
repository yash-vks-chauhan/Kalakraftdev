'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  LifeBuoy,
  Mail,
  Search,
  Inbox,
  CircleDot,
  Clock,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'

import { useAuth } from '../../../contexts/AuthContext'
import { SegmentedControl, SegmentedControlItem } from '../../_components/SegmentedControl'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Ticket {
  id: string
  name: string
  email: string
  subject: string
  status: string
  createdAt: string
}

type TabKey = 'all' | 'open' | 'pending' | 'closed'

const tabs: {
  key: TabKey
  label: string
  icon: typeof Inbox
  status: string | null
}[] = [
  { key: 'all', label: 'All', icon: Inbox, status: null },
  { key: 'open', label: 'Open', icon: CircleDot, status: 'open' },
  { key: 'pending', label: 'Pending', icon: Clock, status: 'pending' },
  { key: 'closed', label: 'Closed', icon: CheckCircle2, status: 'closed' },
]

function initialsOf(name?: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatRelative(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const min = Math.round(diffMs / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day}d ago`
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminSupportPage() {
  const { token, user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadTickets(initial = false) {
    if (initial) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch('/api/admin/support/ticket', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load tickets')
      const data: Ticket[] = await res.json()
      setTickets(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load tickets')
    } finally {
      if (initial) setLoading(false)
      else setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user?.role !== 'admin') return
    loadTickets(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user])

  const counts = useMemo(() => {
    const open = tickets.filter((t) => t.status.toLowerCase() === 'open').length
    const pending = tickets.filter((t) => t.status.toLowerCase() === 'pending').length
    const closed = tickets.filter((t) => t.status.toLowerCase() === 'closed').length
    return { total: tickets.length, open, pending, closed }
  }, [tickets])

  const displayTickets = useMemo(() => {
    let list = tickets
    if (activeTab !== 'all') {
      list = list.filter((t) => t.status.toLowerCase() === activeTab)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q)
      )
    }
    return list
  }, [tickets, activeTab, query])

  if (user?.role !== 'admin') {
    return (
      <main>
        <p className="text-sm text-muted-foreground">Unauthorized</p>
      </main>
    )
  }

  return (
    <main className="flex flex-col gap-6">
      {/* Page header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Support tickets</h1>
          <p className="text-sm text-muted-foreground">
            Triage customer messages, track open conversations, and close out resolved ones.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadTickets()}
          disabled={refreshing}
          className="gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw
            className={cn('h-4 w-4', refreshing && 'animate-spin')}
          />
          Refresh
        </Button>
      </header>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={LifeBuoy}
          label="Total"
          value={counts.total}
          tone="default"
        />
        <StatCard
          icon={CircleDot}
          label="Open"
          value={counts.open}
          tone="destructive"
          hint="Needs attention"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={counts.pending}
          tone="warning"
          hint="Awaiting reply"
        />
        <StatCard
          icon={CheckCircle2}
          label="Closed"
          value={counts.closed}
          tone="muted"
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="gap-4 p-4 sm:p-6">
          <div className="flex flex-col gap-1">
            <CardTitle>Tickets</CardTitle>
            <CardDescription>
              {displayTickets.length}{' '}
              {displayTickets.length === 1 ? 'ticket' : 'tickets'} shown.
            </CardDescription>
          </div>

          {/* Top tabs + search */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SegmentedControl<TabKey>
              ariaLabel="Filter tickets by status"
              value={activeTab}
              onChange={setActiveTab}
              items={tabs.map<SegmentedControlItem<TabKey>>((t) => ({
                key: t.key,
                label: t.label,
                icon: t.icon,
                count:
                  t.key === 'all'
                    ? counts.total
                    : t.key === 'open'
                    ? counts.open
                    : t.key === 'pending'
                    ? counts.pending
                    : counts.closed,
              }))}
            />

            <div className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subject, name or email"
                className="pl-9"
                aria-label="Search tickets"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="px-4">Customer</TableHead>
                  <TableHead className="px-4">Subject</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                  <TableHead className="px-4">Created</TableHead>
                  <TableHead className="px-4 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      Loading tickets…
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-destructive"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : displayTickets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-4 py-12 text-center"
                    >
                      <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-muted-foreground">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Mail className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          No tickets here
                        </p>
                        <p className="text-xs">
                          {activeTab === 'all'
                            ? 'Everything is caught up.'
                            : `No ${activeTab} tickets right now.`}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayTickets.map((t) => (
                    <TableRow key={t.id} className="align-middle">
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border">
                            <AvatarFallback className="bg-secondary text-xs font-medium text-foreground">
                              {initialsOf(t.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium text-foreground">
                              {t.name}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {t.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <Link
                          href={`/dashboard/admin/support/${t.id}`}
                          className="block max-w-xl truncate text-sm font-medium text-foreground hover:underline"
                        >
                          {t.subject}
                        </Link>
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <StatusBadge status={t.status} />
                      </TableCell>

                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {formatRelative(t.createdAt)}
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                          >
                            <Link
                              href={`/dashboard/admin/support/${t.id}`}
                              aria-label={`Open ticket ${t.subject}`}
                            >
                              View
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  if (normalized === 'open') {
    return (
      <Badge className="gap-1 bg-destructive/10 text-destructive hover:bg-destructive/15 dark:bg-destructive/20">
        <CircleDot className="h-3 w-3" />
        Open
      </Badge>
    )
  }
  if (normalized === 'pending') {
    return (
      <Badge className="gap-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/15 dark:text-amber-500">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    )
  }
  if (normalized === 'closed') {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Closed
      </Badge>
    )
  }
  return <Badge variant="outline">{status}</Badge>
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: typeof Inbox
  label: string
  value: number
  tone: 'default' | 'warning' | 'destructive' | 'muted'
  hint?: string
}) {
  const toneStyles =
    tone === 'destructive'
      ? 'bg-destructive/10 text-destructive'
      : tone === 'warning'
      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500'
      : tone === 'muted'
      ? 'bg-muted text-muted-foreground'
      : 'bg-muted/50 text-foreground border'

  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-md',
            toneStyles
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-semibold tracking-tight text-foreground">
              {value.toLocaleString()}
            </span>
            {hint && (
              <span className="text-[11px] text-muted-foreground">{hint}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
