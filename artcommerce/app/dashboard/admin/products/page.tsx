'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  Star,
  CheckCircle2,
  CircleSlash,
  AlertTriangle,
  Tag,
  Boxes,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react'

import { useAuth } from '../../../contexts/AuthContext'
import LoadingSpinner from '../../../components/LoadingSpinner'
import ConfirmDialog from '../../../components/ConfirmDialog'
import { ActionSheet } from '../../_components/ActionSheet'
import {
  DataCard,
  DataCardEmpty,
  DataCardList,
  DataCardSkeleton,
  DataCardThumb,
  DesktopTableFrame,
} from '../../_components/DataCardList'
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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Product {
  id: number
  name: string
  slug: string
  price: number
  currency: string
  stockQuantity: number
  isActive: boolean
  categoryId: number | null
  totalSold: number
  imageUrls?: string[]
  shortDesc?: string
}

interface Category {
  id: number
  name: string
}

type TabKey = 'all' | number

const LOW_STOCK_THRESHOLD = 10

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

function stockTone(qty: number) {
  if (qty === 0) return 'text-destructive'
  if (qty <= LOW_STOCK_THRESHOLD) return 'text-amber-600 dark:text-amber-500'
  return 'text-foreground'
}

function stockLabel(qty: number) {
  if (qty === 0) return 'Out of stock'
  if (qty <= LOW_STOCK_THRESHOLD) return `${qty} left — low`
  return `${qty} in stock`
}

