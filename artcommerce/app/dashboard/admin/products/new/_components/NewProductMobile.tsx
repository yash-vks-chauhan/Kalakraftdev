'use client'

import { useState } from 'react'
import {
  AlertCircle,
  Camera,
  Check,
  ChevronRight,
  Image as ImageIcon,
  Link2,
  Loader2,
  Minus,
  MoveLeft,
  MoveRight,
  Package,
  Plus,
  Star,
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
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'

/**
 * Creating a product on a phone — a record you fill in, not a form you fight.
 *
 * Fields are rules, not boxes: a mono uppercase label, the value at 16pt with
 * no border, and a hairline beneath that darkens on focus. Boxing every input
 * at the same radius as the primary button is what made the previous version
 * read as a consumer app; here the only filled shape on the screen is the one
 * thing you press.
 *
 * The dock is suppressed for this route (see AppRootClient), so the action bar
 * sits flush on the bottom edge instead of floating above a floating pill.
 */

const STEP_LABEL: Record<TabKey, string> = {
  basics: 'Details',
  pricing: 'Pricing',
  media: 'Media',
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
  const [tileOpen, setTileOpen] = useState(false)
  const [tileIndex, setTileIndex] = useState(0)

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
      {/* Step rail. Sticky under the app bar — the old page's own command bar
          claimed `top-0` too and rode over the back chevron. */}
      <div
        className="sticky z-20 -mx-4 -mt-5 border-b bg-background sm:-mx-6"
        style={{ top: 'var(--mobile-header-total, 3.5rem)' }}
      >
        <div className="h-0.5 bg-border">
          <div
            className="h-full rounded-r-full bg-foreground transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex">
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
                  'relative flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-1 pb-2.5 pt-3',
                  'font-mono text-[9.5px] uppercase tracking-[0.1em] transition-colors',
                  'after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-t-full after:bg-foreground after:transition-opacity',
                  on ? 'text-foreground after:opacity-100' : 'text-faint after:opacity-0'
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'size-[5px] rounded-full border',
                    complete ? 'border-success bg-success' : 'border-current'
                  )}
                />
                {STEP_LABEL[key]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Keyed on the step so React remounts it and the entrance replays —
          moving between steps should read as a move, not a repaint. */}
      <div key={activeTab} className="animate-rise-in pb-6">
        {activeTab === 'basics' && <DetailsStep form={form} />}
        {activeTab === 'pricing' && <PricingStep form={form} />}
        {activeTab === 'media' && <MediaStep form={form} onOpenTile={openTile} />}
        {activeTab === 'discovery' && <TagsStep form={form} />}
      </div>

      {/* Flat, one hairline, flush to the bottom edge. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background pb-safe lg:hidden">
        {isLastTab && blocker && (
          <button
            type="button"
            onClick={() => setActiveTab(blocker.tab)}
            className="flex w-full items-center gap-2 border-b bg-wash px-4 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[0.04em] text-muted-foreground transition-colors active:bg-secondary"
          >
            <AlertCircle className="size-3.5 shrink-0 text-warning" />
            <span className="min-w-0 truncate">
              {blocker.message} —{' '}
              <span className="font-medium text-foreground">{STEP_LABEL[blocker.tab]}</span>
            </span>
            <ChevronRight className="ml-auto size-3.5 shrink-0" />
          </button>
        )}
        <div className="flex items-center gap-2.5 px-4 py-2.5">
          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            className="h-[42px] shrink-0 rounded-md border border-input px-3.5 text-[13.5px] font-medium text-foreground transition-colors active:bg-wash"
          >
            Review
          </button>
          <button
            type="button"
            onClick={handlePrimary}
            disabled={submitting || (isLastTab && !allRequiredDone)}
            className="flex h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary text-[14px] font-medium tracking-[-0.008em] text-primary-foreground transition-opacity active:opacity-90 disabled:opacity-30"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating…
              </>
            ) : isLastTab ? (
              'Create product'
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>

      <ReviewSheet form={form} open={reviewOpen} onOpenChange={setReviewOpen} />

      {/* Reordering, named. Touch never fires the drag events the desktop uses. */}
      <ActionSheet
        open={tileOpen}
        onOpenChange={setTileOpen}
        title={`Photo ${String(tileIndex + 1).padStart(2, '0')} of ${String(
          imageUrls.length
        ).padStart(2, '0')}`}
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
      description: 'Shown on cards and in search',
      icon: Star,
      onSelect: onMakeCover,
    })
    actions.push({
      id: 'earlier',
      label: 'Move earlier',
      description: `Swap with photo ${String(index).padStart(2, '0')}`,
      icon: MoveLeft,
      onSelect: onEarlier,
    })
  }
  if (index < total - 1) {
    actions.push({
      id: 'later',
      label: 'Move later',
      description: `Swap with photo ${String(index + 2).padStart(2, '0')}`,
      icon: MoveRight,
      onSelect: onLater,
    })
  }
  actions.push({
    id: 'remove',
    label: 'Remove photo',
    description: 'Takes it out of the gallery',
    icon: Trash2,
    destructive: true,
    onSelect: onRemove,
  })
  return [{ actions }]
}

