import dynamic from 'next/dynamic'

const ProductsClient = dynamic(
  () => import('./ProductsClient.tsx'),
  { ssr: false, loading: () => <div>Loading products…</div> }
)

export default function Page() {
  return <ProductsClient />
} 