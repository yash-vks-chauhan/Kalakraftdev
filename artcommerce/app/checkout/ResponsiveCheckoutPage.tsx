'use client'

import { useState, useEffect } from 'react'
import DesktopCheckoutPage from './DesktopCheckoutPage'
import MobileCheckout from '../components/mobile/MobileCheckout'

export default function ResponsiveCheckoutPage() {
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)

    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])

  if (!isClient) {
    return null
  }

  return isMobile ? <MobileCheckout /> : <DesktopCheckoutPage />
} 