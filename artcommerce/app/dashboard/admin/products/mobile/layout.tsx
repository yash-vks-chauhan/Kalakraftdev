'use client'

import { useAuth } from '../../../../contexts/AuthContext'
import { redirect } from 'next/navigation'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import { useEffect, useState } from 'react'
import { isMobileDevice } from '../../../../../lib/utils'

export default function MobileProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(isMobileDevice())
    }
  }, [])

  if (loading) {
    return (
      <div style={{ 
        position: 'relative', 
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    )
  }

  if (!user) {
    redirect('/auth/login')
  }

  if (user.role !== 'admin') {
    redirect('/dashboard')
  }

  // Always render mobile view for this specific page
  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {children}
    </div>
  )
}
