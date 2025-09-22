import { useState, useEffect, useCallback } from 'react'
import { isMobileDevice } from '@/lib/utils'

interface DeviceState {
  isMobile: boolean
  forceDesktopView: boolean
  isSmallScreen: boolean
}

interface DeviceDetection extends DeviceState {
  switchToDesktopView: () => void
  switchToMobileView: () => void
}

export function useDeviceDetection(mobileOnlyRoute = false): DeviceDetection {
  const [deviceState, setDeviceState] = useState<DeviceState>({
    isMobile: false,
    forceDesktopView: false,
    isSmallScreen: false,
  })

  const switchToDesktopView = useCallback(() => {
    if (!mobileOnlyRoute) {
      setDeviceState(prev => ({ ...prev, forceDesktopView: true, isMobile: false }))
      localStorage.setItem('viewPreference', 'desktop')
    }
  }, [mobileOnlyRoute])

  const switchToMobileView = useCallback(() => {
    setDeviceState(prev => ({ ...prev, forceDesktopView: false, isMobile: true }))
    localStorage.setItem('viewPreference', 'mobile')
  }, [])

  useEffect(() => {
    const checkDevice = () => {
      try {
        // Check if user has a preference saved
        const savedViewPreference = localStorage.getItem('viewPreference')
        const isSmallScreen = window.innerWidth <= 1024
        const mobileDetected = isMobileDevice()

        // Handle mobile-only routes
        if (mobileOnlyRoute) {
          setDeviceState({
            isMobile: true,
            forceDesktopView: false,
            isSmallScreen,
          })
          return
        }

        // Handle desktop preference
        if (!mobileOnlyRoute && savedViewPreference === 'desktop') {
          setDeviceState({
            isMobile: false,
            forceDesktopView: true,
            isSmallScreen,
          })
          return
        }

        // Clear invalid desktop preference on mobile
        if (mobileDetected && savedViewPreference === 'desktop') {
          localStorage.removeItem('viewPreference')
        }

        setDeviceState({
          isMobile: mobileDetected,
          forceDesktopView: false,
          isSmallScreen,
        })
      } catch (error) {
        console.error('Error in device detection:', error)
        // Fallback to basic detection
        const fallbackMobile = window.innerWidth <= 1024
        setDeviceState({
          isMobile: fallbackMobile,
          forceDesktopView: false,
          isSmallScreen: fallbackMobile,
        })
      }
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)

    return () => {
      window.removeEventListener('resize', checkDevice)
    }
  }, [mobileOnlyRoute])

  // Handle mobile-only routes
  useEffect(() => {
    if (mobileOnlyRoute && deviceState.forceDesktopView) {
      switchToMobileView()
    }
  }, [mobileOnlyRoute, deviceState.forceDesktopView, switchToMobileView])

  return {
    ...deviceState,
    switchToDesktopView,
    switchToMobileView,
  }
}
