/**
 * Custom hook for intelligent image preloading
 * Fixes performance issue: Inefficient Image Preloading (loading all images immediately)
 */

import { useState, useEffect, useCallback, useRef } from 'react'

interface ImagePreloadOptions {
  // Preload images when they are within this distance from viewport
  preloadDistance?: number
  // Maximum number of images to preload simultaneously
  maxConcurrentPreloads?: number
  // Priority for first few images (immediate load)
  priorityCount?: number
  // Enable lazy loading for non-priority images
  enableLazyLoading?: boolean
}

interface ImagePreloadState {
  loadedImages: Set<string>
  preloadingImages: Set<string>
  erroredImages: Set<string>
  shouldPreload: (src: string, index: number) => boolean
  preloadImage: (src: string) => Promise<void>
  isImageLoaded: (src: string) => boolean
  hasImageErrored: (src: string) => boolean
}

export function useImagePreload(
  imageUrls: string[],
  options: ImagePreloadOptions = {}
): ImagePreloadState {
  const {
    preloadDistance = 1000,
    maxConcurrentPreloads = 3,
    priorityCount = 2,
    enableLazyLoading = true
  } = options
  
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [preloadingImages, setPreloadingImages] = useState<Set<string>>(new Set())
  const [erroredImages, setErroredImages] = useState<Set<string>>(new Set())
  
  // Keep track of preload queue
  const preloadQueue = useRef<string[]>([])
  const currentlyPreloading = useRef<number>(0)
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())
  
  // Preload a single image
  const preloadImage = useCallback(async (src: string): Promise<void> => {
    // Skip if already loaded, loading, or errored
    if (loadedImages.has(src) || preloadingImages.has(src) || erroredImages.has(src)) {
      return Promise.resolve()
    }
    
    // Check if we have too many concurrent preloads
    if (currentlyPreloading.current >= maxConcurrentPreloads) {
      // Add to queue
      if (!preloadQueue.current.includes(src)) {
        preloadQueue.current.push(src)
      }
      return Promise.resolve()
    }
    
    return new Promise((resolve) => {
      // Mark as preloading
      setPreloadingImages(prev => new Set([...prev, src]))
      currentlyPreloading.current++
      
      const img = new Image()
      imageCache.current.set(src, img)
      
      img.onload = () => {
        setLoadedImages(prev => new Set([...prev, src]))
        setPreloadingImages(prev => {
          const newSet = new Set(prev)
          newSet.delete(src)
          return newSet
        })
        currentlyPreloading.current--
        
        // Process queue
        processPreloadQueue()
        resolve()
      }
      
      img.onerror = () => {
        setErroredImages(prev => new Set([...prev, src]))
        setPreloadingImages(prev => {
          const newSet = new Set(prev)
          newSet.delete(src)
          return newSet
        })
        currentlyPreloading.current--
        
        // Process queue
        processPreloadQueue()
        resolve()
      }
      
      // Start loading
      img.src = src
    })
  }, [loadedImages, preloadingImages, erroredImages, maxConcurrentPreloads])
  
  // Process the preload queue
  const processPreloadQueue = useCallback(() => {
    while (preloadQueue.current.length > 0 && currentlyPreloading.current < maxConcurrentPreloads) {
      const nextSrc = preloadQueue.current.shift()
      if (nextSrc) {
        preloadImage(nextSrc)
      }
    }
  }, [preloadImage, maxConcurrentPreloads])
  
  // Determine if an image should be preloaded
  const shouldPreload = useCallback((src: string, index: number): boolean => {
    // Always preload priority images immediately
    if (index < priorityCount) {
      return true
    }
    
    // For lazy loading, only preload when requested
    if (enableLazyLoading) {
      return loadedImages.has(src) || preloadingImages.has(src)
    }
    
    // If lazy loading disabled, preload all
    return true
  }, [priorityCount, enableLazyLoading, loadedImages, preloadingImages])
  
  // Preload priority images immediately
  useEffect(() => {
    const priorityImages = imageUrls.slice(0, priorityCount)
    priorityImages.forEach(src => {
      if (src) {
        preloadImage(src)
      }
    })
  }, [imageUrls, priorityCount, preloadImage])
  
  // Utility functions
  const isImageLoaded = useCallback((src: string): boolean => {
    return loadedImages.has(src)
  }, [loadedImages])
  
  const hasImageErrored = useCallback((src: string): boolean => {
    return erroredImages.has(src)
  }, [erroredImages])
  
  // Enhanced cleanup on unmount and URL changes
  useEffect(() => {
    return () => {
      // Cancel all pending image loads and clean up event listeners
      imageCache.current.forEach(img => {
        img.onload = null
        img.onerror = null
        // Force garbage collection of image references
        img.src = ''
      })
      imageCache.current.clear()
      preloadQueue.current = []
      currentlyPreloading.current = 0
      
      // Clear state to prevent memory leaks
      setLoadedImages(new Set())
      setPreloadingImages(new Set())
      setErroredImages(new Set())
    }
  }, [])

  // Clean up on imageUrls change to prevent stale references
  useEffect(() => {
    // Clean up images that are no longer needed
    const currentImageSet = new Set(imageUrls)
    imageCache.current.forEach((img, src) => {
      if (!currentImageSet.has(src)) {
        img.onload = null
        img.onerror = null
        img.src = ''
        imageCache.current.delete(src)
      }
    })
    
    // Update loaded images to only include current URLs
    setLoadedImages(prev => {
      const newSet = new Set<string>()
      prev.forEach(src => {
        if (currentImageSet.has(src)) {
          newSet.add(src)
        }
      })
      return newSet
    })
    
    setPreloadingImages(prev => {
      const newSet = new Set<string>()
      prev.forEach(src => {
        if (currentImageSet.has(src)) {
          newSet.add(src)
        }
      })
      return newSet
    })
    
    setErroredImages(prev => {
      const newSet = new Set<string>()
      prev.forEach(src => {
        if (currentImageSet.has(src)) {
          newSet.add(src)
        }
      })
      return newSet
    })
  }, [imageUrls])
  
  return {
    loadedImages,
    preloadingImages,
    erroredImages,
    shouldPreload,
    preloadImage,
    isImageLoaded,
    hasImageErrored
  }
}

