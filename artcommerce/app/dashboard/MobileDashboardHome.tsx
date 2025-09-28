"use client"

import Link from 'next/link'
import { ChevronRight, ChevronDown, ChevronUp, ChevronLeft, User, Package, ShoppingCart, Heart, Settings, Users, Tag, AlertTriangle, TicketCheck, Star, LogOut, RefreshCw, Clock, PackageOpen, Calendar, PlusCircle, BarChart3, Shield, UserCheck, DollarSign, ArrowLeft, Home } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import styles from './mobile-dashboard.module.css'
import desktopStyles from './dashboard.module.css'
import { useState, useEffect, useRef } from 'react'
import InlineLoader from '../components/InlineLoader'
import MobileBottomNavbar from '../components/MobileBottomNavbar'

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
  const [showSystemMenu, setShowSystemMenu] = useState(false)
  const isAnyAdminAccordionExpanded = showProductsMenu || showUsersMenu || showSystemMenu
  const [showOverview, setShowOverview] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showPeriodModal, setShowPeriodModal] = useState(false)

  // Computed properties
  const isAdmin = user?.role === 'admin'

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

  // Add scroll event listener for header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 20)
    }

    // Set initial scroll state
    setIsScrolled(window.scrollY > 20)

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

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
      case 'delivered':
        return 'statusCompleted'
      case 'processing':
      case 'confirmed':
        return 'statusProcessing'
      case 'shipped':
      case 'out_for_delivery':
        return 'statusShipped'
      case 'cancelled':
      case 'refunded':
        return 'statusCancelled'
      default:
        return 'statusPending'
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
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <Link href="/" className={styles.backButton}>
            <ChevronLeft size={20} />
          </Link>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <button 
            onClick={handleLogout}
            className={`${styles.logoutButton} ${showLogoutConfirm ? styles.confirmLogout : ''}`}
            title={showLogoutConfirm ? "Confirm Logout" : "Logout"}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
      
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
            <p className={styles.welcomeText}>Welcome back</p>
          </div>
        </div>

        {/* Analytics Overview for Admin Users */}
        {isAdmin && (
          <div className={styles.analyticsSection}>
            <h2 className={styles.sectionTitle}>Analytics Overview</h2>
            {metrics ? (
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <div className={styles.metricIcon}>📊</div>
                  <div className={styles.metricValue}>{metrics.totalRevenue || '₹0'}</div>
                  <div className={styles.metricLabel}>Total Revenue</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricIcon}>🛍️</div>
                  <div className={styles.metricValue}>{metrics.totalOrders || '0'}</div>
                  <div className={styles.metricLabel}>Total Orders</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricIcon}>👥</div>
                  <div className={styles.metricValue}>{metrics.totalUsers || '0'}</div>
                  <div className={styles.metricLabel}>Total Users</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricIcon}>📦</div>
                  <div className={styles.metricValue}>{metrics.totalProducts || '0'}</div>
                  <div className={styles.metricLabel}>Total Products</div>
                </div>
              </div>
            ) : (
              <div className={styles.loadingMetrics}>
                <InlineLoader />
                <span>Loading analytics...</span>
              </div>
            )}
          </div>
        )}

        {/* Unified Admin Section with Parallax Effects */}
        {isAdmin && (
          <div className={styles.adminUnifiedGroup}>
            <h2 className={styles.sectionTitle}>Admin Panel</h2>
            
            {/* All Orders Accordion */}
            <div 
              className={`${styles.accordionItem} ${showProductsMenu ? styles.expanded : ''}`}
              onClick={() => setShowProductsMenu(!showProductsMenu)}
            >
              <div className={`${styles.accordionHeader} ${showProductsMenu ? styles.expandedTitle : ''}`}>
                <div className={`${styles.accordionIcon} ${showProductsMenu ? styles.expandedIcon : ''}`}>
                  📦
                </div>
                <span>All Orders</span>
                <ChevronDown 
                  className={`${styles.chevron} ${showProductsMenu ? styles.rotated : ''}`} 
                  size={20} 
                />
              </div>
              {showProductsMenu && (
                <div className={styles.accordionContent}>
                  <a href="/dashboard/admin/orders" className={styles.subMenuItem}>
                    <span>View All Orders</span>
                    <ChevronRight size={16} />
                  </a>
                  <a href="/dashboard/admin/orders?status=pending" className={styles.subMenuItem}>
                    <span>Pending Orders</span>
                    <ChevronRight size={16} />
                  </a>
                  <a href="/dashboard/admin/orders?status=processing" className={styles.subMenuItem}>
                    <span>Processing Orders</span>
                    <ChevronRight size={16} />
                  </a>
                  <a href="/dashboard/admin/orders?status=completed" className={styles.subMenuItem}>
                    <span>Completed Orders</span>
                    <ChevronRight size={16} />
                  </a>
                </div>
              )}
            </div>

            {/* Product Management Accordion */}
            <div 
              className={`${styles.accordionItem} ${showUsersMenu ? styles.expanded : ''}`}
              onClick={() => setShowUsersMenu(!showUsersMenu)}
            >
              <div className={`${styles.accordionHeader} ${showUsersMenu ? styles.expandedTitle : ''}`}>
                <div className={`${styles.accordionIcon} ${showUsersMenu ? styles.expandedIcon : ''}`}>
                  🎨
                </div>
                <span>Product Management</span>
                <ChevronDown 
                  className={`${styles.chevron} ${showUsersMenu ? styles.rotated : ''}`} 
                  size={20} 
                />
              </div>
              {showUsersMenu && (
                <div className={styles.accordionContent}>
                  <a href="/dashboard/admin/products" className={styles.subMenuItem}>
                    <span>All Products</span>
                    <ChevronRight size={16} />
                  </a>
                  <a href="/dashboard/admin/products/new" className={styles.subMenuItem}>
                    <span>Add New Product</span>
                    <ChevronRight size={16} />
                  </a>
                  <a href="/dashboard/admin/products/low-stock" className={styles.subMenuItem}>
                    <span>Low Stock Products</span>
                    <ChevronRight size={16} />
                  </a>
                  <a href="/dashboard/admin/products/highest-rated" className={styles.subMenuItem}>
                    <span>Highest Rated</span>
                    <ChevronRight size={16} />
                  </a>
                </div>
              )}
            </div>

            {/* User Management Accordion */}
            <div 
              className={`${styles.accordionItem} ${showSystemMenu ? styles.expanded : ''}`}
              onClick={() => setShowSystemMenu(!showSystemMenu)}
            >
              <div className={`${styles.accordionHeader} ${showSystemMenu ? styles.expandedTitle : ''}`}>
                <div className={`${styles.accordionIcon} ${showSystemMenu ? styles.expandedIcon : ''}`}>
                  👥
                </div>
                <span>User Management</span>
                <ChevronDown 
                  className={`${styles.chevron} ${showSystemMenu ? styles.rotated : ''}`} 
                  size={20} 
                />
              </div>
              {showSystemMenu && (
                <div className={styles.accordionContent}>
                  <a href="/dashboard/admin/users" className={styles.subMenuItem}>
                    <span>All Users</span>
                    <ChevronRight size={16} />
                  </a>
                  <a href="/dashboard/admin/reviews" className={styles.subMenuItem}>
                    <span>Reviews & Ratings</span>
                    <ChevronRight size={16} />
                  </a>
                  <a href="/dashboard/admin/support" className={styles.subMenuItem}>
                    <span>Support Tickets</span>
                    <ChevronRight size={16} />
                  </a>
                  <a href="/dashboard/admin/coupons" className={styles.subMenuItem}>
                    <span>Manage Coupons</span>
                    <ChevronRight size={16} />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Personal Section for All Users */}
        <div className={styles.personalSection}>
          <h2 className={styles.sectionTitle}>Personal</h2>
          <div className={styles.personalMenuItems}>
            <a href="/dashboard/orders" className={styles.personalMenuItem}>
              <div className={styles.personalIcon}>📋</div>
              <span>My Orders</span>
              <ChevronRight size={16} />
            </a>
            <a href="/dashboard/profile" className={styles.personalMenuItem}>
              <div className={styles.personalIcon}>👤</div>
              <span>Profile Settings</span>
              <ChevronRight size={16} />
            </a>
            <a href="/dashboard/wishlist" className={styles.personalMenuItem}>
              <div className={styles.personalIcon}>❤️</div>
              <span>Wishlist</span>
              <ChevronRight size={16} />
            </a>
            <a href="/dashboard/support" className={styles.personalMenuItem}>
              <div className={styles.personalIcon}>🎧</div>
              <span>Support</span>
              <ChevronRight size={16} />
            </a>
          </div>
        </div>

        {/* Recent Orders Section */}
        {recentOrders.length > 0 && (
          <div className={styles.recentOrdersSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Orders</h2>
              <Link href="/dashboard/orders" className={styles.viewAllLink}>
                View All
              </Link>
            </div>
            <div className={styles.ordersList}>
              {recentOrders.slice(0, 5).map((order: any) => {
                const firstImage = getFirstProductImage(order)
                return (
                  <Link key={order.id} href={`/dashboard/orders/${order.id}`} className={styles.orderItem}>
                    <div className={styles.orderImageContainer}>
                      {firstImage ? (
                        <img 
                          src={firstImage} 
                          alt="Order item"
                          className={styles.orderImage}
                        />
                      ) : (
                        <div className={styles.orderImagePlaceholder}>
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                    <div className={styles.orderInfo}>
                      <div className={styles.orderHeader}>
                        <span className={styles.orderId}>#{order.id.slice(-8)}</span>
                        <span className={`${styles.orderStatus} ${styles[getStatusClass(order.status)]}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className={styles.orderDetails}>
                        <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                        <span className={styles.orderTotal}>₹{order.total}</span>
                      </div>
                      <div className={styles.orderItems}>
                        {order.orderItems?.length || 0} items
                      </div>
                    </div>
                    <ChevronRight size={16} className={styles.orderChevron} />
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <MobileBottomNavbar />
      </div>
    </div>
  )
}
