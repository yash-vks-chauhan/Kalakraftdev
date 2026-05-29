'use client'

import { useAuth } from '../../../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import { useEffect, useState } from 'react'

export default function MobileProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (loading) return

    if (!user) {
      setRedirecting(true)
      router.replace('/auth/login')
      return
    }

    if (user.role !== 'admin') {
      setRedirecting(true)
      router.replace('/dashboard')
    }
  }, [loading, user, router])

  if (loading || redirecting || !user || user.role !== 'admin') {
    return (
      <div style={{ 
        position: 'relative', 
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LoadingSpinner message={loading ? "Loading dashboard..." : "Redirecting..."} />
      </div>
    )
  }

  // Always render mobile view for this specific page
  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {children}
    </div>
  )
}
