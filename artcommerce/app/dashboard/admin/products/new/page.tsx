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
  Check,
  Circle,
  GripVertical,
  ImageIcon,
  ImagePlus,
  Loader2,
  Package,
  Plus,
  Save,
  Sparkles,
  Tag,
  UploadCloud,
  X,
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

  const requiredDone = (Object.values(sections).filter((s) => s.required && s.complete).length)
  const requiredTotal = Object.values(sections).filter((s) => s.required).length
  const allRequiredDone = requiredDone === requiredTotal
  const progressPct = Math.round((requiredDone / requiredTotal) * 100)

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !slug.trim()) {
      showNotice('error', 'Name and slug are required.')
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

  return (
    <main className="flex flex-col gap-6 pb-10">
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
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
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

      {/* Live preview strip */}
      <PreviewStrip
        name={name}
        cover={imageUrls[0]}
        priceFormatted={formatPrice(priceNum, currency)}
        categoryLabel={categoryLabel}
        stock={stockNum}
        isActive={isActive}
        tagCount={usageTags.length}
      />

      <form id="new-product-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* 01 — Basics */}
        <Section
          step={1}
          title="Basics"
          description="The information shoppers see first on the storefront."
          complete={sections.basics.complete}
          required
        >
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

          <Separator />

          <div className="grid gap-1.5">
            <Label htmlFor="np-desc">Full description</Label>
            <Textarea
              id="np-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the story behind this piece…"
              className="min-h-[120px]"
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
                className="min-h-[100px]"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="np-care">Care &amp; maintenance</Label>
              <Textarea
                id="np-care"
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
                placeholder="How to keep it looking its best"
                className="min-h-[100px]"
              />
            </div>
          </div>
        </Section>

        {/* 02 — Pricing & inventory */}
        <Section
          step={2}
          title="Pricing & inventory"
          description="How this product is sold and how many you can ship."
          complete={sections.pricing.complete}
          required
        >
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
                Displayed as <span className="font-medium text-foreground">{formatPrice(priceNum, currency)}</span>
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
          </div>
        </Section>

        {/* 03 — Media */}
        <Section
          step={3}
          title="Media"
          description="At least one image is required. The first image is used as the cover."
          complete={sections.media.complete}
          required
          badge={
            <Badge variant="secondary" className="rounded-full">
              {imageUrls.length}/{MAX_IMAGES} images
            </Badge>
          }
        >
          <div
            {...getProductRootProps()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-4 py-10 text-center transition-colors',
              isProductDrag && 'border-primary bg-primary/5',
              imageUrls.length >= MAX_IMAGES && 'cursor-not-allowed opacity-60'
            )}
          >
            <input {...getProductInputProps()} />
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm">
              <UploadCloud className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-foreground">
              {imageUrls.length >= MAX_IMAGES
                ? 'Image limit reached'
                : isProductDrag
                ? 'Drop images to upload'
                : 'Drag product images here, or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WEBP &middot; up to 20MB each
            </p>
          </div>

          {(imageUrls.length > 0 || productUploadIds.length > 0) && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
                  <img src={url} alt={`Product image ${i + 1}`} className="h-full w-full object-cover" />
                  {i === 0 && (
                    <Badge className="absolute left-1.5 top-1.5 h-5 rounded-full px-1.5 text-[10px]">
                      Cover
                    </Badge>
                  )}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </span>
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-destructive opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground focus:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {productUploadIds.map((id) => (
                <UploadingTile key={id} progress={uploadingProduct[id] ?? 0} />
              ))}
            </div>
          )}

          <Separator />

          {/* Styling ideas — kept as a sub-section, not a separate card */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Styling ideas</span>
                <span className="text-xs text-muted-foreground">
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
                'flex cursor-pointer items-center gap-3 rounded-md border border-dashed bg-muted/20 px-4 py-4 transition-colors',
                isStylingDrag && 'border-primary bg-primary/5'
              )}
            >
              <input {...getStylingInputProps()} />
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground shadow-sm">
                <ImagePlus className="h-4 w-4" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {isStylingDrag ? 'Drop styling images' : 'Add styling inspiration images'}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Drag or click · captions optional · up to 20MB each
                </span>
              </div>
            </div>

            {(stylingIdeas.length > 0 || stylingUploadIds.length > 0) && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stylingIdeas.map((idea, idx) => (
                  <div key={idea.url} className="flex flex-col gap-2 rounded-md border bg-card p-2">
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
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
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
                      className="h-8"
                    />
                  </div>
                ))}
                {stylingUploadIds.map((id) => (
                  <UploadingTile key={id} progress={uploadingStyling[id] ?? 0} />
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* 04 — Discovery */}
        <Section
          step={4}
          title="Discovery"
          description="Tags help shoppers find this piece by mood or occasion."
          complete={sections.discovery.complete}
        >
          {usageTags.length > 0 && (
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
          )}

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

          {availableTags.filter((t) => !usageTags.includes(t)).length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Suggestions</span>
              <div className="flex flex-wrap gap-1.5">
                {availableTags
                  .filter((t) => !usageTags.includes(t))
                  .map((tag) => (
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
        </Section>
      </form>
    </main>
  )
}

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

function PreviewStrip({
  name,
  cover,
  priceFormatted,
  categoryLabel,
  stock,
  isActive,
  tagCount,
}: {
  name: string
  cover?: string
  priceFormatted: string
  categoryLabel: string | null
  stock: number
  isActive: boolean
  tagCount: number
}) {
  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40 sm:h-24 sm:w-24">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={name || 'Cover'} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-base font-semibold text-foreground sm:text-lg">
              {name.trim() || 'Untitled product'}
            </span>
            <Badge
              variant="outline"
              className={cn(
                'rounded-full text-[10px]',
                isActive
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'text-muted-foreground'
              )}
            >
              {isActive ? 'Visible' : 'Draft'}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium tabular-nums text-foreground">
              <Sparkles className="h-3 w-3 text-muted-foreground" />
              {priceFormatted}
            </span>
            <span className="text-border">•</span>
            <span className="inline-flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {categoryLabel ?? 'No category'}
            </span>
            <span className="text-border">•</span>
            <span className="inline-flex items-center gap-1">
              <Package className="h-3 w-3" />
              {stock > 0 ? `${stock} in stock` : 'No stock set'}
            </span>
            {tagCount > 0 && (
              <>
                <span className="text-border">•</span>
                <span>{tagCount} tag{tagCount === 1 ? '' : 's'}</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Live preview — this is roughly how the product will appear in admin lists.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function Section({
  step,
  title,
  description,
  complete,
  required,
  badge,
  children,
}: {
  step: number
  title: string
  description: string
  complete: boolean
  required?: boolean
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card id={`section-${step}`} className="shadow-sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
              complete
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-border bg-muted/40 text-muted-foreground'
            )}
            aria-hidden
          >
            {complete ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">
                <span className="text-muted-foreground">0{step} —</span> {title}
              </CardTitle>
              {required && !complete && (
                <Badge variant="outline" className="rounded-full text-[10px] text-muted-foreground">
                  Required
                </Badge>
              )}
              {badge}
            </div>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
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
    <main className="flex flex-col gap-6 pb-10">
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

      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <Skeleton className="h-24 w-24 rounded-md" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-72" />
            <Skeleton className="h-3 w-40" />
          </div>
        </CardContent>
      </Card>

      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="shadow-sm">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Skeleton className="h-7 w-7 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3.5 w-72" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ))}
    </main>
  )
}
