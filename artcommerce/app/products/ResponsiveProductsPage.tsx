'use client'

import { useState, useEffect } from 'react'

interface ResponsiveProductsPageProps {
  DesktopComponent: React.ComponentType
  MobileComponent: React.ComponentType
}

export default function ResponsiveProductsPage({
  DesktopComponent,
  MobileComponent
}: ResponsiveProductsPageProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

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

  // Show a loading state during SSR and initial client-side render
  if (!isClient) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px'
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

  // After hydration, render the appropriate component based on screen size
  return isMobile ? <MobileComponent /> : <DesktopComponent />
} 