// Hook for intersection observer-based image loading
export function useIntersectionImagePreload(
  imageUrls: string[],
  options: ImagePreloadOptions & { rootMargin?: string } = {}
) {
  const { rootMargin = '200px', ...preloadOptions } = options
  const imagePreload = useImagePreload(imageUrls, preloadOptions)
  const observedElements = useRef<Map<Element, string>>(new Map())
  const observer = useRef<IntersectionObserver>()
  
  // Initialize intersection observer with enhanced cleanup
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const src = observedElements.current.get(entry.target)
          if (src && entry.isIntersecting) {
            imagePreload.preloadImage(src)
            observer.current?.unobserve(entry.target)
            observedElements.current.delete(entry.target)
          }
        })
      },
      { rootMargin }
    )
    
    return () => {
      // Enhanced cleanup for intersection observer
      if (observer.current) {
        observer.current.disconnect()
        observer.current = undefined
      }
      
      // Clear all observed elements to prevent memory leaks
      observedElements.current.forEach((_, element) => {
        // Make sure to unobserve any remaining elements
        if (observer.current) {
          observer.current.unobserve(element)
        }
      })
      observedElements.current.clear()
    }
  }, [rootMargin, imagePreload])

  // Clean up observed elements when imageUrls change
  useEffect(() => {
    const currentImageSet = new Set(imageUrls)
    
    // Remove observers for images no longer in the list
    observedElements.current.forEach((src, element) => {
      if (!currentImageSet.has(src)) {
        observer.current?.unobserve(element)
        observedElements.current.delete(element)
      }
    })
  }, [imageUrls])
  
  // Function to observe an element for image preloading
  const observeElement = useCallback((element: Element, src: string) => {
    if (observer.current && !observedElements.current.has(element)) {
      observedElements.current.set(element, src)
      observer.current.observe(element)
    }
  }, [])
  
  return {
    ...imagePreload,
    observeElement
  }
}
