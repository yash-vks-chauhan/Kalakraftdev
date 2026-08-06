'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertCircle,
  CheckCircle2,
  Heart,
  Loader2,
  MessageCircle,
  MessageSquareReply,
  Package,
  Search,
  Smile,
  Sparkles,
  Star,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react'

import { useAuth } from '../../../contexts/AuthContext'
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

interface RatedProduct {
  id: number
  name: string
  avgRating: number
  reviewCount: number
}

interface Review {
  id: number
  rating: number
  comment?: string | null
  createdAt: string
  adminReply?: string | null
  adminReaction?: string | null
  product: { id: number; name: string } | null
  user: { id: string; fullName: string }
}

type RatingFilter = 'all' | '1' | '2' | '3' | '4' | '5'
type StatusFilter = 'all' | 'pending' | 'replied'

const QUICK_REACTIONS = [
  { value: '👍', icon: ThumbsUp, label: 'Thanks' },
  { value: '😊', icon: Smile, label: 'Smile' },
  { value: '❤️', icon: Heart, label: 'Loved' },
  { value: '✨', icon: Sparkles, label: 'Wow' },
] as const

function ratingTone(value: number) {
  if (value >= 4) return 'emerald'
  if (value >= 3) return 'amber'
  return 'destructive'
}

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo ago`
  return new Date(value).toLocaleDateString()
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function ReviewsDashboard() {
  const { token, user, loading: authLoading } = useAuth()

  const [reviews, setReviews] = useState<Review[]>([])
  const [topProducts, setTopProducts] = useState<RatedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const [active, setActive] = useState<Review | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [reactionDraft, setReactionDraft] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    if (user.role !== 'admin') {
      setError('You are not authorized to view this page.')
      setLoading(false)
      return
    }
    Promise.all([
      fetch('/api/admin/reviews', { headers: { Authorization: `Bearer ${token}` } }).then((r) =>
        r.json()
      ),
      fetch('/api/admin/products/highest-rated', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([rJson, pJson]) => {
        setReviews(rJson.reviews ?? [])
        setTopProducts(pJson.products ?? [])
      })
      .catch(() => setError('Failed to load reviews.'))
      .finally(() => setLoading(false))
  }, [authLoading, user, token])

  const stats = useMemo(() => {
    const total = reviews.length
    let pending = 0
    let replied = 0
    let sumRating = 0
    for (const r of reviews) {
      sumRating += r.rating
      if (r.adminReply) replied++
      else pending++
    }
    const avg = total > 0 ? sumRating / total : 0
    const replyRate = total > 0 ? Math.round((replied / total) * 100) : 0
    return { total, pending, replied, avg, replyRate }
  }, [reviews])

  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]
    for (const r of reviews) {
      const idx = Math.max(1, Math.min(5, Math.round(r.rating))) - 1
      counts[idx]++
    }
    const total = reviews.length || 1
    return [5, 4, 3, 2, 1].map((star) => ({
      rating: `${star}★`,
      stars: star,
      count: counts[star - 1],
      pct: Math.round((counts[star - 1] / total) * 100),
    }))
  }, [reviews])

  const trend = useMemo(() => {
    const days: { date: string; label: string; reviews: number }[] = []
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      days.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        reviews: 0,
      })
    }
    const idxByDate = new Map(days.map((d, i) => [d.date, i]))
    for (const r of reviews) {
      const day = new Date(r.createdAt).toISOString().slice(0, 10)
      const i = idxByDate.get(day)
      if (i !== undefined) days[i].reviews++
    }
    return days
  }, [reviews])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reviews.filter((r) => {
      if (ratingFilter !== 'all' && r.rating !== Number(ratingFilter)) return false
      if (statusFilter === 'pending' && r.adminReply) return false
      if (statusFilter === 'replied' && !r.adminReply) return false
      if (q) {
        const haystack = `${r.user.fullName} ${r.product?.name ?? ''} ${r.comment ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [reviews, search, ratingFilter, statusFilter])

  function openComposer(r: Review) {
    setActive(r)
    setReplyDraft(r.adminReply ?? '')
    setReactionDraft(r.adminReaction ?? null)
  }

  function closeComposer() {
    setActive(null)
    setReplyDraft('')
    setReactionDraft(null)
  }

  async function saveResponse(e?: FormEvent) {
    e?.preventDefault()
    if (!active) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/reviews/${active.id}/reply`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reply: replyDraft.trim(),
          reaction: reactionDraft ?? '',
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save')
      const { review } = await res.json()
      setReviews((prev) => prev.map((r) => (r.id === review.id ? review : r)))
      toast.success('Response saved.')
      closeComposer()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function quickReact(review: Review, reaction: string) {
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}/reply`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reply: review.adminReply ?? '',
          reaction,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const { review: updated } = await res.json()
      setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      toast.success('Reaction added.')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) return <ReviewsSkeleton />

  if (error) {
    return (
      <main className="flex flex-col gap-6">
        <PageHeader />
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-foreground">Unable to load reviews</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex flex-col gap-6 pb-10">
      <PageHeader />

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <StatTile icon={MessageCircle} label="Total reviews" value={stats.total.toString()} />
        <StatTile
          icon={Star}
          label="Average rating"
          value={stats.avg.toFixed(1)}
          hint={`out of 5`}
          tone={ratingTone(stats.avg)}
        />
        <StatTile
          icon={MessageSquareReply}
          label="Pending replies"
          value={stats.pending.toString()}
          tone={stats.pending > 0 ? 'amber' : 'muted'}
        />
        <StatTile
          icon={TrendingUp}
          label="Reply rate"
          value={`${stats.replyRate}%`}
          hint={`${stats.replied} of ${stats.total}`}
          tone="primary"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Rating distribution</CardTitle>
            <CardDescription>Where shoppers are landing on the 5-star scale.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {stats.total === 0 ? (
              <EmptyChart message="No reviews yet" />
            ) : (
              <DistributionChart data={distribution} />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Last 30 days</CardTitle>
            <CardDescription>Daily review volume.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {stats.total === 0 ? (
              <EmptyChart message="No activity yet" />
            ) : (
              <TrendChart data={trend} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top rated + reviews list */}
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        {/* Top rated products */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Top rated products</CardTitle>
            <CardDescription>Highest-scoring items in your catalog.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
            {topProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No rated products yet.
              </p>
            ) : (
              topProducts.slice(0, 8).map((p, i) => (
                <TopProductRow key={p.id} product={p} rank={i + 1} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Reviews list */}
        <Card className="shadow-sm">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle>All reviews</CardTitle>
              <CardDescription>
                {filtered.length} of {reviews.length} shown.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product, customer, or comment"
                  className="pl-9"
                  aria-label="Search reviews"
                />
              </div>
              <div className="flex gap-2">
                <Select value={ratingFilter} onValueChange={(v) => setRatingFilter(v as RatingFilter)}>
                  <SelectTrigger className="w-full sm:w-[130px]">
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ratings</SelectItem>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} stars
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                {reviews.length === 0 ? 'No reviews yet.' : 'No reviews match this view.'}
              </div>
            ) : (
              filtered.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  onReply={() => openComposer(r)}
                  onQuickReact={(value) => quickReact(r, value)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reply Sheet */}
      <Sheet open={Boolean(active)} onOpenChange={(o) => !o && closeComposer()}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Respond to review</SheetTitle>
            <SheetDescription>
              {active ? `Reply to ${active.user.fullName} on ${active.product?.name ?? 'product'}.` : ''}
            </SheetDescription>
          </SheetHeader>
          {active && (
            <form
              onSubmit={saveResponse}
              className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6"
            >
              <div className="rounded-md border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {active.user.fullName} · {timeAgo(active.createdAt)}
                  </span>
                  <Stars value={active.rating} />
                </div>
                {active.comment && (
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{active.comment}</p>
                )}
              </div>

              <div className="grid gap-2">
                <span className="text-xs font-medium text-muted-foreground">Reaction</span>
                <div className="flex flex-wrap gap-2">
                  {QUICK_REACTIONS.map(({ value, icon: Icon, label }) => {
                    const selected = reactionDraft === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setReactionDraft(selected ? null : value)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                          selected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-2">
                <span className="text-xs font-medium text-muted-foreground">Reply</span>
                <Textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder="Thanks for sharing your feedback…"
                  className="min-h-[160px]"
                  maxLength={2000}
                />
                <span className="text-xs text-muted-foreground">
                  {replyDraft.length}/2000
                </span>
              </div>

              <div className="mt-auto flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeComposer} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="gap-1.5">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save response
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </main>
  )
}

function PageHeader() {
  return (
    <header className="hidden flex-col gap-1 md:flex">
      <h1 className="text-2xl font-semibold tracking-tight">Reviews &amp; ratings</h1>
      <p className="text-sm text-muted-foreground">
        Monitor customer feedback, jump on pending replies, and watch your rating trend.
      </p>
    </header>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'primary' | 'emerald' | 'amber' | 'destructive' | 'muted'
}) {
  const toneClass = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    destructive: 'bg-destructive/10 text-destructive',
    muted: 'bg-muted text-muted-foreground',
  }[tone]

  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-2.5 p-2.5 sm:gap-3 sm:p-4">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-md', toneClass)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-semibold tabular-nums text-foreground">{value}</span>
            {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const distributionConfig = {
  count: { label: 'Reviews', color: 'hsl(var(--primary))' },
} satisfies ChartConfig

const ratingColor: Record<number, string> = {
  5: 'hsl(142 71% 45%)',
  4: 'hsl(160 60% 45%)',
  3: 'hsl(38 92% 50%)',
  2: 'hsl(25 95% 53%)',
  1: 'hsl(0 84% 60%)',
}

function DistributionChart({
  data,
}: {
  data: { rating: string; stars: number; count: number; pct: number }[]
}) {
  return (
    <ChartContainer config={distributionConfig} className="aspect-auto h-[220px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} className="stroke-border/50" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="rating"
          axisLine={false}
          tickLine={false}
          width={36}
          className="fill-muted-foreground text-xs"
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, item) => {
                const pct = (item.payload as any).pct as number
                return (
                  <div className="flex w-full justify-between gap-4">
                    <span className="text-muted-foreground">{(item.payload as any).rating}</span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {Number(value).toLocaleString()} · {pct}%
                    </span>
                  </div>
                )
              }}
            />
          }
        />
        <Bar dataKey="count" radius={[4, 4, 4, 4]} barSize={18}>
          {data.map((d) => (
            <Cell key={d.rating} fill={ratingColor[d.stars]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

const trendConfig = {
  reviews: { label: 'Reviews', color: 'hsl(var(--primary))' },
} satisfies ChartConfig

function TrendChart({
  data,
}: {
  data: { date: string; label: string; reviews: number }[]
}) {
  return (
    <ChartContainer config={trendConfig} className="aspect-auto h-[220px] w-full">
      <LineChart data={data} margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
        <CartesianGrid vertical={false} className="stroke-border/50" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          minTickGap={32}
          className="fill-muted-foreground text-xs"
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          width={28}
          className="fill-muted-foreground text-xs"
        />
        <ChartTooltip
          content={<ChartTooltipContent indicator="dot" labelKey="label" />}
        />
        <Line
          type="monotone"
          dataKey="reviews"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground">
      <Star className="h-5 w-5" />
      {message}
    </div>
  )
}

function TopProductRow({ product, rank }: { product: RatedProduct; rank: number }) {
  const pct = Math.round((product.avgRating / 5) * 100)
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex items-center gap-3 rounded-md border bg-background p-3 transition-colors hover:border-foreground/20"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted/30 text-xs font-semibold tabular-nums text-muted-foreground">
        {rank}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-medium text-foreground group-hover:text-primary">
          {product.name}
        </span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {product.avgRating ? product.avgRating.toFixed(1) : '0.0'} · {product.reviewCount}
          </span>
        </div>
      </div>
    </Link>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i <= value ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-muted-foreground/40'
          )}
        />
      ))}
    </div>
  )
}

function ReviewCard({
  review,
  onReply,
  onQuickReact,
}: {
  review: Review
  onReply: () => void
  onQuickReact: (reaction: string) => void
}) {
  const hasReply = Boolean(review.adminReply)
  const productHref = review.product ? `/products/${review.product.id}` : null

  return (
    <article className="flex flex-col gap-3 rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="default">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials(review.user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-foreground">
              {review.user.fullName}
            </span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              {productHref && review.product ? (
                <Link href={productHref} className="inline-flex items-center gap-1 hover:underline">
                  <Package className="h-3 w-3" />
                  {review.product.name}
                </Link>
              ) : (
                <span className="italic">Product unavailable</span>
              )}
              <span className="text-border">•</span>
              <span>{timeAgo(review.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Stars value={review.rating} />
          {hasReply ? (
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300"
            >
              <CheckCircle2 className="h-3 w-3" />
              Replied
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300"
            >
              <MessageSquareReply className="h-3 w-3" />
              Pending
            </Badge>
          )}
        </div>
      </div>

      {review.comment && (
        <p className="text-sm leading-relaxed text-foreground">{review.comment}</p>
      )}

      {(review.adminReply || review.adminReaction) && (
        <div className="rounded-md border border-l-2 border-l-primary bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <MessageSquareReply className="h-3.5 w-3.5" />
            Admin response
            {review.adminReaction && (
              <span className="text-base leading-none">{review.adminReaction}</span>
            )}
          </div>
          {review.adminReply && (
            <p className="mt-1.5 text-sm leading-relaxed text-foreground">{review.adminReply}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <div className="flex items-center gap-1">
          {QUICK_REACTIONS.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onQuickReact(value)}
              aria-label={`React with ${label}`}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                review.adminReaction === value && 'bg-primary/10 text-primary'
              )}
              title={label}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onReply} className="gap-1.5">
          <MessageSquareReply className="h-3.5 w-3.5" />
          {hasReply ? 'Edit reply' : 'Reply'}
        </Button>
      </div>
    </article>
  )
}

function ReviewsSkeleton() {
  return (
    <main className="flex flex-col gap-6 pb-10">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96" />
      </header>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="flex items-center gap-2.5 p-2.5 sm:gap-3 sm:p-4">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="mt-1.5 h-4 w-60" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-[220px] w-full rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-1.5 h-4 w-56" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-1.5 h-4 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
