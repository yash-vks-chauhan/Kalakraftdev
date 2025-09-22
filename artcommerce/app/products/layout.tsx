'use client'

import React from 'react'
import styles from './layout.module.css'
import navStyles from '../components/Navbar.module.css'
import MobileLayout from '../components/MobileLayout'
import { useDeviceDetection } from '../hooks/useDeviceDetection'

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use optimized device detection hook
  const { isSmallScreen, switchToDesktopView } = useDeviceDetection()

  if (isSmallScreen) {
    return (
      <MobileLayout onSwitchToDesktop={switchToDesktopView}>
        <div className={styles.productContainer}>
          {children}
        </div>
      </MobileLayout>
    )
  }

  return (
    <div className={navStyles.pageWrapper}>
      <div className={styles.productContainer}>
        {children}
      </div>
    </div>
  )
}
