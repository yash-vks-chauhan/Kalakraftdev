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
  Eye,
  EyeOff,
  Focus,
  Minimize2,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import styles from './google-inspired-dashboard.module.css'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import AdminMetrics from './components/AdminMetrics'
import RecentOrders from './components/RecentOrders'

// Custom hook for swipe gestures
const useSwipeGestures = (onSwipeLeft?: () => void, onSwipeRight?: () => void) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const touchEnd = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEnd.current = null
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return
    
    const distanceX = touchStart.current.x - touchEnd.current.x
    const distanceY = touchStart.current.y - touchEnd.current.y
    const isLeftSwipe = distanceX > 50 && Math.abs(distanceY) < 100
    const isRightSwipe = distanceX < -50 && Math.abs(distanceY) < 100

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft()
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight()
    }
  }, [onSwipeLeft, onSwipeRight])

  return { onTouchStart, onTouchMove, onTouchEnd }
}

// Smart layout hook based on usage patterns
const useSmartLayout = (user: any) => {
  const [layoutPreferences, setLayoutPreferences] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardLayout')
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  const adaptiveLayout = useMemo(() => {
    const hour = new Date().getHours()
    const isWeekend = [0, 6].includes(new Date().getDay())
    
    if (user?.role === 'admin') {
      // Admin morning routine
      if (hour >= 6 && hour < 12) {
        return {
          priority: 'metrics',
          quickActions: ['checkOrders', 'reviewAlerts', 'manageInventory'],
          showInsights: true,
          compactMode: false
        }
      }
      // Admin business hours
      if (hour >= 12 && hour < 18) {
        return {
          priority: 'actions',
          quickActions: ['processOrders', 'customerSupport', 'addProduct'],
          showInsights: false,
          compactMode: true
        }
      }
      // Admin evening
      return {
        priority: 'summary',
        quickActions: ['viewReports', 'reviewDay', 'planTomorrow'],
        showInsights: true,
        compactMode: false
      }
    }
    
    // Regular user patterns
    if (isWeekend) {
      return {
        priority: 'browse',
        quickActions: ['browseProducts', 'viewWishlist', 'trackOrders'],
        showInsights: false,
        compactMode: false
      }
    }
    
    return {
      priority: 'orders',
      quickActions: ['trackOrders', 'viewCart', 'contactSupport'],
      showInsights: false,
      compactMode: true
    }
  }, [user?.role, user?.id])

  const updateLayoutPreference = useCallback((key: string, value: any) => {
    const newPrefs = { ...layoutPreferences, [key]: value }
    setLayoutPreferences(newPrefs)
    localStorage.setItem('dashboardLayout', JSON.stringify(newPrefs))
  }, [layoutPreferences])

  return { adaptiveLayout, layoutPreferences, updateLayoutPreference }
}

