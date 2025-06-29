'use client'

import { useState, useEffect } from 'react'
import DesktopCartPage from './DesktopCartPage'
import MobileCart from '../components/mobile/MobileCart'

export default function ResponsiveCartPage() {
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

  return isMobile ? <MobileCart /> : <DesktopCartPage />
} 