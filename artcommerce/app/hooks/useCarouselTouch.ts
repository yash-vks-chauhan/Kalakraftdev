import { useRef, useState, useCallback, useEffect } from 'react'

interface CarouselTouchState {
  startX: number
  scrollLeft: number
  isDragging: boolean
}

export function useCarouselTouch() {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [touchState, setTouchState] = useState<CarouselTouchState>({
    startX: 0,
    scrollLeft: 0,
    isDragging: false,
  })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!carouselRef.current) return
    
    const startX = e.pageX - carouselRef.current.offsetLeft
    const scrollLeft = carouselRef.current.scrollLeft
    
    setTouchState({
      startX,
      scrollLeft,
      isDragging: true,
    })
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!touchState.isDragging || !carouselRef.current) return
    
    e.preventDefault()
    const x = e.pageX - carouselRef.current.offsetLeft
    const walk = (x - touchState.startX) * 2 // Scroll speed multiplier
    carouselRef.current.scrollLeft = touchState.scrollLeft - walk
  }, [touchState.isDragging, touchState.startX, touchState.scrollLeft])

  const handleMouseUp = useCallback(() => {
    setTouchState(prev => ({ ...prev, isDragging: false }))
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!carouselRef.current) return
    
    const startX = e.touches[0].pageX - carouselRef.current.offsetLeft
    const scrollLeft = carouselRef.current.scrollLeft
    
    setTouchState({
      startX,
      scrollLeft,
      isDragging: true,
    })
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.isDragging || !carouselRef.current) return
    
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft
    const walk = (x - touchState.startX) * 2
    carouselRef.current.scrollLeft = touchState.scrollLeft - walk
  }, [touchState.isDragging, touchState.startX, touchState.scrollLeft])

  const handleTouchEnd = useCallback(() => {
    setTouchState(prev => ({ ...prev, isDragging: false }))
  }, [])

  // Clean up event listeners
  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    const handleGlobalMouseUp = () => {
      setTouchState(prev => ({ ...prev, isDragging: false }))
    }

    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('mouseleave', handleGlobalMouseUp)

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('mouseleave', handleGlobalMouseUp)
    }
  }, [])

  return {
    carouselRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isDragging: touchState.isDragging,
  }
}
