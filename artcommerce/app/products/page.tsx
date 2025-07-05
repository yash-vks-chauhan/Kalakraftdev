export const dynamic = 'force-dynamic'

import dynamicImport from 'next/dynamic'

const ProductsResponsiveClient = dynamicImport(
  () => import('./ProductsResponsiveClient'),
  {
    ssr: false,
    loading: () => <div>Loading products…</div>
  }
)

export default function Page() {
  return <ProductsResponsiveClient />
} 