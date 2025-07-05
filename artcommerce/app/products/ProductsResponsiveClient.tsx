'use client'

import { useState, useEffect } from 'react'
import ProductsClient from './ProductsClient'
import ProductsMobileClient from './ProductsMobileClient'

export default function ProductsResponsiveClient() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile ? <ProductsMobileClient /> : <ProductsClient />
} 