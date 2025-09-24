'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RedirectToClient() {
  const router = useRouter()

  useEffect(() => {
    // Force client-side only navigation
    if (typeof window !== 'undefined') {
      // Use replace to avoid back button issues
      window.location.replace('/dashboard/admin/products/new/mobile/pure-client')
    }
  }, [])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
      color: '#666'
    }}>
      Redirecting...
    </div>
  )
}
