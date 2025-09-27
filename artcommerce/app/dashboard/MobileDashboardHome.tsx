"use client"

import Link from 'next/link'
import { ChevronRight, ChevronDown, ChevronUp, User, Package, ShoppingCart, Heart, Settings, Users, Tag, AlertTriangle, TicketCheck, Star, LogOut, RefreshCw, Clock, PackageOpen, Calendar, PlusCircle, BarChart3, Shield, UserCheck, DollarSign } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import styles from './mobile-dashboard.module.css'
import desktopStyles from './dashboard.module.css'
import { useState, useEffect, useRef } from 'react'
import InlineLoader from '../components/InlineLoader'

// Mobile Dashboard Skeleton Components
const MetricsSkeleton = () => (
  <div className={styles.metricsGrid}>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className={styles.metricCard}>
        <div className={`${styles.modernSkeleton}`} style={{ width: '40px', height: '40px', borderRadius: '12px', marginBottom: '12px' }}></div>
        <div className={styles.metricContent}>
          <div className={`${styles.modernSkeleton}`} style={{ width: '60px', height: '28px', marginBottom: '4px' }}></div>
          <div className={`${styles.modernSkeleton}`} style={{ width: '80px', height: '16px' }}></div>
        </div>
      </div>
    ))}
  </div>
);

