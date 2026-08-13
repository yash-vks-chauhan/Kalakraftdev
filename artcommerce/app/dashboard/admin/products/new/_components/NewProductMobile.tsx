'use client'

import { useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  ClipboardCheck,
  Image as ImageIcon,
  ImagePlus,
  Link2,
  Loader2,
  Minus,
  MoveLeft,
  MoveRight,
  Package,
  Plus,
  Star,
  Tags,
  Trash2,
  X,
} from 'lucide-react'

import {
  ActionSheet,
  type ActionSheetGroup,
  type SheetAction,
} from '../../../../_components/ActionSheet'
import {
  CURRENCIES,
  CURRENCY_SYMBOL,
  MAX_IMAGES,
  SHORT_DESC_IDEAL,
  TAB_ORDER,
  formatPrice,
  type ProductForm,
  type TabKey,
} from '../_lib/product-form'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

/**
 * Creating a product on a phone.
 *
 * The desktop workspace puts a tabbed form beside a preview and a checklist.
 * Folded to 390pt that became a wrapping command bar over the app header, four
 * tabs too wide to fit, and a preview a screen and a half below the field it
 * described. Worse, three things simply did not work: the photo remove button
 * and drag grip were hover-only, reordering was HTML5 drag — which touch never
 * fires — and the draft/live switch was `hidden sm:flex`, so every product a
 * phone created published immediately.
 *
 * So this asks four questions in turn, keeps the verb in a bar above the dock,
 * and puts the preview, the checklist and the publish decision in one Review
 * sheet that opens from any step. Every control is visible at rest.
 */

const STEP_LABEL: Record<TabKey, string> = {
  basics: 'Basics',
  pricing: 'Price',
  media: 'Photos',
  discovery: 'Tags',
}

