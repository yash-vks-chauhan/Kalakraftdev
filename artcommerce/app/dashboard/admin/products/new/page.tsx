// File: app/dashboard/admin/products/new/page.tsx

'use client'

import { useState, FormEvent, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  DollarSign,
  FileText,
  GripVertical,
  ImageIcon,
  ImagePlus,
  Loader2,
  Package,
  Plus,
  Save,
  Sparkles,
  Tag,
  Tags,
  UploadCloud,
  X,
} from 'lucide-react'

import { useAuth } from '../../../../contexts/AuthContext'
import { SegmentedControl, SegmentedControlItem } from '../../../_components/SegmentedControl'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

const MAX_IMAGES = 5
const MAX_FILE_BYTES = 20 * 1024 * 1024
const SHORT_DESC_IDEAL = { min: 50, max: 160 } as const

type TabKey = 'basics' | 'pricing' | 'media' | 'discovery'

const TAB_ORDER: TabKey[] = ['basics', 'pricing', 'media', 'discovery']

interface Category {
  id: number
  name: string
}

interface StylingIdea {
  url: string
  text: string
}

export default function NewProductPage() {
  const { token, user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [bootstrapping, setBootstrapping] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('basics')

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [shortDesc, setShortDesc] = useState('')
  const [description, setDescription] = useState('')
  const [specifications, setSpecifications] = useState('')
  const [careInstructions, setCareInstructions] = useState('')
  const [price, setPrice] = useState<string>('')
  const [currency, setCurrency] = useState('INR')
  const [stockQuantity, setStockQuantity] = useState<string>('')
  const [isActive, setIsActive] = useState(true)
  const [categoryId, setCategoryId] = useState<string>('')

  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [stylingIdeas, setStylingIdeas] = useState<StylingIdea[]>([])
  const [uploadingProduct, setUploadingProduct] = useState<Record<string, number>>({})
  const [uploadingStyling, setUploadingStyling] = useState<Record<string, number>>({})

  const [categories, setCategories] = useState<Category[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [usageTags, setUsageTags] = useState<string[]>([])
  const [newTagInput, setNewTagInput] = useState('')

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth/login')
      return
    }
    if (user.role !== 'admin') {
      setError('You are not authorized to access this page.')
      setBootstrapping(false)
      return
    }
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/products/usage-tags').then((r) => r.json()),
    ])
      .then(([catJson, tagJson]) => {
        setCategories(catJson?.categories ?? [])
        if (Array.isArray(tagJson?.tags)) setAvailableTags(tagJson.tags)
      })
      .catch(() => setError('Failed to load categories.'))
      .finally(() => setBootstrapping(false))
  }, [authLoading, user, router])

  useEffect(() => {
    if (slugTouched) return
    const auto = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
    setSlug(auto)
  }, [name, slugTouched])

  const showNotice = useCallback((tone: 'success' | 'error', text: string) => {
    if (tone === 'success') toast.success(text)
    else toast.error(text)
  }, [])

  const reorderImages = (from: number, to: number) => {
    setImageUrls((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  const uploadFile = useCallback(
    async (
      file: File,
      folder: 'products' | 'styling',
      setProgress: React.Dispatch<React.SetStateAction<Record<string, number>>>
    ): Promise<{ url: string }> => {
      const uploadId = `${folder}-${file.name}-${Date.now()}`
      setProgress((prev) => ({ ...prev, [uploadId]: 0 }))
      try {
        const result = await new Promise<{ url: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress((prev) => ({
                ...prev,
                [uploadId]: Math.round((e.loaded * 100) / e.total),
              }))
            }
          }
          xhr.open(
            'POST',
            `/api/uploads/imagekit?filename=${encodeURIComponent(file.name)}&folder=${folder}`,
            true
          )
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText))
              } catch {
                reject(new Error('Invalid upload response'))
              }
            } else {
              reject(new Error(`Upload failed (${xhr.status})`))
            }
          }
          xhr.onerror = () => reject(new Error('Network error during upload'))
          xhr.ontimeout = () => reject(new Error('Upload timed out'))
          xhr.send(file)
        })
        return result
      } finally {
        setProgress((prev) => {
          const next = { ...prev }
          delete next[uploadId]
          return next
        })
      }
    },
    [token]
  )

  const onDropProduct = useCallback(
    async (accepted: File[]) => {
      const slotsLeft = MAX_IMAGES - imageUrls.length
      if (accepted.length > slotsLeft) {
        showNotice('error', `You can only add ${slotsLeft} more image${slotsLeft === 1 ? '' : 's'}.`)
        return
      }
      for (const file of accepted) {
        if (file.size > MAX_FILE_BYTES) {
          showNotice('error', `${file.name} exceeds the 20MB limit.`)
          continue
        }
        try {
          const { url } = await uploadFile(file, 'products', setUploadingProduct)
          setImageUrls((prev) => [...prev, url])
        } catch (err: any) {
          showNotice('error', `Failed to upload ${file.name}: ${err.message}`)
        }
      }
    },
    [imageUrls.length, showNotice, uploadFile]
  )

  const onDropStyling = useCallback(
    async (accepted: File[]) => {
      for (const file of accepted) {
        if (file.size > MAX_FILE_BYTES) {
          showNotice('error', `${file.name} exceeds the 20MB limit.`)
          continue
        }
        try {
          const { url } = await uploadFile(file, 'styling', setUploadingStyling)
          setStylingIdeas((prev) => [...prev, { url, text: '' }])
        } catch (err: any) {
          showNotice('error', `Failed to upload ${file.name}: ${err.message}`)
        }
      }
    },
    [showNotice, uploadFile]
  )

  const {
    getRootProps: getProductRootProps,
    getInputProps: getProductInputProps,
    isDragActive: isProductDrag,
  } = useDropzone({
    onDrop: onDropProduct,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxFiles: MAX_IMAGES - imageUrls.length,
    maxSize: MAX_FILE_BYTES,
    multiple: true,
    disabled: imageUrls.length >= MAX_IMAGES,
  })

  const {
    getRootProps: getStylingRootProps,
    getInputProps: getStylingInputProps,
    isDragActive: isStylingDrag,
  } = useDropzone({
    onDrop: onDropStyling,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxSize: MAX_FILE_BYTES,
    multiple: true,
  })

  function addTag(raw: string) {
    const val = raw.trim()
    if (!val) return
    setUsageTags((prev) => (prev.includes(val) ? prev : [...prev, val]))
    setAvailableTags((prev) => (prev.includes(val) ? prev : [...prev, val]))
    setNewTagInput('')
  }

  // ── Derived: section completion & overall progress ───────────────────────
  const priceNum = parseFloat(price || '0')
  const stockNum = parseInt(stockQuantity || '0', 10)
  const numericCategoryId = categoryId ? Number(categoryId) : null
  const categoryLabel = useMemo(
    () => categories.find((c) => c.id === numericCategoryId)?.name ?? null,
    [categories, numericCategoryId]
  )

  const sections = useMemo(
    () => ({
      basics: {
        complete: name.trim().length > 0 && slug.trim().length > 0,
        required: true,
      },
      pricing: {
        complete: priceNum > 0 && numericCategoryId != null,
        required: true,
      },
      media: {
        complete: imageUrls.length > 0,
        required: true,
      },
      discovery: {
        complete: usageTags.length > 0,
        required: false,
      },
    }),
    [name, slug, priceNum, numericCategoryId, imageUrls.length, usageTags.length]
  )

  const requiredDone = Object.values(sections).filter((s) => s.required && s.complete).length
  const requiredTotal = Object.values(sections).filter((s) => s.required).length
  const allRequiredDone = requiredDone === requiredTotal
  const progressPct = Math.round((requiredDone / requiredTotal) * 100)

  const activeIndex = TAB_ORDER.indexOf(activeTab)
  const isFirstTab = activeIndex === 0
  const isLastTab = activeIndex === TAB_ORDER.length - 1
  const goPrevTab = () =>
    setActiveTab(TAB_ORDER[Math.max(0, activeIndex - 1)])
  const goNextTab = () =>
    setActiveTab(TAB_ORDER[Math.min(TAB_ORDER.length - 1, activeIndex + 1)])

  const tabMeta: Record<
    TabKey,
    { label: string; icon: typeof FileText; description: string; required: boolean }
  > = {
    basics: {
      label: 'Basics',
      icon: FileText,
      description: 'The information shoppers see first on the storefront.',
      required: true,
    },
    pricing: {
      label: 'Pricing',
      icon: DollarSign,
      description: 'How this product is sold and how many you can ship.',
      required: true,
    },
    media: {
      label: 'Media',
      icon: ImageIcon,
      description: 'Cover image, gallery, and optional styling references.',
      required: true,
    },
    discovery: {
      label: 'Discovery',
      icon: Tags,
      description: 'Tags help shoppers find this piece by mood or occasion.',
      required: false,
    },
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !slug.trim()) {
      showNotice('error', 'Name and slug are required.')
      setActiveTab('basics')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          shortDesc,
          description,
          specifications,
          careInstructions,
          stylingIdeaImages: stylingIdeas,
          price: priceNum,
          currency,
          stockQuantity: stockNum,
          isActive,
          categoryId: numericCategoryId,
          imageUrls,
          usageTags,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create product')
      }
      showNotice('success', 'Product created successfully.')
      setTimeout(() => router.push('/dashboard/admin/products'), 800)
    } catch (err: any) {
      showNotice('error', err.message)
      setSubmitting(false)
    }
  }

  if (bootstrapping) return <NewProductSkeleton />

  if (error) {
    return (
      <main className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Create product</h1>
        </header>
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-foreground">Unable to open this page</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/admin/products">Back to products</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  const productUploadIds = Object.keys(uploadingProduct)
  const stylingUploadIds = Object.keys(uploadingStyling)
  const shortDescLen = shortDesc.length
  const shortDescTone =
    shortDescLen === 0
      ? 'muted'
      : shortDescLen < SHORT_DESC_IDEAL.min
      ? 'amber'
      : shortDescLen <= SHORT_DESC_IDEAL.max
      ? 'emerald'
      : 'amber'

  // SegmentedControl items: icon swaps to a check when complete
  const tabItems: SegmentedControlItem<TabKey>[] = TAB_ORDER.map((key) => {
    const meta = tabMeta[key]
    const done = sections[key].complete
    return {
      key,
      label: meta.label,
      icon: done ? CheckCircle2 : meta.icon,
    }
  })

  return (
    <main className="flex flex-col gap-4 pb-6">
      {/* Sticky command bar */}
      <div className="sticky top-0 z-30 -mx-4 -mt-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:-mt-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              href="/dashboard/admin/products"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All products
            </Link>
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {name.trim() || 'Untitled product'}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ProgressChip
              percent={progressPct}
              done={requiredDone}
              total={requiredTotal}
            />
            <div className="hidden h-8 items-center gap-2 rounded-md border bg-card px-2.5 sm:flex">
              <Switch
                id="np-active-bar"
                size="sm"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="np-active-bar" className="cursor-pointer text-xs text-muted-foreground">
                {isActive ? 'Visible' : 'Draft'}
              </Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/admin/products')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="new-product-form"
              size="sm"
              disabled={submitting || !allRequiredDone}
              className="gap-1.5"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {submitting ? 'Saving…' : 'Create product'}
            </Button>
          </div>
        </div>
      </div>

      {/* Two-column workspace */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* LEFT — tabbed form */}
        <form
          id="new-product-form"
          onSubmit={handleSubmit}
          className="min-w-0"
        >
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="gap-3 p-4 sm:p-5">
              <SegmentedControl<TabKey>
                ariaLabel="Form sections"
                value={activeTab}
                onChange={setActiveTab}
                items={tabItems}
              />
              <div className="flex flex-wrap items-baseline gap-2">
                <CardTitle className="text-base">
                  {tabMeta[activeTab].label}
                </CardTitle>
                {tabMeta[activeTab].required && !sections[activeTab].complete && (
                  <Badge
                    variant="outline"
                    className="rounded-full text-[10px] text-muted-foreground"
                  >
                    Required
                  </Badge>
                )}
                {sections[activeTab].complete && (
                  <Badge
                    variant="outline"
                    className="gap-1 rounded-full border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Complete
                  </Badge>
                )}
              </div>
              <CardDescription>{tabMeta[activeTab].description}</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 p-4 pt-0 sm:p-5 sm:pt-0">
              {activeTab === 'basics' && (
                <BasicsFields
                  name={name}
                  setName={setName}
                  slug={slug}
                  setSlug={setSlug}
                  setSlugTouched={setSlugTouched}
                  shortDesc={shortDesc}
                  setShortDesc={setShortDesc}
                  shortDescLen={shortDescLen}
                  shortDescTone={shortDescTone}
                  description={description}
                  setDescription={setDescription}
                  specifications={specifications}
                  setSpecifications={setSpecifications}
                  careInstructions={careInstructions}
                  setCareInstructions={setCareInstructions}
                />
              )}

              {activeTab === 'pricing' && (
                <PricingFields
                  price={price}
                  setPrice={setPrice}
                  currency={currency}
                  setCurrency={setCurrency}
                  priceNum={priceNum}
                  stockQuantity={stockQuantity}
                  setStockQuantity={setStockQuantity}
                  stockNum={stockNum}
                  categoryId={categoryId}
                  setCategoryId={setCategoryId}
                  categories={categories}
                />
              )}

              {activeTab === 'media' && (
                <MediaFields
                  imageUrls={imageUrls}
                  setImageUrls={setImageUrls}
                  stylingIdeas={stylingIdeas}
                  setStylingIdeas={setStylingIdeas}
                  uploadingProduct={uploadingProduct}
                  uploadingStyling={uploadingStyling}
                  productUploadIds={productUploadIds}
                  stylingUploadIds={stylingUploadIds}
                  getProductRootProps={getProductRootProps}
                  getProductInputProps={getProductInputProps}
                  isProductDrag={isProductDrag}
                  getStylingRootProps={getStylingRootProps}
                  getStylingInputProps={getStylingInputProps}
                  isStylingDrag={isStylingDrag}
                  draggingIndex={draggingIndex}
                  setDraggingIndex={setDraggingIndex}
                  reorderImages={reorderImages}
                />
              )}

              {activeTab === 'discovery' && (
                <DiscoveryFields
                  usageTags={usageTags}
                  setUsageTags={setUsageTags}
                  availableTags={availableTags}
                  newTagInput={newTagInput}
                  setNewTagInput={setNewTagInput}
                  addTag={addTag}
                />
              )}
            </CardContent>

            <Separator />

            <div className="flex items-center justify-between gap-2 p-3 sm:p-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={goPrevTab}
                disabled={isFirstTab}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {isFirstTab ? 'Previous' : tabMeta[TAB_ORDER[activeIndex - 1]].label}
              </Button>
              {!isLastTab ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={goNextTab}
                  className="gap-1.5"
                >
                  {tabMeta[TAB_ORDER[activeIndex + 1]].label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || !allRequiredDone}
                  className="gap-1.5"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Create product
                </Button>
              )}
            </div>
          </Card>
        </form>

        {/* RIGHT — sticky live preview + checklist */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-16 lg:self-start">
          <PreviewCard
            name={name}
            cover={imageUrls[0]}
            priceFormatted={formatPrice(priceNum, currency)}
            categoryLabel={categoryLabel}
            stock={stockNum}
            isActive={isActive}
            tagCount={usageTags.length}
            shortDesc={shortDesc}
          />

          <ChecklistCard
            sections={sections}
            tabMeta={tabMeta}
            activeTab={activeTab}
            onJump={setActiveTab}
          />
        </aside>
      </div>
    </main>
  )
}

/* -------------------------------------------------------------- */
/* TAB CONTENTS                                                    */
/* -------------------------------------------------------------- */

function BasicsFields({
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
}: {
  name: string
  setName: (v: string) => void
  slug: string
  setSlug: (v: string) => void
  setSlugTouched: (v: boolean) => void
  shortDesc: string
  setShortDesc: (v: string) => void
  shortDescLen: number
  shortDescTone: 'muted' | 'amber' | 'emerald'
  description: string
  setDescription: (v: string) => void
  specifications: string
  setSpecifications: (v: string) => void
  careInstructions: string
  setCareInstructions: (v: string) => void
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="np-name">Product name</Label>
          <Input
            id="np-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Hand-painted ceramic vase"
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="np-slug">URL slug</Label>
          <div className="flex items-center rounded-md border bg-muted/30 pl-3 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
            <span className="select-none text-xs text-muted-foreground">/products/</span>
            <Input
              id="np-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
              placeholder="hand-painted-ceramic-vase"
              required
              className="border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="np-short">Short description</Label>
          <span
            className={cn(
              'text-[11px] tabular-nums',
              shortDescTone === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
              shortDescTone === 'amber' && 'text-amber-600 dark:text-amber-400',
              shortDescTone === 'muted' && 'text-muted-foreground'
            )}
          >
            {shortDescLen}/{SHORT_DESC_IDEAL.max}{' '}
            {shortDescTone === 'emerald'
              ? '· ideal for SEO'
              : shortDescLen > 0 && shortDescTone === 'amber'
              ? shortDescLen < SHORT_DESC_IDEAL.min
                ? '· a bit short'
                : '· a bit long'
              : ''}
          </span>
        </div>
        <Input
          id="np-short"
          value={shortDesc}
          onChange={(e) => setShortDesc(e.target.value)}
          placeholder="One-line summary used in product cards"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="np-desc">Full description</Label>
        <Textarea
          id="np-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell the story behind this piece…"
          className="min-h-[110px]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="np-spec">Specifications</Label>
          <Textarea
            id="np-spec"
            value={specifications}
            onChange={(e) => setSpecifications(e.target.value)}
            placeholder="Material, dimensions, weight…"
            className="min-h-[88px]"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="np-care">Care &amp; maintenance</Label>
          <Textarea
            id="np-care"
            value={careInstructions}
            onChange={(e) => setCareInstructions(e.target.value)}
            placeholder="How to keep it looking its best"
            className="min-h-[88px]"
          />
        </div>
      </div>
    </>
  )
}

function PricingFields({
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
}: {
  price: string
  setPrice: (v: string) => void
  currency: string
  setCurrency: (v: string) => void
  priceNum: number
  stockQuantity: string
  setStockQuantity: (v: string) => void
  stockNum: number
  categoryId: string
  setCategoryId: (v: string) => void
  categories: Category[]
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="np-price">Price</Label>
          <div className="flex items-stretch rounded-md border focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-9 w-[88px] border-0 border-r bg-muted/40 px-2.5 text-xs shadow-none focus-visible:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR ₹</SelectItem>
                <SelectItem value="USD">USD $</SelectItem>
                <SelectItem value="EUR">EUR €</SelectItem>
              </SelectContent>
            </Select>
            <Input
              id="np-price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Displayed as{' '}
            <span className="font-medium text-foreground">
              {formatPrice(priceNum, currency)}
            </span>
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="np-stock">Stock quantity</Label>
          <Input
            id="np-stock"
            type="number"
            inputMode="numeric"
            min="0"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            placeholder="0"
          />
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                'inline-flex h-2 w-2 rounded-full',
                stockNum === 0
                  ? 'bg-destructive'
                  : stockNum <= 5
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              )}
            />
            <span className="text-muted-foreground">
              {stockNum === 0
                ? 'Out of stock'
                : stockNum <= 5
                ? `${stockNum} left · low stock`
                : `${stockNum} units in stock`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="np-category">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="np-category" className="w-full">
            <SelectValue placeholder="Pick the best fit" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Category drives storefront filtering and analytics roll-ups.
        </p>
      </div>
    </>
  )
}

