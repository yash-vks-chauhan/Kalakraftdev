// File: app/dashboard/orders/page.tsx
//list page
'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from './orders.module.css'


// Shape of each order (match what /api/orders returns)
interface OrderItem {
  id: number
  productId: number
  quantity: number
  priceAtPurchase: number
  product: {
    id: number
    name: string
    imageUrls: string[]
  }
}

interface ShippingAddress {
  line1: string
  city: string
  postalCode: string
  country: string
}

interface OrderUser {
  id: number
  fullName: string
  email: string
}

interface Order {
  id: number
  orderNumber: string
  status: string
  subtotal: number
  tax: number
  shippingFee: number
  totalAmount: number
  discountedTotal?: number
  discountAmount?: number
  couponCode?: string
  createdAt: string
  orderItems: OrderItem[]
  user: OrderUser
  shippingAddress: ShippingAddress
}

export default function DashboardOrdersPage() {
  const { user, token } = useAuth()
  const role = user?.role
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterUserId = searchParams.get('userId')

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (user === null) {
      router.replace('/auth/login')
      return
    }
    if (user && token) {
      fetchOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, filterUserId])

  async function fetchOrders() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/orders', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch orders')
      }
      
      let ordersList = data.orders as Order[]
      if (filterUserId) {
        ordersList = ordersList.filter(order => order.user.id === Number(filterUserId))
      }
      setOrders(ordersList)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Server error')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <main className={styles.ordersContainer}>
      <h1 className={styles.title}>Your Orders</h1>

      {loading && <p className={styles.loadingText}>Loading orders…</p>}
      {error && <p className={styles.errorMessage}>{error}</p>}

      {!loading && orders.length === 0 && (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyStateTitle}>No Orders Yet</h2>
          <p className={styles.emptyStateText}>Start shopping to see your orders here.</p>
          <Link href="/products" className={styles.shopNowButton}>
            Shop Now
          </Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <ul className={styles.orderList}>
          {orders.map((order) => (
            <li key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div className={styles.orderNumber}>
                  Order #{order.orderNumber}
                </div>
                <div className={styles.orderDate}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Customer Information */}
              {order.user && (
                <div className={styles.orderInfo}>
                  <div className={styles.infoLabel}>Customer</div>
                  <div className={styles.infoValue}>{order.user.fullName}</div>
                  <div className={styles.infoValue}>{order.user.email}</div>
                </div>
              )}

              {/* Shipping Address */}
              <div className={styles.orderInfo}>
                <div className={styles.infoLabel}>Shipping Address</div>
                <div className={styles.infoValue}>
                  {order.shippingAddress.line1}, {order.shippingAddress.city},{' '}
                  {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                </div>
              </div>

              <div className={`${styles.status} ${styles[`status${order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}`]}`}>
                {order.status}
              </div>

              {order.discountAmount && order.discountAmount > 0 ? (
                <div className={styles.orderInfo}>
                  <div className={styles.infoLabel}>Discount Applied</div>
                  <div className={styles.infoValue}>
                    Coupon <code>{order.couponCode}</code> — Saved ₹{order.discountAmount.toFixed(2)}
                  </div>
                  <div className={styles.orderTotal}>
                    Total (after discount): ₹{order.discountedTotal?.toFixed(2)}
                  </div>
                </div>
              ) : (
                <div className={styles.orderTotal}>
                  Total: ₹{order.totalAmount.toFixed(2)}
                </div>
              )}

              {/* Product Grid */}
              <div className={styles.productGrid}>
                {order.orderItems.map((item) => (
                  <div key={item.id} className={styles.productCard}>
                    {item.product.imageUrls[0] ? (
                      <img
                        src={item.product.imageUrls[0]}
                        alt={item.product.name}
                        className={styles.productImage}
                      />
                    ) : (
                      <div className={styles.productImage} />
                    )}
                    <div className={styles.productInfo}>
                      <div className={styles.productName}>
                        {item.product.name}
                      </div>
                      <div className={styles.productDetails}>
                        Qty: {item.quantity} • ₹{(item.priceAtPurchase * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.orderActions}>
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className={styles.actionButton}
                >
                  View Details
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    href={`/dashboard/orders/${order.id}/edit-status`}
                    className={styles.actionButton}
                  >
                    Edit Status
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}