export function NewProductMobile({ form }: { form: ProductForm }) {
  const {
    submitting,
    activeTab,
    setActiveTab,
    isLastTab,
    goNextTab,
    imageUrls,
    setImageUrls,
    reorderImages,
    allRequiredDone,
    blocker,
    progressPct,
    sections,
    submit,
  } = form

  const [reviewOpen, setReviewOpen] = useState(false)
  // Held past the close so the sheet does not blank out while it animates down.
  const [tileIndex, setTileIndex] = useState(0)
  const [tileOpen, setTileOpen] = useState(false)

  function openTile(index: number) {
    setTileIndex(index)
    setTileOpen(true)
  }

  function handlePrimary() {
    if (!isLastTab) {
      goNextTab()
      return
    }
    if (!allRequiredDone || submitting) return
    void submit()
  }

  return (
    <main className="flex flex-col">
      {/*
        Sticky under the app bar rather than at the viewport top: the dashboard
        header is `sticky top-0`, and the old page's own command bar claimed the
        same offset and layer, so it rode straight over the back chevron.
      */}
      <div
        className="sticky z-20 -mx-4 -mt-5 border-b bg-background/95 px-4 pb-3 pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6"
        style={{ top: 'var(--mobile-header-total, 3.5rem)' }}
      >
        <div className="flex gap-1.5">
          {TAB_ORDER.map((key) => {
            const on = key === activeTab
            const complete = sections[key].complete
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                aria-current={on ? 'step' : undefined}
                className={cn(
                  'flex h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[13px] text-[12px] font-semibold tracking-tight transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  on
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground active:bg-secondary'
                )}
              >
                <span
                  className={cn(
                    'flex size-[15px] items-center justify-center rounded-full border-[1.5px]',
                    complete
                      ? on
                        ? 'border-transparent bg-background text-foreground'
                        : 'border-transparent bg-emerald-500 text-white'
                      : 'border-current opacity-40'
                  )}
                >
                  {complete && <Check className="size-2.5" strokeWidth={3.5} />}
                </span>
                {STEP_LABEL[key]}
              </button>
            )
          })}
        </div>
        <div className="mx-0.5 mt-2.5 h-[3px] overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-foreground transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Clears the action bar, which floats above the dock. */}
      <div className="flex flex-col gap-4 pb-24 pt-4">
        {activeTab === 'basics' && <BasicsStep form={form} />}
        {activeTab === 'pricing' && <PricingStep form={form} />}
        {activeTab === 'media' && <MediaStep form={form} onOpenTile={openTile} />}
        {activeTab === 'discovery' && <DiscoveryStep form={form} />}
      </div>

      {/*
        Pinned to --mobile-dock-total, the same anchor the cart's checkout card
        uses, so the app has one place and one shape for "the action".
      */}
      <div
        className="fixed inset-x-0 z-30 lg:hidden"
        style={{ bottom: 'var(--mobile-dock-total, 4.375rem)' }}
      >
        <div className="mx-3 mb-2.5 overflow-hidden rounded-[18px] border bg-background/95 shadow-lg backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/90">
          {isLastTab && blocker && (
            <button
              type="button"
              onClick={() => setActiveTab(blocker.tab)}
              className="flex w-full items-center gap-2 border-b bg-muted px-3.5 py-2.5 text-left text-[12.5px] text-muted-foreground transition-colors active:bg-secondary"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span className="min-w-0 truncate">
                {blocker.message} —{' '}
                {/* Named by the step rail's own label, not the desktop tab's. */}
                <span className="font-semibold text-foreground">
                  {STEP_LABEL[blocker.tab]}
                </span>
              </span>
              <ChevronRight className="ml-auto size-4 shrink-0" />
            </button>
          )}
          <div className="flex items-center gap-2 p-2.5">
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-[13.5px] font-semibold tracking-tight text-foreground transition-colors active:bg-secondary"
            >
              <ClipboardCheck className="size-4" />
              Review
            </button>
            <button
              type="button"
              onClick={handlePrimary}
              disabled={submitting || (isLastTab && !allRequiredDone)}
              className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-foreground text-[14.5px] font-semibold tracking-[-0.012em] text-background transition-opacity active:opacity-90 disabled:opacity-35"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating…
                </>
              ) : isLastTab ? (
                <>
                  <Check className="size-4" strokeWidth={2.6} />
                  Create product
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <ReviewSheet form={form} open={reviewOpen} onOpenChange={setReviewOpen} />

      {/* Reordering, named. Touch never fires the drag events the desktop uses. */}
      <ActionSheet
        open={tileOpen}
        onOpenChange={setTileOpen}
        title={`Photo ${tileIndex + 1} of ${imageUrls.length}`}
        description={tileIndex === 0 ? 'This is the cover' : 'Shown in the gallery'}
        groups={buildTileActions({
          index: tileIndex,
          total: imageUrls.length,
          onMakeCover: () => reorderImages(tileIndex, 0),
          onEarlier: () => reorderImages(tileIndex, tileIndex - 1),
          onLater: () => reorderImages(tileIndex, tileIndex + 1),
          onRemove: () => setImageUrls((prev) => prev.filter((_, i) => i !== tileIndex)),
        })}
      />
    </main>
  )
}

function buildTileActions({
  index,
  total,
  onMakeCover,
  onEarlier,
  onLater,
  onRemove,
}: {
  index: number
  total: number
  onMakeCover: () => void
  onEarlier: () => void
  onLater: () => void
  onRemove: () => void
}): ActionSheetGroup[] {
  const actions: SheetAction[] = []
  if (index !== 0) {
    actions.push({
      id: 'cover',
      label: 'Make cover',
      description: 'Show this one on cards and in search',
      icon: Star,
      onSelect: onMakeCover,
    })
    actions.push({
      id: 'earlier',
      label: 'Move earlier',
      description: `Swap with photo ${index}`,
      icon: MoveLeft,
      onSelect: onEarlier,
    })
  }
  if (index < total - 1) {
    actions.push({
      id: 'later',
      label: 'Move later',
      description: `Swap with photo ${index + 2}`,
      icon: MoveRight,
      onSelect: onLater,
    })
  }
  return [
    ...(actions.length ? [{ actions }] : []),
    {
      actions: [
        {
          id: 'remove',
          label: 'Remove photo',
          description: 'Takes it out of the gallery',
          icon: Trash2,
          destructive: true,
          onSelect: onRemove,
        },
      ],
    },
  ]
}

