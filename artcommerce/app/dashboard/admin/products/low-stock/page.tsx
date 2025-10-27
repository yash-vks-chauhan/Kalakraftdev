// app/dashboard/admin/products/low-stock/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../../../contexts/AuthContext'
import Link from 'next/link'

interface Product {
  id: number
  name: string
  slug: string
  stockQuantity: number
  price: number
  currency: string
  imageUrls: string[]
}

export default function LowStockPage() {
  const { token, user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Unauthorized')
      setLoading(false)
      return
    }

    fetch('/api/admin/products/low-stock', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error || r.statusText)
        return r.json()
      })
      .then(json => setProducts(json.products))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [token, user])

  if (loading) return <p className="p-8">Loading low-stock products…</p>
  if (error)   return <p className="p-8 text-red-600">{error}</p>

  return (
    <main className="container mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Low-Stock Alerts</h1>
      {products.length === 0 ? (
        <p className="text-gray-600">All products are sufficiently stocked.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(p => (
            <li key={p.id} className="border rounded-lg p-4 flex flex-col">
              <img
                src={p.imageUrls[0] || '/default-product.png'}
                alt={p.name}
                className="h-32 w-full object-cover mb-4 rounded"
              />
              <h2 className="font-semibold">{p.name}</h2>
              <p className="text-sm text-gray-600">Stock: {p.stockQuantity}</p>
              <p className="mt-2">
                {p.currency} {p.price.toFixed(2)}
              </p>
              <Link
                href={`/dashboard/admin/products/${p.id}`}
                className="mt-auto text-blue-600 hover:underline text-sm"
              >
                Edit Product
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}