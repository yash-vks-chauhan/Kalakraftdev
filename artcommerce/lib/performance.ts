// Performance utility for detecting device capabilities
export const getDevicePerformanceLevel = () => {
  // Check if we're in browser environment
  if (typeof window === 'undefined') return 'medium'
  
  let performanceLevel = 'medium'
  
  try {
    // Check RAM (if available)
    const ram = (navigator as any).deviceMemory
    if (ram) {
      if (ram >= 8) performanceLevel = 'high'
      else if (ram >= 4) performanceLevel = 'medium'
      else performanceLevel = 'low'
    }
    
    // Check CPU cores (if available)
    const cores = navigator.hardwareConcurrency
    if (cores && cores < 4 && performanceLevel !== 'low') {
      performanceLevel = 'medium'
    }
    
    // Check connection speed
    const connection = (navigator as any).connection
    if (connection && (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g')) {
      performanceLevel = 'low'
    }
    
    // Check battery level
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level < 0.2) {
          document.body.classList.add('low-battery')
        }
      }).catch(() => {
        // Ignore battery API errors
      })
    }
    
  } catch (error) {
    console.warn('Performance detection failed:', error)
  }
  
  return performanceLevel
}

export const getOptimizedAnimationConfig = (performanceLevel: string, isTouchDevice: boolean) => {
  const baseConfig = {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1]
  }
  
  switch (performanceLevel) {
    case 'high':
      return {
        ...baseConfig,
        type: 'spring',
        stiffness: 400,
        damping: 25
      }
    case 'medium':
      return {
        ...baseConfig,
        type: isTouchDevice ? 'tween' : 'spring',
        stiffness: 300,
        damping: 30
      }
    case 'low':
      return {
        duration: 0.15,
        ease: 'easeOut',
        type: 'tween'
      }
    default:
      return baseConfig
  }
}

export const shouldUseReducedAnimations = () => {
  // Check user preference for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true
  }
  
  // Check if low battery mode is active
  if (document.body.classList.contains('low-battery')) {
    return true
  }
  
  return false
}

export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}
