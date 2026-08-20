'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { BadgeCheck, PenLine, Star, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Rating, RatingInput } from '@/components/ui/rating'
import { useAuth } from '../../contexts/AuthContext'
import { EASE, formatReviewDate, initialsFrom } from './pdp-utils'

export interface Review {
  id: number
  rating: number
  comment?: string | null
  createdAt?: string | null
  adminReply?: string | null
  user?: { fullName?: string | null; avatarUrl?: string | null } | null
}

interface ProductReviewsProps {
  productId: number
  productName: string
  avg: number
  count: number
  reviews: Review[]
  onSubmitted: () => void
}

type SortKey = 'recent' | 'highest' | 'lowest'

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'highest', label: 'Highest rated' },
  { value: 'lowest', label: 'Lowest rated' },
]

const PAGE = 4

// What buyers said, read as a page from the visitors' book rather than a
// stack of cards: one summary column that also filters, and a hairline-ruled
// column of accounts beside it.
export default function ProductReviews({
  productId,
  productName,
  avg,
  count,
  reviews,
  onSubmitted,
}: ProductReviewsProps) {
  const { user } = useAuth()
  const [sort, setSort] = useState<SortKey>('recent')
  const [filter, setFilter] = useState<number | null>(null)
  const [shown, setShown] = useState(PAGE)
  const [composing, setComposing] = useState(false)

  // Composer
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // The bars describe the reviews actually on the page, so the maths always
  // adds up to what a visitor can read.
  const distribution = useMemo(() => {
    const buckets = [5, 4, 3, 2, 1].map(star => ({
      star,
      n: reviews.filter(r => Math.round(r.rating) === star).length,
    }))
    const max = Math.max(1, ...buckets.map(b => b.n))
    return buckets.map(b => ({ ...b, pct: (b.n / max) * 100 }))
  }, [reviews])

  const visible = useMemo(() => {
    const list = filter ? reviews.filter(r => Math.round(r.rating) === filter) : [...reviews]
    list.sort((a, b) => {
      if (sort === 'highest') return b.rating - a.rating
      if (sort === 'lowest') return a.rating - b.rating
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })
    return list
  }, [reviews, filter, sort])

  const submit = async () => {
    if (rating < 1) {
      setSubmitError('Choose a rating first.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/products/${productId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating, comment: comment.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(
          res.status === 403
            ? 'Reviews are open to buyers once their order has been delivered.'
            : res.status === 401
              ? 'Please sign in again to post your review.'
              : data.error || 'Could not post your review. Please try again.',
        )
        return
      }
      setComposing(false)
      setRating(0)
      setComment('')
      onSubmitted()
    } catch {
      setSubmitError('Network error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const writeButton = (
    <button
      type="button"
      onClick={() => setComposing(c => !c)}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#1a1a1a] px-6 text-[13px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-white"
    >
      <PenLine className="h-3.5 w-3.5" />
      Write a review
    </button>
  )

  const signInButton = (
    <Link
      href="/auth/login"
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e5e5e5] px-6 text-[13px] font-medium text-[#666] transition-colors hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
    >
      <PenLine className="h-3.5 w-3.5" />
      Sign in to review
    </Link>
  )

  const composer = (
    <AnimatePresence initial={false}>
      {composing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="overflow-hidden"
        >
          <div className="mb-10 rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-7">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h3 className="font-serif text-2xl font-medium leading-none text-[#1a1a1a]">
                  Write a review
                </h3>
                <p className="mt-2 text-[13px] text-[#666]">
                  Tell others how {productName} lives in your space.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComposing(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#999] transition-colors hover:bg-[#ececec] hover:text-[#1a1a1a]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#999]">
                Your rating
              </span>
              <RatingInput value={rating} onChange={setRating} size="lg" className="-ml-1" />
            </div>

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value.slice(0, 1000))}
              rows={4}
              placeholder="What stood out — the finish, the colour, how it arrived?"
              className="mt-5 w-full resize-none rounded-xl border border-[#e5e5e5] bg-white px-4 py-3 text-[14px] leading-relaxed text-[#1a1a1a] outline-none transition-colors placeholder:text-[#b9b9b9] focus:border-[#b9b9b9]"
            />

            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="text-[11px] tabular-nums text-[#b9b9b9]">{comment.length}/1000</span>
              <div className="flex items-center gap-3">
                {submitError && <span className="text-[12.5px] text-[#b4453c]">{submitError}</span>}
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#1a1a1a] px-6 text-[13px] font-medium text-white transition-colors hover:bg-[#000] disabled:opacity-50"
                >
                  {submitting ? 'Posting…' : 'Post review'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ── Nothing written yet ────────────────────────────────────────────
  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e5e5e5] bg-[#fafafa] px-10 py-16 text-center">
        <Rating value={0} size="lg" aria-hidden="true" />
        <h3 className="mt-5 font-serif text-3xl font-medium leading-none text-[#1a1a1a]">
          No reviews yet
        </h3>
        <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-[#666]">
          This piece is waiting for its first account. If you own it, yours would be the one others
          read.
        </p>
        <div className="mt-7 flex justify-center">{user ? writeButton : signInButton}</div>
        <div className="mx-auto mt-8 max-w-2xl text-left">{composer}</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-x-16">
      {/* Summary — and the filter */}
      <aside className="col-span-4 self-start lg:sticky lg:top-28">
        <div className="flex items-end gap-3">
          <span className="font-serif text-[64px] font-medium leading-[0.8] text-[#1a1a1a]">
            {avg.toFixed(1)}
          </span>
          <span className="pb-1 text-[15px] text-[#b9b9b9]">/ 5</span>
        </div>
        <Rating value={avg} size="md" className="mt-4" />
        <p className="mt-3 text-[13px] text-[#666]">
          Based on {count || reviews.length} {(count || reviews.length) === 1 ? 'review' : 'reviews'}
        </p>

        <div className="mt-7 flex flex-col gap-1.5">
          {distribution.map(b => {
            const isActive = filter === b.star
            return (
              <button
                key={b.star}
                type="button"
                disabled={b.n === 0}
                onClick={() => {
                  setFilter(isActive ? null : b.star)
                  setShown(PAGE)
                }}
                className={cn(
                  'group flex items-center gap-3 py-1 text-left outline-none transition-opacity',
                  b.n === 0 ? 'cursor-default opacity-45' : 'hover:opacity-100',
                  filter && !isActive && b.n > 0 && 'opacity-55',
                )}
              >
                <span className="w-3 text-[12px] tabular-nums text-[#666]">{b.star}</span>
                <Star className="h-3 w-3 shrink-0 fill-rating text-rating" strokeWidth={1.25} />
                <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-[#ececec]">
                  <motion.span
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full',
                      isActive ? 'bg-rating' : 'bg-[#1a1a1a]',
                    )}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${b.pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: EASE, delay: 0.05 * (5 - b.star) }}
                  />
                </span>
                <span className="w-4 text-right text-[12px] tabular-nums text-[#999]">{b.n}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-8">{user ? writeButton : signInButton}</div>
      </aside>

      {/* The accounts */}
      <div className="col-span-8">
        {composer}

        <div className="flex items-center justify-between gap-4 border-b border-[#ececec] pb-4">
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-[#666]">
              {visible.length} {visible.length === 1 ? 'review' : 'reviews'}
            </span>
            {filter && (
              <button
                type="button"
                onClick={() => setFilter(null)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-[#fafafa] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:border-[#b9b9b9]"
              >
                {filter} stars
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {SORTS.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSort(s.value)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors',
                  sort === s.value
                    ? 'bg-[#f2f2f2] text-[#1a1a1a]'
                    : 'text-[#999] hover:text-[#1a1a1a]',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <ul>
          {visible.slice(0, shown).map((rev, i) => (
            <motion.li
              key={rev.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE, delay: Math.min(i, 4) * 0.05 }}
              className="border-b border-[#ececec] py-7"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#ececec] bg-[#fafafa] font-serif text-[15px] font-medium text-[#666]">
                  {initialsFrom(rev.user?.fullName)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[14px] font-medium text-[#1a1a1a]">
                      {rev.user?.fullName || 'Anonymous'}
                    </span>
                    {/* Only delivered orders can post, so every account here
                        is a purchase that arrived. */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[#a3a3a3]">
                      <BadgeCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Verified
                    </span>
                    {rev.createdAt && (
                      <span className="text-[12px] text-[#b9b9b9]">
                        {formatReviewDate(rev.createdAt)}
                      </span>
                    )}
                    <Rating value={rev.rating} size="sm" className="ml-auto" />
                  </div>

                  {rev.comment && (
                    <p className="mt-3 text-[14.5px] leading-[1.75] text-[#4a4a4a]">{rev.comment}</p>
                  )}

                  {rev.adminReply && (
                    <div className="mt-4 border-l-2 border-[#d4a373] pl-4">
                      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#b8845a]">
                        From the atelier
                      </span>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#666]">
                        {rev.adminReply}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.li>
          ))}
        </ul>

        {visible.length > shown && (
          <button
            type="button"
            onClick={() => setShown(n => n + PAGE)}
            className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-[#e5e5e5] px-7 text-[13px] font-medium text-[#1a1a1a] transition-colors hover:border-[#1a1a1a]"
          >
            Read {Math.min(PAGE, visible.length - shown)} more
          </button>
        )}

        {visible.length === 0 && (
          <p className="py-12 text-center text-[14px] text-[#999]">
            No {filter}-star reviews yet.
          </p>
        )}
      </div>
    </div>
  )
}
