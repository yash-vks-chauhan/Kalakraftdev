"use client"

import Link from 'next/link'
import { ChevronRight, ChevronDown, ChevronUp, ChevronLeft, User, Package, ShoppingCart, Heart, Settings, Users, Tag, AlertTriangle, TicketCheck, Star, LogOut, RefreshCw, Clock, PackageOpen, Calendar, PlusCircle, BarChart3, Shield, UserCheck, DollarSign, ArrowLeft, Home } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import styles from './mobile-dashboard.module.css'
import desktopStyles from './dashboard.module.css'
import { useState, useEffect, useRef } from 'react'
import InlineLoader from '../components/InlineLoader'
import MobileBottomNavbar from '../components/MobileBottomNavbar'

// Mobile Dashboard Skeleton Components
const MetricsSkeleton = () => (
  <div className={styles.metricsContainer}>
    <div className={styles.metricsGrid}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={styles.metricCard}>
          <div className={`${styles.modernSkeleton}`} style={{ width: '48px', height: '48px', borderRadius: '16px', marginBottom: '12px' }}></div>
          <div className={styles.metricContent}>
            <div className={`${styles.modernSkeleton}`} style={{ width: '50px', height: '24px', marginBottom: '4px' }}></div>
            <div className={`${styles.modernSkeleton}`} style={{ width: '70px', height: '14px' }}></div>
          </div>
        </div>
      ))}
    </div>
    <div className={styles.scrollIndicator}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={styles.scrollDot}></div>
      ))}
    </div>
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
  const [showSystemMenu, setShowSystemMenu] = useState(false)
  
  // Check if any admin accordion is expanded for parallax effects
  const isAnyAdminAccordionExpanded = showProductsMenu || showUsersMenu || showSystemMenu
  const [showOverview, setShowOverview] = useState(true) // Default to open
  const [isScrolled, setIsScrolled] = useState(false)
  const [showPeriodModal, setShowPeriodModal] = useState(false)

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

      {user.role === 'admin' && (
        <>
          {/* Overview Section - Redesigned like Recent Activity */}
          <div className={styles.iosSection}>
            <div className={styles.iosSectionHeader}>
              <h3 className={styles.iosSectionTitle}>Business Overview</h3>
            </div>
            <div className={styles.iosMenuGroup}>
              <div 
                className={styles.activityHeader}
                onClick={() => setShowOverview(prev => !prev)}
              >
                <h2 className={styles.sectionTitle}>Analytics Dashboard</h2>
                <div className={styles.activityHeaderRight}>
                  <button 
                    className={styles.periodSelectorMini}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPeriodModal(true);
                    }}
                  >
                    {period === 'today' ? 'Today' : 
                     period === 'week' ? '7d' : 
                     period === 'month' ? '1m' : 
                     period === 'year' ? '1y' : 'All'}
                  </button>
                  <ChevronRight 
                    size={16} 
                    className={`${styles.chevronIcon} ${showOverview ? styles.chevronRotated : ''}`}
                  />
                </div>
              </div>
              <div className={`${styles.expandableContent} ${showOverview ? styles.expanded : ''}`}>
                {metrics ? (
                  <>
                    <div className={styles.overviewMetricsScroll}>
                      {/* Revenue Card */}
                      <div className={styles.overviewMetricCard}>
                        <div className={styles.metricCardHeader}>
                          <div className={styles.metricCardIcon}>
                            <DollarSign size={24} />
                          </div>
                        </div>
                        <div className={styles.metricCardContent}>
                          <h4 className={styles.metricCardTitle}>Total Revenue</h4>
                          <p className={styles.metricCardValue}>₹{metrics?.revenue ? metrics.revenue.toFixed(0) : '0'}</p>
                          <p className={styles.metricCardSubtitle}>This {period === 'today' ? 'day' : period}</p>
                        </div>
                      </div>

                      {/* Orders Card */}
                      <div className={styles.overviewMetricCard}>
                        <div className={styles.metricCardHeader}>
                          <div className={styles.metricCardIcon}>
                            <Package size={24} />
                          </div>
                        </div>
                        <div className={styles.metricCardContent}>
                          <h4 className={styles.metricCardTitle}>Total Orders</h4>
                          <p className={styles.metricCardValue}>{metrics?.totalOrders || '0'}</p>
                          <p className={styles.metricCardSubtitle}>Orders processed</p>
                        </div>
                      </div>

                      {/* Status Breakdown Cards */}
                      {metrics?.statusCounts?.slice(0, 4).map((sc: any) => (
                        <div key={sc.status} className={styles.overviewMetricCard}>
                          <div className={styles.metricCardHeader}>
                            <div className={styles.metricCardIcon}>
                              {sc.status === 'completed' && <PackageOpen size={24} />}
                              {sc.status === 'processing' && <Clock size={24} />}
                              {sc.status === 'shipped' && <Package size={24} />}
                              {sc.status === 'pending' && <Calendar size={24} />}
                              {!['completed', 'processing', 'shipped', 'pending'].includes(sc.status) && <BarChart3 size={24} />}
                            </div>
                          </div>
                          <div className={styles.metricCardContent}>
                            <h4 className={styles.metricCardTitle}>
                              {sc.status.charAt(0).toUpperCase() + sc.status.slice(1)}
                            </h4>
                            <p className={styles.metricCardValue}>{sc._count.status}</p>
                            <p className={styles.metricCardSubtitle}>orders</p>
                          </div>
                        </div>
                      ))}

                      {/* Period Info Card */}
                      <div className={styles.overviewMetricCard}>
                        <div className={styles.metricCardHeader}>
                          <div className={styles.metricCardIcon}>
                            <BarChart3 size={24} />
                          </div>
                        </div>
                        <div className={styles.metricCardContent}>
                          <h4 className={styles.metricCardTitle}>Time Period</h4>
                          <p className={styles.metricCardValue}>
                            {period === 'today' ? 'Today' :
                             period === 'week' ? '7 Days' :
                             period === 'month' ? '1 Month' :
                             period === 'year' ? '1 Year' : 'All Time'}
                          </p>
                          <p className={styles.metricCardSubtitle}>current view</p>
                        </div>
                      </div>
                    </div>

                    {/* Scroll Indicator for Analytics Cards */}
                    <div className={styles.analyticsScrollIndicator}>
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className={styles.scrollIndicatorDot}></div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className={styles.loadingContainer}>
                    <InlineLoader size="small" message="Loading metrics..." />
                  </div>
                )}
              </div>
            </div>
          </div>

        </>
      )}

      {/* Recent Activity Section */}
      <div className={styles.iosSection}>
        <div className={styles.iosSectionHeader}>
          <h3 className={styles.iosSectionTitle}>Recent Activity</h3>
        </div>
        <div className={styles.iosMenuGroup}>
          <div 
            className={styles.activityHeader}
            onClick={() => setShowRecent(prev => !prev)}
          >
            <h2 className={styles.sectionTitle}>Recent Orders</h2>
            <div className={styles.activityHeaderRight}>
              <Link 
                href="/dashboard/orders" 
                className={styles.viewAllLink}
                onClick={(e) => e.stopPropagation()}
              >
                View All
              </Link>
              <ChevronRight 
                size={16} 
                className={`${styles.chevronIcon} ${showRecent ? styles.chevronRotated : ''}`}
              />
            </div>
          </div>
          <div className={`${styles.expandableContent} ${showRecent ? styles.expanded : ''}`}>
        {loadingOrders ? (
          <div className={styles.loadingContainer}>
            <InlineLoader size="small" message="Loading..." />
          </div>
        ) : recentOrders.length > 0 ? (
          <div className={styles.iosOrdersList}>
            {recentOrders.slice(0, 3).map((order: any) => (
              <Link 
                key={order.id} 
                href={`/dashboard/orders/${order.id}`} 
                className={styles.iosOrderItem}
              >
                <div className={styles.orderIcon}>
                  {getFirstProductImage(order) ? (
                    <img 
                      src={getFirstProductImage(order)} 
                      alt={getProductName(order)}
                      className={styles.orderImage}
                    />
                  ) : (
                    <Package size={20} />
                  )}
                </div>
                
                <div className={styles.orderDetails}>
                  <h4 className={styles.orderTitle}>
                    {getProductSummary(order)}
                  </h4>
                  <p className={styles.orderSubtitle}>
                    #{order.id.toString().substring(0, 8)} • {formatDate(order.createdAt)}
                  </p>
                  <div className={styles.orderMeta}>
                    <span className={styles.orderPrice}>
                      ₹{order.totalAmount?.toFixed(0) || '0'}
                    </span>
                    <div className={`${styles.orderStatus} ${styles[getStatusClass(order.status)]}`}>
                      <span className={styles.statusDot}></span>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.emptyStateSmall}>
            <p className={styles.emptyText}>No recent activity</p>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Personal Section */}
      <div className={styles.iosSection}>
        <div className={styles.iosSectionHeader}>
          <h3 className={styles.iosSectionTitle}>Personal</h3>
        </div>
        <div className={styles.iosMenuGroup}>
          <Link href="/dashboard/profile" className={styles.iosMenuItem}>
            <div className={styles.iosMenuIcon}>
              <Settings size={22} />
            </div>
            <div className={styles.iosMenuContent}>
              <span className={styles.iosMenuTitle}>Profile Settings</span>
              <span className={styles.iosMenuSubtitle}>Update your information</span>
            </div>
            <ChevronRight size={16} className={styles.iosChevron} />
          </Link>
          
          <Link href="/dashboard/orders" className={styles.iosMenuItem}>
            <div className={styles.iosMenuIcon}>
              <Package size={22} />
            </div>
            <div className={styles.iosMenuContent}>
              <span className={styles.iosMenuTitle}>Your Orders</span>
              <span className={styles.iosMenuSubtitle}>Track your purchases</span>
            </div>
            <ChevronRight size={16} className={styles.iosChevron} />
          </Link>
          
          <Link href="/dashboard/cart" className={styles.iosMenuItem}>
            <div className={styles.iosMenuIcon}>
              <ShoppingCart size={22} />
            </div>
            <div className={styles.iosMenuContent}>
              <span className={styles.iosMenuTitle}>Shopping Cart</span>
              <span className={styles.iosMenuSubtitle}>Items ready to purchase</span>
            </div>
            <ChevronRight size={16} className={styles.iosChevron} />
          </Link>
          
          <Link href="/dashboard/wishlist" className={styles.iosMenuItem}>
            <div className={styles.iosMenuIcon}>
              <Heart size={22} />
            </div>
            <div className={styles.iosMenuContent}>
              <span className={styles.iosMenuTitle}>Wishlist</span>
              <span className={styles.iosMenuSubtitle}>Your saved items</span>
            </div>
            <ChevronRight size={16} className={styles.iosChevron} />
          </Link>
        </div>
      </div>
        
      {/* Admin Section - Unified Group */}
      {user.role === 'admin' && (
        <>
          <div className={styles.iosSection}>
            <div className={styles.iosSectionHeader}>
              <h3 className={styles.iosSectionTitle}>Admin</h3>
            </div>
            
            {/* Unified Admin Menu Group with All Items */}
            <div className={`${styles.iosMenuGroup} ${styles.adminUnifiedGroup} ${isAnyAdminAccordionExpanded ? styles.hasExpanded : ''}`}>
              
              {/* All Orders - Regular Menu Item */}
              <Link href="/dashboard/admin/orders" className={styles.iosMenuItem}>
                <div className={styles.iosMenuIcon}>
                  <Package size={22} />
                </div>
                <div className={styles.iosMenuContent}>
                  <span className={styles.iosMenuTitle}>All Orders</span>
                  <span className={styles.iosMenuSubtitle}>Manage customer orders</span>
                </div>
                <ChevronRight size={16} className={styles.iosChevron} />
              </Link>
              
              {/* Product Management Accordion */}
              <div 
                className={`${styles.iosMenuItem} ${styles.accordionItem}`}
                onClick={() => setShowProductsMenu(prev => !prev)}
              >
                <div className={`${styles.iosMenuIcon} ${showProductsMenu ? styles.expandedIcon : ''}`}>
                  <Tag size={22} />
                </div>
                <div className={styles.iosMenuContent}>
                  <span className={`${styles.iosMenuTitle} ${showProductsMenu ? styles.expandedTitle : ''}`}>Product Management</span>
                  <span className={styles.iosMenuSubtitle}>Manage your inventory</span>
                </div>
                <ChevronRight 
                  size={16} 
                  className={`${styles.iosChevron} ${showProductsMenu ? styles.chevronRotated : ''}`}
                />
              </div>
              
              {/* Product Submenu - Expandable Content */}
              <div className={`${styles.accordionContent} ${showProductsMenu ? styles.expanded : ''}`}>
                <Link href="/dashboard/admin/products/mobile" className={`${styles.iosMenuItem} ${styles.subMenuItem}`}>
                  <div className={styles.iosMenuIcon}>
                    <Package size={20} />
                  </div>
                  <div className={styles.iosMenuContent}>
                    <span className={styles.iosMenuTitle}>All Products</span>
                    <span className={styles.iosMenuSubtitle}>View and manage inventory</span>
                  </div>
                  <ChevronRight size={14} className={styles.iosChevron} />
                </Link>
                
                <Link href="/dashboard/admin/products/new" className={`${styles.iosMenuItem} ${styles.subMenuItem}`}>
                  <div className={styles.iosMenuIcon}>
                    <PlusCircle size={20} />
                  </div>
                  <div className={styles.iosMenuContent}>
                    <span className={styles.iosMenuTitle}>Add New Product</span>
                    <span className={styles.iosMenuSubtitle}>Create product listing</span>
                  </div>
                  <ChevronRight size={14} className={styles.iosChevron} />
                </Link>
                
                <Link href="/dashboard/admin/products/low-stock" className={`${styles.iosMenuItem} ${styles.subMenuItem}`}>
                  <div className={styles.iosMenuIcon}>
                    <AlertTriangle size={20} />
                  </div>
                  <div className={styles.iosMenuContent}>
                    <span className={styles.iosMenuTitle}>Low Stock Alert</span>
                    <span className={styles.iosMenuSubtitle}>Items running low</span>
                  </div>
                  <ChevronRight size={14} className={styles.iosChevron} />
                </Link>
              </div>

              {/* User Management Accordion */}
              <div 
                className={`${styles.iosMenuItem} ${styles.accordionItem}`}
                onClick={() => setShowUsersMenu(prev => !prev)}
              >
                <div className={`${styles.iosMenuIcon} ${showUsersMenu ? styles.expandedIcon : ''}`}>
                  <Users size={22} />
                </div>
                <div className={styles.iosMenuContent}>
                  <span className={`${styles.iosMenuTitle} ${showUsersMenu ? styles.expandedTitle : ''}`}>User Management</span>
                  <span className={styles.iosMenuSubtitle}>Manage user accounts</span>
                </div>
                <ChevronRight 
                  size={16} 
                  className={`${styles.iosChevron} ${showUsersMenu ? styles.chevronRotated : ''}`}
                />
              </div>
              
              {/* User Submenu - Expandable Content */}
              <div className={`${styles.accordionContent} ${showUsersMenu ? styles.expanded : ''}`}>
                <Link href="/dashboard/admin/users/mobile" className={`${styles.iosMenuItem} ${styles.subMenuItem}`}>
                  <div className={styles.iosMenuIcon}>
                    <UserCheck size={20} />
                  </div>
                  <div className={styles.iosMenuContent}>
                    <span className={styles.iosMenuTitle}>All Users</span>
                    <span className={styles.iosMenuSubtitle}>Manage user accounts</span>
                  </div>
                  <ChevronRight size={14} className={styles.iosChevron} />
                </Link>
                
                <Link href="/dashboard/admin/users/mobile?filter=admin" className={`${styles.iosMenuItem} ${styles.subMenuItem}`}>
                  <div className={styles.iosMenuIcon}>
                    <Shield size={20} />
                  </div>
                  <div className={styles.iosMenuContent}>
                    <span className={styles.iosMenuTitle}>Admin Users</span>
                    <span className={styles.iosMenuSubtitle}>Administrative accounts</span>
                  </div>
                  <ChevronRight size={14} className={styles.iosChevron} />
                </Link>
                
                <Link href="/dashboard/admin/users/mobile?filter=user" className={`${styles.iosMenuItem} ${styles.subMenuItem}`}>
                  <div className={styles.iosMenuIcon}>
                    <User size={20} />
                  </div>
                  <div className={styles.iosMenuContent}>
                    <span className={styles.iosMenuTitle}>Regular Users</span>
                    <span className={styles.iosMenuSubtitle}>Customer accounts</span>
                  </div>
                  <ChevronRight size={14} className={styles.iosChevron} />
                </Link>
              </div>

              {/* System Management Accordion */}
              <div 
                className={`${styles.iosMenuItem} ${styles.accordionItem}`}
                onClick={() => setShowSystemMenu(prev => !prev)}
              >
                <div className={`${styles.iosMenuIcon} ${showSystemMenu ? styles.expandedIcon : ''}`}>
                  <Settings size={22} />
                </div>
                <div className={styles.iosMenuContent}>
                  <span className={`${styles.iosMenuTitle} ${showSystemMenu ? styles.expandedTitle : ''}`}>System Management</span>
                  <span className={styles.iosMenuSubtitle}>System settings & tools</span>
                </div>
                <ChevronRight 
                  size={16} 
                  className={`${styles.iosChevron} ${showSystemMenu ? styles.chevronRotated : ''}`}
                />
              </div>
              
              {/* System Submenu - Expandable Content */}
              <div className={`${styles.accordionContent} ${showSystemMenu ? styles.expanded : ''}`}>
                <Link href="/dashboard/admin/support" className={`${styles.iosMenuItem} ${styles.subMenuItem}`}>
                  <div className={styles.iosMenuIcon}>
                    <TicketCheck size={20} />
                  </div>
                  <div className={styles.iosMenuContent}>
                    <span className={styles.iosMenuTitle}>Support Tickets</span>
                    <span className={styles.iosMenuSubtitle}>Customer support</span>
                  </div>
                  <ChevronRight size={14} className={styles.iosChevron} />
                </Link>
                
                <Link href="/dashboard/admin/reviews" className={`${styles.iosMenuItem} ${styles.subMenuItem}`}>
                  <div className={styles.iosMenuIcon}>
                    <Star size={20} />
                  </div>
                  <div className={styles.iosMenuContent}>
                    <span className={styles.iosMenuTitle}>Reviews & Ratings</span>
                    <span className={styles.iosMenuSubtitle}>Product feedback</span>
                  </div>
                  <ChevronRight size={14} className={styles.iosChevron} />
                </Link>
                
                <Link href="/dashboard/admin/coupons" className={`${styles.iosMenuItem} ${styles.subMenuItem}`}>
                  <div className={styles.iosMenuIcon}>
                    <Tag size={20} />
                  </div>
                  <div className={styles.iosMenuContent}>
                    <span className={styles.iosMenuTitle}>Coupon Manager</span>
                    <span className={styles.iosMenuSubtitle}>Discount codes</span>
                  </div>
                  <ChevronRight size={14} className={styles.iosChevron} />
                </Link>
              </div>
              
            </div>
          </div>
        </>
      )}
      </div>

      {/* Period Selection Modal */}
      {showPeriodModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPeriodModal(false)}>
          <div className={styles.periodModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Select Time Period</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setShowPeriodModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.periodModalOptions}>
              {[
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'Last 7 days' },
                { value: 'month', label: 'This month' },
                { value: 'year', label: 'This year' },
                { value: 'all', label: 'All time' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setPeriod(option.value as any);
                    fetchMetrics(option.value);
                    setShowPeriodModal(false);
                  }}
                  className={`${styles.periodModalOption} ${period === option.value ? styles.active : ''}`}
                >
                  <span className={styles.optionLabel}>{option.label}</span>
                  {period === option.value && (
                    <div className={styles.checkmark}>✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavbar />
    </div>
  )
} 
