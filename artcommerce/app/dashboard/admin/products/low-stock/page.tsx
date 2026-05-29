'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Minus,
  Package,
  PackageCheck,
  PackageX,
  Plus,
  RotateCcw,
} from 'lucide-react'

import { useAuth } from '../../../../contexts/AuthContext'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'

interface Product {
  id: number
  name: string
  slug: string
  stockQuantity: number
  price: number
  currency: string
  imageUrls: string[]
  isActive?: boolean
}

type Severity = 'out' | 'critical' | 'low'
type SeverityFilter = 'all' | Severity

const QUICK_ADDS = [1, 5, 10, 25] as const

function getSeverity(stock: number): Severity {
  if (stock === 0) return 'out'
  if (stock <= 2) return 'critical'
  return 'low'
}

const severityCopy: Record<Severity, { label: string; bar: string; pill: string; dot: string }> = {
  out: {
    label: 'Out of stock',
    bar: 'bg-destructive',
    pill: 'border-destructive/30 bg-destructive/10 text-destructive',
    dot: 'bg-destructive',
  },
  critical: {
    label: 'Critically low',
    bar: 'bg-amber-500',
    pill: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  low: {
    label: 'Low',
    bar: 'bg-yellow-500',
    pill: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
    dot: 'bg-yellow-500',
  },
}

function formatPrice(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(0)}`
  }
}

export default function LowStockPage() {
  const { token, user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [drafts, setDrafts] = useState<Record<number, number>>({})
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set())
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<SeverityFilter>('all')

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    if (user.role !== 'admin') {
      setError('You are not authorized to view this page.')
      setLoading(false)
      return
    }
    fetch('/api/admin/products/low-stock', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || r.statusText)
        return r.json()
      })
      .then((json) => setProducts(json.products ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [authLoading, user, token])

  const stats = useMemo(() => {
    let out = 0
    let critical = 0
    let low = 0
    for (const p of products) {
      const s = getSeverity(p.stockQuantity)
      if (s === 'out') out++
      else if (s === 'critical') critical++
      else low++
    }
    return { total: products.length, out, critical, low }
  }, [products])

  const visibleProducts = useMemo(() => {
    if (filter === 'all') return products
    return products.filter((p) => getSeverity(p.stockQuantity) === filter)
  }, [products, filter])

  function getDraft(p: Product) {
    return drafts[p.id] ?? p.stockQuantity
  }

  function setDraft(id: number, value: number) {
    setDrafts((prev) => ({ ...prev, [id]: Math.max(0, value) }))
  }

  function clearDraft(id: number) {
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  async function patchProduct(id: number, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Update failed')
    }
    return res.json()
  }

  async function saveStock(p: Product) {
    const draft = getDraft(p)
    if (draft === p.stockQuantity) return
    setSavingIds((prev) => new Set(prev).add(p.id))
    try {
      const { product } = await patchProduct(p.id, { stockQuantity: draft })
      setProducts((prev) =>
        prev.map((it) => (it.id === p.id ? { ...it, stockQuantity: product.stockQuantity } : it))
      )
      clearDraft(p.id)
      toast.success(`${p.name} stock set to ${product.stockQuantity}.`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev)
        next.delete(p.id)
        return next
      })
    }
  }

  async function toggleActive(p: Product, next: boolean) {
    setTogglingIds((prev) => new Set(prev).add(p.id))
    try {
      const { product } = await patchProduct(p.id, { isActive: next })
      setProducts((prev) =>
        prev.map((it) => (it.id === p.id ? { ...it, isActive: product.isActive } : it))
      )
      toast.success(`${p.name} is now ${product.isActive ? 'visible' : 'hidden'}.`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(p.id)
        return next
      })
    }
  }

  if (loading) return <LowStockSkeleton />

  if (error) {
    return (
      <main className="flex flex-col gap-6">
        <PageHeader />
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-foreground">Unable to load stock alerts</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex flex-col gap-6 pb-10">
      <PageHeader />

      {/* Severity tiles act as filter chips */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SeverityTile
          icon={Package}
          label="All alerts"
          value={stats.total}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          tone="muted"
        />
        <SeverityTile
          icon={PackageX}
          label="Out of stock"
          value={stats.out}
          active={filter === 'out'}
          onClick={() => setFilter('out')}
          tone="destructive"
        />
        <SeverityTile
          icon={AlertTriangle}
          label="Critically low"
          value={stats.critical}
          hint="≤ 2 left"
          active={filter === 'critical'}
          onClick={() => setFilter('critical')}
          tone="amber"
        />
        <SeverityTile
          icon={PackageCheck}
          label="Low"
          value={stats.low}
          hint="3 – 5 left"
          active={filter === 'low'}
          onClick={() => setFilter('low')}
          tone="yellow"
        />
      </div>

      {products.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <PackageCheck className="h-6 w-6" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium text-foreground">All products are sufficiently stocked</p>
              <p className="text-sm text-muted-foreground">
                You&rsquo;ll see alerts here when inventory drops to 5 units or fewer.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/admin/products">Back to products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : visibleProducts.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
            <Package className="h-5 w-5" />
            No items match this severity. Try another filter.
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Stock action center</CardTitle>
            <CardDescription>
              Adjust quantity inline or use a quick-add to restock without leaving this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
            {visibleProducts.map((p) => (
              <StockRow
                key={p.id}
                product={p}
                draft={getDraft(p)}
                hasDraft={drafts[p.id] !== undefined && drafts[p.id] !== p.stockQuantity}
                saving={savingIds.has(p.id)}
                toggling={togglingIds.has(p.id)}
                onChange={(v) => setDraft(p.id, v)}
                onReset={() => clearDraft(p.id)}
                onSave={() => saveStock(p)}
                onToggleActive={(v) => toggleActive(p, v)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  )
}

function PageHeader() {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <Link
          href="/dashboard/admin/products"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to products
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Low-stock alerts
        </h1>
        <p className="text-sm text-muted-foreground">
          Restock or pause items in one place. Stock is saved per product when you click Save.
        </p>
      </div>
    </header>
  )
}

function SeverityTile({
  icon: Icon,
  label,
  value,
  hint,
  active,
  onClick,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  hint?: string
  active: boolean
  onClick: () => void
  tone: 'muted' | 'destructive' | 'amber' | 'yellow'
}) {
  const iconTone = {
    muted: 'bg-muted text-muted-foreground',
    destructive: 'bg-destructive/10 text-destructive',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  }[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-card p-4 text-left shadow-sm transition-all',
        'hover:border-foreground/20 hover:shadow-md',
        active && 'border-foreground ring-2 ring-foreground/10'
      )}
    >
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-md', iconTone)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-semibold tabular-nums text-foreground">{value}</span>
          {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
        </div>
      </div>
    </button>
  )
}

function StockRow({
  product,
  draft,
  hasDraft,
  saving,
  toggling,
  onChange,
  onReset,
  onSave,
  onToggleActive,
}: {
  product: Product
  draft: number
  hasDraft: boolean
  saving: boolean
  toggling: boolean
  onChange: (v: number) => void
  onReset: () => void
  onSave: () => void
  onToggleActive: (v: boolean) => void
}) {
  const severity = getSeverity(product.stockQuantity)
  const meta = severityCopy[severity]
  const isActive = product.isActive ?? true
  const delta = draft - product.stockQuantity
  const cover = product.imageUrls?.[0]

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-lg border bg-card p-4 transition-colors',
        hasDraft && 'border-primary/40 bg-primary/[0.02]'
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground" />
            )}
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
                meta.dot
              )}
              aria-hidden
            />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              href={`/dashboard/admin/products/${product.id}`}
              className="truncate text-sm font-semibold text-foreground hover:underline"
            >
              {product.name}
            </Link>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="truncate">/{product.slug}</span>
              <span className="text-border">•</span>
              <span className="font-medium tabular-nums text-foreground">
                {formatPrice(product.price, product.currency)}
              </span>
              <span className="text-border">•</span>
              <Badge variant="outline" className={cn('h-5 gap-1 px-1.5 text-[10px]', meta.pill)}>
                {meta.label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 rounded-md border bg-background p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onChange(draft - 1)}
              disabled={saving || draft <= 0}
              aria-label="Decrease stock"
              className="rounded-sm"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              value={draft}
              onChange={(e) => {
                const v = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                onChange(Number.isFinite(v) ? v : 0)
              }}
              disabled={saving}
              aria-label="Stock quantity"
              className="h-8 w-16 border-0 bg-transparent p-0 text-center text-sm font-semibold tabular-nums shadow-none focus-visible:ring-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onChange(draft + 1)}
              disabled={saving}
              aria-label="Increase stock"
              className="rounded-sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={onToggleActive}
              disabled={toggling}
              aria-label={`Toggle ${product.name} active`}
            />
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {isActive ? 'Visible' : 'Hidden'}
            </span>
          </div>

          <Link
            href={`/dashboard/admin/products/${product.id}`}
            className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
            aria-label={`Open ${product.name}`}
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Quick add row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Quick add</span>
          {QUICK_ADDS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(draft + n)}
              disabled={saving}
              className="rounded-full border border-dashed border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-50"
            >
              +{n}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {hasDraft && (
            <span
              className={cn(
                'text-xs font-medium tabular-nums',
                delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
              )}
            >
              {delta > 0 ? `+${delta}` : delta} from {product.stockQuantity}
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={!hasDraft || saving}
            className="gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={!hasDraft || saving}
            className="gap-1.5"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {saving ? 'Saving' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function LowStockSkeleton() {
  return (
    <main className="flex flex-col gap-6 pb-10">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96" />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-1.5 h-4 w-80" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4 rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-md" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  )
}
