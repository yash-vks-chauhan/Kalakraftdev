import dynamic from 'next/dynamic'

const ProductsResponsiveClient = dynamic(
  () => import('./ProductsResponsiveClient'),
  {
    ssr: false,
    loading: () => <div>Loading products…</div>
  }
)

export const dynamic = 'force-dynamic'

export default function Page() {
  return <ProductsResponsiveClient />
} 