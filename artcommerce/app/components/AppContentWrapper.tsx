'use client'

import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useCallback, useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import InitialLoadingScreen from './InitialLoadingScreen'
import { DataCache } from '../../lib/dataCache'

interface AppContentWrapperProps {
  children: React.ReactNode
}

export default function AppContentWrapper({ children }: AppContentWrapperProps) {
  const { loading: authLoading, user, token } = useAuth()
  const { cartLoading } = useCart()
  const { loading: wishlistLoading } = useWishlist()

  // The head script in app/layout.tsx already decided (before first paint)
  // whether the splash should show and flagged <html data-kksplash>. We read
  // that flag so the splash is present on the very first client commit — no
  // gap where the home page could flash through.
  const [showInitialLoading, setShowInitialLoading] = useState<boolean>(() =>
    typeof document !== 'undefined' &&
    document.documentElement.hasAttribute('data-kksplash')
  )
  const [mounted, setMounted] = useState(false)
  const [allSystemsReady, setAllSystemsReady] = useState(false)
  const [dataPreloaded, setDataPreloaded] = useState(false)
  const [currentLoadingStep, setCurrentLoadingStep] = useState(0)
  const loadingStartRef = useRef(0)

  useEffect(() => setMounted(true), [])

  // Dismiss: drop the gate flag (reveals the app) and fade the splash out.
  const dismiss = useCallback(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-kksplash')
      try {
        sessionStorage.setItem('initialLoadingShown', 'true')
      } catch {}
    }
    setShowInitialLoading(false)
  }, [])

  const preloadData = async () => {
    if (DataCache.isLoaded()) {
      setDataPreloaded(true)
      return
    }

    try {
      setCurrentLoadingStep(0)
      
      const productsResponse = await fetch('/api/products')
      const productsData = await productsResponse.json()
      if (productsData.products) {
        DataCache.set('products', productsData.products)
      }

      setCurrentLoadingStep(1)
      
      const categoriesResponse = await fetch('/api/categories')
      const categoriesData = await categoriesResponse.json()
      if (categoriesData.categories) {
        DataCache.set('categories', categoriesData.categories)
      }

      setCurrentLoadingStep(2)
      
      const products = DataCache.get('products')
      if (products) {
        const featuredProducts = products
          .filter((p: any) => p.isActive && p.imageUrls && p.imageUrls.length > 0)
          .map((p: any) => ({
            ...p,
            imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : JSON.parse(p.imageUrls || '[]')
          }))
          .sort(() => Math.random() - 0.5)
          .slice(0, 8)
        
        DataCache.set('featuredProducts', featuredProducts)
      }

      setCurrentLoadingStep(3)
      
      DataCache.setLoaded(true)
      setDataPreloaded(true)
      
      const allData = DataCache.getAll()
      sessionStorage.setItem('preloadedData', JSON.stringify({
        products: allData.products,
        categories: allData.categories,
        featuredProducts: allData.featuredProducts,
        timestamp: Date.now()
      }))

    } catch (error) {
      console.error('Error preloading data:', error)
      setDataPreloaded(true)
    }
  }

  useEffect(() => {
    const cached = sessionStorage.getItem('preloadedData')
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached)
        const isRecent = Date.now() - parsedCache.timestamp < 30 * 60 * 1000
        
        if (isRecent && parsedCache.products) {
          DataCache.set('products', parsedCache.products)
          DataCache.set('categories', parsedCache.categories)
          DataCache.set('featuredProducts', parsedCache.featuredProducts)
          DataCache.setLoaded(true)
          setDataPreloaded(true)
          return
        }
      } catch (error) {
        console.error('Error parsing cached data:', error)
      }
    }
  }, [])

  useEffect(() => {
    const authReady = !authLoading
    const cartReady = !token ? true : !cartLoading
    const wishlistReady = !token ? true : !wishlistLoading
    
    if (authReady && cartReady && wishlistReady && dataPreloaded) {
      setAllSystemsReady(true)
    }
  }, [authLoading, cartLoading, wishlistLoading, token, dataPreloaded])

  // If the splash is showing (decided pre-paint), kick off the real data
  // preload and a hard fallback so it can never get stuck on screen.
  useEffect(() => {
    if (!showInitialLoading) return
    loadingStartRef.current = Date.now()
    preloadData()
    const fallbackTimer = setTimeout(() => {
      console.warn('Loading screen timeout reached - forcing hide')
      dismiss()
    }, 15000)
    return () => clearTimeout(fallbackTimer)
    // Intentionally run once on mount; showInitialLoading is fixed from init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Hold the splash for a minimum beat, then dismiss once everything is ready.
  useEffect(() => {
    if (!showInitialLoading || !allSystemsReady) return
    const elapsed = Date.now() - loadingStartRef.current
    const remaining = 1500 - elapsed
    if (remaining <= 0) {
      dismiss()
      return
    }
    const timer = setTimeout(dismiss, remaining)
    return () => clearTimeout(timer)
  }, [showInitialLoading, allSystemsReady, dismiss])

  return (
    <>
      {/* Children always render so SSR and client markup match (no hydration
          mismatch). While the splash is up they're held hidden via the
          `html[data-kksplash] [data-app-root]` CSS gate, then revealed on
          dismiss so the splash dissolves to a fully-ready page. */}
      {children}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {showInitialLoading && (
              <motion.div
                key="kalakraft-splash"
                initial={false}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: 'easeInOut' }}
                style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
              >
                <InitialLoadingScreen currentStep={currentLoadingStep} />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
