'use client'

import { useState, useEffect } from 'react'
import ProductsClient from './ProductsClient'
import ProductsMobileClient from './ProductsMobileClient'
import { isMobileDevice } from '../../lib/utils'

export default function ProductsResponsiveClient() {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      try {
        setIsMobile(isMobileDevice())
      } catch (error) {
        console.error('Error in mobile detection:', error)
        // Fallback to basic detection
        setIsMobile(window.innerWidth <= 1024)
      }
    }
    
    // Set mounted to true after component mounts
    setMounted(true)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        fontSize: '16px',
        color: '#666'
      }}>
        Loading products…
      </div>
    )
  }

  return isMobile ? <ProductsMobileClient /> : <ProductsClient />
} 