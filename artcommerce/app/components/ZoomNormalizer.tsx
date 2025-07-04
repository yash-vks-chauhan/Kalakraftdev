'use client'

import { useEffect } from 'react'

export default function ZoomNormalizer() {
  useEffect(() => {
    const normalize = () => {
      if (window.innerWidth >= 768) {
        const scale = 0.8

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