/* ---------------------------------------------------------------- steps */

function BasicsStep({ form }: { form: ProductForm }) {
  const {
    name,
    setName,
    slug,
    setSlug,
    setSlugTouched,
    shortDesc,
    setShortDesc,
    shortDescLen,
    shortDescTone,
    description,
    setDescription,
    specifications,
    setSpecifications,
    careInstructions,
    setCareInstructions,
  } = form

  const [slugOpen, setSlugOpen] = useState(false)
  const [open, setOpen] = useState<'specs' | 'care' | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <Field label="Product name" htmlFor="npm-name">
        <Input
          id="npm-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Hand-painted ceramic vase"
          autoComplete="off"
          className="h-11 rounded-xl text-base"
        />
      </Field>

      {/*
        The slug writes itself from the name. On a phone it is a line of text
        with an Edit beside it, not a composite input whose /products/ prefix
        eats a third of an already narrow field.
      */}
      <div className="-mt-1 flex items-center gap-2 px-0.5">
        <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
        <code className="min-w-0 truncate font-mono text-[11.5px] text-foreground">
          /products/{slug || '…'}
        </code>
        <button
          type="button"
          onClick={() => setSlugOpen((v) => !v)}
          className="ml-auto shrink-0 py-1 text-[12.5px] font-semibold text-foreground underline underline-offset-[3px]"
        >
          {slugOpen ? 'Hide' : 'Edit'}
        </button>
      </div>

      {slugOpen && (
        <Field label="URL slug" htmlFor="npm-slug" hint="Changing this changes the product's link.">
          <Input
            id="npm-slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
            placeholder="hand-painted-ceramic-vase"
            autoComplete="off"
            className="h-11 rounded-xl font-mono text-[15px]"
          />
        </Field>
      )}

      <Field
        label="Short description"
        htmlFor="npm-short"
        counter={
          <span
            className={cn(
              shortDescTone === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
              shortDescTone === 'amber' && 'text-amber-600 dark:text-amber-400',
              shortDescTone === 'muted' && 'text-muted-foreground'
            )}
          >
            {shortDescLen}/{SHORT_DESC_IDEAL.max}
          </span>
        }
        hint={
          shortDescLen === 0
            ? 'Used on cards and in search results.'
            : shortDescTone === 'emerald'
            ? 'Good length for search results.'
            : shortDescLen < SHORT_DESC_IDEAL.min
            ? 'A little short for search results.'
            : 'Search results will trim this.'
        }
      >
        <Input
          id="npm-short"
          value={shortDesc}
          onChange={(e) => setShortDesc(e.target.value)}
          placeholder="One line for the product card"
          className="h-11 rounded-xl text-base"
        />
      </Field>

      <Field label="Full description" htmlFor="npm-desc">
        <Textarea
          id="npm-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell the story behind this piece…"
          className="min-h-[112px] rounded-xl text-base"
        />
      </Field>

      {/* Optional prose, folded — it used to bury the required fields. */}
      <Panel>
        <Disclosure
          title="Specifications"
          state={specifications.length ? `${specifications.length} characters` : 'Not added'}
          open={open === 'specs'}
          onToggle={() => setOpen(open === 'specs' ? null : 'specs')}
        >
          <Textarea
            value={specifications}
            onChange={(e) => setSpecifications(e.target.value)}
            placeholder="Material, dimensions, weight…"
            className="min-h-[96px] rounded-xl bg-background text-base"
          />
        </Disclosure>
        <Disclosure
          title="Care & maintenance"
          state={careInstructions.length ? `${careInstructions.length} characters` : 'Not added'}
          open={open === 'care'}
          onToggle={() => setOpen(open === 'care' ? null : 'care')}
        >
          <Textarea
            value={careInstructions}
            onChange={(e) => setCareInstructions(e.target.value)}
            placeholder="How to keep it looking its best"
            className="min-h-[96px] rounded-xl bg-background text-base"
          />
        </Disclosure>
      </Panel>
    </div>
  )
}