/* ---------------------------------------------------------------- steps */

function DetailsStep({ form }: { form: ProductForm }) {
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
  const [expanded, setExpanded] = useState<'specs' | 'care' | null>(null)

  return (
    <div className="flex flex-col">
      <RuleField label="Name" htmlFor="npm-name">
        <input
          id="npm-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Hand-painted ceramic vase"
          autoComplete="off"
          className="w-full bg-transparent p-0 text-[16px] tracking-[-0.01em] text-foreground outline-none placeholder:text-faint"
        />
      </RuleField>

      {/* The slug writes itself. On a phone it is a line of text with an Edit
          beside it, not a composite input whose prefix eats the field. */}
      <div className="flex items-center gap-2 border-b py-3.5">
        <Link2 className="size-3.5 shrink-0 text-faint" />
        <code className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-muted-foreground">
          /products/{slug || '…'}
        </code>
        <button
          type="button"
          onClick={() => setSlugOpen((v) => !v)}
          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.13em] text-foreground"
        >
          {slugOpen ? 'Hide' : 'Edit'}
        </button>
      </div>

      {slugOpen && (
        <RuleField label="URL slug" htmlFor="npm-slug" hint="Changing this changes the product's link.">
          <input
            id="npm-slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
            placeholder="hand-painted-ceramic-vase"
            autoComplete="off"
            className="w-full bg-transparent p-0 font-mono text-[15px] text-foreground outline-none placeholder:text-faint"
          />
        </RuleField>
      )}

      <RuleField
        label="Short description"
        htmlFor="npm-short"
        counter={
          <span
            className={cn(
              shortDescTone === 'emerald' && 'text-success',
              shortDescTone === 'amber' && 'text-warning',
              shortDescTone === 'muted' && 'text-faint'
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
        <input
          id="npm-short"
          value={shortDesc}
          onChange={(e) => setShortDesc(e.target.value)}
          placeholder="One line for the product card"
          className="w-full bg-transparent p-0 text-[16px] tracking-[-0.01em] text-foreground outline-none placeholder:text-faint"
        />
      </RuleField>

      <RuleField label="Description" htmlFor="npm-desc">
        <textarea
          id="npm-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell the story behind this piece…"
          rows={3}
          className="w-full resize-none bg-transparent p-0 text-[16px] leading-[1.45] tracking-[-0.01em] text-foreground outline-none placeholder:text-faint"
        />
      </RuleField>

      <ExpandRow
        label="Specifications"
        value={specifications.length ? `${specifications.length} chars` : 'Not set'}
        unset={specifications.length === 0}
        open={expanded === 'specs'}
        onToggle={() => setExpanded(expanded === 'specs' ? null : 'specs')}
      >
        <textarea
          value={specifications}
          onChange={(e) => setSpecifications(e.target.value)}
          placeholder="Material, dimensions, weight…"
          rows={3}
          aria-label="Specifications"
          className="w-full resize-none bg-transparent p-0 text-[15px] leading-[1.45] text-foreground outline-none placeholder:text-faint"
        />
      </ExpandRow>

      <ExpandRow
        label="Care & maintenance"
        value={careInstructions.length ? `${careInstructions.length} chars` : 'Not set'}
        unset={careInstructions.length === 0}
        open={expanded === 'care'}
        onToggle={() => setExpanded(expanded === 'care' ? null : 'care')}
      >
        <textarea
          value={careInstructions}
          onChange={(e) => setCareInstructions(e.target.value)}
          placeholder="How to keep it looking its best"
          rows={3}
          aria-label="Care and maintenance"
          className="w-full resize-none bg-transparent p-0 text-[15px] leading-[1.45] text-foreground outline-none placeholder:text-faint"
        />
      </ExpandRow>
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

  const [picker, setPicker] = useState<'currency' | 'category' | null>(null)

  function bumpStock(by: number) {
    setStockQuantity(String(Math.max(0, (parseInt(stockQuantity || '0', 10) || 0) + by)))
  }

  return (
    <div className="flex flex-col">
      {/* The one large figure on the screen. */}
      <RuleField
        label="Price"
        htmlFor="npm-price"
        hint={
          <>
            Shown to customers as{' '}
            <span className="font-medium text-muted-foreground">
              {formatPrice(priceNum, currency)}
            </span>
          </>
        }
      >
        <div className="flex items-baseline gap-1.5">
          <span aria-hidden className="text-[15px] text-faint">
            {CURRENCY_SYMBOL[currency] ?? ''}
          </span>
          <input
            id="npm-price"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            className="min-w-0 flex-1 bg-transparent p-0 text-[26px] font-medium tracking-[-0.03em] tabular-nums text-foreground outline-none placeholder:font-normal placeholder:text-faint"
          />
        </div>
      </RuleField>

      <ValueRow label="Currency" value={currency} onClick={() => setPicker('currency')} />

      <RuleField label="Stock on hand">
        <div className="flex items-center gap-3">
          <span className="flex h-[38px] shrink-0 items-stretch overflow-hidden rounded-md border border-input">
            <button
              type="button"
              aria-label="One fewer"
              onClick={() => bumpStock(-1)}
              className="grid w-10 place-items-center text-foreground transition-colors active:bg-wash"
            >
              <Minus className="size-[15px]" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              placeholder="0"
              aria-label="Stock on hand"
              className="w-12 min-w-0 border-x border-input bg-transparent text-center text-[14px] font-medium tabular-nums text-foreground outline-none"
            />
            <button
              type="button"
              aria-label="One more"
              onClick={() => bumpStock(1)}
              className="grid w-10 place-items-center text-foreground transition-colors active:bg-wash"
            >
              <Plus className="size-[15px]" />
            </button>
          </span>
          <span className="min-w-0 flex-1 text-[12px] text-faint">
            {stockNum === 0
              ? 'Out of stock — it will not sell'
              : stockNum <= 5
              ? `${stockNum} left · counted as low stock`
              : `${stockNum} units available`}
          </span>
        </div>
      </RuleField>

      <ValueRow
        label="Category"
        value={categoryLabel ?? 'Not set'}
        unset={!categoryLabel}
        onClick={() => setPicker('category')}
        hint="Drives storefront filtering and analytics roll-ups."
      />

      <ActionSheet
        open={picker === 'currency'}
        onOpenChange={(open) => !open && setPicker(null)}
        title="Currency"
        groups={[
          {
            actions: CURRENCIES.map((c) => ({
              id: `cur-${c}`,
              label: `${CURRENCY_SYMBOL[c]} ${c}`,
              selected: currency === c,
              onSelect: () => setCurrency(c),
            })),
          },
        ]}
      />

      <ActionSheet
        open={picker === 'category'}
        onOpenChange={(open) => !open && setPicker(null)}
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
  const empty = imageUrls.length === 0 && productUploadIds.length === 0
  const room = imageUrls.length < MAX_IMAGES

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-3 pb-2 pt-4">
        <span className="flex-1 font-mono text-[10px] uppercase tracking-[0.13em] text-faint">
          Photographs
        </span>
        <span className="font-mono text-[10px] tabular-nums text-faint">
          {imageUrls.length}/{MAX_IMAGES}
        </span>
      </div>

      {empty ? (
        <div
          {...getProductRootProps()}
          className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-input px-4 py-7 text-center transition-colors active:bg-wash"
        >
          <input {...getProductInputProps()} />
          <Camera className="size-[22px] text-muted-foreground" />
          <span className="text-[14px] font-medium text-foreground">Add photos</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-faint">
            Camera or library · up to 20MB
          </span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-[7px]">
            {imageUrls.map((url, i) => (
              <div
                key={url}
                className={cn(
                  'relative aspect-square overflow-hidden rounded-lg border',
                  i === 0 ? 'border-[1.5px] border-foreground' : 'border-border'
                )}
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
                  <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-sm bg-primary px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-primary-foreground">
                    Cover
                  </span>
                )}
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-1 left-2 font-mono text-[9.5px] tracking-[0.08em] text-white [text-shadow:0_1px_3px_rgba(0,0,0,.55)]"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-sm border border-input bg-background/95 text-foreground transition-colors active:bg-destructive active:text-destructive-foreground"
                >
                  <X className="size-3" strokeWidth={2.6} />
                </button>
              </div>
            ))}
            {productUploadIds.map((id) => (
              <UploadingTile key={id} progress={uploadingProduct[id] ?? 0} />
            ))}
          </div>

          {room && productUploadIds.length === 0 && (
            <div
              {...getProductRootProps()}
              className="mt-2 flex h-[46px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-input text-[13.5px] font-medium text-muted-foreground transition-colors active:bg-wash"
            >
              <input {...getProductInputProps()} />
              <Plus className="size-[15px]" />
              Add photo
            </div>
          )}

          <p className="pt-2.5 text-[12px] text-faint">
            Tap a photo to make it the cover, move it, or remove it. Photo 01 is the cover.
          </p>
        </>
      )}

      <div className="mt-4">
        <ExpandRow
          label="Styling photos"
          value={stylingIdeas.length ? `${stylingIdeas.length} added` : 'None'}
          unset={stylingIdeas.length === 0}
          open={stylingOpen}
          onToggle={() => setStylingOpen((v) => !v)}
        >
          <div className="flex flex-col gap-2.5">
            <div
              {...getStylingRootProps()}
              className="flex h-[46px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-input text-[13.5px] font-medium text-muted-foreground transition-colors active:bg-wash"
            >
              <input {...getStylingInputProps()} />
              <Plus className="size-[15px]" />
              Add styling photo
            </div>

            {(stylingIdeas.length > 0 || stylingUploadIds.length > 0) && (
              <div className="grid grid-cols-2 gap-2">
                {stylingIdeas.map((idea, idx) => (
                  <div key={idea.url} className="flex flex-col gap-1.5">
                    <div className="relative aspect-square overflow-hidden rounded-lg border">
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
                        className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-sm border border-input bg-background/95 text-foreground transition-colors active:bg-destructive active:text-destructive-foreground"
                      >
                        <X className="size-3" strokeWidth={2.6} />
                      </button>
                    </div>
                    <input
                      value={idea.text}
                      onChange={(e) => {
                        const v = e.target.value
                        setStylingIdeas((prev) =>
                          prev.map((it, i) => (i === idx ? { ...it, text: v } : it))
                        )
                      }}
                      placeholder="Caption"
                      aria-label={`Caption for styling photo ${idx + 1}`}
                      className="h-9 w-full rounded-sm border border-input bg-transparent px-2 text-[12.5px] text-foreground outline-none placeholder:text-faint focus:border-foreground"
                    />
                  </div>
                ))}
                {stylingUploadIds.map((id) => (
                  <UploadingTile key={id} progress={uploadingStyling[id] ?? 0} />
                ))}
              </div>
            )}
          </div>
        </ExpandRow>
      </div>
    </div>
  )
}

function TagsStep({ form }: { form: ProductForm }) {
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
    <div className="flex flex-col">
      <RuleField
        label="Usage tags"
        htmlFor="npm-tag"
        counter={<span className="text-faint">Optional</span>}
        hint="Tags let shoppers find this by mood or occasion. Press return to add."
      >
        <input
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
          className="w-full bg-transparent p-0 text-[16px] tracking-[-0.01em] text-foreground outline-none placeholder:text-faint"
        />
      </RuleField>

      {usageTags.length > 0 && (
        <div className="flex flex-col gap-2 border-b py-3.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-faint">
            Added
          </span>
          <div className="flex flex-wrap gap-1.5">
            {usageTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex h-[30px] items-center gap-0.5 rounded-sm border border-input pl-2.5 pr-1 text-[13px] text-foreground"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove ${tag}`}
                  className="grid size-[22px] place-items-center rounded-sm text-faint transition-colors active:bg-wash"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-2 border-b py-3.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-faint">
            Suggested
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setUsageTags((prev) => [...prev, tag])}
                className="inline-flex h-[30px] items-center gap-1 rounded-sm border border-dashed border-input px-2.5 text-[13px] text-muted-foreground transition-colors active:bg-wash"
              >
                <Plus className="size-3" />
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* The decision the phone could not make at all before. */}
      <div className="flex items-center gap-3 border-b py-3.5">
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[10px] uppercase tracking-[0.13em] text-faint">
            On create
          </span>
          <span className="mt-0.5 block text-[14.5px] text-foreground">
            {isActive ? 'Publish to the store' : 'Save as a draft'}
          </span>
        </span>
        <Switch
          size="lg"
          checked={isActive}
          onCheckedChange={setIsActive}
          aria-label="Publish on create"
        />
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- review */

/**
 * A record about to be committed, not a product card: label left, value right,
 * anything missing in red with the row itself as the way to go and set it.
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
    requiredDone,
    requiredTotal,
    allRequiredDone,
    submitting,
    setActiveTab,
    submit,
  } = form

  const cover = imageUrls[0]

  const jump = (tab: TabKey) => () => {
    setActiveTab(tab)
    onOpenChange(false)
  }

  const missing = (v: string) => <span className="text-destructive">{v}</span>

  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Review"
      description={`${requiredDone} of ${requiredTotal} required steps done`}
      dismissLabel="Close"
      keepOpenOnSelect
      groups={[
        {
          actions: [
            {
              id: 'name',
              label: 'Name',
              value: sections.basics.complete ? name.trim() : missing('Not set'),
              onSelect: jump('basics'),
            },
            {
              id: 'price',
              label: 'Price',
              value:
                priceNum > 0 ? formatPrice(priceNum, currency) : missing('Not set'),
              onSelect: jump('pricing'),
            },
            {
              id: 'category',
              label: 'Category',
              value: categoryLabel ?? missing('Not set'),
              onSelect: jump('pricing'),
            },
            {
              id: 'stock',
              label: 'Stock',
              value: `${stockNum} units`,
              onSelect: jump('pricing'),
            },
            {
              id: 'photos',
              label: 'Photos',
              value: sections.media.complete
                ? `${imageUrls.length} ${imageUrls.length === 1 ? 'photo' : 'photos'}`
                : missing('None'),
              onSelect: jump('media'),
            },
            {
              id: 'tags',
              label: 'Tags',
              value: usageTags.length ? usageTags.join(', ') : 'None',
              onSelect: jump('discovery'),
            },
          ],
        },
      ]}
      footer={
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] text-foreground">
                {isActive ? 'Publish on create' : 'Save as a draft'}
              </span>
              <span className="block font-mono text-[10.5px] uppercase tracking-[0.1em] text-faint">
                {isActive ? 'Visible to customers immediately' : 'Only you can see it'}
              </span>
            </span>
            <Switch
              size="lg"
              checked={isActive}
              onCheckedChange={setIsActive}
              aria-label="Publish on create"
            />
          </div>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!allRequiredDone || submitting}
            className="flex h-[46px] w-full items-center justify-center gap-2 rounded-md bg-primary text-[14.5px] font-medium text-primary-foreground transition-opacity active:opacity-90 disabled:opacity-30"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create product'
            )}
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-3 border-b px-4 py-3.5">
        <span className="grid size-[60px] shrink-0 place-items-center overflow-hidden rounded-lg border bg-wash text-faint">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-5" />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15.5px] font-semibold tracking-[-0.015em] text-foreground">
            {name.trim() || 'Untitled product'}
          </span>
          <span className="text-[20px] font-medium tracking-[-0.025em] tabular-nums text-foreground">
            {formatPrice(priceNum, currency)}
          </span>
        </span>
      </div>
    </ActionSheet>
  )
}

/* ----------------------------------------------------------- primitives */

/** A label, a value, and the hairline beneath that carries the focus state. */
function RuleField({
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
    <div className="flex flex-col gap-1.5 border-b py-3.5 transition-colors focus-within:border-foreground">
      <div className="flex items-baseline gap-3">
        <label
          htmlFor={htmlFor}
          className="flex-1 font-mono text-[10px] uppercase tracking-[0.13em] text-faint"
        >
          {label}
        </label>
        {counter && (
          <span className="font-mono text-[10px] tabular-nums">{counter}</span>
        )}
      </div>
      {children}
      {hint && <p className="text-[12px] text-faint">{hint}</p>}
    </div>
  )
}

function ValueRow({
  label,
  value,
  unset,
  hint,
  onClick,
}: {
  label: string
  value: string
  unset?: boolean
  hint?: string
  onClick: () => void
}) {
  return (
    <div className="border-b">
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-[54px] w-full items-center gap-3 py-2 text-left transition-colors active:bg-wash"
      >
        <span className="min-w-0 flex-1 text-[14.5px] text-foreground">{label}</span>
        <span className={cn('shrink-0 text-[14px]', unset ? 'text-faint' : 'text-muted-foreground')}>
          {value}
        </span>
        <ChevronRight className="size-[15px] shrink-0 text-faint" />
      </button>
      {hint && <p className="-mt-1 pb-3 text-[12px] text-faint">{hint}</p>}
    </div>
  )
}

/** A value row that opens an editor beneath it, keeping the row grammar. */
function ExpandRow({
  label,
  value,
  unset,
  open,
  onToggle,
  children,
}: {
  label: string
  value: string
  unset?: boolean
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-[54px] w-full items-center gap-3 py-2 text-left transition-colors active:bg-wash"
      >
        <span className="min-w-0 flex-1 text-[14.5px] text-foreground">{label}</span>
        <span className={cn('shrink-0 text-[14px]', unset ? 'text-faint' : 'text-muted-foreground')}>
          {value}
        </span>
        <ChevronRight
          className={cn(
            'size-[15px] shrink-0 text-faint transition-transform duration-200',
            open && 'rotate-90'
          )}
        />
      </button>
      {/*
        `grid-template-rows: 0fr → 1fr` animates to the content's own height
        without measuring it, which max-height cannot do without a magic
        number that is either too small or eases from nothing.
      */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="pb-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

function UploadingTile({ progress }: { progress: number }) {
  return (
    <div className="relative grid aspect-square place-items-center rounded-lg border border-dashed border-input">
      <span className="font-mono text-[10px] tabular-nums text-faint">{progress}%</span>
      <span className="absolute inset-x-2 bottom-2 h-0.5 overflow-hidden bg-border">
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
      <div className="-mx-4 -mt-5 border-b sm:-mx-6">
        <div className="h-0.5 bg-border" />
        <div className="flex">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-1 justify-center pb-2.5 pt-3">
              <Skeleton className="h-2.5 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col pb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 border-b py-3.5">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        ))}
        <div className="flex items-center gap-3 border-b py-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="ml-auto h-4 w-14" />
        </div>
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
      <span className="grid size-11 place-items-center rounded-lg border border-destructive/30 text-destructive">
        <Package className="size-5" />
      </span>
      <p className="text-[15px] font-semibold text-foreground">Unable to open this page</p>
      <p className="max-w-[34ch] text-[13px] text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onBack}
        className="mt-2 h-10 rounded-md border border-input px-4 text-[13.5px] font-medium transition-colors active:bg-wash"
      >
        Back to products
      </button>
    </main>
  )
}
