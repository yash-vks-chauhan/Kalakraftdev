'use client'

import React from 'react'
import styles from './layout.module.css'
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

  // Desktop: /products and /products/[id] own their full-bleed shells now and
  // no longer sit under the global navbar — so we drop the navbar-offset
  // pageWrapper and its padding, letting the page start flush at the top.
  return <>{children}</>
}
