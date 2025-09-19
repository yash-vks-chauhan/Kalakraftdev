'use client'

import { useAuth } from '../contexts/AuthContext'
import RealTimeNotifications from './RealTimeNotifications'

export default function AdminNotifications() {
  const { user, loading } = useAuth()
  if (loading || user?.role !== 'admin') return null

  return (
    <>
      <RealTimeNotifications />
    </>
  )
}