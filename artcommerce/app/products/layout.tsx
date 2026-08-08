'use client'

import React from 'react'
import styles from './layout.module.css'
import { useDeviceDetection } from '../hooks/useDeviceDetection'

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use optimized device detection hook
  const { isSmallScreen, switchToDesktopView } = useDeviceDetection()

  if (isSmallScreen) {
    /*
     * AppRootClient already wraps every non-bypassed route in MobileLayout,
     * and /products is not on its bypass list — so wrapping again here mounted
     * a second header, a second footer nav, and a second
     * <main class="productsPageContent">, whose 56px top padding applied
     * twice. That is where the 112px of empty space above the title came
     * from, and with it the first product sitting 263px down an 844px screen.
     */
    return <div className={styles.productContainer}>{children}</div>
  }

  // Desktop: /products and /products/[id] own their full-bleed shells now and
  // no longer sit under the global navbar — so we drop the navbar-offset
  // pageWrapper and its padding, letting the page start flush at the top.
  return <>{children}</>
}