function PricingStep({ form }: { form: ProductForm }) {
  const {
    price,
    setPrice,
    currency,
    setCurrency,
    priceNum,
    stockQuantity,
    setStockQuantity,
    stockNum,
    categoryId,
    setCategoryId,
    categories,
    categoryLabel,
  } = form

  const [pickerOpen, setPickerOpen] = useState(false)

  function bumpStock(by: number) {
    const next = Math.max(0, (parseInt(stockQuantity || '0', 10) || 0) + by)
    setStockQuantity(String(next))
  }

  return (
    <div className="flex flex-col gap-4">
      <Field
        label="Price"
        htmlFor="npm-price"
        hint={
          <>
            Shown to customers as{' '}
            <span className="font-semibold text-foreground">
              {formatPrice(priceNum, currency)}
            </span>
          </>
        }
      >
        <div className="flex gap-2">
          {/* Three options do not deserve a portal and a scroll. */}
          <div
            role="group"
            aria-label="Currency"
            className="flex shrink-0 gap-0.5 rounded-xl bg-muted p-1"
          >
            {CURRENCIES.map((c) => {
              const on = currency === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  aria-pressed={on}
                  className={cn(
                    'h-9 w-[44px] rounded-[9px] text-[12.5px] font-bold transition-colors',
                    on
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground active:bg-secondary'
                  )}
                >
                  {c}
                </button>
              )
            })}
          </div>
          <div className="relative min-w-0 flex-1">
            <span
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[17px] text-muted-foreground"
            >
              {CURRENCY_SYMBOL[currency] ?? ''}
            </span>
            <Input
              id="npm-price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="h-11 rounded-xl pl-8 text-[19px] font-bold tabular-nums tracking-tight"
            />
          </div>
        </div>
      </Field>

      <Field label="Stock" htmlFor="npm-stock">
        <div className="flex h-11 items-stretch overflow-hidden rounded-xl border bg-background">
          <button
            type="button"
            onClick={() => bumpStock(-1)}
            aria-label="One fewer"
            className="flex w-12 shrink-0 items-center justify-center text-foreground transition-colors active:bg-secondary"
          >
            <Minus className="size-[18px]" />
          </button>
          <input
            id="npm-stock"
            type="number"
            inputMode="numeric"
            min="0"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            placeholder="0"
            className="min-w-0 flex-1 border-x bg-transparent text-center text-base font-semibold tabular-nums text-foreground outline-none"
          />
          <button
            type="button"
            onClick={() => bumpStock(1)}
            aria-label="One more"
            className="flex w-12 shrink-0 items-center justify-center text-foreground transition-colors active:bg-secondary"
          >
            <Plus className="size-[18px]" />
          </button>
        </div>
        <span className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
          <span
            aria-hidden
            className={cn(
              'size-1.5 shrink-0 rounded-full',
              stockNum === 0 ? 'bg-destructive' : stockNum <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
            )}
          />
          {stockNum === 0
            ? 'Out of stock — it will not sell'
            : stockNum <= 5
            ? `${stockNum} left · low stock`
            : `${stockNum} units in stock`}
        </span>
      </Field>

      <Field
        label="Category"
        hint="Drives storefront filtering and analytics roll-ups."
      >
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex h-11 w-full items-center gap-2 rounded-xl border bg-background px-3.5 text-left text-[15.5px] transition-colors active:bg-secondary"
        >
          <span className={cn('min-w-0 flex-1 truncate', !categoryLabel && 'text-muted-foreground')}>
            {categoryLabel ?? 'Pick the best fit'}
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </Field>

      <ActionSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="Category"
        description="Drives storefront filtering and roll-ups"
        groups={[
          {
            actions: categories.map((c) => ({
              id: `cat-${c.id}`,
              label: c.name,
              selected: categoryId === String(c.id),
              onSelect: () => setCategoryId(String(c.id)),
            })),
          },
        ]}
      />
    </div>
  )
}

