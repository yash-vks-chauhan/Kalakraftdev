"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, RefreshCw, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import styles from './RecentOrders.module.css'

interface RecentOrdersProps {
  token: string | null;
  user: any;
}

const OrderSkeleton = () => (
  <div className={styles.ordersScrollContainer}>
    {[...Array(3)].map((_, i) => (
      <div key={i} className={`${styles.orderCard} ${styles.skeleton}`}>
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
  const [showRecent, setShowRecent] = useState(true)

  const fetchRecentOrders = async () => {
    if (!token) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const endpoint = user?.role === 'admin' 
        ? '/api/admin/orders?limit=5'
        : '/api/orders?limit=5'
      
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recent orders.')
      }
      
      const data = await response.json()
      setRecentOrders((data.orders || []).slice(0, 5))
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getStatusClass = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed': return styles.statusCompleted;
      case 'processing': return styles.statusProcessing;
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
    if (itemCount === 1) return order.orderItems[0].product?.name || 'Unknown Product'
    return `${order.orderItems[0].product?.name || 'Unknown Product'} + ${itemCount - 1} more`
  }
  
  const handleRetry = () => {
    fetchRecentOrders()
  }

  return (
    <div className={styles.ordersSection}>
      <div className={`${styles.sectionHeader} ${styles.clickable}`} onClick={() => setShowRecent(prev => !prev)}>
        <h2 className={styles.sectionTitle}>Recent Orders</h2>
        <div className={styles.headerActions}>
           <button onClick={handleRetry} className={styles.refreshButton} disabled={loading}>
              <RefreshCw size={16} className={loading ? styles.refreshing : ''} />
            </button>
          {showRecent ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>
      <div className={`${styles.expandableSection} ${showRecent ? styles.expanded : ''}`}>
        {loading ? (
          <OrderSkeleton />
        ) : error ? (
           <div className={styles.errorState}>
            <p>{error}</p>
            <button onClick={handleRetry} className={styles.retryButton}>Retry</button>
          </div>
        ) : recentOrders.length > 0 ? (
          <div className={styles.ordersScrollContainer}>
            {recentOrders.map((order: any) => (
              <div key={order.id} className={styles.orderCard}>
                <Link href={`/dashboard/orders/${order.id}`} className={styles.orderCardLink}>
                  <div className={styles.orderImageContainer}>
                    {getFirstProductImage(order) ? (
                      <img 
                        src={getFirstProductImage(order)} 
                        alt={getProductSummary(order)}
                        className={styles.orderImage}
                      />
                    ) : (
                      <div className={styles.noOrderImage}><Package size={24} /></div>
                    )}
                  </div>
                  <div className={styles.orderContent}>
                    <h3 className={styles.productName}>{getProductSummary(order)}</h3>
                    <div className={styles.orderMeta}>
                       <span className={styles.orderDate}>
                        <Calendar size={12} />
                        {formatDate(order.createdAt)}
                      </span>
                      <span className={`${styles.orderStatus} ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Package className={styles.emptyStateIcon} size={32} />
            <p className={styles.emptyStateTitle}>No recent orders</p>
            <p className={styles.emptyStateDescription}>You haven't placed any orders yet. </p>
            <Link href="/products" className={styles.emptyStateButton}>
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 