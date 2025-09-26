import { Suspense } from 'react'
import ProductsResponsiveClient from './ProductsResponsiveClient'
import ErrorBoundary from '../components/ErrorBoundary'
import MobileProductsSkeleton from './MobileProductsSkeleton'

export default function Page() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<MobileProductsSkeleton />}>
        <ProductsResponsiveClient />
      </Suspense>
    </ErrorBoundary>
  )
} 