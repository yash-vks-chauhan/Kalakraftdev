// File: app/dashboard/cart/page.tsx
'use client'

import React from 'react'
import MobileCartClient from '../../cart/mobile/MobileCartClient'

export default function DashboardCartPage() {
  // Always use the mobile cart UI for consistency
  // This ensures both navbar cart and dashboard cart use the same mobile-optimized interface
  return <MobileCartClient />
}