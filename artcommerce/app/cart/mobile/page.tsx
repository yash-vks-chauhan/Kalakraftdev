import dynamic from 'next/dynamic'
import React from 'react'

const SafeMobileCart = dynamic(() => import('./MobileCartClient'), {
  ssr: false,
  loading: () => <main className="p-4 text-sm">Loading cart…</main>,
})

export default function MobileCartPage() {
  return <SafeMobileCart />
}
