'use client'

import { useState, useEffect } from 'react'

interface ResponsiveProductDetailProps {
  DesktopComponent: React.ComponentType
  MobileComponent: React.ComponentType
}

export default function ResponsiveProductDetail({
  DesktopComponent,
  MobileComponent
}: ResponsiveProductDetailProps) {
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

  // During SSR or before hydration, render a placeholder or the desktop version
  if (!isClient) {
    return null
  }

  // After hydration, render the appropriate component based on screen size
  return isMobile ? <MobileComponent /> : <DesktopComponent />
} 