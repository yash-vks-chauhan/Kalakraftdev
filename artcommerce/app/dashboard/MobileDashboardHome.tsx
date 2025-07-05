"use client"

import Link from 'next/link'
import { ChevronRight, User, Package, ShoppingCart, Heart, Settings, Users, Tag, AlertTriangle, TicketCheck, Star, LogOut, RefreshCw, Clock, PackageOpen, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import styles from './mobile-dashboard.module.css'
import { useState, useEffect } from 'react'

export default function MobileDashboardHome() {
  const { user, logout, token } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState<'today'|'week'|'month'|'year'|'all'>('week')
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchMetrics()
    }
    if (user) {
      fetchRecentOrders()
    }
  }, [user, token, period])

  const fetchMetrics = async () => {
    if (user?.role !== 'admin' || !token) return
    
    setRefreshing(true)
    try {
      const response = await fetch(`/api/admin/metrics?period=${period}`, {
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

  if (!user) return null

  return (
    <div className={styles.mobileDashboardContainer}>
      <h1 className={styles.mobileHeader}>
        Dashboard
        <button 
          onClick={handleLogout}
          className={showLogoutConfirm ? "text-red-500" : "text-gray-500"}
        >
          <LogOut size={20} />
        </button>
      </h1>
      
      <div className={styles.userProfile}>
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`${user.fullName}'s avatar`}
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatar}>
            <User size={30} />
          </div>
        )}
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user.fullName}</span>
          <span className={styles.userRole}>{user.role}</span>
        </div>
      </div>

      {user.role === 'admin' && (
        <>
          <div className="flex items-center justify-between mb-4 px-4">
            <select
              value={period}
              onChange={e => setPeriod(e.target.value as any)}
              className="border border-gray-300 rounded-md p-2"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
              <option value="all">All time</option>
            </select>
            <button
              onClick={fetchMetrics}
              className={styles.refreshButton}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? styles.refreshing : ''} />
            </button>
          </div>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <h3 className={styles.metricTitle}>Orders ({period === 'today' ? 'Today' : period === 'week' ? 'Week' : period === 'month' ? 'Month' : period === 'year' ? 'Year' : 'All'})</h3>
              <p className={styles.metricValue}>{metrics?.totalOrders || '0'}</p>
            </div>
            <div className={styles.metricCard}>
              <h3 className={styles.metricTitle}>Revenue ({period === 'today' ? 'Today' : period === 'week' ? 'Week' : period === 'month' ? 'Month' : period === 'year' ? 'Year' : 'All'})</h3>
              <p className={styles.metricValue}>₹{metrics?.revenue ? metrics.revenue.toFixed(2) : '0.00'}</p>
            </div>
            {metrics?.statusCounts?.slice(0, 2).map((sc: any) => (
              <div key={sc.status} className={styles.metricCard}>
                <h3 className={styles.metricTitle}>
                  {sc.status.charAt(0).toUpperCase() + sc.status.slice(1)}
                </h3>
                <p className={styles.metricValue}>{sc._count.status}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <div className={styles.activitySection}>
        <div className={styles.activityHeader}>
          <h2 className={styles.activityTitle}>Recent Activity</h2>
          <Link href="/dashboard/orders" className={styles.viewAllLink}>
            View All
          </Link>
        </div>
        
        {loadingOrders ? (
          <div className={styles.emptyState}>
            <RefreshCw className={`${styles.emptyStateIcon} ${styles.refreshing}`} size={24} />
            <p>Loading recent orders...</p>
          </div>
        ) : recentOrders.length > 0 ? (
          <ul className={styles.activityList}>
            {recentOrders.map((order: any) => (
              <li key={order.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  <PackageOpen size={20} />
                </div>
                <div className={styles.activityContent}>
                  <h3 className={styles.activityTitle}>
                    Order #{order.id.toString().substring(0, 8)}
                  </h3>
                  <div className={styles.activityMeta}>
                    <span className={styles.activityDate}>
                      <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {formatDate(order.createdAt)}
                    </span>
                    <span className={`${styles.activityStatus} ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <Link href={`/dashboard/orders/${order.id}`}>
                  <ChevronRight size={16} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.emptyState}>
            <Package className={styles.emptyStateIcon} size={24} />
            <p className={styles.emptyStateText}>No recent orders found</p>
          </div>
        )}
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
                <span className={styles.menuItemText}>Manage Products</span>
                <ChevronRight size={20} />
              </Link>
            </li>
            <li>
              <Link href="/dashboard/admin/users" className={styles.menuItem}>
                <div className={styles.menuIcon}>
                  <Users size={18} />
                </div>
                <span className={styles.menuItemText}>User Management</span>
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
              <Link href="/dashboard/admin/products/low-stock" className={styles.menuItem}>
                <div className={styles.menuIcon}>
                  <AlertTriangle size={18} />
                </div>
                <span className={styles.menuItemText}>Low-Stock</span>
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
  )
} 