'use client'

import React, { useEffect, useRef, useState } from 'react'
import Navbar from './Navbar'
import AdminNotifications from './AdminNotifications'
import UserNotifications from './UserNotifications'
import Providers from '../Providers'
import { useMobileMenu } from '../contexts/MobileMenuContext'

// Optimized background effects component
const ProductGridEffects = ({ mousePosition }: { mousePosition: { x: number; y: number } }) => {
  return (
    <>
      <div 
        className="lightEffect"
        style={{
          '--x-position': `${mousePosition.x}px`,
          '--y-position': `${mousePosition.y}px`,
        } as React.CSSProperties}
      />
      <div className="watercolorSplash" />
      <div className="watercolorSplash2" />
      <div className="inkSplash" />
      <div className="scrollDownIndicator">
        <div className="scrollArrow" />
        <div className="scrollArrow" />
      </div>
      <div className="brushAccent" />
    </>
  )
}

export default function LayoutClientContent({ children }: { children: React.ReactNode }) {
  const { isMobileMenuOpen } = useMobileMenu()
  const productGridRef = useRef<HTMLElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [showEffects, setShowEffects] = useState(false)

  // Optimized mouse tracking with throttling
  useEffect(() => {
    let animationFrame: number

    const handleMouseMove = (e: MouseEvent) => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }

      animationFrame = requestAnimationFrame(() => {
        if (productGridRef.current) {
          const rect = productGridRef.current.getBoundingClientRect()
          setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          })
        }
      })
    }

    // Find product grid section and add event listener
    const productGridSection = document.querySelector('.productGridSection') as HTMLElement | null
    if (productGridSection) {
      productGridRef.current = productGridSection
      setShowEffects(true)
      productGridSection.addEventListener('mousemove', handleMouseMove, { passive: true })

      return () => {
        productGridSection.removeEventListener('mousemove', handleMouseMove)
        if (animationFrame) {
          cancelAnimationFrame(animationFrame)
        }
      }
    }
  }, [])

  return (
    <body className={isMobileMenuOpen ? 'bodyBlurred' : ''} suppressHydrationWarning>
      <Providers>
        <Navbar />
        <AdminNotifications />
        <UserNotifications />
        {children}
        {showEffects && productGridRef.current && (
          <div 
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              top: productGridRef.current.offsetTop,
              left: productGridRef.current.offsetLeft,
              width: productGridRef.current.offsetWidth,
              height: productGridRef.current.offsetHeight,
            }}
          >
            <ProductGridEffects mousePosition={mousePosition} />
          </div>
        )}
        <div className="sectionSeparator" />
      </Providers>
    </body>
  )
}