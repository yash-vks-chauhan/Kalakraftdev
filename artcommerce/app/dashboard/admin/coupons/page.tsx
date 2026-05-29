'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Percent,
  Pencil,
  Plus,
  Search,
  Tag,
  Ticket,
  TicketX,
  Trash2,
  Wallet,
} from 'lucide-react'

import { useAuth } from '../../../contexts/AuthContext'
import ConfirmDialog from '../../../components/ConfirmDialog'
import { cn } from '@/lib/utils'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Coupon {
  id: number
  code: string
  type: 'percentage' | 'flat'
  amount: number
  expiresAt: string
  usedCount: number
  usageLimit: number | null
  createdAt?: string
}

type StatusFilter = 'all' | 'active' | 'expired' | 'used-up'
type CouponStatus = 'active' | 'expired' | 'used-up'

interface FormState {
  code: string
  type: 'percentage' | 'flat'
  amount: string
  expiresAt: string
  usageLimit: string
}

const EMPTY_FORM: FormState = {
  code: '',
  type: 'percentage',
  amount: '',
  expiresAt: '',
  usageLimit: '',
}

function getStatus(c: Coupon): CouponStatus {
  if (new Date(c.expiresAt).getTime() < Date.now()) return 'expired'
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return 'used-up'
  return 'active'
}

