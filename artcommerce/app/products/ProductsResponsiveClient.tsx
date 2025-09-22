'use client'

import { useState, useEffect } from 'react'
import ProductsClient from './ProductsClient'
import ProductsMobileClient from './ProductsMobileClient'
import { useDeviceDetection } from '../hooks/useDeviceDetection'

export default function ProductsResponsiveClient() {
  const [mounted, setMounted] = useState(false)
  
  // Use optimized device detection hook
  const { isMobile } = useDeviceDetection()

  useEffect(() => {
    // Set mounted to true after component mounts
    setMounted(true)
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