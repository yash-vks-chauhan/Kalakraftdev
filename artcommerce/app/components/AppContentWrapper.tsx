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
  const { loading: authLoading, user } = useAuth()
  const { cartItems, loading: cartLoading } = useCart()
  const { wishlistItems, loading: wishlistLoading } = useWishlist()
  const pathname = usePathname()
  const [showInitialLoading, setShowInitialLoading] = useState(false)
  const [minLoadingComplete, setMinLoadingComplete] = useState(false)
  const [systemsInitialized, setSystemsInitialized] = useState(false)
  
  // Check if all systems are properly initialized
  useEffect(() => {
    // Auth is ready when either user is loaded or we know there's no user
    const authReady = !authLoading
    
    // Cart and wishlist are ready when they're not loading
    // (They should initialize even for non-authenticated users)
    const cartReady = !cartLoading
    const wishlistReady = !wishlistLoading
    
    // All systems are initialized
    if (authReady && cartReady && wishlistReady) {
      setSystemsInitialized(true)
    }
  }, [authLoading, cartLoading, wishlistLoading, user])
  
  // Check if we should show initial loading screen
  useEffect(() => {
    // Only show loading on home page and only if we haven't shown it in this session
    const hasShownLoading = sessionStorage.getItem('initialLoadingShown')
    const isHomePage = pathname === '/'
    
    if (isHomePage && !hasShownLoading && !systemsInitialized) {
      setShowInitialLoading(true)
      
      // Set minimum loading duration for better UX
      const timer = setTimeout(() => {
        setMinLoadingComplete(true)
      }, 800) // Slightly longer for art-themed animation
      
      return () => clearTimeout(timer)
    } else {
      setShowInitialLoading(false)
      setMinLoadingComplete(true)
    }
  }, [pathname, systemsInitialized])
  
  // Hide loading when all systems are ready and minimum time has passed
  useEffect(() => {
    if (showInitialLoading && systemsInitialized && minLoadingComplete) {
      setShowInitialLoading(false)
      // Mark that we've shown the initial loading in this session
      sessionStorage.setItem('initialLoadingShown', 'true')
    }
  }, [showInitialLoading, systemsInitialized, minLoadingComplete])
  
  if (showInitialLoading) {
    return <InitialLoadingScreen />
  }
  
  return <>{children}</>
}
