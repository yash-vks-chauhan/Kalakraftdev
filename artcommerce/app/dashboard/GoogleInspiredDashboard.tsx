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
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import styles from './google-inspired-dashboard.module.css'
import { useState } from 'react'
import AdminMetrics from './components/AdminMetrics'
import RecentOrders from './components/RecentOrders'

export default function GoogleInspiredDashboard() {
  const { user, logout, token } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showAdminSubMenu, setShowAdminSubMenu] = useState<string | null>(null)

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
        <div className={styles.headerActions}>
          <button
            onClick={handleLogout}
            className={showLogoutConfirm ? styles.logoutConfirm : styles.logoutButton}
          >
            <LogOut size={22} />
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        
        {user.role === 'admin' && <AdminMetrics token={token} user={user} />}

        <RecentOrders token={token} user={user} />

        <div className={styles.menuContainer}>
          <h2 className={styles.menuTitle}>Account</h2>
          <div className={styles.cardGrid}>
            {menuItems.map((item, index) => (
              <div className={styles.card} key={index}>
                <Link href={item.href} className={styles.menuItem}>
                  <div className={styles.menuIconWrapper}>
                    <item.icon size={24} />
                  </div>
                  <div className={styles.menuText}>
                    <span className={styles.menuLabel}>{item.label}</span>
                    <span className={styles.menuDescription}>{item.description}</span>
                  </div>
                  <ChevronRight size={24} className={styles.menuArrow} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {user.role === 'admin' && (
          <div className={styles.adminControlsSection}>
            <div className={styles.adminSection}>
              <h2 className={styles.adminTitle}>Admin Controls</h2>
              <div className={styles.cardGrid}>
                {adminMenuItems.map((item: any, index: number) => (
                  <div className={styles.card} key={index}>
                    <Link href={item.href} className={styles.menuItem}>
                      <div className={styles.menuIconWrapper}>
                        <item.icon size={24} />
                      </div>
                      <div className={styles.menuText}>
                        <span className={styles.menuLabel}>{item.label}</span>
                        <span className={styles.menuDescription}>{item.description}</span>
                      </div>
                      <ChevronRight size={24} className={styles.menuArrow} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 