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
  const { loading: authLoading, user, token } = useAuth()
  const { cartLoading } = useCart()
  const { loading: wishlistLoading } = useWishlist()
  const pathname = usePathname()
  const [showInitialLoading, setShowInitialLoading] = useState(false)
  const [allSystemsReady, setAllSystemsReady] = useState(false)
  
  // Check if all systems are ready
  useEffect(() => {
    // Auth is ready when not loading
    const authReady = !authLoading
    
    // For authenticated users, wait for cart and wishlist to load
    // For non-authenticated users, they should be ready immediately
    let cartReady = true
    let wishlistReady = true
    
    if (token && user) {
      // User is authenticated, wait for actual data loading
      cartReady = !cartLoading
      wishlistReady = !wishlistLoading
    }
    
    console.log('System status:', {
      authReady,
      authLoading,
      cartReady,
      cartLoading,
      wishlistReady,
      wishlistLoading,
      hasToken: !!token,
      hasUser: !!user
    })
    
    // All systems are ready
    if (authReady && cartReady && wishlistReady) {
      console.log('All systems ready!')
      setAllSystemsReady(true)
    }
  }, [authLoading, cartLoading, wishlistLoading, token, user])
  
  // Control loading screen display
  useEffect(() => {
    const hasShownLoading = sessionStorage.getItem('initialLoadingShown')
    const isHomePage = pathname === '/'
    
    if (isHomePage && !hasShownLoading) {
      setShowInitialLoading(true)
      
      // Fallback timeout to prevent infinite loading (max 5 seconds)
      const fallbackTimer = setTimeout(() => {
        console.log('Fallback timeout reached, forcing completion')
        setShowInitialLoading(false)
        sessionStorage.setItem('initialLoadingShown', 'true')
      }, 5000)
      
      // Wait for all systems to be ready with minimum display time
      if (allSystemsReady) {
        // Add minimum display time for better UX
        setTimeout(() => {
          clearTimeout(fallbackTimer)
          setShowInitialLoading(false)
          sessionStorage.setItem('initialLoadingShown', 'true')
        }, 1000) // Minimum time to see the loading animation
      }
      
      return () => clearTimeout(fallbackTimer)
    } else {
      setShowInitialLoading(false)
    }
  }, [pathname, allSystemsReady])
  
  if (showInitialLoading) {
    return <InitialLoadingScreen />
  }
  
  return <>{children}</>
}
