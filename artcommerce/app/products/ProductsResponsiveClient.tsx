'use client'

import { useState, useEffect } from 'react'
import ProductsClient from './ProductsClient'
import ProductsMobileClient from './ProductsMobileClient'
import OptimizedMobileSkeleton from './OptimizedMobileSkeleton'
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
    return <OptimizedMobileSkeleton mode="initial" />
  }

  return isMobile ? <ProductsMobileClient /> : <ProductsClient />
} 