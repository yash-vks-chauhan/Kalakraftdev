import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import ProductsClient from './ProductsClient'

// Import the mobile version with no SSR to avoid hydration mismatches
const MobileProductsPage = dynamic(
  () => import('../components/mobile/MobileProductsPage'),
  { ssr: false }
)

// Client component to handle responsive rendering
const ResponsiveProductsPage = dynamic(
  () => import('./ResponsiveProductsPage'),
  { ssr: false }
)

export const dynamicConfig = 'force-dynamic'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading products…</div>}>
      <ResponsiveProductsPage 
        DesktopComponent={ProductsClient}
        MobileComponent={MobileProductsPage}
      />
    </Suspense>
  )
} 