function formatAmount(c: Coupon) {
  if (c.type === 'percentage') return `${c.amount}% off`
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(c.amount)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function daysFromNow(value: string) {
  const ms = new Date(value).getTime() - Date.now()
  const days = Math.round(ms / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days > 0) return `in ${days} day${days === 1 ? '' : 's'}`
  return `${Math.abs(days)} day${days === -1 ? '' : 's'} ago`
}

function toDateInputValue(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export default function CouponManager() {
  const { token, user, loading: authLoading } = useAuth()

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    if (user.role !== 'admin') {
      setError('You are not authorized to view this page.')
      setLoading(false)
      return
    }
    fetch('/api/admin/coupons', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((j) => setCoupons(j.coupons ?? []))
      .catch(() => setError('Failed to load coupons.'))
      .finally(() => setLoading(false))
  }, [authLoading, user, token])

  useEffect(() => {
    if (!notice) return
    const t = window.setTimeout(() => setNotice(null), 3500)
    return () => window.clearTimeout(t)
  }, [notice])

  const stats = useMemo(() => {
    let active = 0
    let expired = 0
    let redemptions = 0
    for (const c of coupons) {
      redemptions += c.usedCount
      const s = getStatus(c)
      if (s === 'active') active++
      else if (s === 'expired') expired++
    }
    return { total: coupons.length, active, expired, redemptions }
  }, [coupons])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return coupons.filter((c) => {
      if (statusFilter !== 'all' && getStatus(c) !== statusFilter) return false
      if (q && !c.code.toLowerCase().includes(q)) return false
      return true
    })
  }, [coupons, query, statusFilter])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setSheetOpen(true)
  }

  function openEdit(c: Coupon) {
    setEditing(c)
    setForm({
      code: c.code,
      type: c.type,
      amount: String(c.amount),
      expiresAt: toDateInputValue(c.expiresAt),
      usageLimit: c.usageLimit == null ? '' : String(c.usageLimit),
    })
    setFormError(null)
    setSheetOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const amountNum = Number(form.amount)
    if (!form.code.trim()) return setFormError('Code is required.')
    if (!Number.isFinite(amountNum) || amountNum <= 0)
      return setFormError('Amount must be greater than zero.')
    if (form.type === 'percentage' && amountNum > 100)
      return setFormError('Percentage cannot exceed 100.')
    if (!form.expiresAt) return setFormError('Expiry date is required.')

    setSubmitting(true)
    try {
      const usageLimitVal = form.usageLimit.trim() === '' ? null : Number(form.usageLimit)
      if (usageLimitVal != null && (!Number.isInteger(usageLimitVal) || usageLimitVal < 1)) {
        throw new Error('Usage limit must be a positive integer.')
      }

      if (editing) {
        const res = await fetch('/api/admin/coupons', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            id: editing.id,
            code: form.code.trim().toUpperCase(),
            type: form.type,
            amount: amountNum,
            expiresAt: form.expiresAt,
            usageLimit: usageLimitVal,
          }),
        })
        const j = await res.json()
        if (!res.ok) throw new Error(j.error || 'Failed to update coupon')
        setCoupons((prev) => prev.map((c) => (c.id === j.coupon.id ? j.coupon : c)))
        setNotice({ tone: 'success', text: `Updated ${j.coupon.code}.` })
      } else {
        const res = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            code: form.code.trim().toUpperCase(),
            type: form.type,
            amount: amountNum,
            expiresAt: form.expiresAt,
            usageLimit: usageLimitVal,
          }),
        })
        const j = await res.json()
        if (!res.ok) throw new Error(j.error || 'Failed to create coupon')
        setCoupons((prev) => [j.coupon, ...prev])
        setNotice({ tone: 'success', text: `Created ${j.coupon.code}.` })
      }
      setSheetOpen(false)
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      if (!res.ok) throw new Error('Failed to delete coupon')
      setCoupons((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setNotice({ tone: 'success', text: `Deleted ${deleteTarget.code}.` })
      setDeleteTarget(null)
    } catch (err: any) {
      setNotice({ tone: 'error', text: err.message || 'Failed to delete coupon' })
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return <CouponsSkeleton />
  }

  if (error) {
    return (
      <main className="flex flex-col gap-6">
        <PageHeader />
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-foreground">Unable to load coupons</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex flex-col gap-6 pb-10">
      {notice && (
        <div
          role="status"
          className={cn(
            'fixed right-4 top-4 z-50 flex items-center gap-2 rounded-md border px-3.5 py-2.5 text-sm shadow-md sm:right-6 sm:top-6',
            notice.tone === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-destructive/20 bg-destructive/10 text-destructive'
          )}
        >
          {notice.tone === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      <PageHeader>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New coupon
        </Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Ticket} label="Total" value={stats.total} />
        <StatTile
          icon={CheckCircle2}
          label="Active"
          value={stats.active}
          tone={stats.active > 0 ? 'emerald' : 'muted'}
        />
        <StatTile
          icon={TicketX}
          label="Expired"
          value={stats.expired}
          tone={stats.expired > 0 ? 'destructive' : 'muted'}
        />
        <StatTile icon={Wallet} label="Redemptions" value={stats.redemptions} />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="gap-4 p-4 sm:p-6">
          <div className="flex flex-col gap-1">
            <CardTitle>All coupons</CardTitle>
            <CardDescription>
              {filtered.length} of {coupons.length} {coupons.length === 1 ? 'coupon' : 'coupons'} shown.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by code"
                className="pl-9"
                aria-label="Search coupons"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-full sm:w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="used-up">Used up</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="px-4">Code</TableHead>
                  <TableHead className="px-4">Discount</TableHead>
                  <TableHead className="px-4">Usage</TableHead>
                  <TableHead className="px-4">Expires</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                  <TableHead className="px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      {coupons.length === 0
                        ? 'No coupons yet. Create your first one to get started.'
                        : 'No coupons match this view.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => {
                    const status = getStatus(c)
                    return (
                      <TableRow key={c.id} className="align-middle">
                        <TableCell className="px-4 py-3">
                          <span className="rounded-md border border-dashed border-border bg-muted/40 px-2 py-1 font-mono text-xs font-medium tracking-wide text-foreground">
                            {c.code}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm">
                            {c.type === 'percentage' ? (
                              <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className="font-medium tabular-nums text-foreground">
                              {formatAmount(c)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <UsageMeter
                            used={c.usedCount}
                            limit={c.usageLimit}
                          />
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm text-foreground">
                              {formatDate(c.expiresAt)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {daysFromNow(c.expiresAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <StatusBadge status={status} />
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(c)}
                              className="gap-1.5"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Separator orientation="vertical" className="mx-1 h-6" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeleteTarget(c)}
                              aria-label={`Delete ${c.code}`}
                              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit coupon' : 'New coupon'}</SheetTitle>
            <SheetDescription>
              {editing
                ? `Update the details for ${editing.code}.`
                : 'Set up a discount code shoppers can redeem at checkout.'}
            </SheetDescription>
          </SheetHeader>
          <form
            id="coupon-form"
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6"
          >
            <div className="grid gap-1.5">
              <Label htmlFor="cp-code">Code</Label>
              <Input
                id="cp-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="SUMMER25"
                autoComplete="off"
                required
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">Saved as uppercase.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="cp-type">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm({ ...form, type: v as 'percentage' | 'flat' })
                  }
                >
                  <SelectTrigger id="cp-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="flat">Flat amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 grid gap-1.5">
                <Label htmlFor="cp-amount">
                  {form.type === 'percentage' ? 'Percentage off' : 'Amount off'}
                </Label>
                <div className="relative">
                  <Input
                    id="cp-amount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step={form.type === 'percentage' ? '1' : '0.01'}
                    max={form.type === 'percentage' ? '100' : undefined}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder={form.type === 'percentage' ? '25' : '500'}
                    required
                    className={form.type === 'percentage' ? 'pr-8' : 'pl-8'}
                  />
                  <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none"
                    style={form.type === 'percentage' ? { right: '0.75rem' } : { left: '0.75rem' }}
                  >
                    {form.type === 'percentage' ? '%' : '₹'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="cp-expires">Expires on</Label>
              <Input
                id="cp-expires"
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="cp-limit">Usage limit</Label>
              <Input
                id="cp-limit"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                placeholder="Leave empty for unlimited"
              />
              <p className="text-xs text-muted-foreground">
                Maximum total redemptions across all customers.
              </p>
            </div>

            {editing && (
              <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                Redeemed{' '}
                <span className="font-medium text-foreground">{editing.usedCount}</span>{' '}
                time{editing.usedCount === 1 ? '' : 's'} so far.
              </div>
            )}

            {formError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="mt-auto flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gap-1.5">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? 'Save changes' : 'Create coupon'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete coupon"
        description={
          deleteTarget
            ? `Delete coupon "${deleteTarget.code}" permanently? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete coupon"
        isProcessing={isDeleting}
        onConfirm={handleDelete}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null)
        }}
      />
    </main>
  )
}

function PageHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Coupons</h1>
        <p className="text-sm text-muted-foreground">
          Create discount codes, control usage limits, and track redemptions.
        </p>
      </div>
      {children}
    </header>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  tone?: 'default' | 'emerald' | 'destructive' | 'muted'
}) {
  const toneClass = {
    default: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    destructive: 'bg-destructive/10 text-destructive',
    muted: 'bg-muted text-muted-foreground',
  }[tone]

  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
            toneClass
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className="text-xl font-semibold tabular-nums text-foreground">
            {value.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function UsageMeter({ used, limit }: { used: number; limit: number | null }) {
  if (limit == null) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm text-foreground tabular-nums">
          {used.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground">unlimited</span>
      </div>
    )
  }
  const pct = Math.min(100, Math.round((used / limit) * 100))
  return (
    <div className="flex w-32 flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="tabular-nums text-foreground">
          {used.toLocaleString()}
          <span className="text-muted-foreground">/{limit.toLocaleString()}</span>
        </span>
        <span className="text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full transition-all',
            pct >= 100 ? 'bg-destructive' : pct >= 75 ? 'bg-amber-500' : 'bg-primary'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: CouponStatus }) {
  if (status === 'active') {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      >
        <CheckCircle2 className="h-3 w-3" />
        Active
      </Badge>
    )
  }
  if (status === 'expired') {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <CalendarClock className="h-3 w-3" />
        Expired
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
      <TicketX className="h-3 w-3" />
      Used up
    </Badge>
  )
}

function CouponsSkeleton() {
  return (
    <main className="flex flex-col gap-6 pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-32" />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="gap-4 p-4 sm:p-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-9 w-full sm:max-w-sm" />
            <Skeleton className="h-9 w-full sm:w-[170px]" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b px-4 py-4 last:border-b-0"
              >
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="ml-auto h-4 w-24" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
