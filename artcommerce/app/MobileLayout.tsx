'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import MobileNavbar from './components/mobile/MobileNavbar'
import MobileFooter from './components/mobile/MobileFooter'

interface MobileLayoutProps {
  children: React.ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  // Detect mobile device on client side
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkMobile()
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // If not mobile, just render children without mobile-specific components
  if (!isMobile) {
    return <>{children}</>
  }

  return (
    <div className="mobile-layout">
      <MobileNavbar />
      <main className="mobile-content">
        {children}
      </main>
      <MobileFooter />
    </div>
  )
} 