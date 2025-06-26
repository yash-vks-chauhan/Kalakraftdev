// File: app/orders/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface OrderItem {
  id: number
  product: {
    id: number
    name: string
    price: number
    currency: string
  }
  quantity: number
  priceAtPurchase: number
}

interface Order {
  id: number
  orderNumber: string
  status: string
  subtotal: number
  tax: number
  shippingFee: number
  totalAmount: number
  createdAt: string
  orderItems: OrderItem[]   // ← Note the property name is orderItems
}

export default function OrdersPage() {
  const { user, token } = useAuth()
  const router = useRouter()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect to login if not authenticated:
  useEffect(() => {
    if (!user) {
      router.replace('/auth/login')
    } else {
      fetchOrders()
    }
  }, [user, router])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch orders')
      }
      // We now expect data.orders to each have orderItems: OrderItem[]
      setOrders(Array.isArray(data.orders) ? data.orders : [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    // While redirecting, render nothing
    return null
  }

  if (loading) {
    return <p className="text-center mt-8">Loading orders…</p>
  }

  if (error) {
    return (
      <p className="text-center mt-8 text-red-600">
        Error loading orders: {error}
      </p>
    )
  }

  if (orders.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Your Orders</h1>
        <p className="text-center mt-8">You have no orders yet.</p>
        <div className="text-center mt-6">
          <Link href="/products" className="text-blue-600 hover:underline">
            Shop Now
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Orders</h1>
      <div className="space-y-8">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border rounded-lg p-6 bg-white shadow-sm"
          >
            {/* Order Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
              <h2 className="text-xl font-semibold">
                Order #{order.orderNumber}
              </h2>
              <p className="text-gray-600">
                Placed on{' '}
                {new Date(order.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <p className="mb-4">
              Status: <span className="font-medium">{order.status}</span>
            </p>

            {/* List of Items */}
            <ul className="mb-4 divide-y">
              {order.orderItems.map((item) => (
                <li
                  key={item.id}
                  className="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-gray-600">
                      Qty: {item.quantity} × {item.product.currency}{' '}
                      {item.priceAtPurchase.toFixed(2)}
                    </p>
                  </div>
                  <p className="mt-2 sm:mt-0 font-semibold">
                    {item.product.currency}{' '}
                    {(item.quantity * item.priceAtPurchase).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>

            {/* Order Totals */}
            <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-8">
              <div className="mb-2 sm:mb-0">
                <span className="text-gray-600">Subtotal:</span>{' '}
                <span className="font-semibold">
                  {order.orderItems[0].product.currency}{' '}
                  {order.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="mb-2 sm:mb-0">
                <span className="text-gray-600">Tax:</span>{' '}
                <span className="font-semibold">
                  {order.orderItems[0].product.currency} {order.tax.toFixed(2)}
                </span>
              </div>
              <div className="mb-2 sm:mb-0">
                <span className="text-gray-600">Shipping:</span>{' '}
                <span className="font-semibold">
                  {order.orderItems[0].product.currency}{' '}
                  {order.shippingFee.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total:</span>{' '}
                <span className="text-lg font-semibold">
                  {order.orderItems[0].product.currency}{' '}
                  {order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}