function MediaStep({
  form,
  onOpenTile,
}: {
  form: ProductForm
  onOpenTile: (index: number) => void
}) {
  const {
    imageUrls,
    setImageUrls,
    stylingIdeas,
    setStylingIdeas,
    uploadingProduct,
    uploadingStyling,
    productUploadIds,
    stylingUploadIds,
    getProductRootProps,
    getProductInputProps,
    getStylingRootProps,
    getStylingInputProps,
  } = form

  const [stylingOpen, setStylingOpen] = useState(false)
  const full = imageUrls.length >= MAX_IMAGES

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-0.5">
        <h2 className="text-[13.5px] font-semibold tracking-[-0.008em] text-foreground">
          Product photos
        </h2>
        <span className="ml-auto text-[11.5px] font-semibold tabular-nums text-muted-foreground">
          {imageUrls.length}/{MAX_IMAGES}
        </span>
      </div>

      {!full && (
        <div
          {...getProductRootProps()}
          className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border border-dashed bg-muted px-4 py-5 text-center transition-colors active:bg-secondary"
        >
          <input {...getProductInputProps()} />
          <span className="flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm">
            <Camera className="size-[18px]" />
          </span>
          <span className="text-[14.5px] font-semibold text-foreground">Add photos</span>
          <span className="text-[11.5px] text-muted-foreground">
            Camera or library · JPG, PNG, WEBP · up to 20MB
          </span>
        </div>
      )}

      {(imageUrls.length > 0 || productUploadIds.length > 0) && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {imageUrls.map((url, i) => (
              <div
                key={url}
                className="relative aspect-square overflow-hidden rounded-[13px] border bg-muted"
              >
                <button
                  type="button"
                  onClick={() => onOpenTile(i)}
                  aria-label={`Photo ${i + 1} options`}
                  className="absolute inset-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="size-full object-cover" />
                </button>
                {i === 0 && (
                  <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-foreground px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-background">
                    Cover
                  </span>
                )}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 flex h-6 items-end justify-center bg-gradient-to-t from-black/55 to-transparent pb-0.5 text-[10.5px] font-semibold text-white"
                >
                  {i + 1}
                </span>
                {/* Visible at rest — the desktop's × is behind :hover. */}
                <button
                  type="button"
                  onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-1 top-1 flex size-[26px] items-center justify-center rounded-full bg-background/95 text-destructive shadow-sm transition-colors active:bg-destructive active:text-destructive-foreground"
                >
                  <X className="size-3.5" strokeWidth={2.6} />
                </button>
              </div>
            ))}
            {productUploadIds.map((id) => (
              <UploadingTile key={id} progress={uploadingProduct[id] ?? 0} />
            ))}
          </div>
          <p className="px-0.5 text-[12px] text-muted-foreground">
            Tap a photo to make it the cover, reorder it or remove it. The cover is what
            shows on cards.
          </p>
        </>
      )}

      <Panel className="mt-1">
        <Disclosure
          title="Styling photos"
          state={
            stylingIdeas.length
              ? `${stylingIdeas.length} added`
              : 'Optional inspiration shown beside the product'
          }
          open={stylingOpen}
          onToggle={() => setStylingOpen((v) => !v)}
        >
          <div className="flex flex-col gap-2.5">
            <div
              {...getStylingRootProps()}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-background px-3 py-3 transition-colors active:bg-secondary"
            >
              <input {...getStylingInputProps()} />
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ImagePlus className="size-[18px]" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[14px] font-medium text-foreground">
                  Add styling photos
                </span>
                <span className="truncate text-[11.5px] text-muted-foreground">
                  Captions optional · up to 20MB each
                </span>
              </span>
            </div>

            {(stylingIdeas.length > 0 || stylingUploadIds.length > 0) && (
              <div className="grid grid-cols-2 gap-2">
                {stylingIdeas.map((idea, idx) => (
                  <div
                    key={idea.url}
                    className="flex flex-col gap-1.5 rounded-xl border bg-background p-1.5"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={idea.url}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setStylingIdeas((prev) => prev.filter((_, i) => i !== idx))
                        }
                        aria-label={`Remove styling photo ${idx + 1}`}
                        className="absolute right-1 top-1 flex size-[26px] items-center justify-center rounded-full bg-background/95 text-destructive shadow-sm transition-colors active:bg-destructive active:text-destructive-foreground"
                      >
                        <X className="size-3.5" strokeWidth={2.6} />
                      </button>
                    </div>
                    <Input
                      value={idea.text}
                      onChange={(e) => {
                        const v = e.target.value
                        setStylingIdeas((prev) =>
                          prev.map((it, i) => (i === idx ? { ...it, text: v } : it))
                        )
                      }}
                      placeholder="Caption"
                      aria-label={`Caption for styling photo ${idx + 1}`}
                      className="h-10 rounded-lg text-[13px]"
                    />
                  </div>
                ))}
                {stylingUploadIds.map((id) => (
                  <UploadingTile key={id} progress={uploadingStyling[id] ?? 0} />
                ))}
              </div>
            )}
          </div>
        </Disclosure>
      </Panel>
    </div>
  )
}

