export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import ProductsResponsiveClient from './ProductsResponsiveClient'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading products…</div>}>
      <ProductsResponsiveClient />
    </Suspense>
  )
} 