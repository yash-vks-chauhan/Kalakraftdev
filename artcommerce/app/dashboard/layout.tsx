// File: app/dashboard/layout.tsx
'use client'

import { useAuth } from '../contexts/AuthContext'
import { redirect } from 'next/navigation'
import styles from './layout.module.css'
import navStyles from '../components/Navbar.module.css'
import { useEffect, useState } from 'react'
import { isMobileDevice } from '../../lib/utils'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const [forceDesktopView, setForceDesktopView] = useState(false)

  // Detect mobile and read view preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(isMobileDevice())
      const pref = localStorage.getItem('viewPreference')
      if (pref === 'desktop') setForceDesktopView(true)
    }
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    redirect('/auth/login')
  }

  // Mobile view without extra desktop wrappers
  if (isMobile && !forceDesktopView) {
    return <>{children}</>
  }

  // Default desktop view wrappers
  return (
    <div className={`${styles.dashboardContainer} ${navStyles.mainContent}`}>
      <div className={styles.dashboardContent}>
        {children}
      </div>
    </div>
  )
}