const OrdersSkeleton = () => (
  <div className={styles.ordersScrollContainer}>
    <div className={styles.ordersRow}>
      {[1, 2, 3].map((index) => (
        <div key={index} className={styles.orderCard}>
          <div className={styles.orderCardLink}>
            <div className={styles.orderImageContainer}>
              <div className={`${styles.skeletonOrderImage} ${styles.skeletonShimmer}`}></div>
            </div>
            
            <div className={styles.orderContent}>
              <div className={styles.orderHeader}>
                <div className={`${styles.skeletonProductName} ${styles.skeletonShimmer}`}></div>
                <div className={`${styles.skeletonOrderNumber} ${styles.skeletonShimmer}`}></div>
              </div>
              
              <div className={styles.orderMeta}>
                <div className={`${styles.skeletonOrderDate} ${styles.skeletonShimmer}`}></div>
                <div className={`${styles.skeletonOrderStatus} ${styles.skeletonShimmer}`}></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function MobileDashboardHome() {
  const { user, logout, token } = useAuth()
  const [showRecent, setShowRecent] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState<'today'|'week'|'month'|'year'|'all'>('week')
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [activeMetricDot, setActiveMetricDot] = useState(0)
  const metricsRowRef = useRef<HTMLDivElement>(null)
  const [showProductsMenu, setShowProductsMenu] = useState(false)
  const [showUsersMenu, setShowUsersMenu] = useState(false)

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchMetrics()
    }
    if (user) {
      fetchRecentOrders()
    }
  }, [user, token])

  // Add scroll event listener for metrics row
  useEffect(() => {
    const metricsRow = metricsRowRef.current
    if (!metricsRow) return

    const handleScroll = () => {
      const scrollPosition = metricsRow.scrollLeft
      const itemWidth = metricsRow.scrollWidth / (metrics?.statusCounts?.length + 2 || 3)
      const activeIndex = Math.round(scrollPosition / itemWidth)
      setActiveMetricDot(activeIndex)
    }

    metricsRow.addEventListener('scroll', handleScroll)
    return () => {
      metricsRow.removeEventListener('scroll', handleScroll)
    }
  }, [metrics])

  const fetchMetrics = async (p: string = period) => {
    if (user?.role !== 'admin' || !token) return
    
    setRefreshing(true)
    try {
      const response = await fetch(`/api/admin/metrics?period=${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value as 'today'|'week'|'month'|'year'|'all'
    setPeriod(newPeriod)
    fetchMetrics(newPeriod)
  }

  const fetchRecentOrders = async () => {
    if (!token) return
    
    setLoadingOrders(true)
    try {
      // For admin, fetch all recent orders, for regular users fetch their orders
      const endpoint = user?.role === 'admin' 
        ? '/api/admin/orders?limit=5'
        : '/api/orders?limit=5'
        
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setRecentOrders((data.orders || []).slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleLogout = () => {
    if (showLogoutConfirm) {
      logout()
    } else {
      setShowLogoutConfirm(true)
      // Auto hide after 3 seconds
      setTimeout(() => setShowLogoutConfirm(false), 3000)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getStatusClass = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed':
        return styles.statusCompleted
      case 'processing':
        return styles.statusProcessing
      default:
        return styles.statusPending
    }
  }

  // Helper to get the first product image from order items
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
  
  // Helper to get the product name from order items
  const getProductName = (order: any) => {
    if (!order.orderItems || order.orderItems.length === 0) return 'Unknown Product'
    return order.orderItems[0].product?.name || 'Unknown Product'
  }
  
  // Helper to handle multiple products in an order
  const getProductSummary = (order: any) => {
    if (!order.orderItems || order.orderItems.length === 0) return 'No products'
    
    const itemCount = order.orderItems.length
    if (itemCount === 1) return order.orderItems[0].product?.name || 'Unknown Product'
    
    return `${order.orderItems[0].product?.name || 'Unknown Product'} + ${itemCount - 1} more`
  }

  if (!user) return null

  return (
    <div className={styles.mobileDashboardContainer}>
      <header className={styles.mobileHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <h1 className={styles.headerTitle}>Dashboard</h1>
            <p className={styles.headerSubtitle}>Welcome back, {user.fullName}</p>
          </div>
          <div className={styles.headerActions}>
            <button 
              onClick={handleLogout}
              className={`${styles.iconButton} ${showLogoutConfirm ? "text-red-500" : ""}`}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>
      
      <div className={styles.contentWrapper}>
        <div className={styles.userProfile}>
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`${user.fullName}'s avatar`}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatar}>
              <User size={24} />
            </div>
          )}
          <div className={styles.userInfo}>
            <h2 className={styles.userName}>{user.fullName}</h2>
            <p className={styles.userRole}>{user.role}</p>
          </div>
        </div>

      {user.role === 'admin' && (
        <>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h3 className={styles.sectionTitle}>Overview</h3>
              <select
                value={period}
                onChange={handlePeriodChange}
                className={styles.modernSelect}
              >
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">This month</option>
                <option value="year">This year</option>
                <option value="all">All time</option>
              </select>
            </div>
            <button
              onClick={() => fetchMetrics()}
              className={styles.iconButton}
              disabled={refreshing}
              aria-label="Refresh metrics"
            >
              <RefreshCw size={16} className={refreshing ? styles.refreshing : ''} />
            </button>
          </div>
          {refreshing || !metrics ? (
            <MetricsSkeleton />
          ) : (
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricIcon}>
                  <Package size={20} />
                </div>
                <div className={styles.metricContent}>
                  <p className={styles.metricValue}>{metrics?.totalOrders || '0'}</p>
                  <p className={styles.metricLabel}>Orders</p>
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricIcon}>
                  <DollarSign size={20} />
                </div>
                <div className={styles.metricContent}>
                  <p className={styles.metricValue}>₹{metrics?.revenue ? metrics.revenue.toFixed(0) : '0'}</p>
                  <p className={styles.metricLabel}>Revenue</p>
                </div>
              </div>
              {metrics?.statusCounts?.slice(0, 2).map((sc: any) => (
                <div key={sc.status} className={styles.metricCard}>
                  <div className={styles.metricIcon}>
                    <BarChart3 size={20} />
                  </div>
                  <div className={styles.metricContent}>
                    <p className={styles.metricValue}>{sc._count.status}</p>
                    <p className={styles.metricLabel}>
                      {sc.status.charAt(0).toUpperCase() + sc.status.slice(1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className={styles.activitySection}>
        <div 
          className={styles.activityHeader}
          onClick={() => setShowRecent(prev => !prev)}
        >
          <h2 className={styles.activityTitle}>Recent Orders</h2>
          <button className="p-2">
            {showRecent ? <ChevronUp size={20} className={styles.rotateIcon}/> : <ChevronDown size={20}/>}          
          </button>
        </div>
        <div className={`${styles.expandableSection} ${showRecent ? styles.expanded : ''}`}>
        {loadingOrders ? (
          <InlineLoader size="medium" message="Loading orders..." />
        ) : recentOrders.length > 0 ? (
          <div className={styles.modernOrdersList}>
            {recentOrders.map((order: any) => (
              <Link 
                key={order.id} 
                href={`/dashboard/orders/${order.id}`} 
                className={styles.modernOrderItem}
              >
                <div className={styles.orderItemIcon}>
                  {getFirstProductImage(order) ? (
                    <img 
                      src={getFirstProductImage(order)} 
                      alt={getProductName(order)}
                      className={styles.orderItemImage}
                    />
                  ) : (
                    <Package size={20} />
                  )}
                </div>
                
                <div className={styles.orderItemContent}>
                  <h4 className={styles.orderItemTitle}>
                    {getProductSummary(order)}
                  </h4>
                  <p className={styles.orderItemSubtitle}>
                    Order #{order.id.toString().substring(0, 8)} • {formatDate(order.createdAt)}
                  </p>
                </div>
                
                <div className={styles.orderItemStatus}>
                  <span className={`${styles.statusBadge} ${styles[getStatusClass(order.status)]}`}>
                    {order.status}
                  </span>
                  <ChevronRight size={16} className={styles.orderItemChevron} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Package className={styles.emptyStateIcon} size={24} />
            <p className={styles.emptyStateText}>No recent orders found</p>
          </div>
        )}
        </div>
      </div>

      <ul className={styles.menuList}>
        <li>
          <Link href="/dashboard/profile" className={styles.menuItem}>
            <div className={styles.menuIcon}>
              <Settings size={18} />
            </div>
            <span className={styles.menuItemText}>Profile Settings</span>
            <ChevronRight size={20} />
          </Link>
        </li>
        <li>
          <Link href="/dashboard/orders" className={styles.menuItem}>
            <div className={styles.menuIcon}>
              <Package size={18} />
            </div>
            <span className={styles.menuItemText}>Your Orders</span>
            <ChevronRight size={20} />
          </Link>
        </li>
        <li>
         <Link href="/dashboard/cart" className={styles.menuItem}>
            <div className={styles.menuIcon}>
              <ShoppingCart size={18} />
            </div>
            <span className={styles.menuItemText}>Your Cart</span>
            <ChevronRight size={20} />
          </Link>
        </li>
        <li>
          <Link href="/dashboard/wishlist" className={styles.menuItem}>
            <div className={styles.menuIcon}>
              <Heart size={18} />
            </div>
            <span className={styles.menuItemText}>Your Wishlist</span>
            <ChevronRight size={20} />
          </Link>
        </li>
        
        {/* Admin specific entries */}
        {user.role === 'admin' && (
          <>
            <div className={styles.sectionDivider}>Admin Controls</div>
            
            <li>
              <Link href="/dashboard/admin/orders" className={styles.menuItem}>
                <div className={styles.menuIcon}>
                  <Package size={18} />
                </div>
                <span className={styles.menuItemText}>All Orders</span>
                <ChevronRight size={20} />
              </Link>
            </li>
            <li>
              <Link href="/dashboard/admin/products" className={styles.menuItem}>
                <div className={styles.menuIcon}>
                  <Tag size={18} />
                </div>
                <span className={styles.menuItemText}>All Products</span>
                <ChevronRight size={20} />
              </Link>
            </li>
            <li>
              <Link href="/dashboard/admin/products/new" className={styles.menuItem}>
                <div className={styles.menuIcon}>
                  <PlusCircle size={18} />
                </div>
                <span className={styles.menuItemText}>Add Product</span>
                <ChevronRight size={20} />
              </Link>
            </li>
            <li>
              <Link href="/dashboard/admin/users" className={styles.menuItem}>
                <div className={styles.menuIcon}>
                  <Users size={18} />
                </div>
                <span className={styles.menuItemText}>Manage Users</span>
                <ChevronRight size={20} />
              </Link>
            </li>
            <li>
              <Link href="/dashboard/admin/coupons" className={styles.menuItem}>
                <div className={styles.menuIcon}>
                  <Tag size={18} />
                </div>
                <span className={styles.menuItemText}>Coupon Manager</span>
                <ChevronRight size={20} />
              </Link>
            </li>
            <li>
              <Link href="/dashboard/admin/support" className={styles.menuItem}>
                <div className={styles.menuIcon}>
                  <TicketCheck size={18} />
                </div>
                <span className={styles.menuItemText}>Support Tickets</span>
                <ChevronRight size={20} />
              </Link>
            </li>
            <li>
              <Link href="/dashboard/admin/reviews" className={styles.menuItem}>
                <div className={styles.menuIcon}>
                  <Star size={18} />
                </div>
                <span className={styles.menuItemText}>Reviews & Ratings</span>
                <ChevronRight size={20} />
              </Link>
            </li>
          </>
        )}
      </ul>
      </div>
    </div>
  )
} 