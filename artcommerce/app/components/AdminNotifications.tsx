// app/components/AdminNotifications.tsx
'use client'

import { useAuth } from '../contexts/AuthContext'
import RealTimeNotifications from './RealTimeNotifications'
import NotificationContainer from './NotificationContainer'

export default function AdminNotifications() {
  const { user, loading } = useAuth()
  // nothing until we know it's an admin
  if (loading || user?.role !== 'admin') return null

  return (
    <>
      {/* only kicks off the Pusher bind() calls */}
      <RealTimeNotifications />

      {/* the ONLY place we map over `notifications` */}
      <NotificationContainer />
    </>
  )
}