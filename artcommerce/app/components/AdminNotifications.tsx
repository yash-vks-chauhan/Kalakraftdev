// app/components/AdminNotifications.tsx
'use client'

import { useAuth } from '../contexts/AuthContext'
import RealTimeNotifications from './RealTimeNotifications'

export default function AdminNotifications() {
  const { user, loading } = useAuth()
  // nothing until we know it's an admin
  if (loading || user?.role !== 'admin') return null

  return (
    <>
      {/* only kicks off the Pusher bind() calls for admin notifications */}
      <RealTimeNotifications />
    </>
  )
}