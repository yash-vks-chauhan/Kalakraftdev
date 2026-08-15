"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { DollarSign, FileText, ImageIcon, Tags } from 'lucide-react'

import { useAuth } from '../../../../contexts/AuthContext'

/**
 * Everything the product form knows, in one place.
 *
 * Two axes share it. The desktop workspace and the phone step flow are
 * different arrangements of the same fields — two copies of the state is how
 * the layouts would quietly stop validating the same thing. And creating a
 * product and editing one ask exactly the same questions, so they are the same
 * screen in two modes rather than two screens: an admin should not have to
 * learn the catalogue's form twice.
 *
 * Editing adds three things creating does not need — hydration from the
 * record, a dirty check so Save is only offered when there is something to
 * save, and deletion.
 */

export const MAX_IMAGES = 5
export const MAX_FILE_BYTES = 20 * 1024 * 1024
export const SHORT_DESC_IDEAL = { min: 50, max: 160 } as const

export type TabKey = 'basics' | 'pricing' | 'media' | 'discovery'

export const TAB_ORDER: TabKey[] = ['basics', 'pricing', 'media', 'discovery']

export interface Category {
  id: number
  name: string
}

export interface StylingIdea {
  url: string
  text: string
}

export const CURRENCIES = ['INR', 'USD', 'EUR'] as const
export const CURRENCY_SYMBOL: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
}

export function formatPrice(value: number, currency: string) {
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

export type FormMode = 'create' | 'edit'

export type ProductForm = ReturnType<typeof useProductForm>

/** The JSON columns come back as arrays or as strings, depending on the driver. */
function parseArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      return []
    }
  }
  return []
}

function parseUrls(value: unknown): string[] {
  return parseArray<unknown>(value).filter(
    (url): url is string => typeof url === 'string' && url.length > 0
  )
}

function parseStylingIdeas(value: unknown): StylingIdea[] {
  return parseArray<unknown>(value).filter(
    (idea): idea is StylingIdea =>
      typeof idea === 'object' &&
      idea !== null &&
      typeof (idea as StylingIdea).url === 'string' &&
      (idea as StylingIdea).url.length > 0
  )
}

/** The shape the dirty check compares. Order matters for the arrays. */
interface FormSnapshot {
  name: string
  slug: string
  shortDesc: string
  description: string
  specifications: string
  careInstructions: string
  price: string
  currency: string
  stockQuantity: string
  isActive: boolean
  categoryId: string
  imageUrls: string
  stylingIdeas: string
  usageTags: string
}

