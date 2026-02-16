'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import styles from './products-list.module.css'
import { FiEdit2, FiTrash2, FiArrowRight } from 'react-icons/fi'
import LoadingSpinner from '../../../components/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { SearchIcon } from 'lucide-react'
import type { Column, ColumnDef, ColumnFiltersState, RowData, SortingState } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Product {
  id: number
  name: string
  slug: string
  price: number
  currency: string
  stockQuantity: number
  isActive: boolean
  categoryId: number | null
  imageUrls?: unknown
}

type ProductStatus = 'Active' | 'Inactive'
type ProductRow = Product & { status: ProductStatus }
type RangeValue = [number | undefined, number | undefined]

function getProductImageUrl(imageUrls: unknown) {
  if (!Array.isArray(imageUrls)) return null
  const firstImage = imageUrls.find(value => typeof value === 'string' && value.trim().length > 0)
  return typeof firstImage === 'string' ? firstImage : null
}

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: 'text' | 'range' | 'select'
  }
}

function Filter({ column }: { column: Column<ProductRow, unknown> }) {
  const id = useId()
  const columnFilterValue = column.getFilterValue()
  const { filterVariant } = column.columnDef.meta ?? {}
  const columnHeader = typeof column.columnDef.header === 'string' ? column.columnDef.header : ''

  const sortedUniqueValues = useMemo(() => {
    if (filterVariant === 'range') return []
    return Array.from(column.getFacetedUniqueValues().keys()).map(value => String(value)).sort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column.getFacetedUniqueValues(), filterVariant])

  if (filterVariant === 'range') {
    const range = (columnFilterValue as RangeValue | undefined) ?? [undefined, undefined]

    return (
      <div className='*:not-first:mt-2'>
        <Label className='text-zinc-800'>{columnHeader}</Label>
        <div className='flex'>
          <Input
            id={`${id}-range-1`}
            className='flex-1 rounded-r-none [-moz-appearance:_textfield] focus:z-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none'
            value={range[0] ?? ''}
            onChange={e =>
              column.setFilterValue((old: RangeValue = [undefined, undefined]) => [
                e.target.value ? Number(e.target.value) : undefined,
                old[1]
              ])
            }
            placeholder='Min'
            type='number'
            aria-label={`${columnHeader} minimum`}
          />
          <Input
            id={`${id}-range-2`}
            className='-ms-px flex-1 rounded-l-none [-moz-appearance:_textfield] focus:z-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none'
            value={range[1] ?? ''}
            onChange={e =>
              column.setFilterValue((old: RangeValue = [undefined, undefined]) => [
                old[0],
                e.target.value ? Number(e.target.value) : undefined
              ])
            }
            placeholder='Max'
            type='number'
            aria-label={`${columnHeader} maximum`}
          />
        </div>
      </div>
    )
  }

  if (filterVariant === 'select') {
    return (
      <div className='*:not-first:mt-2'>
        <Label htmlFor={`${id}-select`} className='text-zinc-800'>
          {columnHeader}
        </Label>
        <Select
          value={columnFilterValue?.toString() ?? 'all'}
          onValueChange={value => {
            column.setFilterValue(value === 'all' ? undefined : value)
          }}
        >
          <SelectTrigger id={`${id}-select`} className='w-full bg-white'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            {sortedUniqueValues.map(value => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className='*:not-first:mt-2'>
      <Label htmlFor={`${id}-input`} className='text-zinc-800'>
        {columnHeader}
      </Label>
      <div className='relative'>
        <Input
          id={`${id}-input`}
          className='peer bg-white pl-9'
          value={(columnFilterValue ?? '') as string}
          onChange={e => column.setFilterValue(e.target.value)}
          placeholder={`Search ${columnHeader.toLowerCase()}`}
          type='text'
        />
        <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 text-zinc-500 peer-disabled:opacity-50'>
          <SearchIcon size={16} />
        </div>
      </div>
    </div>
  )
}

function ProductsDataTable({
  products,
  onEdit,
  onDelete
}: {
  products: Product[]
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}) {
  const data = useMemo<ProductRow[]>(
    () =>
      products.map(product => ({
        ...product,
        status: product.isActive ? 'Active' : 'Inactive'
      })),
    [products]
  )

  const columns = useMemo<ColumnDef<ProductRow>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
            onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
            aria-label='Select all products'
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={value => row.toggleSelected(!!value)}
            aria-label='Select product row'
          />
        ),
        enableSorting: false,
        enableColumnFilter: false
      },
      {
        id: 'image',
        header: 'Image',
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const imageUrl = getProductImageUrl(row.original.imageUrls)
          const fallback = row.original.name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .slice(0, 2)
            .toUpperCase()

          return (
            <Avatar className='size-9 rounded-md border border-zinc-200'>
              <AvatarImage src={imageUrl ?? undefined} alt={row.original.name} className='object-cover' />
              <AvatarFallback className='rounded-md bg-zinc-100 text-[10px] font-semibold text-zinc-700'>
                {fallback}
              </AvatarFallback>
            </Avatar>
          )
        }
      },
      {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <span className='font-medium text-zinc-900'>{row.original.name}</span>
            <span className='text-xs text-zinc-500'>/{row.original.slug}</span>
          </div>
        ),
        meta: {
          filterVariant: 'text'
        }
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => (
          <span className='font-medium text-emerald-700'>
            {row.original.currency} {row.original.price.toFixed(2)}
          </span>
        ),
        meta: {
          filterVariant: 'range'
        }
      },
      {
        accessorKey: 'stockQuantity',
        header: 'Stock',
        cell: ({ row }) => <span>{row.original.stockQuantity}</span>,
        meta: {
          filterVariant: 'range'
        }
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            className={cn(
              'border-none',
              row.original.isActive
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-200'
            )}
          >
            {row.original.status}
          </Badge>
        ),
        meta: {
          filterVariant: 'select'
        }
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='bg-white'
              onClick={() => onEdit(row.original.id)}
            >
              <FiEdit2 className='size-4' />
              Edit
            </Button>
            <Button type='button' variant='destructive' size='sm' onClick={() => onDelete(row.original.id)}>
              <FiTrash2 className='size-4' />
              Delete
            </Button>
          </div>
        )
      }
    ],
    [onDelete, onEdit]
  )

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'price',
      desc: false
    }
  ])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    enableSortingRemoval: false
  })

  return (
    <div className='w-full overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900'>
      <div className='grid gap-3 border-b border-zinc-200 p-4 md:grid-cols-4'>
        <Filter column={table.getColumn('name')!} />
        <Filter column={table.getColumn('price')!} />
        <Filter column={table.getColumn('stockQuantity')!} />
        <Filter column={table.getColumn('status')!} />
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id} className='bg-zinc-50'>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id} className='h-11 border-t border-zinc-200 text-xs uppercase tracking-wide'>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map(row => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className='h-20 text-center text-zinc-500'>
                No products found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default function AdminProductsPage() {
  const { user, token } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Unauthorized')
      setIsLoading(false)
      return
    }

    fetch('/api/admin/products', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error || r.statusText)
        return r.json()
      })
      .then(json => setProducts(json.products))
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [token, user])

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return
    setIsTransitioning(true)
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setProducts(prev => prev.filter(product => product.id !== id))
    } catch (err: any) {
      alert('Failed to delete product: ' + err.message)
    } finally {
      setIsTransitioning(false)
    }
  }

  function handleEdit(id: number) {
    setIsTransitioning(true)
    router.push(`/dashboard/admin/products/${id}`)
  }

  function handleAddNew() {
    setIsTransitioning(true)
    router.push('/dashboard/admin/products/new')
  }

  if (isLoading || isTransitioning) return <LoadingSpinner />
  if (error) return <div className={styles.error}>{error}</div>

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Manage Products</h1>
        <button onClick={handleAddNew} className={styles.newButton}>
          + Add New Product
          <FiArrowRight className={styles.arrowIcon} />
        </button>
      </div>
      <ProductsDataTable products={products} onEdit={handleEdit} onDelete={handleDelete} />
    </main>
  )
}
