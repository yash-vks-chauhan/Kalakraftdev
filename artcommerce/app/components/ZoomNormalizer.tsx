'use client'

import { useEffect } from 'react'

export default function ZoomNormalizer() {
  useEffect(() => {
    const normalize = () => {
      const zoomPercent = (window.outerWidth / window.innerWidth) * 100
      const target = 80
      if (window.innerWidth >= 768 && zoomPercent > 100) {
        const scale = target / zoomPercent

        document.documentElement.style.transformOrigin = '0 0'
        document.documentElement.style.transform = `scale(${scale})`
        document.documentElement.style.width = `${100 / scale}%`
      } else {
        document.documentElement.style.transform = ''
        document.documentElement.style.width = ''
      }
    }

    window.addEventListener('resize', normalize)
    normalize()

    return () => {
      window.removeEventListener('resize', normalize)
      document.documentElement.style.transform = ''
      document.documentElement.style.width = ''
    }
  }, [])

  return null
} 