function DiscoveryStep({ form }: { form: ProductForm }) {
  const {
    usageTags,
    availableTags,
    newTagInput,
    setNewTagInput,
    addTag,
    removeTag,
    setUsageTags,
    isActive,
    setIsActive,
  } = form

  const suggestions = availableTags.filter((t) => !usageTags.includes(t))

  return (
    <div className="flex flex-col gap-4">
      <Field
        label="Usage tags"
        htmlFor="npm-tag"
        counter={<span className="text-muted-foreground">optional</span>}
        hint="Tags let shoppers find this by mood or occasion."
      >
        <div className="flex gap-2">
          <Input
            id="npm-tag"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag(newTagInput)
              }
            }}
            placeholder="Diwali, gifting, living room…"
            enterKeyHint="done"
            className="h-11 min-w-0 flex-1 rounded-xl text-base"
          />
          <button
            type="button"
            onClick={() => addTag(newTagInput)}
            disabled={!newTagInput.trim()}
            aria-label="Add tag"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition-opacity active:opacity-90 disabled:opacity-35"
          >
            <Plus className="size-5" />
          </button>
        </div>
      </Field>

      {usageTags.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Added
          </h3>
          <div className="flex flex-wrap gap-2">
            {usageTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex h-9 items-center gap-0.5 rounded-full bg-secondary pl-3 pr-1 text-[13px] font-medium text-foreground"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove ${tag}`}
                  className="flex size-7 items-center justify-center rounded-full text-muted-foreground active:bg-foreground/10"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Suggestions
          </h3>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setUsageTags((prev) => [...prev, tag])}
                className="inline-flex h-9 items-center gap-1 rounded-full border border-dashed px-3 text-[13px] text-muted-foreground transition-colors active:bg-secondary"
              >
                <Plus className="size-3.5" />
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {usageTags.length === 0 && suggestions.length === 0 && (
        <p className="px-1 text-[12.5px] text-muted-foreground">
          No tags yet. Add a few to help shoppers discover this piece.
        </p>
      )}

      {/* The decision the phone could not make before. */}
      <Panel>
        <div className="flex items-center gap-3 px-3.5 py-3">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[14.5px] font-semibold text-foreground">
              {isActive ? 'Publishes when created' : 'Saves as a draft'}
            </span>
            <span className="text-[12px] text-muted-foreground">
              {isActive
                ? 'Visible on the storefront straight away'
                : 'Only you can see it until you publish'}
            </span>
          </span>
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
            aria-label="Publish when created"
          />
        </div>
      </Panel>
    </div>
  )
}

