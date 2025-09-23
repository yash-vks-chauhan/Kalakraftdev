import { Suspense } from 'react'
import ProductsResponsiveClient from './ProductsResponsiveClient'
import ErrorBoundary from '../components/ErrorBoundary'

// Mobile skeleton fallback component
const MobileProductsSkeleton = () => {
  const shimmerKeyframes = `
    @keyframes shimmer-${Math.random().toString(36).substr(2, 9)} {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes pulse-${Math.random().toString(36).substr(2, 9)} {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shimmerKeyframes }} />
      <div style={{ 
        width: '100%', 
        padding: '0', 
        backgroundColor: '#fff' 
      }}>
        <div style={{ padding: '16px 16px 12px' }}>
          <div style={{ 
            height: '24px', 
            width: '150px', 
            background: '#f0f0f0',
            borderRadius: '4px',
            marginBottom: '8px'
          }}></div>
          <div style={{ 
            height: '14px', 
            width: '80px', 
            background: '#f0f0f0',
            borderRadius: '4px'
          }}></div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0',
          padding: '0'
        }}>
          {[...Array(6)].map((_, index) => (
            <div key={index} style={{ 
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}>
              <div style={{
                width: '100%',
                aspectRatio: '1',
                background: '#f0f0f0'
              }}></div>
              <div style={{ padding: '12px 10px 16px' }}>
                <div style={{ 
                  height: '10px', 
                  width: '50%', 
                  background: '#f0f0f0',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}></div>
                <div style={{ 
                  height: '16px', 
                  width: '80%', 
                  background: '#f0f0f0',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}></div>
                <div style={{ 
                  height: '18px', 
                  width: '60%', 
                  background: '#f0f0f0',
                  borderRadius: '4px'
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default function Page() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<MobileProductsSkeleton />}>
        <ProductsResponsiveClient />
      </Suspense>
    </ErrorBoundary>
  )
} 