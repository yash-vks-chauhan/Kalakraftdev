"use client"

import Link from 'next/link'
import {
  User,
  LogOut,
  ChevronRight,
  Settings,
  Package,
  ShoppingCart,
  Heart,
  Users,
  Tag,
  AlertTriangle,
  TicketCheck,
  Star,
  BarChart3,
  PlusCircle,
  Shield,
  UserCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Calendar
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import styles from './google-inspired-dashboard.module.css'
import { useState, useEffect, useRef } from 'react'

export default function GoogleInspiredDashboard() {
  const { user, logout, token } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showAdminSubMenu, setShowAdminSubMenu] = useState<string | null>(null)

  // State from old component
  const [metrics, setMetrics] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState<'today'|'week'|'month'|'year'|'all'>('week')
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [activeMetricDot, setActiveMetricDot] = useState(0)
  const metricsRowRef = useRef<HTMLDivElement>(null)
  const [showRecent, setShowRecent] = useState(true)

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

  const toggleAdminSubMenu = (menu: string) => {
    setShowAdminSubMenu(prevMenu => (prevMenu === menu ? null : menu))
  }

  // Helper functions from old component
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

  if (!user) return null

  const menuItems = [
    { href: '/dashboard/profile', icon: Settings, label: 'Personal info', description: 'Name, email, password' },
    { href: '/dashboard/orders', icon: Package, label: 'Your Orders', description: 'Track your packages' },
    { href: '/dashboard/cart', icon: ShoppingCart, label: 'Your Cart', description: 'View items in your cart' },
    { href: '/dashboard/wishlist', icon: Heart, label: 'Your Wishlist', description: 'Your saved items' },
  ]

  const adminMenuItems = [
    {
      label: 'Manage Products',
      icon: Tag,
      subMenuKey: 'products',
      subItems: [
        { href: '/dashboard/admin/products', icon: BarChart3, label: 'All Products' },
        { href: '/dashboard/admin/products/new', icon: PlusCircle, label: 'Add New Product' },
        { href: '/dashboard/admin/products/highest-rated', icon: Star, label: 'Highest Rated' },
        { href: '/dashboard/admin/products/low-stock', icon: AlertTriangle, label: 'Low Stock' },
      ],
    },
    {
      label: 'User Management',
      icon: Users,
      subMenuKey: 'users',
      subItems: [
        { href: '/dashboard/admin/users?filter=admin', icon: Shield, label: 'Admin Users' },
        { href: '/dashboard/admin/users?filter=user', icon: UserCheck, label: 'Regular Users' },
      ],
    },
    { href: '/dashboard/admin/orders', icon: Package, label: 'All Orders', description: 'View all customer orders' },
    { href: '/dashboard/admin/coupons', icon: Tag, label: 'Coupon Manager', description: 'Create and manage coupons' },
    { href: '/dashboard/admin/support', icon: TicketCheck, label: 'Support Tickets', description: 'Respond to user queries' },
    { href: '/dashboard/admin/reviews', icon: Star, label: 'Reviews & Ratings', description: 'Manage product reviews' },
  ]

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Account</h1>
          <div className={styles.headerActions}>
            <button
              onClick={handleLogout}
              className={showLogoutConfirm ? styles.logoutConfirm : styles.logoutButton}
            >
              <LogOut size={22} />
            </button>
          </div>
        </div>
        <div className={styles.profileSection}>
          <div className={styles.avatar}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="User Avatar" className={styles.avatarImage} />
            ) : (
              <User size={32} />
            )}
          </div>
          <div className={styles.profileInfo}>
            <p className={styles.profileName}>{user.fullName}</p>
            <p className={styles.profileEmail}>{user.email}</p>
          </div>
          <ChevronRight size={24} className={styles.profileArrow} />
        </div>
      </header>

      <main className={styles.mainContent}>
        
        {user.role === 'admin' && (
          <div className={styles.metricsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Admin Metrics</h2>
              <div className={styles.periodSelector}>
                <select value={period} onChange={handlePeriodChange} className={styles.periodSelect}>
                  <option value="today">Today</option>
                  <option value="week">Last 7d</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                  <option value="all">All</option>
                </select>
                <button onClick={() => fetchMetrics()} className={styles.refreshButton} disabled={refreshing}>
                  <RefreshCw size={16} className={refreshing ? styles.refreshing : ''} />
                </button>
              </div>
            </div>
            <div className={styles.metricsScrollContainer}>
              <div className={styles.metricsRow} ref={metricsRowRef}>
                <div className={styles.metricCard}>
                  <h3 className={styles.metricTitle}>Revenue</h3>
                  <p className={styles.metricValue}>₹{metrics?.revenue ? metrics.revenue.toFixed(2) : '0.00'}</p>
                </div>
                <div className={styles.metricCard}>
                  <h3 className={styles.metricTitle}>Orders</h3>
                  <p className={styles.metricValue}>{metrics?.totalOrders || '0'}</p>
                </div>
                {metrics?.statusCounts?.map((sc: any) => (
                  <div key={sc.status} className={styles.metricCard}>
                    <h3 className={styles.metricTitle}>{sc.status}</h3>
                    <p className={styles.metricValue}>{sc._count.status}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.scrollIndicator}>
              {[0, 1, ...(metrics?.statusCounts?.map((_: any, i: number) => i + 2) || [])].map((i) => (
                <div 
                  key={i} 
                  className={`${styles.scrollDot} ${activeMetricDot === i ? styles.activeDot : ''}`}
                  onClick={() => {
                    if (metricsRowRef.current) {
                      const itemWidth = metricsRowRef.current.scrollWidth / (metrics?.statusCounts?.length + 2 || 3)
                      metricsRowRef.current.scrollTo({ left: itemWidth * i, behavior: 'smooth' })
                    }
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.ordersSection}>
          <div className={`${styles.sectionHeader} ${styles.clickable}`} onClick={() => setShowRecent(prev => !prev)}>
            <h2 className={styles.sectionTitle}>Recent Orders</h2>
            {showRecent ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          <div className={`${styles.expandableSection} ${showRecent ? styles.expanded : ''}`}>
            {loadingOrders ? (
              <div className={styles.emptyState}>
                <RefreshCw className={`${styles.emptyStateIcon} ${styles.refreshing}`} size={24} />
                <p>Loading recent orders...</p>
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
                <Package className={styles.emptyStateIcon} size={24} />
                <p>No recent orders found</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <Link href={item.href} key={index} className={styles.menuItem}>
              <div className={styles.menuIconWrapper}>
                <item.icon size={24} />
              </div>
              <div className={styles.menuText}>
                <span className={styles.menuLabel}>{item.label}</span>
                <span className={styles.menuDescription}>{item.description}</span>
              </div>
              <ChevronRight size={24} className={styles.menuArrow} />
            </Link>
          ))}
        </div>

        {user.role === 'admin' && (
          <div className={styles.adminSection}>
            <h2 className={styles.adminTitle}>Admin Controls</h2>
            <div className={styles.menuContainer}>
              {adminMenuItems.map((item: any, index: number) =>
                item.subItems ? (
                  <div key={index} className={styles.menuItemGroup}>
                    <div
                      className={styles.menuItem}
                      onClick={() => toggleAdminSubMenu(item.subMenuKey)}
                    >
                      <div className={styles.menuIconWrapper}>
                        <item.icon size={24} />
                      </div>
                      <div className={styles.menuText}>
                        <span className={styles.menuLabel}>{item.label}</span>
                      </div>
                      {showAdminSubMenu === item.subMenuKey ? (
                        <ChevronUp size={24} className={styles.menuArrow} />
                      ) : (
                        <ChevronDown size={24} className={styles.menuArrow} />
                      )}
                    </div>
                    {showAdminSubMenu === item.subMenuKey && (
                      <div className={styles.subMenuContainer}>
                        {item.subItems.map((subItem: any, subIndex: number) => (
                          <Link href={subItem.href} key={subIndex} className={styles.subMenuItem}>
                             <div className={styles.menuIconWrapper}>
                                <subItem.icon size={20} />
                            </div>
                            <span className={styles.subMenuLabel}>{subItem.label}</span>
                            <ChevronRight size={20} className={styles.menuArrow} />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href={item.href} key={index} className={styles.menuItem}>
                    <div className={styles.menuIconWrapper}>
                      <item.icon size={24} />
                    </div>
                    <div className={styles.menuText}>
                      <span className={styles.menuLabel}>{item.label}</span>
                      <span className={styles.menuDescription}>{item.description}</span>
                    </div>
                    <ChevronRight size={24} className={styles.menuArrow} />
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 