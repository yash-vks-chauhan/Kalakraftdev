// File: app/products/[id]/page.tsx
'use client'

import dynamic from 'next/dynamic'

// Import the mobile version with no SSR to avoid hydration mismatches
const MobileProductDetail = dynamic(
  () => import('../../components/mobile/MobileProductDetail'),
  { ssr: false }
)

// Client component to handle responsive rendering
const ResponsiveProductDetail = dynamic(
  () => import('./ResponsiveProductDetail'),
  { ssr: false }
)

// Import the desktop version (the current component)
const DesktopProductDetail = dynamic(
  () => import('./ProductDetailsComponent'),
  { ssr: false }
)

export default function ProductPage() {
  return (
    <ResponsiveProductDetail 
      DesktopComponent={DesktopProductDetail}
      MobileComponent={MobileProductDetail}
    />
  )
}