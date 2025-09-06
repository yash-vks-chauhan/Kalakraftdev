export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import ProductsResponsiveClient from './ProductsResponsiveClient'
import ErrorBoundary from '../components/ErrorBoundary'

export default function Page() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading products…</div>}>
        <ProductsResponsiveClient />
      </Suspense>
    </ErrorBoundary>
  )
} 