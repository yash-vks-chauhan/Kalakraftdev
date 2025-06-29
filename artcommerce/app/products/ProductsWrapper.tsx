'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import ProductsClient from './ProductsClient'

// Import the mobile version with loading fallback
const MobileProductsPage = dynamic(
  () => import('../components/mobile/MobileProductsPage'),
  {
    loading: () => (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          fontSize: '16px',
          color: '#666'
        }}>
          Loading mobile view...
        </div>
      </div>
    )
  }
)

// Client component to handle responsive rendering
const ResponsiveProductsPage = dynamic(
  () => import('./ResponsiveProductsPage'),
  {
    loading: () => (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          fontSize: '16px',
          color: '#666'
        }}>
          Loading...
        </div>
      </div>
    )
  }
)

const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px'
  }}>
    <div style={{
      textAlign: 'center',
      fontSize: '16px',
      color: '#666'
    }}>
      Loading products...
    </div>
  </div>
)

export default function ProductsWrapper() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResponsiveProductsPage 
        DesktopComponent={ProductsClient}
        MobileComponent={MobileProductsPage}
      />
    </Suspense>
  )
} 