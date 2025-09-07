'use client'

import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import InitialLoadingScreen from './InitialLoadingScreen'

interface AppContentWrapperProps {
  children: React.ReactNode
}

export default function AppContentWrapper({ children }: AppContentWrapperProps) {
  const { loading: authLoading } = useAuth()
  const pathname = usePathname()
  const [showInitialLoading, setShowInitialLoading] = useState(false)
  const [loadingComplete, setLoadingComplete] = useState(false)
  
  // Simplified approach: Show loading for minimum time to ensure all contexts initialize
  useEffect(() => {
    const hasShownLoading = sessionStorage.getItem('initialLoadingShown')
    const isHomePage = pathname === '/'
    
    if (isHomePage && !hasShownLoading) {
      setShowInitialLoading(true)
      
      // Wait for auth to complete AND minimum time for contexts to initialize
      const checkComplete = () => {
        if (!authLoading) {
          // Auth is done, now wait additional time for contexts to fully initialize
          setTimeout(() => {
            setLoadingComplete(true)
            setShowInitialLoading(false)
            sessionStorage.setItem('initialLoadingShown', 'true')
          }, 1200) // Extra time for cart/wishlist to initialize
        }
      }
      
      // Check immediately and set up interval
      checkComplete()
      const interval = setInterval(checkComplete, 100)
      
      // Cleanup
      return () => clearInterval(interval)
    } else {
      setShowInitialLoading(false)
      setLoadingComplete(true)
    }
  }, [pathname, authLoading])
  
  if (showInitialLoading) {
    return <InitialLoadingScreen />
  }
  
  return <>{children}</>
}
