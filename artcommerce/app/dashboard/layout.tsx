// File: app/dashboard/layout.tsx
'use client'

import { useAuth } from '../contexts/AuthContext'
import { redirect, usePathname } from 'next/navigation'
import Link from 'next/link'
import styles from './layout.module.css'
import dashboardStyles from './dashboard.module.css'
import navStyles from '../components/Navbar.module.css'
import { FiHome, FiUser, FiShoppingBag, FiMessageSquare, FiSettings } from 'react-icons/fi'

const mobileNavItems = [
  { href: '/dashboard', label: 'Overview', icon: FiHome },
  { href: '/dashboard/profile', label: 'Profile', icon: FiUser },
  { href: '/dashboard/orders', label: 'Orders', icon: FiShoppingBag },
  { href: '/dashboard/support', label: 'Support', icon: FiMessageSquare },
  { href: '/dashboard/account', label: 'Settings', icon: FiSettings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className={`${styles.dashboardContainer} ${navStyles.mainContent}`}>
      <div className={styles.dashboardContent}>
        {children}
      </div>
      
      {/* Mobile Dashboard Navigation */}
      <nav className={dashboardStyles.mobileDashboardNav}>
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${dashboardStyles.mobileNavItem} ${isActive ? dashboardStyles.active : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}