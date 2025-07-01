// File: app/dashboard/layout.tsx
'use client'

import { useAuth } from '../contexts/AuthContext'
import { redirect } from 'next/navigation'
import styles from './layout.module.css'
import navStyles from '../components/Navbar.module.css'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className={`${styles.dashboardContainer} ${navStyles.mainContent}`} data-dashboard="true">
      <div className={styles.dashboardContent}>
        {children}
      </div>
    </div>
  )
}