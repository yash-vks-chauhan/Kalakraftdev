'use client'

import { useAuth } from '../contexts/AuthContext'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import InitialLoadingScreen from './InitialLoadingScreen'

interface AppContentWrapperProps {
  children: React.ReactNode
}

export default function AppContentWrapper({ children }: AppContentWrapperProps) {
  const { loading: authLoading } = useAuth()
  const pathname = usePathname()
  const [initialLoad, setInitialLoad] = useState(true)
  const [minLoadingComplete, setMinLoadingComplete] = useState(false)
  
  // Ensure minimum loading duration of 600ms for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingComplete(true)
    }, 600)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Mark initial load as complete once auth loading is done and minimum time has passed
  useEffect(() => {
    if (!authLoading && minLoadingComplete) {
      setInitialLoad(false)
    }
  }, [authLoading, minLoadingComplete])
  
  // Show loading screen during initial app load
  // Only show on home page and auth pages to avoid disrupting user experience on other pages
  const shouldShowLoading = initialLoad && (pathname === '/' || pathname.startsWith('/auth/'))
  
  if (shouldShowLoading) {
    return <InitialLoadingScreen message="Just a moment..." />
  }
  
  return <>{children}</>
}
