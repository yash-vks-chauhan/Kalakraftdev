'use client'

import React, { useState, useEffect } from 'react'
import styles from './layout.module.css'
import navStyles from '../components/Navbar.module.css'
import MobileLayout from '../components/MobileLayout'

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileView, setIsMobileView] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSwitchToDesktop = () => setIsMobileView(false)

  if (isMobileView) {
    return (
      <MobileLayout onSwitchToDesktop={handleSwitchToDesktop}>
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
