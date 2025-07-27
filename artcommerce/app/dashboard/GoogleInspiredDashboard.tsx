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
  Zap,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import styles from './google-inspired-dashboard.module.css'
import { useState, useEffect, useRef, useCallback } from 'react'
import AdminMetrics from './components/AdminMetrics'
import RecentOrders from './components/RecentOrders'

export default function GoogleInspiredDashboard() {
  const { user, logout, token } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showAdminSubMenu, setShowAdminSubMenu] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastTap, setLastTap] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pullThreshold = 80
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)

  // Double-tap detection for quick actions
  const handleDoubleTap = useCallback((callback: () => void) => {
    const now = Date.now()
    const timeSinceLastTap = now - lastTap
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      callback()
    }
    setLastTap(now)
  }, [lastTap])

  // Pull-to-refresh functionality
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      setIsPulling(true)
      const startY = e.touches[0].clientY
      
      const handleTouchMove = (e: TouchEvent) => {
        if (!isPulling) return
        const currentY = e.touches[0].clientY
        const distance = Math.max(0, currentY - startY)
        setPullDistance(Math.min(distance * 0.5, pullThreshold))
      }

      const handleTouchEnd = () => {
        if (pullDistance >= pullThreshold) {
          triggerRefresh()
        }
        setIsPulling(false)
        setPullDistance(0)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }

      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
    }
  }, [isPulling, pullDistance])

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    // Add haptic-like feedback with animation
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    
    // Simulate refresh delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Force refresh of child components
    window.location.reload()
  }, [isRefreshing])

  const handleLogout = () => {
    if (showLogoutConfirm) {
      // Add haptic feedback for important action
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
      logout()
    } else {
      setShowLogoutConfirm(true)
      setTimeout(() => setShowLogoutConfirm(false), 3000)
    }
  }

  const toggleAdminSubMenu = (menu: string) => {
    setShowAdminSubMenu(prevMenu => (prevMenu === menu ? null : menu))
    // Light haptic feedback for menu interactions
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }
  }

  // Enhanced touch feedback for quick actions
  const handleQuickActionPress = useCallback((href: string, isImportant = false) => {
    if (navigator.vibrate) {
      navigator.vibrate(isImportant ? 50 : 25)
    }
    // Small delay to show press animation
    setTimeout(() => {
      window.location.href = href
    }, 100)
  }, [])

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        triggerRefresh()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [triggerRefresh])

  if (!user) return null

  // Simplified and prioritized menu items for mobile
  const quickActions = [
    { href: '/dashboard/orders', icon: Package, label: 'Orders', description: 'Track packages', isPrimary: true, shortcut: 'o' },
    { href: '/dashboard/cart', icon: ShoppingCart, label: 'Cart', description: 'View cart items', isPrimary: true, shortcut: 'c' },
    { href: '/dashboard/wishlist', icon: Heart, label: 'Wishlist', description: 'Saved items', isPrimary: false, shortcut: 'w' },
  ]

  const accountItems = [
    { href: '/dashboard/profile', icon: Settings, label: 'Personal Info', description: 'Name, email, password' },
  ]

  const adminQuickActions = [
    { href: '/dashboard/admin/products/new', icon: PlusCircle, label: 'Add Product', description: 'Create new product', isPrimary: true, shortcut: 'n' },
    { href: '/dashboard/admin/orders', icon: Package, label: 'Manage Orders', description: 'View all orders', isPrimary: true, shortcut: 'o' },
    { href: '/dashboard/admin/support', icon: TicketCheck, label: 'Support', description: 'Help customers', isPrimary: false, shortcut: 's' },
  ]

  const adminMenuItems = [
    {
      label: 'Product Management',
      icon: Tag,
      subMenuKey: 'products',
      subItems: [
        { href: '/dashboard/admin/products', icon: BarChart3, label: 'All Products' },
        { href: '/dashboard/admin/products/highest-rated', icon: Star, label: 'Top Rated' },
        { href: '/dashboard/admin/products/low-stock', icon: AlertTriangle, label: 'Low Stock' },
      ],
    },
    {
      label: 'User Management',
      icon: Users,
      subMenuKey: 'users',
      subItems: [
        { href: '/dashboard/admin/users?filter=admin', icon: Shield, label: 'Admin Users' },
        { href: '/dashboard/admin/users?filter=user', icon: UserCheck, label: 'Customers' },
      ],
    },
    { href: '/dashboard/admin/coupons', icon: Tag, label: 'Coupons', description: 'Manage promotions' },
    { href: '/dashboard/admin/reviews', icon: Star, label: 'Reviews', description: 'Customer feedback' },
  ]

  return (
    <div className={styles.container}>
      {/* Pull-to-refresh indicator */}
      {isPulling && (
        <div 
          className={styles.pullToRefreshIndicator}
          style={{ 
            transform: `translateY(${pullDistance}px)`,
            opacity: pullDistance / pullThreshold 
          }}
        >
          <div className={styles.refreshSpinner}>
            <Zap size={20} />
          </div>
          <span>Pull to refresh</span>
        </div>
      )}

      {/* Simplified Header with better hierarchy */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>Welcome back, {user.fullName?.split(' ')[0] || 'User'}</p>
          </div>
          <button
            onClick={handleLogout}
            className={showLogoutConfirm ? styles.logoutConfirm : styles.logoutButton}
            aria-label={showLogoutConfirm ? 'Confirm logout' : 'Logout'}
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* Enhanced Profile Section with double-tap */}
        <div 
          className={styles.profileSection}
          onClick={() => handleDoubleTap(() => window.location.href = '/dashboard/profile')}
          role="button"
          tabIndex={0}
          aria-label="Double tap to edit profile"
        >
          <div className={styles.avatar}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className={styles.avatarImage} />
            ) : (
              <User size={24} />
            )}
          </div>
          <div className={styles.profileInfo}>
            <p className={styles.profileName}>{user.fullName}</p>
            <p className={styles.profileEmail}>{user.email}</p>
          </div>
          <div className={styles.profileBadge}>
            <ChevronRight size={16} />
          </div>
        </div>
      </header>

      <main 
        className={styles.mainContent}
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
      >
        {/* Admin Metrics - Only for admin users */}
        {user.role === 'admin' && (
          <section className={styles.metricsContainer}>
            <AdminMetrics token={token} user={user} />
          </section>
        )}

        {/* Enhanced Quick Actions Section */}
        <section className={styles.quickActionsContainer}>
          <div className={styles.sectionHeaderWithActions}>
            <h2 className={styles.sectionTitle}>Quick Actions</h2>
            <div className={styles.quickRefreshButton} onClick={triggerRefresh}>
              <Zap size={16} className={isRefreshing ? styles.refreshing : ''} />
            </div>
          </div>
          <div className={styles.quickActionsGrid}>
            {(user.role === 'admin' ? adminQuickActions : quickActions).map((action, index) => (
              <div
                key={index} 
                className={`${styles.quickActionCard} ${action.isPrimary ? styles.primaryAction : styles.secondaryAction}`}
                onClick={() => handleQuickActionPress(action.href, action.isPrimary)}
                role="button"
                tabIndex={0}
                aria-label={`${action.label} - ${action.description}`}
                data-shortcut={action.shortcut}
              >
                <div className={styles.actionIconWrapper}>
                  <action.icon size={24} />
                </div>
                <div className={styles.actionText}>
                  <span className={styles.actionLabel}>{action.label}</span>
                  <span className={styles.actionDescription}>{action.description}</span>
                </div>
                <div className={styles.actionIndicator}>
                  <ChevronRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Orders Section */}
        <section className={styles.recentSection}>
          <RecentOrders token={token} user={user} />
        </section>

        {/* Account & Settings */}
        <section className={styles.accountSection}>
          <h2 className={styles.sectionTitle}>Account & Settings</h2>
          <div className={styles.menuContainer}>
            {accountItems.map((item, index) => (
              <Link 
                href={item.href} 
                key={index} 
                className={styles.menuItem}
                role="button"
                aria-label={`${item.label} - ${item.description}`}
              >
                <div className={styles.menuIconWrapper}>
                  <item.icon size={20} />
                </div>
                <div className={styles.menuText}>
                  <span className={styles.menuLabel}>{item.label}</span>
                  <span className={styles.menuDescription}>{item.description}</span>
                </div>
                <ChevronRight size={16} className={styles.menuArrow} />
              </Link>
            ))}
          </div>
        </section>

        {/* Admin Section - Enhanced with better interactions */}
        {user.role === 'admin' && (
          <section className={styles.adminSection}>
            <h2 className={styles.sectionTitle}>Administration</h2>
            <div className={styles.menuContainer}>
              {adminMenuItems.map((item: any, index: number) =>
                item.subItems ? (
                  <div key={index} className={styles.menuItemGroup}>
                    <div
                      className={styles.menuItem}
                      onClick={() => toggleAdminSubMenu(item.subMenuKey)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={showAdminSubMenu === item.subMenuKey}
                      aria-label={`${item.label} menu`}
                    >
                      <div className={styles.menuIconWrapper}>
                        <item.icon size={20} />
                      </div>
                      <div className={styles.menuText}>
                        <span className={styles.menuLabel}>{item.label}</span>
                      </div>
                      <div className={styles.expandIcon}>
                        {showAdminSubMenu === item.subMenuKey ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </div>
                    </div>
                    <div className={`${styles.subMenuContainer} ${showAdminSubMenu === item.subMenuKey ? styles.subMenuOpen : ''}`}>
                      <div className={styles.subMenuItemWrapper}>
                        {item.subItems.map((subItem: any, subIndex: number) => (
                          <Link 
                            href={subItem.href} 
                            key={subIndex} 
                            className={styles.subMenuItem}
                            role="button"
                            aria-label={subItem.label}
                          >
                            <div className={styles.menuIconWrapper}>
                              <subItem.icon size={16} />
                            </div>
                            <span className={styles.subMenuLabel}>{subItem.label}</span>
                            <ChevronRight size={14} className={styles.menuArrow} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link 
                    href={item.href} 
                    key={index} 
                    className={styles.menuItem}
                    role="button"
                    aria-label={`${item.label} - ${item.description}`}
                  >
                    <div className={styles.menuIconWrapper}>
                      <item.icon size={20} />
                    </div>
                    <div className={styles.menuText}>
                      <span className={styles.menuLabel}>{item.label}</span>
                      <span className={styles.menuDescription}>{item.description}</span>
                    </div>
                    <ChevronRight size={16} className={styles.menuArrow} />
                  </Link>
                )
              )}
            </div>
          </section>
        )}

        {/* Bottom Spacing */}
        <div className={styles.bottomSpacer} />
      </main>
    </div>
  )
} 