export default function GoogleInspiredDashboard() {
  const { user, logout, token } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showAdminSubMenu, setShowAdminSubMenu] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastTap, setLastTap] = useState(0)
  const [focusMode, setFocusMode] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pullThreshold = 80
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)

  // Smart layout and preferences
  const { adaptiveLayout, layoutPreferences, updateLayoutPreference } = useSmartLayout(user)

  // Swipe gestures for navigation
  const swipeHandlers = useSwipeGestures(
    () => {
      // Swipe left - next section or quick action
      if (navigator.vibrate) navigator.vibrate(30)
      const sections = document.querySelectorAll('[data-swipeable]')
      const currentVisible = Array.from(sections).find(el => {
        const rect = el.getBoundingClientRect()
        return rect.top >= 0 && rect.bottom <= window.innerHeight
      })
      if (currentVisible?.nextElementSibling) {
        currentVisible.nextElementSibling.scrollIntoView({ behavior: 'smooth' })
      }
    },
    () => {
      // Swipe right - previous section
      if (navigator.vibrate) navigator.vibrate(30)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  )

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
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    window.location.reload()
  }, [isRefreshing])

  const handleLogout = () => {
    if (showLogoutConfirm) {
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
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }
  }

  // Enhanced focus mode
  const toggleFocusMode = useCallback(() => {
    setFocusMode(!focusMode)
    updateLayoutPreference('focusMode', !focusMode)
    if (navigator.vibrate) {
      navigator.vibrate(!focusMode ? [50, 25, 50] : 25)
    }
  }, [focusMode, updateLayoutPreference])

  // Smart minimize/expand
  const toggleMinimized = useCallback(() => {
    setIsMinimized(!isMinimized)
    updateLayoutPreference('minimized', !isMinimized)
  }, [isMinimized, updateLayoutPreference])

  // Enhanced touch feedback for quick actions
  const handleQuickActionPress = useCallback((href: string, isImportant = false) => {
    if (navigator.vibrate) {
      navigator.vibrate(isImportant ? 50 : 25)
    }
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
      if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleFocusMode()
      }
      if (e.key === 'm' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleMinimized()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [triggerRefresh, toggleFocusMode, toggleMinimized])

  // Load preferences on mount
  useEffect(() => {
    if (layoutPreferences.focusMode !== undefined) {
      setFocusMode(layoutPreferences.focusMode)
    }
    if (layoutPreferences.minimized !== undefined) {
      setIsMinimized(layoutPreferences.minimized)
    }
  }, [layoutPreferences])

  if (!user) return null

  // Adaptive quick actions based on smart layout
  const getSmartQuickActions = () => {
    const baseActions = user.role === 'admin' 
      ? [
          { href: '/dashboard/admin/products/new', icon: PlusCircle, label: 'Add Product', description: 'Create new product', isPrimary: true, shortcut: 'n' },
          { href: '/dashboard/admin/orders', icon: Package, label: 'Manage Orders', description: 'View all orders', isPrimary: true, shortcut: 'o' },
          { href: '/dashboard/admin/support', icon: TicketCheck, label: 'Support', description: 'Help customers', isPrimary: false, shortcut: 's' },
        ]
      : [
          { href: '/dashboard/orders', icon: Package, label: 'Orders', description: 'Track packages', isPrimary: true, shortcut: 'o' },
          { href: '/dashboard/cart', icon: ShoppingCart, label: 'Cart', description: 'View cart items', isPrimary: true, shortcut: 'c' },
          { href: '/dashboard/wishlist', icon: Heart, label: 'Wishlist', description: 'Saved items', isPrimary: false, shortcut: 'w' },
        ]

    // Filter based on focus mode and layout priority
    if (focusMode) {
      return baseActions.filter(action => action.isPrimary).slice(0, 2)
    }

    return baseActions
  }

  const quickActions = getSmartQuickActions()

  const accountItems = [
    { href: '/dashboard/profile', icon: Settings, label: 'Personal Info', description: 'Name, email, password' },
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
    <div className={`${styles.container} ${focusMode ? styles.focusMode : ''} ${isMinimized ? styles.minimized : ''}`}>
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

      {/* Smart Controls */}
      <div className={styles.smartControls}>
        <button 
          onClick={toggleFocusMode} 
          className={`${styles.smartControlButton} ${focusMode ? styles.active : ''}`}
          title="Focus Mode (Cmd+F)"
        >
          {focusMode ? <EyeOff size={16} /> : <Focus size={16} />}
        </button>
        <button 
          onClick={toggleMinimized} 
          className={`${styles.smartControlButton} ${isMinimized ? styles.active : ''}`}
          title="Minimize (Cmd+M)"
        >
          <Minimize2 size={16} />
        </button>
      </div>

      {/* Enhanced Header */}
      <header className={styles.header} data-swipeable>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>
              Welcome back, {user.fullName?.split(' ')[0] || 'User'}
              {!focusMode && (
                <span className={styles.layoutIndicator}>
                  • {adaptiveLayout.priority} focus
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className={showLogoutConfirm ? styles.logoutConfirm : styles.logoutButton}
            aria-label={showLogoutConfirm ? 'Confirm logout' : 'Logout'}
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* Enhanced Profile Section with swipe gestures */}
        <div 
          className={styles.profileSection}
          onClick={() => handleDoubleTap(() => window.location.href = '/dashboard/profile')}
          role="button"
          tabIndex={0}
          aria-label="Double tap to edit profile"
          {...swipeHandlers}
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
        {...swipeHandlers}
      >
        {/* Smart Metrics - Only show in focus mode for admin */}
        {user.role === 'admin' && (!focusMode || adaptiveLayout.priority === 'metrics') && (
          <section className={styles.metricsContainer} data-swipeable>
            <AdminMetrics token={token} user={user} />
          </section>
        )}

        {/* Enhanced Quick Actions with swipe support */}
        <section className={`${styles.quickActionsContainer} ${styles.swipeableSection}`} data-swipeable>
          <div className={styles.sectionHeaderWithActions}>
            <h2 className={styles.sectionTitle}>
              {focusMode ? 'Focus Actions' : 'Quick Actions'}
            </h2>
            {!focusMode && (
              <div className={styles.quickRefreshButton} onClick={triggerRefresh}>
                <Zap size={16} className={isRefreshing ? styles.refreshing : ''} />
              </div>
            )}
          </div>
          <div className={`${styles.quickActionsGrid} ${focusMode ? styles.focusGrid : ''}`}>
            {quickActions.map((action, index) => (
              <div
                key={index} 
                className={`${styles.quickActionCard} ${action.isPrimary ? styles.primaryAction : styles.secondaryAction} ${styles.swipeableCard}`}
                onClick={() => handleQuickActionPress(action.href, action.isPrimary)}
                role="button"
                tabIndex={0}
                aria-label={`${action.label} - ${action.description}`}
                data-shortcut={action.shortcut}
                {...swipeHandlers}
              >
                <div className={styles.actionIconWrapper}>
                  <action.icon size={24} />
                </div>
                <div className={styles.actionText}>
                  <span className={styles.actionLabel}>{action.label}</span>
                  {!focusMode && <span className={styles.actionDescription}>{action.description}</span>}
                </div>
                <div className={styles.actionIndicator}>
                  <ChevronRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Orders - Smart visibility */}
        {!focusMode || adaptiveLayout.priority === 'orders' ? (
          <section className={styles.recentSection} data-swipeable>
            <RecentOrders token={token} user={user} />
          </section>
        ) : null}

        {/* Account & Settings - Hidden in focus mode */}
        {!focusMode && (
          <section className={styles.accountSection} data-swipeable>
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
        )}

        {/* Admin Section - Smart visibility */}
        {user.role === 'admin' && (!focusMode || adaptiveLayout.priority === 'admin') && (
          <section className={styles.adminSection} data-swipeable>
            <h2 className={styles.sectionTitle}>Administration</h2>
            <div className={styles.menuContainer}>
              {adminMenuItems.slice(0, focusMode ? 2 : adminMenuItems.length).map((item: any, index: number) =>
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
                    {!focusMode && (
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
                    )}
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
                      {!focusMode && <span className={styles.menuDescription}>{item.description}</span>}
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