function MediaFields({
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
  isProductDrag,
  getStylingRootProps,
  getStylingInputProps,
  isStylingDrag,
  draggingIndex,
  setDraggingIndex,
  reorderImages,
}: {
  imageUrls: string[]
  setImageUrls: React.Dispatch<React.SetStateAction<string[]>>
  stylingIdeas: StylingIdea[]
  setStylingIdeas: React.Dispatch<React.SetStateAction<StylingIdea[]>>
  uploadingProduct: Record<string, number>
  uploadingStyling: Record<string, number>
  productUploadIds: string[]
  stylingUploadIds: string[]
  getProductRootProps: ReturnType<typeof useDropzone>['getRootProps']
  getProductInputProps: ReturnType<typeof useDropzone>['getInputProps']
  isProductDrag: boolean
  getStylingRootProps: ReturnType<typeof useDropzone>['getRootProps']
  getStylingInputProps: ReturnType<typeof useDropzone>['getInputProps']
  isStylingDrag: boolean
  draggingIndex: number | null
  setDraggingIndex: (i: number | null) => void
  reorderImages: (from: number, to: number) => void
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">Product images</span>
        <Badge variant="secondary" className="rounded-full">
          {imageUrls.length}/{MAX_IMAGES}
        </Badge>
      </div>

      <div
        {...getProductRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed bg-muted/30 px-4 py-6 text-center transition-colors',
          isProductDrag && 'border-primary bg-primary/5',
          imageUrls.length >= MAX_IMAGES && 'cursor-not-allowed opacity-60'
        )}
      >
        <input {...getProductInputProps()} />
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm">
          <UploadCloud className="h-4 w-4" />
        </span>
        <p className="text-sm font-medium text-foreground">
          {imageUrls.length >= MAX_IMAGES
            ? 'Image limit reached'
            : isProductDrag
            ? 'Drop images to upload'
            : 'Drag product images here, or click to browse'}
        </p>
        <p className="text-[11px] text-muted-foreground">
          JPG, PNG, WEBP · up to 20MB each · first image is the cover
        </p>
      </div>

      {(imageUrls.length > 0 || productUploadIds.length > 0) && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {imageUrls.map((url, i) => (
            <div
              key={url}
              draggable
              onDragStart={() => setDraggingIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={() => setDraggingIndex(null)}
              onDrop={() => {
                if (draggingIndex !== null && draggingIndex !== i) {
                  reorderImages(draggingIndex, i)
                }
                setDraggingIndex(null)
              }}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-md border bg-muted',
                draggingIndex === i && 'opacity-60'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Product image ${i + 1}`}
                className="h-full w-full object-cover"
              />
              {i === 0 && (
                <Badge className="absolute left-1 top-1 h-4 rounded-full px-1.5 text-[10px]">
                  Cover
                </Badge>
              )}
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
              >
                <GripVertical className="h-3 w-3" />
              </span>
              <button
                type="button"
                aria-label="Remove image"
                onClick={() =>
                  setImageUrls((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-destructive opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground focus:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {productUploadIds.map((id) => (
            <UploadingTile key={id} progress={uploadingProduct[id] ?? 0} />
          ))}
        </div>
      )}

      <Separator />

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">Styling ideas</span>
            <span className="text-[11px] text-muted-foreground">
              Optional inspiration images shown alongside the product.
            </span>
          </div>
          {stylingIdeas.length > 0 && (
            <Badge variant="outline" className="rounded-full text-xs">
              {stylingIdeas.length} added
            </Badge>
          )}
        </div>

        <div
          {...getStylingRootProps()}
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-md border border-dashed bg-muted/20 px-3 py-3 transition-colors',
            isStylingDrag && 'border-primary bg-primary/5'
          )}
        >
          <input {...getStylingInputProps()} />
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground shadow-sm">
            <ImagePlus className="h-4 w-4" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {isStylingDrag ? 'Drop styling images' : 'Add styling inspiration images'}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              Drag or click · captions optional · up to 20MB each
            </span>
          </div>
        </div>

        {(stylingIdeas.length > 0 || stylingUploadIds.length > 0) && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {stylingIdeas.map((idea, idx) => (
              <div key={idea.url} className="flex flex-col gap-1.5 rounded-md border bg-card p-1.5">
                <div className="relative aspect-square overflow-hidden rounded-sm bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={idea.url}
                    alt="Styling idea"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    aria-label="Remove styling image"
                    onClick={() =>
                      setStylingIdeas((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
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
                  className="h-7 text-xs"
                />
              </div>
            ))}
            {stylingUploadIds.map((id) => (
              <UploadingTile key={id} progress={uploadingStyling[id] ?? 0} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function DiscoveryFields({
  usageTags,
  setUsageTags,
  availableTags,
  newTagInput,
  setNewTagInput,
  addTag,
}: {
  usageTags: string[]
  setUsageTags: React.Dispatch<React.SetStateAction<string[]>>
  availableTags: string[]
  newTagInput: string
  setNewTagInput: (v: string) => void
  addTag: (raw: string) => void
}) {
  const suggestions = availableTags.filter((t) => !usageTags.includes(t))
  return (
    <>
      <div className="flex gap-2">
        <Input
          value={newTagInput}
          onChange={(e) => setNewTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag(newTagInput)
            }
          }}
          placeholder="Add a tag and press Enter"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => addTag(newTagInput)}
          disabled={!newTagInput.trim()}
          aria-label="Add tag"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {usageTags.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Selected</span>
          <div className="flex flex-wrap gap-1.5">
            {usageTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 rounded-full pl-2.5 pr-1"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  onClick={() => setUsageTags((prev) => prev.filter((t) => t !== tag))}
                  className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-foreground/10"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Suggestions</span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setUsageTags((prev) => [...prev, tag])}
                className="rounded-full border border-dashed border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {usageTags.length === 0 && suggestions.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No tags yet. Add a few to help shoppers discover this piece.
        </p>
      )}
    </>
  )
}

/* -------------------------------------------------------------- */
/* SIDE PANEL: PREVIEW + CHECKLIST                                 */
/* -------------------------------------------------------------- */

function PreviewCard({
  name,
  cover,
  priceFormatted,
  categoryLabel,
  stock,
  isActive,
  tagCount,
  shortDesc,
}: {
  name: string
  cover?: string
  priceFormatted: string
  categoryLabel: string | null
  stock: number
  isActive: boolean
  tagCount: number
  shortDesc: string
}) {
  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="gap-1 p-4 pb-2">
        <CardTitle className="text-sm">Live preview</CardTitle>
        <CardDescription className="text-xs">
          How this product reads while you build it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4 pt-0">
        <div className="aspect-square w-full overflow-hidden rounded-md border bg-muted/40">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={name || 'Cover'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
              <span className="text-[11px]">No cover yet</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <span className="line-clamp-2 text-sm font-semibold text-foreground">
              {name.trim() || 'Untitled product'}
            </span>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 rounded-full text-[10px]',
                isActive
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'text-muted-foreground'
              )}
            >
              {isActive ? 'Visible' : 'Draft'}
            </Badge>
          </div>

          {shortDesc.trim() && (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {shortDesc}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            {priceFormatted}
          </div>

          <Separator className="my-1" />

          <dl className="flex flex-col gap-1.5 text-xs">
            <PreviewMetaRow icon={Tag} label="Category">
              {categoryLabel ?? <span className="text-muted-foreground">Not set</span>}
            </PreviewMetaRow>
            <PreviewMetaRow icon={Package} label="Stock">
              {stock > 0 ? `${stock} units` : <span className="text-muted-foreground">Not set</span>}
            </PreviewMetaRow>
            <PreviewMetaRow icon={Tags} label="Tags">
              {tagCount > 0 ? `${tagCount} tag${tagCount === 1 ? '' : 's'}` : <span className="text-muted-foreground">None</span>}
            </PreviewMetaRow>
          </dl>
        </div>
      </CardContent>
    </Card>
  )
}

function PreviewMetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Tag
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </dt>
      <dd className="truncate text-right text-foreground">{children}</dd>
    </div>
  )
}

function ChecklistCard({
  sections,
  tabMeta,
  activeTab,
  onJump,
}: {
  sections: Record<TabKey, { complete: boolean; required: boolean }>
  tabMeta: Record<TabKey, { label: string; icon: typeof FileText; description: string; required: boolean }>
  activeTab: TabKey
  onJump: (k: TabKey) => void
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="gap-1 p-4 pb-2">
        <CardTitle className="text-sm">Checklist</CardTitle>
        <CardDescription className="text-xs">
          Jump to any section to keep editing.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 p-2 pt-1">
        {TAB_ORDER.map((key) => {
          const meta = tabMeta[key]
          const done = sections[key].complete
          const isActive = activeTab === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onJump(key)}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/60'
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                  done
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-border bg-muted/40 text-muted-foreground'
                )}
              >
                {done ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5" />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-medium text-foreground">
                  {meta.label}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {done ? 'Done' : meta.required ? 'Required' : 'Optional'}
                </span>
              </span>
              <ArrowRight
                className={cn(
                  'h-3.5 w-3.5 shrink-0 transition-opacity',
                  isActive ? 'opacity-100 text-foreground' : 'opacity-0'
                )}
              />
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------- */
/* SMALL HELPERS                                                   */
/* -------------------------------------------------------------- */

function formatPrice(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(value || 0)
  } catch {
    return `${currency} ${(value || 0).toFixed(2)}`
  }
}

function ProgressChip({
  percent,
  done,
  total,
}: {
  percent: number
  done: number
  total: number
}) {
  const isComplete = percent >= 100
  return (
    <div
      className={cn(
        'flex h-8 items-center gap-2 rounded-full border px-3 text-xs',
        isComplete
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          : 'border-border bg-card text-muted-foreground'
      )}
      title={isComplete ? 'Ready to create' : `${done} of ${total} required steps complete`}
    >
      <span className="relative h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <span
          className={cn(
            'absolute inset-y-0 left-0 transition-all',
            isComplete ? 'bg-emerald-500' : 'bg-primary'
          )}
          style={{ width: `${percent}%` }}
        />
      </span>
      <span className="font-medium tabular-nums">
        {isComplete ? 'Ready' : `${done}/${total}`}
      </span>
    </div>
  )
}

function UploadingTile({ progress }: { progress: number }) {
  return (
    <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/40 p-3 text-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{progress}%</span>
    </div>
  )
}

function NewProductSkeleton() {
  return (
    <main className="flex flex-col gap-4 pb-6">
      <div className="-mx-4 -mt-4 border-b bg-background/80 px-4 py-3 sm:-mx-6 sm:-mt-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-44" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="shadow-sm">
          <CardHeader className="gap-3 p-4 sm:p-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3.5 w-72" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-4 pt-0 sm:p-5 sm:pt-0">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4">
              <Skeleton className="aspect-square w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="flex flex-col gap-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
