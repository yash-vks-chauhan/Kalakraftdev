// app/auth/layout.tsx
'use client'
import { useAuth }     from '../contexts/AuthContext'
import { usePathname } from 'next/navigation'
import React           from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname          = usePathname() || ''

  const PUBLIC_ROUTES = [
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/forgot-password/confirm',
  ]
  const isPublic = PUBLIC_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + '/')
  )
  // Only restrict non-public routes
  if (!isPublic) {
    if (loading) {
      return <p>Loading…</p>;
    }
    if (!user) {
      return <p>Unauthorized. Please <a href="/auth/login">log in</a>.</p>;
    }
  }

  return <>{children}</>
}