/* --------------------------------------------------------------- review */

/**
 * The desktop's whole right column — preview, checklist, publish — plus the
 * Create button, as one sheet reachable from every step. It is the last screen
 * before the product exists, which is where the publish decision belongs.
 */
function ReviewSheet({
  form,
  open,
  onOpenChange,
}: {
  form: ProductForm
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const {
    name,
    imageUrls,
    priceNum,
    currency,
    stockNum,
    categoryLabel,
    usageTags,
    isActive,
    setIsActive,
    sections,
    tabMeta,
    requiredDone,
    requiredTotal,
    allRequiredDone,
    submitting,
    setActiveTab,
    submit,
  } = form

  const cover = imageUrls[0]

  const detail: Record<TabKey, string> = {
    basics: sections.basics.complete ? name.trim() : 'Name required',
    pricing: sections.pricing.complete
      ? `${formatPrice(priceNum, currency)} · ${categoryLabel}`
      : 'Price and category required',
    media: sections.media.complete
      ? `${imageUrls.length} ${imageUrls.length === 1 ? 'photo' : 'photos'}`
      : 'At least one photo required',
    discovery: usageTags.length ? usageTags.join(', ') : 'Optional',
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="dashboard-shell max-h-[86vh] gap-0 overflow-y-auto rounded-t-2xl p-0"
      >
        <div className="flex justify-center pb-1 pt-2.5">
          <span aria-hidden className="h-1 w-9 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-3 pr-14 pt-1.5">
          <SheetTitle className="text-[15px] font-semibold">Review</SheetTitle>
          <SheetDescription className="text-[13px]">
            {requiredDone} of {requiredTotal} required steps done
          </SheetDescription>
        </div>

        <div className="px-4 pb-1">
          <div className="flex gap-3 rounded-2xl bg-muted p-3">
            <span className="flex size-[76px] shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-background text-muted-foreground">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-5" />
              )}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-[15.5px] font-semibold tracking-[-0.015em] text-foreground">
                {name.trim() || 'Untitled product'}
              </span>
              <span className="text-[17px] font-bold tabular-nums tracking-tight text-foreground">
                {formatPrice(priceNum, currency)}
              </span>
              <span className="truncate text-[12px] text-muted-foreground">
                {categoryLabel ?? 'No category'} · {stockNum} in stock ·{' '}
                {usageTags.length} {usageTags.length === 1 ? 'tag' : 'tags'}
              </span>
            </span>
          </div>
        </div>

        <section className="px-4 pb-2">
          <h3 className="px-1 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Checklist
          </h3>
          <ul className="overflow-hidden rounded-xl border bg-card">
            {TAB_ORDER.map((key, i) => {
              const complete = sections[key].complete
              return (
                <li key={key} className={cn(i > 0 && 'border-t')}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(key)
                      onOpenChange(false)
                    }}
                    className="flex min-h-[52px] w-full items-center gap-3 px-3.5 py-2 text-left transition-colors active:bg-secondary"
                  >
                    <span
                      className={cn(
                        'flex size-[21px] shrink-0 items-center justify-center rounded-full border-[1.5px]',
                        complete
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-border text-transparent'
                      )}
                    >
                      <Check className="size-3" strokeWidth={3.5} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[14px] font-medium text-foreground">
                        {STEP_LABEL[key]}
                      </span>
                      <span className="truncate text-[11.5px] text-muted-foreground">
                        {detail[key]}
                      </span>
                    </span>
                    {!complete && tabMeta[key].required && (
                      <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                        Required
                      </span>
                    )}
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="px-4 pb-2">
          <h3 className="px-1 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            When created
          </h3>
          <div className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[14.5px] font-semibold text-foreground">
                {isActive ? 'Publish to the store' : 'Save as a draft'}
              </span>
              <span className="text-[12px] text-muted-foreground">
                {isActive
                  ? 'Customers can see and buy it right away'
                  : 'Only you can see it until you publish'}
              </span>
            </span>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              aria-label="Publish when created"
            />
          </div>
        </section>

        <div className="px-4 pb-3 pt-1">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!allRequiredDone || submitting}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-foreground text-[15px] font-semibold text-background transition-opacity active:opacity-90 disabled:opacity-35"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Check className="size-4" strokeWidth={2.6} />
                Create product
              </>
            )}
          </button>
        </div>

        <div className="pb-safe" />
      </SheetContent>
    </Sheet>
  )
}

