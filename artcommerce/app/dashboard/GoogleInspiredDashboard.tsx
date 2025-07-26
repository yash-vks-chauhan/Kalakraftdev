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
  ChevronUp
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import styles from './google-inspired-dashboard.module.css'
import { useState } from 'react'

export default function GoogleInspiredDashboard() {
  const { user, logout } = useAuth()
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