'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import MobileNavbar from './components/mobile/MobileNavbar'
import MobileFooter from './components/mobile/MobileFooter'
import ErrorBoundary from './components/ErrorBoundary'

interface MobileLayoutProps {
  children: React.ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const pathname = usePathname()

  // Handle client-side initialization
  useEffect(() => {
    setIsClient(true)
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

  // Show a loading state during SSR
  if (!isClient) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#fff'
      }}>
        <div style={{
          textAlign: 'center',
          fontSize: '16px',
          color: '#666'
        }}>
          Loading...
        </div>
      </div>
    )
  }

  // If not mobile, just render children without mobile-specific components
  if (!isMobile) {
    return <ErrorBoundary>{children}</ErrorBoundary>
  }

  return (
    <ErrorBoundary>
      <div className="mobile-layout">
        <MobileNavbar />
        <main className="mobile-content">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
        <MobileFooter />
      </div>
    </ErrorBoundary>
  )
} 