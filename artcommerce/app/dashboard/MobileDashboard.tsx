"use client"

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import styles from './mobile-dashboard.module.css'
import { Home, ShoppingCart, Box, Users, Tag, BarChart2, LifeBuoy, LogOut, ChevronDown, ArrowLeft, Settings, Bell, MessageSquare, Package, Truck, CheckCircle, Clock } from 'lucide-react'
import AdminMetrics from './components/AdminMetrics'
import RecentOrders from './components/RecentOrders'
import { motion, AnimatePresence } from 'framer-motion'
import MobileProductManagement from './admin/products/MobileProductManagement'
import MobileUserManagement from './admin/users/MobileUserManagement'

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: ShoppingCart, label: 'Orders', href: '/dashboard/admin/orders' },
  { icon: Box, label: 'Products', href: '/dashboard/admin/products' },
  { icon: Users, label: 'Users', href: '/dashboard/admin/users' },
  { icon: Tag, label: 'Coupons', href: '/dashboard/admin/coupons' },
  { icon: BarChart2, label: 'Analytics', href: '/dashboard/admin/analytics' },
  { icon: LifeBuoy, label: 'Support', href: '/dashboard/admin/support' },
]

export default function MobileDashboard() {
  const { user, logout, token } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')

  if (!user) {
    router.push('/auth/login')
    return null
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome />
      case 'products':
        return <MobileProductManagement />
      case 'users':
        return <MobileUserManagement />
      // Add cases for other tabs as you build them
      default:
        return <div className={styles.placeholderContent}>Select a tab to view content.</div>
    }
  }

  return (
    <div className={styles.mobileDashboardContainer}>
      <header className={styles.mobileHeader}>
        <div className={styles.userInfo}>
          <img src={user.avatarUrl || '/avatars/default.png'} alt="User Avatar" className={styles.avatar} />
          <div>
            <h1 className={styles.userName}>{user.fullName}</h1>
            <p className={styles.userRole}>{user.role}</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionButton}><Bell size={20} /></button>
          <button className={styles.actionButton}><Settings size={20} /></button>
          <button onClick={logout} className={styles.actionButton}><LogOut size={20} /></button>
        </div>
      </header>
      
      <main className={styles.mainContent}>
        {renderContent()}
      </main>

      <nav className={styles.bottomNav}>
        <button onClick={() => setActiveTab('dashboard')} className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.active : ''}`}>
          <Home size={24} />
          <span>Dashboard</span>
        </button>
        <button onClick={() => router.push('/dashboard/admin/orders')} className={styles.navItem}>
          <ShoppingCart size={24} />
          <span>Orders</span>
        </button>
        <button onClick={() => setActiveTab('products')} className={`${styles.navItem} ${activeTab === 'products' ? styles.active : ''}`}>
          <Box size={24} />
          <span>Products</span>
        </button>
        <button onClick={() => setActiveTab('users')} className={`${styles.navItem} ${activeTab === 'users' ? styles.active : ''}`}>
          <Users size={24} />
          <span>Users</span>
        </button>
        <button onClick={() => router.push('/dashboard/admin/analytics')} className={styles.navItem}>
          <BarChart2 size={24} />
          <span>Analytics</span>
        </button>
      </nav>
    </div>
  )
}

const DashboardHome = () => {
  const { user, token } = useAuth()
  const [isActivityVisible, setIsActivityVisible] = useState(false)

  return (
    <>
      <AdminMetrics token={token} user={user} />
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsActivityVisible(!isActivityVisible)}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
          <ChevronDown size={20} className={`${styles.chevron} ${isActivityVisible ? styles.chevronOpen : ''}`} />
        </div>
        <AnimatePresence>
          {isActivityVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={styles.activityFeed}
            >
              <div className={styles.activityItem}>
                <p>New order #1234 placed.</p>
                <span>5m ago</span>
              </div>
              <div className={styles.activityItem}>
                <p>Low stock warning for "Product Name".</p>
                <span>1h ago</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <RecentOrders token={token} user={user} />
    </>
  )
}
