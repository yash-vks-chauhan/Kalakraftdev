"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, RefreshCw, Calendar, Eye, ArrowRight } from 'lucide-react'
import styles from './RecentOrders.module.css'

interface RecentOrdersProps {
  token: string | null;
  user: any;
}

const OrderSkeleton = () => (
  <div className={styles.recentOrdersList}>
    {[...Array(3)].map((_, i) => (
      <div key={i} className={`${styles.orderItem} ${styles.skeleton}`}>
        <div className={styles.skeletonImage} />
        <div className={styles.skeletonContent}>
          <div className={styles.skeletonText} />
          <div className={styles.skeletonMeta} />
        </div>
      </div>
    ))}
  </div>
);

export default function RecentOrders({ token, user }: RecentOrdersProps) {
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecentOrders = async () => {
    if (!token) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const endpoint = user?.role === 'admin' 
        ? '/api/admin/orders?limit=3'  // Show fewer orders on mobile
        : '/api/orders?limit=3'
      
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recent orders.')
      }
      
      const data = await response.json()
      setRecentOrders((data.orders || []).slice(0, 3))
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchRecentOrders()
  }, [user, token])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getStatusClass = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed': return styles.statusCompleted;
      case 'processing': return styles.statusProcessing;
      case 'shipped': return styles.statusShipped;
      default: return styles.statusPending;
    }
  }

  const getFirstProductImage = (order: any) => {
    if (!order.orderItems || order.orderItems.length === 0) return null
    const firstItem = order.orderItems[0]
    if (!firstItem.product || !firstItem.product.imageUrls) return null
    let imageUrls = []
    try {
      imageUrls = Array.isArray(firstItem.product.imageUrls) 
        ? firstItem.product.imageUrls 
        : JSON.parse(firstItem.product.imageUrls || '[]')
    } catch {
      imageUrls = []
    }
    return imageUrls.length > 0 ? imageUrls[0] : null
  }

  const getProductSummary = (order: any) => {
    if (!order.orderItems || order.orderItems.length === 0) return 'No products'
    const itemCount = order.orderItems.length
    const firstName = order.orderItems[0].product?.name || 'Unknown Product'
    if (itemCount === 1) return firstName
    return `${firstName.length > 20 ? firstName.substring(0, 20) + '...' : firstName} +${itemCount - 1}`
  }
  
  const handleRetry = () => {
    fetchRecentOrders()
  }

  const ordersPageLink = user?.role === 'admin' ? '/dashboard/admin/orders' : '/dashboard/orders'

  return (
    <div className={styles.ordersSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Recent Orders</h2>
        <div className={styles.headerActions}>
          <button 
            onClick={handleRetry} 
            className={styles.refreshButton} 
            disabled={loading}
            aria-label="Refresh orders"
          >
            <RefreshCw size={16} className={loading ? styles.refreshing : ''} />
          </button>
          {recentOrders.length > 0 && (
            <Link href={ordersPageLink} className={styles.viewAllButton}>
              <Eye size={16} />
              <span>View All</span>
            </Link>
          )}
        </div>
      </div>

      <div className={styles.ordersContent}>
        {loading ? (
          <OrderSkeleton />
        ) : error ? (
          <div className={styles.errorState}>
            <p className={styles.errorMessage}>{error}</p>
            <button onClick={handleRetry} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        ) : recentOrders.length > 0 ? (
          <div className={styles.recentOrdersList}>
            {recentOrders.map((order: any) => (
              <Link 
                key={order.id} 
                href={`/dashboard/orders/${order.id}`} 
                className={styles.orderItem}
              >
                <div className={styles.orderImageContainer}>
                  {getFirstProductImage(order) ? (
                    <img 
                      src={getFirstProductImage(order)} 
                      alt={getProductSummary(order)}
                      className={styles.orderImage}
                    />
                  ) : (
                    <div className={styles.noOrderImage}>
                      <Package size={20} />
                    </div>
                  )}
                </div>
                
                <div className={styles.orderDetails}>
                  <div className={styles.orderHeader}>
                    <h3 className={styles.productName}>{getProductSummary(order)}</h3>
                    <span className={`${styles.orderStatus} ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className={styles.orderMeta}>
                    <span className={styles.orderDate}>
                      <Calendar size={12} />
                      {formatDate(order.createdAt)}
                    </span>
                    <span className={styles.orderTotal}>
                      ₹{order.totalAmount?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>

                <div className={styles.orderArrow}>
                  <ArrowRight size={16} />
                </div>
              </Link>
            ))}
            
            {recentOrders.length >= 3 && (
              <Link href={ordersPageLink} className={styles.viewAllOrdersItem}>
                <div className={styles.viewAllContent}>
                  <div className={styles.viewAllIcon}>
                    <Eye size={20} />
                  </div>
                  <span className={styles.viewAllText}>View All Orders</span>
                  <ArrowRight size={16} className={styles.viewAllArrow} />
                </div>
              </Link>
            )}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Package size={48} />
            </div>
            <h3 className={styles.emptyStateTitle}>No Orders Yet</h3>
            <p className={styles.emptyStateDescription}>
              {user?.role === 'admin' 
                ? 'No customer orders have been placed yet.' 
                : 'Start shopping to see your orders here.'}
            </p>
            {user?.role !== 'admin' && (
              <Link href="/products" className={styles.emptyStateButton}>
                Start Shopping
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 