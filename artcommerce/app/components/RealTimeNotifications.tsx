'use client'
import { useEffect } from 'react'
import Pusher from 'pusher-js'
import { useAuth } from '../contexts/AuthContext'
import { useNotificationContext } from '../contexts/NotificationContext'

export default function RealTimeNotifications() {
  const { user, loading } = useAuth()
  const { notify, incrementUnread } = useNotificationContext()

  useEffect(() => {
    // If not an admin, don't subscribe
    if (loading || user?.role !== 'admin') return

    // enable Pusher logs in the browser console (optional)
    // @ts-ignore
    Pusher.logToConsole = false

    const pusherClient = new Pusher(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! }
    )

    pusherClient.connection.bind('connected', () =>
      console.log('🟢 Pusher connected (root)')
    )
    pusherClient.connection.bind('error', (err: any) =>
      console.error('🔴 Pusher connection error (root)', err)
    )

    const channel = pusherClient.subscribe('admin-channel')
    channel.bind('new-order', (data: {
      id: number
      total: number
      customerName: string
      products: string[]
    }) => {
      console.log('➡️  Received new-order at root:', data)
      
      notify({
        title: `New Order #${data.id}`,
        body: `${data.customerName} ordered ${data.products.join(
          ', '
        )} for ₹${data.total.toFixed(2)}.`,
        category: 'admin',
        severity: 'info'
      })
      incrementUnread()
    })

    // Low stock notification
    channel.bind('low-stock', (data: {
      productName: string
      remaining: number
    }) => {
      console.log('➡️  Received low-stock at root:', data)
      
      notify({
        title: `Low Stock: ${data.productName}`,
        body: `Only ${data.remaining} left.`,
        category: 'admin',
        severity: 'warning'
      })
      incrementUnread()
    })

    // Out of stock notification
    channel.bind('out-of-stock', (data: {
      productName: string
    }) => {
      console.log('➡️  Received out-of-stock at root:', data)
      
      notify({
        title: `Out of Stock: ${data.productName}`,
        body: `"${data.productName}" is now sold out.`,
        category: 'admin',
        severity: 'error'
      })
      incrementUnread()
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe('admin-channel')
      pusherClient.disconnect()
    }
  }, [notify, incrementUnread, user, loading])

  return null
}