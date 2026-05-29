// File: app/dashboard/admin/products/new/page.tsx

'use client'

import { useState, FormEvent, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  X,
  GripVertical,
  Loader2,
  ImagePlus,
  Plus,
  Save,
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
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

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

  useEffect(() => {
    if (!notice) return
    const t = window.setTimeout(() => setNotice(null), 4000)
    return () => window.clearTimeout(t)
  }, [notice])

  const showNotice = useCallback((tone: 'success' | 'error', text: string) => {
    setNotice({ tone, text })
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
          price: price ? parseFloat(price) : 0,
          currency,
          stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : 0,
          isActive,
          categoryId: categoryId ? Number(categoryId) : null,
          imageUrls,
          usageTags,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create product')
      }
      showNotice('success', 'Product created successfully.')
      setTimeout(() => router.push('/dashboard/admin/products'), 900)
    } catch (err: any) {
      showNotice('error', err.message)
      setSubmitting(false)
    }
  }

  if (bootstrapping) {
    return <NewProductSkeleton />
  }

  if (error) {
    return (
      <main className="flex flex-col gap-4">
        <PageHeader />
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

  return (
    <main className="flex flex-col gap-6 pb-10">
      {notice && (
        <div
          role="status"
          className={cn(
            'fixed right-4 top-4 z-50 flex items-center gap-2 rounded-md border px-3.5 py-2.5 text-sm shadow-md transition-all sm:right-6 sm:top-6',
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
        <div className="flex flex-wrap items-center gap-2">
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
            disabled={submitting}
            className="gap-1.5"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {submitting ? 'Creating…' : 'Create product'}
          </Button>
        </div>
      </PageHeader>

      <form
        id="new-product-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {/* Main column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Product details</CardTitle>
              <CardDescription>
                Core information shown across the storefront and listing pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-1.5">
                <Label htmlFor="np-name">Name</Label>
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
                <Input
                  id="np-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(e.target.value)
                  }}
                  placeholder="hand-painted-ceramic-vase"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Auto-generated from the name. Edit to override.
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="np-short">Short description</Label>
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

              <div className="grid gap-1.5">
                <Label htmlFor="np-spec">Specifications</Label>
                <Textarea
                  id="np-spec"
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  placeholder="Material, dimensions, weight…"
                  className="min-h-[96px]"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="np-care">Care &amp; maintenance</Label>
                <Textarea
                  id="np-care"
                  value={careInstructions}
                  onChange={(e) => setCareInstructions(e.target.value)}
                  placeholder="How to keep it looking its best"
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Product images</CardTitle>
                  <CardDescription>
                    Up to {MAX_IMAGES} images. Drag to reorder; the first image is the cover.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  {imageUrls.length}/{MAX_IMAGES}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
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
                    : 'Drag images here, or click to browse'}
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
                      <img
                        src={url}
                        alt={`Product image ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
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
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Styling ideas</CardTitle>
              <CardDescription>
                Optional inspiration imagery shown alongside the product detail page.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div
                {...getStylingRootProps()}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-4 py-8 text-center transition-colors',
                  isStylingDrag && 'border-primary bg-primary/5'
                )}
              >
                <input {...getStylingInputProps()} />
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  {isStylingDrag ? 'Drop styling images' : 'Add styling inspiration images'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Up to 20MB each &middot; add a caption per image
                </p>
              </div>

              {(stylingIdeas.length > 0 || stylingUploadIds.length > 0) && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {stylingIdeas.map((idea, idx) => (
                    <div
                      key={idea.url}
                      className="flex flex-col gap-2 rounded-md border bg-card p-2"
                    >
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
            </CardContent>
          </Card>
        </div>

        {/* Sidebar column */}
        <div className="flex flex-col gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Pricing &amp; inventory</CardTitle>
              <CardDescription>How this product is sold and stocked.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 grid gap-1.5">
                  <Label htmlFor="np-price">Price</Label>
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
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="np-currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="np-currency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="np-category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="np-category" className="w-full">
                    <SelectValue placeholder="Select a category" />
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

              <Separator />

              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <Label htmlFor="np-active" className="text-sm">
                    Visible to shoppers
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Toggle off to save as a draft.
                  </span>
                </div>
                <Switch
                  id="np-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Purpose &amp; mood tags</CardTitle>
              <CardDescription>Help shoppers discover this piece by occasion.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
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
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Suggestions
                  </span>
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
            </CardContent>
          </Card>
        </div>
      </form>
    </main>
  )
}

function PageHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <Link
          href="/dashboard/admin/products"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to products
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Create new product
        </h1>
        <p className="text-sm text-muted-foreground">
          Fill in the essentials, upload imagery, and publish when ready.
        </p>
      </div>
      {children}
    </header>
  )
}

function UploadingTile({ progress }: { progress: number }) {
  return (
    <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/40 p-3 text-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{progress}%</span>
    </div>
  )
}

function NewProductSkeleton() {
  return (
    <main className="flex flex-col gap-6 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-32" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-1.5 h-4 w-64" />
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="grid gap-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
              <Separator />
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="grid gap-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <Skeleton className="h-5 w-36" />
              <Skeleton className="mt-1.5 h-4 w-72" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Skeleton className="h-32 w-full" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <Skeleton className="h-5 w-36" />
              <Skeleton className="mt-1.5 h-4 w-48" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="grid gap-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-1.5 h-4 w-56" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-9 w-full" />
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-16 rounded-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
