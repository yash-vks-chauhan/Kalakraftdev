/**
 * Custom hook for optimized scroll handling
 * Fixes performance issue: Heavy Scroll Event Processing (re-renders on every scroll)
 */

import { useState, useEffect, useRef, useCallback } from 'react'

interface ScrollState {
  scrollY: number
  scrollDirection: 'up' | 'down' | 'idle'
  isScrolling: boolean
  scrollProgress: number // 0-1 representing page scroll progress
}

interface ScrollOptions {
  // Throttle scroll events (ms)
  throttleMs?: number
  // Debounce scroll end detection (ms)
  debounceMs?: number
  // Enable scroll direction detection
  trackDirection?: boolean
  // Enable scroll progress calculation
  trackProgress?: boolean
  // Minimum scroll distance to trigger direction change
  directionThreshold?: number
}

interface OptimizedScrollHook {
  scrollState: ScrollState
  // Element-specific scroll utilities
  isElementVisible: (element: Element) => boolean
  getElementVisibility: (element: Element) => {
    isVisible: boolean
    visibilityRatio: number
    distanceFromCenter: number
  }
  // Scroll-based animation helpers
  getScrollAnimation: (element: Element) => {
    opacity: number
    scale: number
    translateY: number
  }
}

export function useOptimizedScroll(options: ScrollOptions = {}): OptimizedScrollHook {
  const {
    throttleMs = 16, // 60fps
    debounceMs = 150,
    trackDirection = true,
    trackProgress = true,
    directionThreshold = 5
  } = options
  
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollY: 0,
    scrollDirection: 'idle',
    isScrolling: false,
    scrollProgress: 0
  })
  
  // Refs for optimization
  const lastScrollY = useRef(0)
  const lastScrollTime = useRef(0)
  const scrollTimeout = useRef<NodeJS.Timeout>()
  const animationFrame = useRef<number>()
  
  // Throttled scroll handler
  const handleScroll = useCallback(() => {
    const now = Date.now()
    
    // Throttle scroll events
    if (now - lastScrollTime.current < throttleMs) {
      return
    }
    lastScrollTime.current = now
    
    // Cancel previous animation frame
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current)
    }
    
    // Schedule update for next frame
    animationFrame.current = requestAnimationFrame(() => {
      const currentScrollY = window.scrollY
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight
      
      // Calculate scroll direction
      let direction: 'up' | 'down' | 'idle' = 'idle'
      if (trackDirection) {
        const scrollDiff = currentScrollY - lastScrollY.current
        if (Math.abs(scrollDiff) > directionThreshold) {
          direction = scrollDiff > 0 ? 'down' : 'up'
        }
      }
      
      // Calculate scroll progress
      const progress = trackProgress && documentHeight > 0 
        ? Math.min(Math.max(currentScrollY / documentHeight, 0), 1)
        : 0
      
      // Update state
      setScrollState({
        scrollY: currentScrollY,
        scrollDirection: direction,
        isScrolling: true,
        scrollProgress: progress
      })
      
      lastScrollY.current = currentScrollY
      
      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
      
      // Set scroll end detection
      scrollTimeout.current = setTimeout(() => {
        setScrollState(prev => ({
          ...prev,
          isScrolling: false,
          scrollDirection: 'idle'
        }))
      }, debounceMs)
    })
  }, [throttleMs, debounceMs, trackDirection, trackProgress, directionThreshold])
  
  // Attach scroll listener with enhanced cleanup
  useEffect(() => {
    // Initialize scroll state
    const initialScrollY = window.scrollY
    const initialDocumentHeight = document.documentElement.scrollHeight - window.innerHeight
    const initialProgress = trackProgress && initialDocumentHeight > 0 
      ? Math.min(Math.max(initialScrollY / initialDocumentHeight, 0), 1)
      : 0
    
    setScrollState({
      scrollY: initialScrollY,
      scrollDirection: 'idle',
      isScrolling: false,
      scrollProgress: initialProgress
    })
    
    lastScrollY.current = initialScrollY
    
    // Add event listener with passive option for better performance
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      // Enhanced cleanup
      window.removeEventListener('scroll', handleScroll)
      
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
        scrollTimeout.current = undefined
      }
      
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
        animationFrame.current = undefined
      }
      
      // Reset refs to prevent stale closures
      lastScrollY.current = 0
      lastScrollTime.current = 0
    }
  }, [handleScroll, trackProgress])
  
  // Check if element is visible in viewport
  const isElementVisible = useCallback((element: Element): boolean => {
    const rect = element.getBoundingClientRect()
    return (
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0
    )
  }, [])
  
  // Get detailed element visibility information
  const getElementVisibility = useCallback((element: Element) => {
    const rect = element.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const windowWidth = window.innerWidth
    
    // Check if element is visible
    const isVisible = (
      rect.top < windowHeight &&
      rect.bottom > 0 &&
      rect.left < windowWidth &&
      rect.right > 0
    )
    
    // Calculate visibility ratio (0-1)
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0)
    const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0)
    const visibilityRatio = isVisible 
      ? (visibleHeight * visibleWidth) / (rect.height * rect.width)
      : 0
    
    // Calculate distance from viewport center
    const elementCenterY = rect.top + rect.height / 2
    const viewportCenterY = windowHeight / 2
    const distanceFromCenter = Math.abs(elementCenterY - viewportCenterY)
    
    return {
      isVisible,
      visibilityRatio: Math.min(Math.max(visibilityRatio, 0), 1),
      distanceFromCenter
    }
  }, [])
  
  // Get scroll-based animation values for an element
  const getScrollAnimation = useCallback((element: Element) => {
    const visibility = getElementVisibility(element)
    
    if (!visibility.isVisible) {
      return {
        opacity: 0.6,
        scale: 0.9,
        translateY: 20
      }
    }
    
    // Base animation on distance from center
    const maxDistance = window.innerHeight / 2
    const normalizedDistance = Math.min(visibility.distanceFromCenter / maxDistance, 1)
    
    // Calculate animation values
    const opacity = Math.max(0.6, 1 - normalizedDistance * 0.4)
    const scale = Math.max(0.9, 1 - normalizedDistance * 0.1)
    const translateY = normalizedDistance * 20
    
    return {
      opacity,
      scale,
      translateY
    }
  }, [getElementVisibility])
  
  return {
    scrollState,
    isElementVisible,
    getElementVisibility,
    getScrollAnimation
  }
}

// Specialized hook for scroll-based card animations
export function useScrollCardAnimations() {
  const { scrollState, getScrollAnimation } = useOptimizedScroll({
    throttleMs: 16,
    trackDirection: false,
    trackProgress: false
  })
  
  // Apply animations to a container's child elements
  const applyCardAnimations = useCallback((containerRef: React.RefObject<HTMLElement>) => {
    if (!containerRef.current) return
    
    const cards = containerRef.current.querySelectorAll('[data-animate-on-scroll]')
    
    cards.forEach((card) => {
      const animation = getScrollAnimation(card)
      const element = card as HTMLElement
      
      element.style.transform = `scale(${animation.scale}) translateY(${animation.translateY}px)`
      element.style.opacity = animation.opacity.toString()
    })
  }, [getScrollAnimation])
  
  return {
    scrollState,
    applyCardAnimations,
    getScrollAnimation
  }
}
