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
  const [forceReady, setForceReady] = useState(false)
  
  // Check if all systems are ready
  useEffect(() => {
    // Auth is ready when we have user data OR when loading is complete and no user
    // This handles cases where authLoading might be stuck but we have valid user data
    const authReady = (!authLoading) || (token && user)
    
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
      hasUser: !!user,
      authReadyReason: (!authLoading) ? 'not loading' : (token && user) ? 'has token and user' : 'waiting'
    })
    
    // All systems are ready OR force ready is triggered
    if ((authReady && cartReady && wishlistReady) || forceReady) {
      console.log('All systems ready!', forceReady ? '(forced)' : '(natural)')
      setAllSystemsReady(true)
    } else {
      console.log('Systems not ready yet:', {
        authReady,
        cartReady,
        wishlistReady
      })
    }
  }, [authLoading, cartLoading, wishlistLoading, token, user, forceReady])
  
  // Force ready after 3 seconds if contexts are stuck
  useEffect(() => {
    const forceTimer = setTimeout(() => {
      if (!allSystemsReady && (token && user)) {
        console.log('Forcing systems ready due to timeout with valid auth')
        setForceReady(true)
      }
    }, 3000) // Force after 3 seconds if we have valid auth but contexts are stuck
    
    return () => clearTimeout(forceTimer)
  }, [allSystemsReady, token, user])
  
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