export default function AdminProductsPage() {
  const { user, token } = useAuth()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Unauthorized')
      setLoading(false)
      return
    }
    Promise.all([
      fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || r.statusText)
        return r.json()
      }),
      fetch('/api/categories')
        .then((r) => r.json())
        .catch(() => ({ categories: [] })),
    ])
      .then(([productsJson, categoriesJson]) => {
        setProducts(productsJson.products ?? [])
        setCategories(categoriesJson.categories ?? [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token, user])

  const categoryCounts = useMemo(() => {
    const map = new Map<number, number>()
    for (const p of products) {
      if (p.categoryId != null) {
        map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1)
      }
    }
    return map
  }, [products])

  const stats = useMemo(() => {
    const total = products.length
    const active = products.filter((p) => p.isActive).length
    const lowStock = products.filter(
      (p) => p.stockQuantity > 0 && p.stockQuantity <= LOW_STOCK_THRESHOLD
    ).length
    const outOfStock = products.filter((p) => p.stockQuantity === 0).length
    return { total, active, lowStock, outOfStock }
  }, [products])

  const displayProducts = useMemo(() => {
    let list = products
    if (activeTab !== 'all') {
      list = list.filter((p) => p.categoryId === activeTab)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      )
    }
    return list
  }, [products, activeTab, query])

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err: any) {
      alert('Failed to delete product: ' + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleToggleStatus(id: number, newStatus: boolean) {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: newStatus }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const json = await res.json()
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: json.product.isActive } : p))
      )
    } catch (err: any) {
      alert('Failed to update product status: ' + err.message)
    }
  }

  function handleEdit(id: number) {
    setIsTransitioning(true)
    router.push(`/dashboard/admin/products/${id}`)
  }

  if (isTransitioning) {
    return <LoadingSpinner overlay message="Loading products..." />
  }
  if (loading) {
    return <ProductsSkeleton />
  }
  if (error) {
    return (
      <main>
        <p className="text-sm text-destructive">{error}</p>
      </main>
    )
  }

  return (
    <main className="flex flex-col gap-6">
      {/* Page header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your catalog, stock levels, and product visibility.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-1.5">
            <Link href="/dashboard/admin/products/highest-rated">
              <Star className="h-4 w-4" />
              Highest rated
            </Link>
          </Button>
          <Button
            onClick={() => {
              setIsTransitioning(true)
              router.push('/dashboard/admin/products/new')
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add product
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Boxes}
          label="Total products"
          value={stats.total}
          tone="default"
        />
        <StatCard
          icon={CheckCircle2}
          label="Active"
          value={stats.active}
          tone="default"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low stock"
          value={stats.lowStock}
          tone="warning"
          hint={`≤ ${LOW_STOCK_THRESHOLD} units`}
        />
        <StatCard
          icon={CircleSlash}
          label="Out of stock"
          value={stats.outOfStock}
          tone="destructive"
        />
      </div>

      {/* Two-column shell: vertical category rail + table */}
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* Vertical category rail */}
        <aside>
          <nav
            aria-label="Filter by category"
            className="flex gap-1 overflow-x-auto rounded-md border bg-card p-2 md:sticky md:top-20 lg:top-6 md:flex-col md:overflow-visible md:p-2"
          >
            <CategoryButton
              icon={Package}
              label="All products"
              count={stats.total}
              isActive={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
            />

            {categories.length > 0 && (
              <Separator className="my-1 hidden md:block" />
            )}

            {categories.map((c) => (
              <CategoryButton
                key={c.id}
                icon={Tag}
                label={c.name}
                count={categoryCounts.get(c.id) ?? 0}
                isActive={activeTab === c.id}
                onClick={() => setActiveTab(c.id)}
              />
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <div className="min-w-0">
          <Card className="shadow-sm">
            <CardHeader className="gap-4 p-4 sm:p-6">
              <div className="flex flex-col gap-1">
                <CardTitle>
                  {activeTab === 'all'
                    ? 'All products'
                    : categories.find((c) => c.id === activeTab)?.name ??
                      'Products'}
                </CardTitle>
                <CardDescription>
                  {displayProducts.length}{' '}
                  {displayProducts.length === 1 ? 'item' : 'items'} shown.
                </CardDescription>
              </div>

              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or slug"
                  className="pl-9"
                  aria-label="Search products"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Desktop: full table. Mobile: stacked cards below. */}
              <DesktopTableFrame>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="px-4">Product</TableHead>
                      <TableHead className="px-4">Price</TableHead>
                      <TableHead className="px-4">Stock</TableHead>
                      <TableHead className="px-4">Sold</TableHead>
                      <TableHead className="px-4">Active</TableHead>
                      <TableHead className="px-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayProducts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="px-4 py-10 text-center text-sm text-muted-foreground"
                        >
                          No products match this view.
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayProducts.map((p) => {
                        const cover = p.imageUrls?.[0]
                        return (
                          <TableRow key={p.id} className="align-middle">
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
                                  {cover ? (
                                    <img
                                      src={cover}
                                      alt={p.name}
                                      loading="lazy"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate text-sm font-medium text-foreground">
                                    {p.name || 'Untitled product'}
                                  </span>
                                  <span className="truncate text-xs text-muted-foreground">
                                    /{p.slug}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="px-4 py-3 text-sm font-medium text-foreground">
                              {formatPrice(p.price, p.currency)}
                            </TableCell>

                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    'inline-flex h-2 w-2 rounded-full',
                                    p.stockQuantity === 0
                                      ? 'bg-destructive'
                                      : p.stockQuantity <= LOW_STOCK_THRESHOLD
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  )}
                                />
                                <span
                                  className={cn(
                                    'text-sm',
                                    stockTone(p.stockQuantity)
                                  )}
                                >
                                  {stockLabel(p.stockQuantity)}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                              {p.totalSold.toLocaleString()}
                            </TableCell>

                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={p.isActive}
                                  onCheckedChange={(v) =>
                                    handleToggleStatus(p.id, v)
                                  }
                                  aria-label={`Toggle ${p.name} active`}
                                />
                                <Badge
                                  variant={p.isActive ? 'secondary' : 'outline'}
                                  className="h-5 px-1.5 text-[11px]"
                                >
                                  {p.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </TableCell>

                            <TableCell className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(p.id)}
                                  className="gap-1.5"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </Button>
                                <Separator
                                  orientation="vertical"
                                  className="mx-1 h-6"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => setDeleteTarget(p)}
                                  aria-label={`Delete ${p.name}`}
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
              </DesktopTableFrame>

              <DataCardList>
                {displayProducts.length === 0 ? (
                  <DataCardEmpty
                    icon={<Package className="h-5 w-5" />}
                    title="No products match this view"
                    description="Try another category, or clear the search."
                  />
                ) : (
                  displayProducts.map((p) => (
                    <AdminProductCard
                      key={p.id}
                      product={p}
                      onEdit={() => handleEdit(p.id)}
                      onToggleActive={() => handleToggleStatus(p.id, !p.isActive)}
                      onDelete={() => setDeleteTarget(p)}
                    />
                  ))
                )}
              </DataCardList>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete product"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.name}" permanently? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete product"
        isProcessing={isDeleting}
        onConfirm={handleDelete}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null)
        }}
      />
    </main>
  )
}

function CategoryButton({
  icon: Icon,
  label,
  count,
  isActive,
  onClick,
}: {
  icon: typeof Package
  label: string
  count: number
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        'group inline-flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors md:w-full',
        isActive
          ? 'bg-secondary text-foreground font-medium'
          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0',
          isActive
            ? 'text-foreground'
            : 'text-muted-foreground group-hover:text-foreground'
        )}
      />
      <span className="flex-1 truncate">{label}</span>
      <Badge
        variant="secondary"
        className={cn(
          'h-5 px-1.5 text-[11px]',
          isActive && 'bg-background border border-border'
        )}
      >
        {count}
      </Badge>
      <ChevronRight
        className={cn(
          'hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/60 md:inline-block',
          isActive && 'text-foreground'
        )}
      />
    </button>
  )
}

