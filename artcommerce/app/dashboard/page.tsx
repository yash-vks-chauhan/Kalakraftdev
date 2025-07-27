// File: app/dashboard/page.tsx

'use client'

import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './dashboard.module.css'
import MobileDashboardHome from './MobileDashboardHome'
import { useIsMobile } from '../../lib/utils'

// Card styling
const cardClasses = `
  border rounded-lg p-6 shadow-sm 
  hover:shadow-md transition-shadow 
  bg-white
`

export default function DashboardHomePage() {
  const { user, token, logout } = useAuth()
  const router = useRouter()
  
  const isMobile = useIsMobile()
  const [forceDesktopView, setForceDesktopView] = useState(false)

  const [period, setPeriod] = useState<'today'|'week'|'month'|'year'|'all'>('today')
  const [metrics, setMetrics] = useState<null | {
    period: string
    totalOrders: number
    statusCounts: { status: string; _count: { status: number } }[]
    revenue: number
  }>(null)

  const mobileView = isMobile && !forceDesktopView;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pref = localStorage.getItem('viewPreference')
      if (pref === 'desktop') setForceDesktopView(true)
    }
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (user?.role !== 'admin') return
    fetch(`/api/admin/metrics?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setMetrics)
      .catch(console.error)
  }, [token, user, period])

  if (mobileView) {
    return <MobileDashboardHome />
  }

  if (!user) return null

  return (
    <main className={styles.dashboardContainer}>
      <div className={styles.header}>
        <div className={styles.userInfo}>
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`${user.fullName}'s avatar`}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatar} />
          )}
          <h1 className={styles.welcomeText}>Welcome, {user.fullName}!</h1>
        </div>
        <button
          onClick={logout}
          className={styles.logoutButton}
        >
          Log Out
        </button>
      </div>

      {user.role === 'admin' && metrics && (
        <div className={styles.metricsContainer}>
          <div className={styles.periodSelector}>
            <label className={styles.periodLabel}>Period:</label>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value as any)}
              className={styles.periodSelect}
            >
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
              <option value="all">All time</option>
            </select>
          </div>

          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <h3 className={styles.metricTitle}>Total Orders</h3>
              <p className={styles.metricValue}>{metrics.totalOrders}</p>
            </div>
            <div className={styles.metricCard}>
              <h3 className={styles.metricTitle}>
                Revenue ({period.charAt(0).toUpperCase() + period.slice(1)})
              </h3>
              <p className={styles.metricValue}>₹{metrics.revenue != null ? metrics.revenue.toFixed(2) : '0.00'}</p>
            </div>
            {metrics.statusCounts?.map(sc => (
              <div key={sc.status} className={styles.metricCard}>
                <h3 className={styles.metricTitle}>
                  {sc.status.charAt(0).toUpperCase() + sc.status.slice(1)}
                </h3>
                <p className={styles.metricValue}>{sc._count.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.dashboardGrid}>
        <Link href="/dashboard/profile" className={styles.dashboardCard}>
          <h2 className={styles.cardTitle}>Profile Settings</h2>
          <p className={styles.cardDescription}>Update your name, avatar, and password.</p>
        </Link>

        <Link href="/dashboard/orders" className={styles.dashboardCard}>
          <h2 className={styles.cardTitle}>Your Orders</h2>
          <p className={styles.cardDescription}>View all the orders you've placed.</p>
        </Link>

        {user.role === 'admin' && (
          <>
            <Link href="/dashboard/admin/orders" className={styles.dashboardCard}>
              <h2 className={styles.cardTitle}>All Orders</h2>
              <p className={styles.cardDescription}>View and manage every customer order.</p>
            </Link>

            {/* Manage Products (admin only) */}
            {user.role === 'admin' && (
              <Link href="/dashboard/admin/products" className={styles.dashboardCard}>
                <h2 className={styles.cardTitle}>Manage Products</h2>
                <p className={styles.cardDescription}>Add, edit, or delete product SKUs.</p>
              </Link>
            )}
            <Link href="/dashboard/admin/users" className={styles.dashboardCard}>
              <h2 className={styles.cardTitle}>User Management</h2>
              <p className={styles.cardDescription}>Promote or demote users</p>
            </Link>
            <Link href="/dashboard/admin/coupons" className={styles.dashboardCard}>
              <h2 className={styles.cardTitle}>Coupon Manager</h2>
              <p className={styles.cardDescription}>Create, edit & delete discount codes.</p>
            </Link>
            <Link href="/dashboard/admin/products/low-stock" className={styles.dashboardCard}>
              <h2 className={styles.cardTitle}>Low-Stock</h2>
              <p className={styles.cardDescription}>View items below threshold</p>
            </Link>
            {/* Support Tickets (admin only) */}
            <Link href="/dashboard/admin/support" className={styles.dashboardCard}>
              <h2 className={styles.cardTitle}>Support Tickets</h2>
              <p className={styles.cardDescription}>View and respond to customer issues.</p>
            </Link>
            {/* Reviews & Ratings (admin only) */}
            <Link href="/dashboard/admin/reviews" className={styles.dashboardCard}>
              <h2 className={styles.cardTitle}>Reviews & Ratings</h2>
              <p className={styles.cardDescription}>See and moderate product reviews.</p>
            </Link>
          </>
        )}

        <Link href="/dashboard/cart" className={styles.dashboardCard}>
          <h2 className={styles.cardTitle}>Your Cart</h2>
          <p className={styles.cardDescription}>See what's in your shopping cart.</p>
        </Link>

        <Link href="/dashboard/wishlist" className={styles.dashboardCard}>
          <h2 className={styles.cardTitle}>Your Wishlist</h2>
          <p className={styles.cardDescription}>Manage your saved items.</p>
        </Link>
      </div>
    </main>
  )
}