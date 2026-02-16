/**
 * Custom hook for virtual scrolling of product lists
 * Fixes performance issue: DOM bloat with large product lists (100+ items)
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

interface VirtualScrollOptions {
  // Height of each item in pixels
  itemHeight: number
  // Container height in pixels
  containerHeight: number
  // Number of items to render outside visible area (buffer)
  overscan?: number
  // Enable horizontal scrolling
  horizontal?: boolean
}

interface VirtualScrollResult<T> {
  // Items to render (only visible + buffer items)
  visibleItems: Array<T & { index: number; style: React.CSSProperties }>
  // Container style (total height/width for scrollbar)
  containerStyle: React.CSSProperties
  // Scroll element ref to attach to container
  scrollElementRef: React.RefObject<HTMLDivElement>
  // Function to scroll to specific item
  scrollToItem: (index: number) => void
  // Current scroll position info
  scrollInfo: {
    startIndex: number
    endIndex: number
    isScrolling: boolean
  }
}

export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollResult<T> {
  const {
    itemHeight,
    containerHeight,
    overscan = 3,
    horizontal = false
  } = options
  
  const [scrollTop, setScrollTop] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollElementRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()
  const frameRef = useRef<number>()
  
  // Calculate visible range
  const { startIndex, endIndex } = useMemo(() => {
    if (!items.length) return { startIndex: 0, endIndex: 0 }
    
    const start = Math.floor(scrollTop / itemHeight)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = Math.min(start + visibleCount, items.length - 1)
    
    return {
      startIndex: Math.max(0, start - overscan),
      endIndex: Math.min(items.length - 1, end + overscan)
    }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])
  
  // Calculate visible items with positioning
  const visibleItems = useMemo(() => {
    const result: Array<T & { index: number; style: React.CSSProperties }> = []
    
    for (let i = startIndex; i <= endIndex; i++) {
      const item = items[i]
      if (!item) continue
      
      const style: React.CSSProperties = horizontal
        ? {
            position: 'absolute',
            left: i * itemHeight,
            top: 0,
            width: itemHeight,
            height: '100%'
          }
        : {
            position: 'absolute',
            top: i * itemHeight,
            left: 0,
            width: '100%',
            height: itemHeight
          }
      
      result.push({
        ...item,
        index: i,
        style
      })
    }
    
    return result
  }, [items, startIndex, endIndex, itemHeight, horizontal])
  
  // Container style for proper scrollbar
  const containerStyle: React.CSSProperties = useMemo(() => {
    const totalSize = items.length * itemHeight
    
    return horizontal
      ? {
          position: 'relative',
          width: totalSize,
          height: containerHeight,
          overflow: 'auto'
        }
      : {
          position: 'relative',
          height: totalSize,
          width: '100%'
        }
  }, [items.length, itemHeight, horizontal, containerHeight])
  
  // Optimized scroll handler
  const handleScroll = useCallback(() => {
    if (!scrollElementRef.current) return
    
    // Cancel previous frame
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }
    
    // Schedule update on next frame
    frameRef.current = requestAnimationFrame(() => {
      if (!scrollElementRef.current) return
      
      const newScrollTop = horizontal
        ? scrollElementRef.current.scrollLeft
        : scrollElementRef.current.scrollTop
      
      setScrollTop(newScrollTop)
      setIsScrolling(true)
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      // Set scroll end detection
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    })
  }, [horizontal])
  
  // Attach scroll listener
  useEffect(() => {
    const element = scrollElementRef.current
    if (!element) return
    
    element.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      element.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [handleScroll])
  
  // Function to scroll to specific item
  const scrollToItem = useCallback((index: number) => {
    if (!scrollElementRef.current) return
    
    const targetPosition = Math.max(0, Math.min(index * itemHeight, 
      (items.length - 1) * itemHeight))
    
    if (horizontal) {
      scrollElementRef.current.scrollLeft = targetPosition
    } else {
      scrollElementRef.current.scrollTop = targetPosition
    }
  }, [itemHeight, horizontal, items.length])
  
  return {
    visibleItems,
    containerStyle,
    scrollElementRef,
    scrollToItem,
    scrollInfo: {
      startIndex,
      endIndex,
      isScrolling
    }
  }
}

// Hook for grid-based virtual scrolling (2D virtualization)
interface VirtualGridOptions {
  itemWidth: number
  itemHeight: number
  containerWidth: number
  containerHeight: number
  gap?: number
  overscan?: number
}

interface VirtualGridResult<T> {
  visibleItems: Array<T & { index: number; row: number; col: number; style: React.CSSProperties }>
  containerStyle: React.CSSProperties
  scrollElementRef: React.RefObject<HTMLDivElement>
  scrollToItem: (index: number) => void
  gridInfo: {
    totalRows: number
    columnsPerRow: number
    visibleRange: { startRow: number; endRow: number }
  }
}

export function useVirtualGrid<T>(
  items: T[],
  options: VirtualGridOptions
): VirtualGridResult<T> {
  const {
    itemWidth,
    itemHeight,
    containerWidth,
    containerHeight,
    gap = 0,
    overscan = 1
  } = options
  
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)
  
  // Calculate grid dimensions
  const gridInfo = useMemo(() => {
    const columnsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap))
    const totalRows = Math.ceil(items.length / columnsPerRow)
    
    const visibleRowCount = Math.ceil(containerHeight / (itemHeight + gap))
    const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan)
    const endRow = Math.min(totalRows - 1, startRow + visibleRowCount + overscan * 2)
    
    return {
      totalRows,
      columnsPerRow,
      visibleRange: { startRow, endRow }
    }
  }, [items.length, containerWidth, containerHeight, itemWidth, itemHeight, gap, scrollTop, overscan])
  
  // Calculate visible items
  const visibleItems = useMemo(() => {
    const result: Array<T & { index: number; row: number; col: number; style: React.CSSProperties }> = []
    const { columnsPerRow, visibleRange } = gridInfo
    
    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
      for (let col = 0; col < columnsPerRow; col++) {
        const index = row * columnsPerRow + col
        const item = items[index]
        
        if (!item) break
        
        const style: React.CSSProperties = {
          position: 'absolute',
          left: col * (itemWidth + gap),
          top: row * (itemHeight + gap),
          width: itemWidth,
          height: itemHeight
        }
        
        result.push({
          ...item,
          index,
          row,
          col,
          style
        })
      }
    }
    
    return result
  }, [items, gridInfo, itemWidth, itemHeight, gap])
  
  // Container style
  const containerStyle: React.CSSProperties = useMemo(() => {
    const totalHeight = gridInfo.totalRows * (itemHeight + gap) - gap
    
    return {
      position: 'relative',
      height: totalHeight,
      width: '100%'
    }
  }, [gridInfo.totalRows, itemHeight, gap])
  
  // Scroll handler
  const handleScroll = useCallback(() => {
    if (!scrollElementRef.current) return
    
    requestAnimationFrame(() => {
      if (!scrollElementRef.current) return
      setScrollTop(scrollElementRef.current.scrollTop)
    })
  }, [])
  
  useEffect(() => {
    const element = scrollElementRef.current
    if (!element) return
    
    element.addEventListener('scroll', handleScroll, { passive: true })
    return () => element.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
  
  // Scroll to item function
  const scrollToItem = useCallback((index: number) => {
    if (!scrollElementRef.current) return
    
    const { columnsPerRow } = gridInfo
    const row = Math.floor(index / columnsPerRow)
    const targetPosition = row * (itemHeight + gap)
    
    scrollElementRef.current.scrollTop = targetPosition
  }, [gridInfo, itemHeight, gap])
  
  return {
    visibleItems,
    containerStyle,
    scrollElementRef,
    scrollToItem,
    gridInfo
  }
}