export function useProductForm({
  mode = 'create',
  productId,
}: { mode?: FormMode; productId?: number } = {}) {
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

  const [deleting, setDeleting] = useState(false)
  /** What the record looked like when it loaded; null until then. */
  const [initial, setInitial] = useState<FormSnapshot | null>(null)

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

    const requests: Promise<any>[] = [
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/products/usage-tags').then((r) => r.json()),
    ]
    if (mode === 'edit' && productId != null) {
      requests.push(
        fetch(`/api/admin/products/${productId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }).then(async (r) => {
          if (!r.ok) {
            throw new Error((await r.json()).error || 'Could not load this product.')
          }
          return r.json()
        })
      )
    }

    Promise.all(requests)
      .then(([catJson, tagJson, productJson]) => {
        setCategories(catJson?.categories ?? [])
        if (Array.isArray(tagJson?.tags)) setAvailableTags(tagJson.tags)

        const p = productJson?.product
        if (!p) return

        const urls = parseUrls(p.imageUrls)
        const ideas = parseStylingIdeas(p.stylingIdeaImages)
        const tags = parseUrls(p.usageTags)

        setName(p.name ?? '')
        setSlug(p.slug ?? '')
        // The record already has a slug; typing a new name must not rewrite it.
        setSlugTouched(true)
        setShortDesc(p.shortDesc ?? '')
        setDescription(p.description ?? '')
        setSpecifications(p.specifications ?? '')
        setCareInstructions(p.careInstructions ?? '')
        setPrice(p.price != null ? String(p.price) : '')
        setCurrency(p.currency || 'INR')
        setStockQuantity(p.stockQuantity != null ? String(p.stockQuantity) : '')
        setIsActive(Boolean(p.isActive))
        setCategoryId(p.categoryId != null ? String(p.categoryId) : '')
        setImageUrls(urls)
        setStylingIdeas(ideas)
        setUsageTags(tags)
        setAvailableTags((prev) => [...new Set([...prev, ...tags])])

        setInitial({
          name: p.name ?? '',
          slug: p.slug ?? '',
          shortDesc: p.shortDesc ?? '',
          description: p.description ?? '',
          specifications: p.specifications ?? '',
          careInstructions: p.careInstructions ?? '',
          price: p.price != null ? String(p.price) : '',
          currency: p.currency || 'INR',
          stockQuantity: p.stockQuantity != null ? String(p.stockQuantity) : '',
          isActive: Boolean(p.isActive),
          categoryId: p.categoryId != null ? String(p.categoryId) : '',
          imageUrls: JSON.stringify(urls),
          stylingIdeas: JSON.stringify(ideas),
          usageTags: JSON.stringify(tags),
        })
      })
      .catch((err) =>
        setError(err?.message || 'Failed to load this page.')
      )
      .finally(() => setBootstrapping(false))
    // token is intentionally read at call time; re-running on it would refetch
    // the record every refresh and discard edits in progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, router, mode, productId])

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

  const reorderImages = useCallback((from: number, to: number) => {
    setImageUrls((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }, [])

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

  const addTag = useCallback((raw: string) => {
    const val = raw.trim()
    if (!val) return
    setUsageTags((prev) => (prev.includes(val) ? prev : [...prev, val]))
    setAvailableTags((prev) => (prev.includes(val) ? prev : [...prev, val]))
    setNewTagInput('')
  }, [])

  const removeTag = useCallback((tag: string) => {
    setUsageTags((prev) => prev.filter((t) => t !== tag))
  }, [])

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

  /**
   * What the API will actually accept. Creating holds out for every required
   * section — that gate exists so an incomplete product never reaches the
   * catalogue. Editing must not: a record that is already live without a photo
   * would otherwise refuse to let anyone fix its name, which punishes the
   * admin for a state they came to repair.
   */
  const canSave = name.trim().length > 0 && slug.trim().length > 0
  const canSubmit = mode === 'edit' ? canSave : allRequiredDone
  const progressPct = Math.round((requiredDone / requiredTotal) * 100)

  const activeIndex = TAB_ORDER.indexOf(activeTab)
  const isFirstTab = activeIndex === 0
  const isLastTab = activeIndex === TAB_ORDER.length - 1
  const goPrevTab = () => setActiveTab(TAB_ORDER[Math.max(0, activeIndex - 1)])
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

  const productUploadIds = Object.keys(uploadingProduct)
  const stylingUploadIds = Object.keys(uploadingStyling)
  const shortDescLen = shortDesc.length
  const shortDescTone: 'muted' | 'amber' | 'emerald' =
    shortDescLen === 0
      ? 'muted'
      : shortDescLen < SHORT_DESC_IDEAL.min
      ? 'amber'
      : shortDescLen <= SHORT_DESC_IDEAL.max
      ? 'emerald'
      : 'amber'

  /**
   * The first required section that is not satisfied, so a blocked Create can
   * say what it is waiting for instead of only greying out.
   */
  const blocker = useMemo(() => {
    if (!sections.basics.complete) {
      return { tab: 'basics' as TabKey, label: 'Basics', message: 'Needs a name' }
    }
    if (!sections.pricing.complete) {
      return {
        tab: 'pricing' as TabKey,
        label: 'Pricing',
        message: priceNum > 0 ? 'Needs a category' : 'Needs a price',
      }
    }
    if (!sections.media.complete) {
      return { tab: 'media' as TabKey, label: 'Media', message: 'Needs at least one photo' }
    }
    return null
  }, [sections, priceNum])

  const goToList = useCallback(() => {
    router.push('/dashboard/admin/products')
  }, [router])

  /** The current form, in the shape the initial snapshot was taken in. */
  const snapshot: FormSnapshot = {
    name,
    slug,
    shortDesc,
    description,
    specifications,
    careInstructions,
    price,
    currency,
    stockQuantity,
    isActive,
    categoryId,
    imageUrls: JSON.stringify(imageUrls),
    stylingIdeas: JSON.stringify(stylingIdeas),
    usageTags: JSON.stringify(usageTags),
  }

  /**
   * Creating is always "dirty" — there is nothing to compare against. Editing
   * compares field by field, so Save is only offered when it would do
   * something, and leaving is only guarded when there is something to lose.
   */
  const changedFields = useMemo(() => {
    if (mode === 'create' || !initial) return []
    return (Object.keys(initial) as (keyof FormSnapshot)[]).filter(
      (key) => initial[key] !== snapshot[key]
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initial, JSON.stringify(snapshot)])

  const dirty = mode === 'create' ? true : changedFields.length > 0

  /* Losing a half-written product to a stray back gesture is the worst thing
     this screen can do, so the browser asks first. */
  useEffect(() => {
    if (!dirty || submitting || deleting) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty, submitting, deleting])

  function body() {
    return {
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
    }
  }

  async function submit() {
    setError(null)
    if (!name.trim() || !slug.trim()) {
      showNotice('error', 'Name and slug are required.')
      setActiveTab('basics')
      return
    }
    setSubmitting(true)
    try {
      const editing = mode === 'edit' && productId != null
      const res = await fetch(
        editing ? `/api/admin/products/${productId}` : '/api/admin/products',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body()),
        }
      )
      if (!res.ok) {
        const data = await res.json()
        throw new Error(
          data.error || (editing ? 'Failed to save changes' : 'Failed to create product')
        )
      }

      if (editing) {
        // Stay put and re-baseline: an admin correcting a price usually has a
        // second correction to make, and bouncing to the list loses their place.
        setInitial(snapshot)
        showNotice('success', 'Changes saved.')
        setSubmitting(false)
        return
      }

      showNotice('success', 'Product created successfully.')
      setTimeout(() => router.push('/dashboard/admin/products'), 800)
    } catch (err: any) {
      showNotice('error', err.message)
      setSubmitting(false)
    }
  }

  /** Puts every field back to the record as it was loaded. Edit mode only. */
  const discard = useCallback(() => {
    if (!initial) return
    setName(initial.name)
    setSlug(initial.slug)
    setSlugTouched(true)
    setShortDesc(initial.shortDesc)
    setDescription(initial.description)
    setSpecifications(initial.specifications)
    setCareInstructions(initial.careInstructions)
    setPrice(initial.price)
    setCurrency(initial.currency)
    setStockQuantity(initial.stockQuantity)
    setIsActive(initial.isActive)
    setCategoryId(initial.categoryId)
    setImageUrls(JSON.parse(initial.imageUrls))
    setStylingIdeas(JSON.parse(initial.stylingIdeas))
    setUsageTags(JSON.parse(initial.usageTags))
  }, [initial])

  async function remove() {
    if (mode !== 'edit' || productId == null) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed')
      showNotice('success', `${name.trim() || 'Product'} deleted.`)
      router.push('/dashboard/admin/products')
    } catch (err: any) {
      showNotice('error', err.message)
      setDeleting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submit()
  }

  return {
    // mode
    mode,
    productId,
    isEdit: mode === 'edit',
    /** What the screen is called and what its primary button says. */
    screenTitle: mode === 'edit' ? name.trim() || 'Edit product' : 'New product',
    submitLabel: mode === 'edit' ? 'Save changes' : 'Create product',
    submittingLabel: mode === 'edit' ? 'Saving…' : 'Creating…',
    dirty,
    changedCount: changedFields.length,
    discard,
    remove,
    deleting,
    // status
    bootstrapping,
    submitting,
    error,
    // navigation
    activeTab,
    setActiveTab,
    activeIndex,
    isFirstTab,
    isLastTab,
    goPrevTab,
    goNextTab,
    goToList,
    tabMeta,
    // fields
    name,
    setName,
    slug,
    setSlug,
    setSlugTouched,
    shortDesc,
    setShortDesc,
    description,
    setDescription,
    specifications,
    setSpecifications,
    careInstructions,
    setCareInstructions,
    price,
    setPrice,
    currency,
    setCurrency,
    stockQuantity,
    setStockQuantity,
    isActive,
    setIsActive,
    categoryId,
    setCategoryId,
    // media
    imageUrls,
    setImageUrls,
    reorderImages,
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
    // discovery
    categories,
    availableTags,
    usageTags,
    setUsageTags,
    newTagInput,
    setNewTagInput,
    addTag,
    removeTag,
    // derived
    priceNum,
    stockNum,
    numericCategoryId,
    categoryLabel,
    sections,
    requiredDone,
    requiredTotal,
    allRequiredDone,
    canSave,
    canSubmit,
    progressPct,
    shortDescLen,
    shortDescTone,
    blocker,
    // submit
    submit,
    handleSubmit,
  }
}
