'use client'

import { useState, useEffect } from 'react'
import ProductsClient from './ProductsClient'
import ProductsMobileClient from './ProductsMobileClient'
import { useDeviceDetection } from '../hooks/useDeviceDetection'

export default function ProductsResponsiveClient() {
  const [mounted, setMounted] = useState(false)
  
  // Use optimized device detection hook
  const { isMobile } = useDeviceDetection()

  useEffect(() => {
    // Set mounted to true after component mounts
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div style={{ 
        width: '100%', 
        padding: '0', 
        backgroundColor: '#fff' 
      }}>
        <div style={{ padding: '16px 16px 12px' }}>
          <div style={{ 
            height: '24px', 
            width: '150px', 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
            borderRadius: '4px',
            marginBottom: '8px'
          }}></div>
          <div style={{ 
            height: '14px', 
            width: '80px', 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
            borderRadius: '4px'
          }}></div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0',
          padding: '0'
        }}>
          {[...Array(4)].map((_, index) => (
            <div key={index} style={{ 
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}>
              <div style={{
                width: '100%',
                aspectRatio: '1',
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite'
              }}></div>
              <div style={{ padding: '12px 10px 16px' }}>
                <div style={{ 
                  height: '10px', 
                  width: '50%', 
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}></div>
                <div style={{ 
                  height: '16px', 
                  width: '80%', 
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}></div>
                <div style={{ 
                  height: '18px', 
                  width: '60%', 
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite',
                  borderRadius: '4px'
                }}></div>
              </div>
            </div>
          ))}
        </div>
        
        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}</style>
      </div>
    )
  }

  return isMobile ? <ProductsMobileClient /> : <ProductsClient />
} 