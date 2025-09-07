'use client'

import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
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
  const loadingStartRef = useRef(0)

  // Determine when critical systems are ready (more lenient approach)
  useEffect(() => {
    const authReady = !authLoading
    // For non-authenticated users, cart and wishlist don't need to be loaded
    const cartReady = !token ? true : !cartLoading
    const wishlistReady = !token ? true : !wishlistLoading
    
    if (authReady && cartReady && wishlistReady) {
      setAllSystemsReady(true)
    }
  }, [authLoading, cartLoading, wishlistLoading, token])

  // Show loading screen on first home page render
  useEffect(() => {
    const hasShown = sessionStorage.getItem('initialLoadingShown')
    const lastShown = localStorage.getItem('lastLoadingScreenShown')
    const now = Date.now()
    
    // Only show if not shown in this session AND not shown in last 24 hours
    const shouldShow = pathname === '/' && !hasShown && 
      (!lastShown || (now - parseInt(lastShown)) > 24 * 60 * 60 * 1000)
    
    if (shouldShow) {
      setShowInitialLoading(true)
      loadingStartRef.current = Date.now()
      localStorage.setItem('lastLoadingScreenShown', now.toString())
      
      // Fallback timeout to prevent infinite loading
      const fallbackTimer = setTimeout(() => {
        setShowInitialLoading(false)
        sessionStorage.setItem('initialLoadingShown', 'true')
        console.warn('Loading screen timeout reached - forcing hide')
      }, 8000) // 8 second maximum
      
      return () => clearTimeout(fallbackTimer)
    }
  }, [pathname])

  // Ensure minimum display time (1.5s) and all systems ready before hiding loading screen
  useEffect(() => {
    if (showInitialLoading && allSystemsReady) {
      const elapsed = Date.now() - loadingStartRef.current
      const minimum = 1500 // Reduced from 5000ms to 1500ms
      const remaining = minimum - elapsed
      if (remaining <= 0) {
        setShowInitialLoading(false)
        sessionStorage.setItem('initialLoadingShown', 'true')
      } else {
        const timer = setTimeout(() => {
          setShowInitialLoading(false)
          sessionStorage.setItem('initialLoadingShown', 'true')
        }, remaining)
        return () => clearTimeout(timer)
      }
    }
  }, [showInitialLoading, allSystemsReady])

  if (showInitialLoading) {
    return <InitialLoadingScreen />
  }

  return <>{children}</>
}
