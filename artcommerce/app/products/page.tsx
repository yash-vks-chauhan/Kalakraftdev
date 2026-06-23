import { Suspense } from 'react'
import ProductsResponsiveClient from './ProductsResponsiveClient'
import ErrorBoundary from '../components/ErrorBoundary'
import ProductsSkeleton from './ProductsSkeleton'

export default function Page() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsResponsiveClient />
      </Suspense>
    </ErrorBoundary>
  )
}