/* -------------------------------------------------------------- */
/* MOBILE CARD                                                     */
/* -------------------------------------------------------------- */

function AdminProductCard({
  product,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  product: Product
  onEdit: () => void
  onToggleActive: () => void
  onDelete: () => void
}) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      <DataCard
        media={
          <DataCardThumb
            src={product.imageUrls?.[0]}
            alt={product.name}
            fallback={<Package className="h-4 w-4" />}
          />
        }
        title={product.name || 'Untitled product'}
        badge={
          !product.isActive ? (
            <Badge variant="outline" className="h-5 px-1.5 text-[11px]">
              Inactive
            </Badge>
          ) : undefined
        }
        meta={
          <span className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                'inline-flex h-1.5 w-1.5 rounded-full',
                product.stockQuantity === 0
                  ? 'bg-destructive'
                  : product.stockQuantity <= LOW_STOCK_THRESHOLD
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              )}
            />
            <span className={stockTone(product.stockQuantity)}>
              {stockLabel(product.stockQuantity)}
            </span>
            <span aria-hidden>·</span>
            {product.totalSold.toLocaleString()} sold
          </span>
        }
        value={formatPrice(product.price, product.currency)}
        onOpenActions={() => setSheetOpen(true)}
        actionsLabel={`Actions for ${product.name}`}
      />

      <ActionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={product.name || 'Untitled product'}
        description={`${formatPrice(product.price, product.currency)} · ${stockLabel(
          product.stockQuantity
        )}`}
        groups={[
          {
            actions: [
              {
                id: 'edit',
                label: 'Edit product',
                icon: Pencil,
                onSelect: onEdit,
              },
              {
                id: 'toggle',
                label: product.isActive ? 'Hide from store' : 'Publish to store',
                icon: product.isActive ? EyeOff : Eye,
                description: product.isActive
                  ? 'Customers will no longer see this'
                  : 'Make this visible to customers',
                onSelect: onToggleActive,
              },
              {
                id: 'view',
                label: 'View on storefront',
                icon: ExternalLink,
                href: `/products/${product.id}`,
              },
            ],
          },
          {
            actions: [
              {
                id: 'delete',
                label: 'Delete product',
                icon: Trash2,
                destructive: true,
                onSelect: onDelete,
              },
            ],
          },
        ]}
      />
    </>
  )
}

function ProductsSkeleton() {
  return (
    <main className="flex flex-col gap-6">
      {/* Page header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-32 sm:h-8 sm:w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </header>

      {/* Stats grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Two-column: rail + table */}
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside>
          <div className="flex gap-1 overflow-x-auto rounded-md border bg-card p-2 md:flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
              <CategoryButtonSkeleton key={i} />
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          <Card className="shadow-sm">
            <CardHeader className="gap-4 p-4 sm:p-6">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3.5 w-32" />
              </div>
              <Skeleton className="h-9 w-full lg:max-w-sm" />
            </CardHeader>
            <CardContent className="p-0">
              <DesktopTableFrame>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="px-4">Product</TableHead>
                      <TableHead className="px-4">Price</TableHead>
                      <TableHead className="px-4">Stock</TableHead>
                      <TableHead className="px-4">Sold</TableHead>
                      <TableHead className="px-4">Active</TableHead>
                      <TableHead className="px-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <ProductRowSkeleton key={i} />
                    ))}
                  </TableBody>
                </Table>
              </DesktopTableFrame>

              <DataCardList>
                {Array.from({ length: 5 }).map((_, i) => (
                  <DataCardSkeleton key={i} />
                ))}
              </DataCardList>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

function StatCardSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-14" />
        </div>
      </CardContent>
    </Card>
  )
}

function CategoryButtonSkeleton() {
  return (
    <div className="inline-flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 md:w-full">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-3.5 flex-1 max-w-[120px]" />
      <Skeleton className="h-5 w-6 rounded-full" />
    </div>
  )
}

function ProductRowSkeleton() {
  return (
    <TableRow className="align-middle">
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 shrink-0 rounded-md" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-40 max-w-full" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <Skeleton className="h-3.5 w-8" />
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-9 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-md" />
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-6 w-px" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: typeof Package
  label: string
  value: number
  tone: 'default' | 'warning' | 'destructive'
  hint?: string
}) {
  const toneStyles =
    tone === 'destructive'
      ? 'bg-destructive/10 text-destructive'
      : tone === 'warning'
      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500'
      : 'bg-muted/50 text-foreground border'

  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-md',
            toneStyles
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-semibold tracking-tight text-foreground">
              {value.toLocaleString()}
            </span>
            {hint && (
              <span className="text-[11px] text-muted-foreground">{hint}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