/* ----------------------------------------------------------- primitives */

function Field({
  label,
  htmlFor,
  counter,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  counter?: React.ReactNode
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2 px-0.5">
        <Label
          htmlFor={htmlFor}
          className="text-[13px] font-semibold tracking-[-0.008em] text-foreground"
        >
          {label}
        </Label>
        {counter && (
          <span className="ml-auto text-[11.5px] font-medium tabular-nums">{counter}</span>
        )}
      </div>
      {children}
      {hint && <p className="px-0.5 text-[12px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** One filled surface with hairlines inside — never a column of boxes. */
function Panel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'divide-y divide-border/60 overflow-hidden rounded-2xl bg-muted',
        className
      )}
    >
      {children}
    </div>
  )
}

function Disclosure({
  title,
  state,
  open,
  onToggle,
  children,
}: {
  title: string
  state: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-[54px] w-full items-center gap-3 px-3.5 py-2 text-left transition-colors active:bg-secondary"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[14.5px] font-medium text-foreground">{title}</span>
          <span className="truncate text-[12px] text-muted-foreground">{state}</span>
        </span>
        <ChevronRight
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-90'
          )}
        />
      </button>
      {open && <div className="px-3.5 pb-3.5">{children}</div>}
    </div>
  )
}

function UploadingTile({ progress }: { progress: number }) {
  return (
    <div className="relative flex aspect-square flex-col items-center justify-center gap-2 rounded-[13px] border border-dashed bg-muted p-3 text-center">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
      <span className="text-[10.5px] font-semibold tabular-nums text-muted-foreground">
        {progress}%
      </span>
      <span className="absolute inset-x-3 bottom-3 h-[3px] overflow-hidden rounded-full bg-background">
        <span
          className="block h-full bg-foreground transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </span>
    </div>
  )
}

/* ------------------------------------------------------------ skeleton */

export function NewProductMobileSkeleton() {
  return (
    <main className="flex flex-col">
      <div className="-mx-4 -mt-5 border-b px-4 pb-3 pt-3 sm:-mx-6 sm:px-6">
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[52px] flex-1 rounded-[13px]" />
          ))}
        </div>
        <Skeleton className="mx-0.5 mt-2.5 h-[3px] rounded-full" />
      </div>

      <div className="flex flex-col gap-4 pb-24 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-[112px] w-full rounded-xl" />
        </div>
        <Skeleton className="h-[108px] w-full rounded-2xl" />
      </div>
    </main>
  )
}

/* Kept for the error branch, so the phone gets a full-width action. */
export function NewProductMobileError({
  message,
  onBack,
}: {
  message: string
  onBack: () => void
}) {
  return (
    <main className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Package className="size-5" />
      </span>
      <p className="text-[15px] font-semibold text-foreground">Unable to open this page</p>
      <p className="max-w-[34ch] text-[13px] text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onBack}
        className="mt-2 flex h-11 items-center gap-1.5 rounded-xl bg-foreground px-4 text-[14px] font-semibold text-background active:opacity-90"
      >
        <Tags className="size-4" />
        Back to products
      </button>
    </main>
  )
}
