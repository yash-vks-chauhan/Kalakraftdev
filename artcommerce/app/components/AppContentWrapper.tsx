'use client'

import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import InitialLoadingScreen from './InitialLoadingScreen'
import { DataCache } from '../../lib/dataCache'

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
  const [dataPreloaded, setDataPreloaded] = useState(false)
  const [currentLoadingStep, setCurrentLoadingStep] = useState(0)
  const loadingStartRef = useRef(0)

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

  useEffect(() => {
    const hasShown = sessionStorage.getItem('initialLoadingShown')
    const lastShown = localStorage.getItem('lastLoadingScreenShown')
    const now = Date.now()
    
    const shouldShow = pathname === '/' && !hasShown && 
      (!lastShown || (now - parseInt(lastShown)) > 24 * 60 * 60 * 1000)
    
    if (shouldShow) {
      setShowInitialLoading(true)
      loadingStartRef.current = Date.now()
      localStorage.setItem('lastLoadingScreenShown', now.toString())
      
      preloadData()
      
      const fallbackTimer = setTimeout(() => {
        setShowInitialLoading(false)
        sessionStorage.setItem('initialLoadingShown', 'true')
        console.warn('Loading screen timeout reached - forcing hide')
      }, 15000)
      
      return () => clearTimeout(fallbackTimer)
    }
  }, [pathname])

  useEffect(() => {
    if (showInitialLoading && allSystemsReady) {
      const elapsed = Date.now() - loadingStartRef.current
      const minimum = 1500
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
    return <InitialLoadingScreen currentStep={currentLoadingStep} />
  }

  return <>{children}</>
}
