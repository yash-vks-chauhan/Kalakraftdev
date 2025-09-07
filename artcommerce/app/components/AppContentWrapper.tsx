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
  const loadingStartRef = useRef<number>(0)

  // Show loading screen on first home page render
  useEffect(() => {
    const hasShown = sessionStorage.getItem('initialLoadingShown')
    if (pathname === '/' && !hasShown) {
      setShowInitialLoading(true)
      loadingStartRef.current = Date.now()
    }
  }, [pathname])

  // Determine when all systems are ready
  useEffect(() => {
    const authReady = !authLoading || (token && user)
    const cartReady = token && user ? !cartLoading : true
    const wishlistReady = token && user ? !wishlistLoading : true
    if (authReady && cartReady && wishlistReady) {
      setAllSystemsReady(true)
    }
  }, [authLoading, cartLoading, wishlistLoading, token, user])

  // Hide loading when all systems are ready AND minimum display time has passed
  useEffect(() => {
    if (showInitialLoading && allSystemsReady) {
      const minDisplayTime = 6000 // 4 steps × 1500ms
      const elapsed = Date.now() - loadingStartRef.current
      if (elapsed >= minDisplayTime) {
        setShowInitialLoading(false)
        sessionStorage.setItem('initialLoadingShown', 'true')
      } else {
        const timer = setTimeout(() => {
          setShowInitialLoading(false)
          sessionStorage.setItem('initialLoadingShown', 'true')
        }, minDisplayTime - elapsed)
        return () => clearTimeout(timer)
      }
    }
  }, [showInitialLoading, allSystemsReady])

  if (showInitialLoading) {
    return <InitialLoadingScreen />
  }

  return <>{children}</>
}
