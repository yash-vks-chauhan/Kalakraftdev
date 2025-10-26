'use client'
import { useEffect } from 'react'
import Pusher from 'pusher-js'
import { useAuth } from '../contexts/AuthContext'
import { useNotificationContext } from '../contexts/NotificationContext'

export default function RealTimeNotifications() {
  const { user, loading } = useAuth()
  const { addNotification } = useNotificationContext()

  useEffect(() => {
    if (loading || user?.role !== 'admin') return
    // @ts-ignore
    Pusher.logToConsole = false

    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      // Custom authorizer so we can include httpOnly cookie via credentials: 'include'
      authorizer: (channel) => {
        return {
          authorize: (socketId, callback) => {
            fetch('/api/pusher/auth', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ socket_id: socketId, channel_name: channel.name })
            })
              .then((res) => res.json())
              .then((data) => callback(null, data))
              .catch((err) => callback(err, null))
          },
        }
      },
    })

    pusherClient.connection.bind('connected', () =>
      console.log('🟢 Pusher connected (admin)')
    )
    pusherClient.connection.bind('error', (err: any) =>
      console.error('🔴 Pusher connection error (admin)', err)
    )

    // Subscribe to private admin channel (server will authorize)
    const channel = pusherClient.subscribe('private-admin')

    channel.bind('new-order', (data: {
      id: number
      total: number
      customerName: string
      products: string[]
    }) => {
      addNotification({
        title: `New Order #${data.id}`,
        body: `${data.customerName} ordered ${data.products.join(', ')} for ₹${data.total.toFixed(2)}.`,
        category: 'system',
        severity: 'info'
      })
    })

    channel.bind('low-stock', (data: { productName: string; remaining: number }) => {
      addNotification({
        title: `Low Stock: ${data.productName}`,
        body: `Only ${data.remaining} left.`,
        category: 'system',
        severity: 'warning'
      })
    })

    channel.bind('out-of-stock', (data: { productName: string }) => {
      addNotification({
        title: `Out of Stock: ${data.productName}`,
        body: `"${data.productName}" is now sold out.`,
        category: 'system',
        severity: 'error'
      })
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe('private-admin')
      pusherClient.disconnect()
    }
  }, [addNotification, user, loading])

  return null
}
